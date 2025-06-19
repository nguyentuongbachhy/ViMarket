package handlers

import (
	"context"
	"time"

	"inventory-service/internal/domain/entity"
	"inventory-service/internal/infrastructure/kafka"
	"inventory-service/internal/service"

	"go.uber.org/zap"
)

type InventoryEventHandler struct {
	inventoryService *service.InventoryService
	producer         *kafka.Producer
	logger           *zap.Logger
}

func NewInventoryEventHandler(
	inventoryService *service.InventoryService,
	producer *kafka.Producer,
	logger *zap.Logger,
) *InventoryEventHandler {
	return &InventoryEventHandler{
		inventoryService: inventoryService,
		producer:         producer,
		logger:           logger,
	}
}

// HandleProductPurchased processes product purchase events
func (h *InventoryEventHandler) HandleProductPurchased(ctx context.Context, event kafka.ProductPurchaseEvent) error {
	h.logger.Info("Processing product purchase event",
		zap.String("request_id", event.RequestID),
		zap.String("order_id", event.OrderID),
		zap.String("user_id", event.UserID),
		zap.Int("items_count", len(event.Items)),
	)

	processedItems := make([]kafka.ProcessedItem, 0, len(event.Items))
	failedItems := make([]kafka.FailedItem, 0)

	for _, item := range event.Items {
		h.logger.Debug("Processing item",
			zap.String("product_id", item.ProductID),
			zap.Int32("quantity", item.Quantity),
		)

		// Get current inventory before update
		oldInventory, _, err := h.inventoryService.CheckInventoryWithProductInfo(
			ctx,
			item.ProductID,
			1,
			&service.ProductInfo{
				InventoryStatus: item.ExpectedInventoryStatus,
				Name:            "", // Will be filled by smart create if needed
				Price:           0,  // Will be filled by smart create if needed
			},
		)

		if err != nil {
			h.logger.Error("Failed to get inventory before purchase",
				zap.String("product_id", item.ProductID),
				zap.Error(err),
			)
			failedItems = append(failedItems, kafka.FailedItem{
				ProductID: item.ProductID,
				Quantity:  item.Quantity,
				Error:     err.Error(),
			})
			continue
		}

		oldQuantity := oldInventory.Quantity
		oldStatus := string(oldInventory.Status)

		// Update inventory - reduce quantity
		updates := []struct {
			ProductID      string
			QuantityChange int32
			OperationType  entity.OperationType
			ReferenceID    string
			Reason         string
			CreatedBy      string
		}{
			{
				ProductID:      item.ProductID,
				QuantityChange: -item.Quantity, // Negative for purchase
				OperationType:  entity.OperationPurchase,
				ReferenceID:    event.OrderID,
				Reason:         "Product purchased",
				CreatedBy:      "kafka-consumer",
			},
		}

		err = h.inventoryService.UpdateInventory(ctx, updates)
		if err != nil {
			h.logger.Error("Failed to update inventory for purchase",
				zap.String("product_id", item.ProductID),
				zap.Int32("quantity", item.Quantity),
				zap.Error(err),
			)
			failedItems = append(failedItems, kafka.FailedItem{
				ProductID: item.ProductID,
				Quantity:  item.Quantity,
				Error:     err.Error(),
			})
			continue
		}

		// Get updated inventory
		newInventory, _, err := h.inventoryService.CheckInventoryWithProductInfo(ctx, item.ProductID, 1, nil)
		if err != nil {
			h.logger.Warn("Failed to get updated inventory status",
				zap.String("product_id", item.ProductID),
				zap.Error(err),
			)
			// Still mark as processed since the update was successful
		}

		newQuantity := oldQuantity - item.Quantity
		newStatus := oldStatus
		if newInventory != nil {
			newQuantity = newInventory.Quantity
			newStatus = string(newInventory.Status)
		}

		processedItem := kafka.ProcessedItem{
			ProductID:     item.ProductID,
			RequestedQty:  item.Quantity,
			ProcessedQty:  item.Quantity,
			OldQuantity:   oldQuantity,
			NewQuantity:   newQuantity,
			OldStatus:     oldStatus,
			NewStatus:     newStatus,
			OperationType: string(entity.OperationPurchase),
			ReferenceID:   event.OrderID,
			ProcessedAt:   time.Now(),
		}

		processedItems = append(processedItems, processedItem)

		// Publish inventory updated event
		err = h.producer.PublishInventoryUpdated(kafka.InventoryUpdatedEvent{
			ProductID:      item.ProductID,
			OldQuantity:    oldQuantity,
			NewQuantity:    newQuantity,
			QuantityChange: -item.Quantity,
			OldStatus:      oldStatus,
			NewStatus:      newStatus,
			OperationType:  string(entity.OperationPurchase),
			ReferenceID:    event.OrderID,
			Reason:         "Product purchased",
		})

		if err != nil {
			h.logger.Error("Failed to publish inventory updated event",
				zap.String("product_id", item.ProductID),
				zap.Error(err),
			)
		}

		h.logger.Info("Successfully processed purchase item",
			zap.String("product_id", item.ProductID),
			zap.Int32("old_quantity", oldQuantity),
			zap.Int32("new_quantity", newQuantity),
		)
	}

	// Publish confirmation event
	confirmationEvent := kafka.InventoryPurchaseConfirmationEvent{
		RequestID:      event.RequestID,
		OrderID:        event.OrderID,
		UserID:         event.UserID,
		ProcessedItems: processedItems,
		FailedItems:    failedItems,
		TotalItems:     len(event.Items),
		ProcessedCount: len(processedItems),
		FailedCount:    len(failedItems),
		Success:        len(failedItems) == 0,
		ProcessedAt:    time.Now(),
		Source:         "inventory-service",
	}

	// If there's a reply topic, send confirmation there
	if event.ReplyTopic != "" {
		// You would publish to the reply topic here
		h.logger.Info("Should publish confirmation to reply topic",
			zap.String("reply_topic", event.ReplyTopic),
			zap.String("request_id", event.RequestID),
			zap.Bool("success", confirmationEvent.Success),
		)
	}

	h.logger.Info("Product purchase event processing completed",
		zap.String("request_id", event.RequestID),
		zap.String("order_id", event.OrderID),
		zap.Int("total_items", confirmationEvent.TotalItems),
		zap.Int("processed_count", confirmationEvent.ProcessedCount),
		zap.Int("failed_count", confirmationEvent.FailedCount),
		zap.Bool("success", confirmationEvent.Success),
	)

	return nil
}

// HandleInventoryRestock processes inventory restock events
func (h *InventoryEventHandler) HandleInventoryRestock(ctx context.Context, event kafka.InventoryRestockEvent) error {
	h.logger.Info("Processing inventory restock event",
		zap.String("restock_id", event.RestockID),
		zap.Int("items_count", len(event.Items)),
		zap.String("reason", event.Reason),
	)

	for _, item := range event.Items {
		h.logger.Debug("Processing restock item",
			zap.String("product_id", item.ProductID),
			zap.Int32("quantity", item.Quantity),
		)

		// Get current inventory before update
		oldInventory, _, err := h.inventoryService.CheckInventoryWithProductInfo(ctx, item.ProductID, 1, nil)
		if err != nil {
			h.logger.Error("Failed to get inventory before restock",
				zap.String("product_id", item.ProductID),
				zap.Error(err),
			)
			continue
		}

		oldQuantity := oldInventory.Quantity
		oldStatus := string(oldInventory.Status)

		// Update inventory - add quantity
		updates := []struct {
			ProductID      string
			QuantityChange int32
			OperationType  entity.OperationType
			ReferenceID    string
			Reason         string
			CreatedBy      string
		}{
			{
				ProductID:      item.ProductID,
				QuantityChange: item.Quantity, // Positive for restock
				OperationType:  entity.OperationRestock,
				ReferenceID:    event.RestockID,
				Reason:         event.Reason,
				CreatedBy:      event.CreatedBy,
			},
		}

		err = h.inventoryService.UpdateInventory(ctx, updates)
		if err != nil {
			h.logger.Error("Failed to update inventory for restock",
				zap.String("product_id", item.ProductID),
				zap.Int32("quantity", item.Quantity),
				zap.Error(err),
			)
			continue
		}

		// Get updated inventory
		newInventory, _, err := h.inventoryService.CheckInventoryWithProductInfo(ctx, item.ProductID, 1, nil)
		newQuantity := oldQuantity + item.Quantity
		newStatus := oldStatus
		if err == nil && newInventory != nil {
			newQuantity = newInventory.Quantity
			newStatus = string(newInventory.Status)
		}

		// Publish inventory updated event
		err = h.producer.PublishInventoryUpdated(kafka.InventoryUpdatedEvent{
			ProductID:      item.ProductID,
			OldQuantity:    oldQuantity,
			NewQuantity:    newQuantity,
			QuantityChange: item.Quantity,
			OldStatus:      oldStatus,
			NewStatus:      newStatus,
			OperationType:  string(entity.OperationRestock),
			ReferenceID:    event.RestockID,
			Reason:         event.Reason,
		})

		if err != nil {
			h.logger.Error("Failed to publish inventory updated event",
				zap.String("product_id", item.ProductID),
				zap.Error(err),
			)
		}

		h.logger.Info("Successfully processed restock item",
			zap.String("product_id", item.ProductID),
			zap.Int32("old_quantity", oldQuantity),
			zap.Int32("new_quantity", newQuantity),
		)
	}

	h.logger.Info("Inventory restock event processing completed",
		zap.String("restock_id", event.RestockID),
		zap.Int("items_count", len(event.Items)),
	)

	return nil
}

// HandleInventoryAdjustment processes inventory adjustment events
func (h *InventoryEventHandler) HandleInventoryAdjustment(ctx context.Context, event kafka.InventoryAdjustmentEvent) error {
	h.logger.Info("Processing inventory adjustment event",
		zap.String("adjustment_id", event.AdjustmentID),
		zap.String("product_id", event.ProductID),
		zap.Int32("quantity_change", event.QuantityChange),
		zap.String("reason", event.Reason),
	)

	// Get current inventory before update
	oldInventory, _, err := h.inventoryService.CheckInventoryWithProductInfo(ctx, event.ProductID, 1, nil)
	if err != nil {
		h.logger.Error("Failed to get inventory before adjustment",
			zap.String("product_id", event.ProductID),
			zap.Error(err),
		)
		return err
	}

	oldQuantity := oldInventory.Quantity
	oldStatus := string(oldInventory.Status)

	// Update inventory
	updates := []struct {
		ProductID      string
		QuantityChange int32
		OperationType  entity.OperationType
		ReferenceID    string
		Reason         string
		CreatedBy      string
	}{
		{
			ProductID:      event.ProductID,
			QuantityChange: event.QuantityChange,
			OperationType:  entity.OperationAdjustment,
			ReferenceID:    event.AdjustmentID,
			Reason:         event.Reason,
			CreatedBy:      event.CreatedBy,
		},
	}

	err = h.inventoryService.UpdateInventory(ctx, updates)
	if err != nil {
		h.logger.Error("Failed to update inventory for adjustment",
			zap.String("product_id", event.ProductID),
			zap.Int32("quantity_change", event.QuantityChange),
			zap.Error(err),
		)
		return err
	}

	// Get updated inventory
	newInventory, _, err := h.inventoryService.CheckInventoryWithProductInfo(ctx, event.ProductID, 1, nil)
	newQuantity := oldQuantity + event.QuantityChange
	newStatus := oldStatus
	if err == nil && newInventory != nil {
		newQuantity = newInventory.Quantity
		newStatus = string(newInventory.Status)
	}

	// Publish inventory updated event
	err = h.producer.PublishInventoryUpdated(kafka.InventoryUpdatedEvent{
		ProductID:      event.ProductID,
		OldQuantity:    oldQuantity,
		NewQuantity:    newQuantity,
		QuantityChange: event.QuantityChange,
		OldStatus:      oldStatus,
		NewStatus:      newStatus,
		OperationType:  string(entity.OperationAdjustment),
		ReferenceID:    event.AdjustmentID,
		Reason:         event.Reason,
	})

	if err != nil {
		h.logger.Error("Failed to publish inventory updated event",
			zap.String("product_id", event.ProductID),
			zap.Error(err),
		)
	}

	h.logger.Info("Successfully processed inventory adjustment",
		zap.String("product_id", event.ProductID),
		zap.Int32("old_quantity", oldQuantity),
		zap.Int32("new_quantity", newQuantity),
		zap.Int32("quantity_change", event.QuantityChange),
	)

	return nil
}
