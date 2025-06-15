package kafka

import (
	"encoding/json"
	"time"

	"inventory-service/internal/config"

	"github.com/IBM/sarama"
	"go.uber.org/zap"
)

type Producer struct {
	producer sarama.AsyncProducer
	config   *config.KafkaConfig
	logger   *zap.Logger
}

type InventoryUpdatedEvent struct {
	ProductID      string    `json:"productId"`
	OldQuantity    int32     `json:"oldQuantity"`
	NewQuantity    int32     `json:"newQuantity"`
	QuantityChange int32     `json:"quantityChange"`
	OldStatus      string    `json:"oldStatus"`
	NewStatus      string    `json:"newStatus"`
	OperationType  string    `json:"operationType"`
	ReferenceID    string    `json:"referenceId"`
	Reason         string    `json:"reason"`
	Timestamp      time.Time `json:"timestamp"`
	Source         string    `json:"source"`
}

type InventoryReservedEvent struct {
	ReservationID string                     `json:"reservationId"`
	UserID        string                     `json:"userId"`
	Items         []InventoryReservationItem `json:"items"`
	ExpiresAt     time.Time                  `json:"expiresAt"`
	Timestamp     time.Time                  `json:"timestamp"`
	Source        string                     `json:"source"`
}

type InventoryConfirmedEvent struct {
	ReservationID string    `json:"reservationId"`
	OrderID       string    `json:"orderId"`
	UserID        string    `json:"userId"`
	Timestamp     time.Time `json:"timestamp"`
	Source        string    `json:"source"`
}

type InventoryReservationItem struct {
	ProductID string `json:"productId"`
	Quantity  int32  `json:"quantity"`
}

func NewProducer(cfg *config.KafkaConfig, logger *zap.Logger) (*Producer, error) {
	config := sarama.NewConfig()
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Retry.Max = 3
	config.Producer.Return.Successes = true
	config.Producer.Return.Errors = true

	producer, err := sarama.NewAsyncProducer(cfg.Brokers, config)
	if err != nil {
		return nil, err
	}

	p := &Producer{
		producer: producer,
		config:   cfg,
		logger:   logger,
	}

	// Handle success and error messages
	go p.handleMessages()

	return p, nil
}

func (p *Producer) handleMessages() {
	for {
		select {
		case success := <-p.producer.Successes():
			p.logger.Debug("Message sent successfully",
				zap.String("topic", success.Topic),
				zap.Int32("partition", success.Partition),
				zap.Int64("offset", success.Offset),
			)

		case err := <-p.producer.Errors():
			p.logger.Error("Failed to send message",
				zap.Error(err),
				zap.String("topic", err.Msg.Topic),
			)
		}
	}
}

func (p *Producer) PublishInventoryUpdated(event InventoryUpdatedEvent) error {
	event.Timestamp = time.Now()
	event.Source = "inventory-service"

	data, err := json.Marshal(event)
	if err != nil {
		return err
	}

	message := &sarama.ProducerMessage{
		Topic: p.config.Topics.InventoryUpdate,
		Key:   sarama.StringEncoder(event.ProductID),
		Value: sarama.ByteEncoder(data),
	}

	p.producer.Input() <- message

	p.logger.Info("Published inventory updated event",
		zap.String("product_id", event.ProductID),
		zap.String("operation_type", event.OperationType),
	)

	return nil
}

func (p *Producer) PublishInventoryReserved(event InventoryReservedEvent) error {
	event.Timestamp = time.Now()
	event.Source = "inventory-service"

	data, err := json.Marshal(event)
	if err != nil {
		return err
	}

	message := &sarama.ProducerMessage{
		Topic: p.config.Topics.InventoryReserved,
		Key:   sarama.StringEncoder(event.ReservationID),
		Value: sarama.ByteEncoder(data),
	}

	p.producer.Input() <- message

	p.logger.Info("Published inventory reserved event",
		zap.String("reservation_id", event.ReservationID),
		zap.String("user_id", event.UserID),
	)

	return nil
}

func (p *Producer) PublishInventoryConfirmed(event InventoryConfirmedEvent) error {
	event.Timestamp = time.Now()
	event.Source = "inventory-service"

	data, err := json.Marshal(event)
	if err != nil {
		return err
	}

	message := &sarama.ProducerMessage{
		Topic: p.config.Topics.InventoryConfirmed,
		Key:   sarama.StringEncoder(event.ReservationID),
		Value: sarama.ByteEncoder(data),
	}

	p.producer.Input() <- message

	p.logger.Info("Published inventory confirmed event",
		zap.String("reservation_id", event.ReservationID),
		zap.String("order_id", event.OrderID),
	)

	return nil
}

func (p *Producer) Close() error {
	return p.producer.Close()
}
