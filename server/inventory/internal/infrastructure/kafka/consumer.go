package kafka

import (
	"context"
	"encoding/json"
	"time"

	"inventory-service/internal/config"

	"github.com/IBM/sarama"
	"go.uber.org/zap"
)

type Consumer struct {
	config  *config.KafkaConfig
	logger  *zap.Logger
	handler EventHandler
}

type EventHandler interface {
	HandleProductPurchased(ctx context.Context, event ProductPurchaseEvent) error
	HandleInventoryRestock(ctx context.Context, event InventoryRestockEvent) error
	HandleInventoryAdjustment(ctx context.Context, event InventoryAdjustmentEvent) error
}

// Event types
type ProductPurchaseEvent struct {
	RequestID    string                `json:"requestId"`
	OrderID      string                `json:"orderId"`
	UserID       string                `json:"userId"`
	Items        []ProductPurchaseItem `json:"items"`
	PurchaseTime string                `json:"purchaseTime"`
	Source       string                `json:"source"`
	ReplyTopic   string                `json:"replyTopic"`
}

type ProductPurchaseItem struct {
	ProductID               string `json:"productId"`
	Quantity                int32  `json:"quantity"`
	ExpectedInventoryStatus string `json:"expectedInventoryStatus"`
}

type InventoryRestockEvent struct {
	RestockID string                 `json:"restockId"`
	Items     []InventoryRestockItem `json:"items"`
	Reason    string                 `json:"reason"`
	CreatedBy string                 `json:"createdBy"`
	Source    string                 `json:"source"`
}

type InventoryRestockItem struct {
	ProductID string `json:"productId"`
	Quantity  int32  `json:"quantity"`
}

type InventoryAdjustmentEvent struct {
	AdjustmentID   string `json:"adjustmentId"`
	ProductID      string `json:"productId"`
	QuantityChange int32  `json:"quantityChange"`
	Reason         string `json:"reason"`
	CreatedBy      string `json:"createdBy"`
	Source         string `json:"source"`
}

// Processing result types
type ProcessedItem struct {
	ProductID     string    `json:"productId"`
	RequestedQty  int32     `json:"requestedQty"`
	ProcessedQty  int32     `json:"processedQty"`
	OldQuantity   int32     `json:"oldQuantity"`
	NewQuantity   int32     `json:"newQuantity"`
	OldStatus     string    `json:"oldStatus"`
	NewStatus     string    `json:"newStatus"`
	OperationType string    `json:"operationType"`
	ReferenceID   string    `json:"referenceId"`
	ProcessedAt   time.Time `json:"processedAt"`
}

type FailedItem struct {
	ProductID string `json:"productId"`
	Quantity  int32  `json:"quantity"`
	Error     string `json:"error"`
}

type InventoryPurchaseConfirmationEvent struct {
	RequestID      string          `json:"requestId"`
	OrderID        string          `json:"orderId"`
	UserID         string          `json:"userId"`
	ProcessedItems []ProcessedItem `json:"processedItems"`
	FailedItems    []FailedItem    `json:"failedItems"`
	TotalItems     int             `json:"totalItems"`
	ProcessedCount int             `json:"processedCount"`
	FailedCount    int             `json:"failedCount"`
	Success        bool            `json:"success"`
	ProcessedAt    time.Time       `json:"processedAt"`
	Source         string          `json:"source"`
}

func NewConsumer(cfg *config.KafkaConfig, logger *zap.Logger, handler EventHandler) *Consumer {
	return &Consumer{
		config:  cfg,
		logger:  logger,
		handler: handler,
	}
}

func (c *Consumer) Start(ctx context.Context) error {
	config := sarama.NewConfig()
	config.Consumer.Group.Rebalance.Strategy = sarama.BalanceStrategyRoundRobin
	config.Consumer.Offsets.Initial = sarama.OffsetNewest
	config.Consumer.Return.Errors = true

	consumerGroup, err := sarama.NewConsumerGroup(c.config.Brokers, c.config.ConsumerGroup, config)
	if err != nil {
		return err
	}

	topics := []string{
		c.config.Topics.ProductPurchased,
	}

	consumer := &consumerGroupHandler{
		consumer: c,
		logger:   c.logger,
	}

	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			default:
				if err := consumerGroup.Consume(ctx, topics, consumer); err != nil {
					c.logger.Error("Error consuming messages", zap.Error(err))
				}
			}
		}
	}()

	go func() {
		for err := range consumerGroup.Errors() {
			c.logger.Error("Consumer group error", zap.Error(err))
		}
	}()

	c.logger.Info("Kafka consumer started", zap.Strings("topics", topics))
	return nil
}

type consumerGroupHandler struct {
	consumer *Consumer
	logger   *zap.Logger
}

func (h *consumerGroupHandler) Setup(sarama.ConsumerGroupSession) error {
	return nil
}

func (h *consumerGroupHandler) Cleanup(sarama.ConsumerGroupSession) error {
	return nil
}

func (h *consumerGroupHandler) ConsumeClaim(session sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for {
		select {
		case message := <-claim.Messages():
			if message == nil {
				return nil
			}

			h.logger.Info("Received message",
				zap.String("topic", message.Topic),
				zap.Int32("partition", message.Partition),
				zap.Int64("offset", message.Offset),
			)

			if err := h.handleMessage(session.Context(), message); err != nil {
				h.logger.Error("Failed to handle message",
					zap.Error(err),
					zap.String("topic", message.Topic),
					zap.Int64("offset", message.Offset),
				)
			}

			session.MarkMessage(message, "")

		case <-session.Context().Done():
			return nil
		}
	}
}

func (h *consumerGroupHandler) handleMessage(ctx context.Context, message *sarama.ConsumerMessage) error {
	switch message.Topic {
	case h.consumer.config.Topics.ProductPurchased:
		return h.handleProductPurchased(ctx, message)
	case "inventory.restock": // Add to config if needed
		return h.handleInventoryRestock(ctx, message)
	case "inventory.adjustment": // Add to config if needed
		return h.handleInventoryAdjustment(ctx, message)
	default:
		h.logger.Warn("Unknown topic", zap.String("topic", message.Topic))
		return nil
	}
}

func (h *consumerGroupHandler) handleProductPurchased(ctx context.Context, message *sarama.ConsumerMessage) error {
	var event ProductPurchaseEvent
	if err := json.Unmarshal(message.Value, &event); err != nil {
		return err
	}

	h.logger.Info("Processing product purchase event",
		zap.String("request_id", event.RequestID),
		zap.String("order_id", event.OrderID),
		zap.Int("items_count", len(event.Items)),
	)

	return h.consumer.handler.HandleProductPurchased(ctx, event)
}

func (h *consumerGroupHandler) handleInventoryRestock(ctx context.Context, message *sarama.ConsumerMessage) error {
	var event InventoryRestockEvent
	if err := json.Unmarshal(message.Value, &event); err != nil {
		return err
	}

	h.logger.Info("Processing inventory restock event",
		zap.String("restock_id", event.RestockID),
		zap.Int("items_count", len(event.Items)),
	)

	return h.consumer.handler.HandleInventoryRestock(ctx, event)
}

func (h *consumerGroupHandler) handleInventoryAdjustment(ctx context.Context, message *sarama.ConsumerMessage) error {
	var event InventoryAdjustmentEvent
	if err := json.Unmarshal(message.Value, &event); err != nil {
		return err
	}

	h.logger.Info("Processing inventory adjustment event",
		zap.String("adjustment_id", event.AdjustmentID),
		zap.String("product_id", event.ProductID),
	)

	return h.consumer.handler.HandleInventoryAdjustment(ctx, event)
}
