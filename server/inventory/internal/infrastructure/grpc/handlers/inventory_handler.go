package handlers

import (
	"context"
	"time"

	"inventory-service/internal/domain/entity"
	"inventory-service/internal/service"
	commonpb "inventory-service/proto/common"
	inventorypb "inventory-service/proto/inventory"

	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type InventoryHandler struct {
	inventorypb.UnimplementedInventoryServiceServer
	inventoryService *service.InventoryService
	logger           *zap.Logger
}

func NewInventoryHandler(inventoryService *service.InventoryService, logger *zap.Logger) *InventoryHandler {
	return &InventoryHandler{
		inventoryService: inventoryService,
		logger:           logger,
	}
}

// CheckInventory checks inventory for a single product
func (h *InventoryHandler) CheckInventory(ctx context.Context, req *inventorypb.CheckInventoryRequest) (*inventorypb.CheckInventoryResponse, error) {
	start := time.Now()

	h.logger.Info("CheckInventory request received",
		zap.String("product_id", req.ProductId),
		zap.Int32("quantity", req.Quantity),
		zap.Any("product_info", req.ProductInfo),
	)

	// Handle test connection requests
	if req.ProductId == "test-connection" {
		h.logger.Info("Test connection request received")
		return &inventorypb.CheckInventoryResponse{
			ProductId:         req.ProductId,
			Available:         false,
			AvailableQuantity: 0,
			Status:            "test",
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_OK,
				Message: "Connection test successful",
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	// Validate request
	if req.ProductId == "" {
		return &inventorypb.CheckInventoryResponse{
			ProductId: req.ProductId,
			Available: false,
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_INVALID_ARGUMENT,
				Message: "Product ID is required",
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	if req.Quantity <= 0 {
		return &inventorypb.CheckInventoryResponse{
			ProductId: req.ProductId,
			Available: false,
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_INVALID_ARGUMENT,
				Message: "Quantity must be greater than 0",
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	// Convert product info
	var productInfo *service.ProductInfo
	if req.ProductInfo != nil {
		productInfo = &service.ProductInfo{
			InventoryStatus: req.ProductInfo.InventoryStatus,
			Name:            req.ProductInfo.Name,
			Price:           req.ProductInfo.Price,
		}
	}

	inv, available, err := h.inventoryService.CheckInventoryWithProductInfo(ctx, req.ProductId, req.Quantity, productInfo)
	if err != nil {
		h.logger.Error("Failed to check inventory",
			zap.String("product_id", req.ProductId),
			zap.Error(err),
		)

		// Return response with error status instead of gRPC error
		return &inventorypb.CheckInventoryResponse{
			ProductId:         req.ProductId,
			Available:         false,
			AvailableQuantity: 0,
			Status:            "error",
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_ERROR,
				Message: err.Error(),
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	response := &inventorypb.CheckInventoryResponse{
		ProductId:         req.ProductId,
		Available:         available,
		AvailableQuantity: inv.CalculateAvailableQuantity(),
		Status:            string(inv.Status),
		ResultStatus: &commonpb.Status{
			Code:    commonpb.Status_OK,
			Message: "Success",
		},
		LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
	}

	h.logger.Info("CheckInventory completed",
		zap.String("product_id", req.ProductId),
		zap.Bool("available", available),
		zap.Int32("available_quantity", response.AvailableQuantity),
		zap.String("status", response.Status),
		zap.Float64("latency_ms", response.LatencyMs),
	)

	return response, nil
}

// CheckInventoryBatch checks inventory for multiple products
func (h *InventoryHandler) CheckInventoryBatch(ctx context.Context, req *inventorypb.CheckInventoryBatchRequest) (*inventorypb.CheckInventoryBatchResponse, error) {
	start := time.Now()

	h.logger.Info("CheckInventoryBatch request received",
		zap.Int("items_count", len(req.Items)),
	)

	if len(req.Items) == 0 {
		return &inventorypb.CheckInventoryBatchResponse{
			Items: []*inventorypb.InventoryStatus{},
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_OK,
				Message: "Success - no items to check",
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	// Validate items
	for i, item := range req.Items {
		if item.ProductId == "" {
			return &inventorypb.CheckInventoryBatchResponse{
				Items: []*inventorypb.InventoryStatus{},
				ResultStatus: &commonpb.Status{
					Code:    commonpb.Status_INVALID_ARGUMENT,
					Message: "Product ID is required for all items",
				},
				LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
			}, nil
		}
		if item.Quantity <= 0 {
			h.logger.Warn("Invalid quantity in batch request",
				zap.Int("item_index", i),
				zap.String("product_id", item.ProductId),
				zap.Int32("quantity", item.Quantity),
			)
		}
	}

	// Convert to service format
	items := make([]struct {
		ProductID string
		Quantity  int32
	}, len(req.Items))

	for i, item := range req.Items {
		items[i] = struct {
			ProductID string
			Quantity  int32
		}{
			ProductID: item.ProductId,
			Quantity:  item.Quantity,
		}
	}

	// Check inventory batch
	inventories, available, err := h.inventoryService.CheckInventoryBatch(ctx, items)
	if err != nil {
		h.logger.Error("Failed to check inventory batch",
			zap.Int("items_count", len(req.Items)),
			zap.Error(err),
		)
		return nil, status.Errorf(codes.Internal, "Failed to check inventory batch: %v", err)
	}

	// Build response items
	responseItems := make([]*inventorypb.InventoryStatus, len(inventories))
	for i, inv := range inventories {
		var errorMessage string
		isAvailable := i < len(available) && available[i]
		if !isAvailable {
			errorMessage = "Insufficient inventory"
		}

		responseItems[i] = &inventorypb.InventoryStatus{
			ProductId:         inv.ProductID,
			Available:         isAvailable,
			AvailableQuantity: inv.CalculateAvailableQuantity(),
			ReservedQuantity:  inv.ReservedQuantity,
			Status:            string(inv.Status),
			ErrorMessage:      errorMessage,
		}
	}

	response := &inventorypb.CheckInventoryBatchResponse{
		Items: responseItems,
		ResultStatus: &commonpb.Status{
			Code:    commonpb.Status_OK,
			Message: "Success",
		},
		LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
	}

	h.logger.Info("CheckInventoryBatch completed",
		zap.Int("items_count", len(responseItems)),
		zap.Int("available_count", func() int {
			count := 0
			for _, item := range responseItems {
				if item.Available {
					count++
				}
			}
			return count
		}()),
		zap.Float64("latency_ms", response.LatencyMs),
	)

	return response, nil
}

// ReserveInventory reserves inventory for specific items
func (h *InventoryHandler) ReserveInventory(ctx context.Context, req *inventorypb.ReserveInventoryRequest) (*inventorypb.ReserveInventoryResponse, error) {
	start := time.Now()

	h.logger.Info("ReserveInventory request received",
		zap.String("reservation_id", req.ReservationId),
		zap.String("user_id", req.UserId),
		zap.Int("items_count", len(req.Items)),
		zap.Int64("expires_at", req.ExpiresAt),
	)

	// Validate request
	if req.ReservationId == "" {
		return &inventorypb.ReserveInventoryResponse{
			ReservationId: req.ReservationId,
			Results:       []*inventorypb.ReservationResult{},
			AllReserved:   false,
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_INVALID_ARGUMENT,
				Message: "Reservation ID is required",
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	if req.UserId == "" {
		return &inventorypb.ReserveInventoryResponse{
			ReservationId: req.ReservationId,
			Results:       []*inventorypb.ReservationResult{},
			AllReserved:   false,
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_INVALID_ARGUMENT,
				Message: "User ID is required",
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	if len(req.Items) == 0 {
		return &inventorypb.ReserveInventoryResponse{
			ReservationId: req.ReservationId,
			Results:       []*inventorypb.ReservationResult{},
			AllReserved:   true,
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_OK,
				Message: "Success - no items to reserve",
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	// Validate expiration time
	if req.ExpiresAt <= time.Now().Unix() {
		return &inventorypb.ReserveInventoryResponse{
			ReservationId: req.ReservationId,
			Results:       []*inventorypb.ReservationResult{},
			AllReserved:   false,
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_INVALID_ARGUMENT,
				Message: "Expiration time must be in the future",
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	// Convert to service format
	items := make([]struct {
		ProductID string
		Quantity  int32
	}, len(req.Items))

	for i, item := range req.Items {
		if item.ProductId == "" || item.Quantity <= 0 {
			return &inventorypb.ReserveInventoryResponse{
				ReservationId: req.ReservationId,
				Results:       []*inventorypb.ReservationResult{},
				AllReserved:   false,
				ResultStatus: &commonpb.Status{
					Code:    commonpb.Status_INVALID_ARGUMENT,
					Message: "Invalid item: product ID and quantity must be provided",
				},
				LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
			}, nil
		}

		items[i] = struct {
			ProductID string
			Quantity  int32
		}{
			ProductID: item.ProductId,
			Quantity:  item.Quantity,
		}
	}

	// Calculate timeout minutes from expires_at
	expiresAt := time.Unix(req.ExpiresAt, 0)
	timeoutMinutes := int(time.Until(expiresAt).Minutes())
	if timeoutMinutes <= 0 {
		timeoutMinutes = 15 // Default timeout
	}

	// Reserve inventory
	reservation, err := h.inventoryService.ReserveInventory(ctx, req.UserId, items, timeoutMinutes)
	if err != nil {
		h.logger.Error("Failed to reserve inventory",
			zap.String("reservation_id", req.ReservationId),
			zap.String("user_id", req.UserId),
			zap.Error(err),
		)

		// Build failed results
		results := make([]*inventorypb.ReservationResult, len(req.Items))
		for i, item := range req.Items {
			results[i] = &inventorypb.ReservationResult{
				ProductId:         item.ProductId,
				RequestedQuantity: item.Quantity,
				ReservedQuantity:  0,
				Success:           false,
				ErrorMessage:      err.Error(),
			}
		}

		return &inventorypb.ReserveInventoryResponse{
			ReservationId: req.ReservationId,
			Results:       results,
			AllReserved:   false,
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_ERROR,
				Message: err.Error(),
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	// Build successful results
	results := make([]*inventorypb.ReservationResult, len(reservation.Items))
	allReserved := true

	for i, item := range reservation.Items {
		success := item.Quantity > 0
		if !success {
			allReserved = false
		}

		results[i] = &inventorypb.ReservationResult{
			ProductId:         item.ProductID,
			RequestedQuantity: item.Quantity,
			ReservedQuantity:  item.Quantity,
			Success:           success,
			ErrorMessage:      "",
		}
	}

	response := &inventorypb.ReserveInventoryResponse{
		ReservationId: reservation.ID,
		Results:       results,
		AllReserved:   allReserved,
		ResultStatus: &commonpb.Status{
			Code:    commonpb.Status_OK,
			Message: "Success",
		},
		LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
	}

	h.logger.Info("ReserveInventory completed",
		zap.String("reservation_id", reservation.ID),
		zap.Bool("all_reserved", allReserved),
		zap.Int("successful_reservations", func() int {
			count := 0
			for _, result := range results {
				if result.Success {
					count++
				}
			}
			return count
		}()),
		zap.Float64("latency_ms", response.LatencyMs),
	)

	return response, nil
}

// ConfirmReservation confirms a reservation and converts it to actual inventory reduction
func (h *InventoryHandler) ConfirmReservation(ctx context.Context, req *inventorypb.ConfirmReservationRequest) (*inventorypb.ConfirmReservationResponse, error) {
	start := time.Now()

	h.logger.Info("ConfirmReservation request received",
		zap.String("reservation_id", req.ReservationId),
		zap.String("order_id", req.OrderId),
	)

	// Validate request
	if req.ReservationId == "" {
		return &inventorypb.ConfirmReservationResponse{
			ReservationId: req.ReservationId,
			OrderId:       req.OrderId,
			Updates:       []*inventorypb.InventoryUpdate{},
			Success:       false,
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_INVALID_ARGUMENT,
				Message: "Reservation ID is required",
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	if req.OrderId == "" {
		return &inventorypb.ConfirmReservationResponse{
			ReservationId: req.ReservationId,
			OrderId:       req.OrderId,
			Updates:       []*inventorypb.InventoryUpdate{},
			Success:       false,
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_INVALID_ARGUMENT,
				Message: "Order ID is required",
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	err := h.inventoryService.ConfirmReservation(ctx, req.ReservationId, req.OrderId)
	if err != nil {
		h.logger.Error("Failed to confirm reservation",
			zap.String("reservation_id", req.ReservationId),
			zap.String("order_id", req.OrderId),
			zap.Error(err),
		)
		return &inventorypb.ConfirmReservationResponse{
			ReservationId: req.ReservationId,
			OrderId:       req.OrderId,
			Updates:       []*inventorypb.InventoryUpdate{},
			Success:       false,
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_ERROR,
				Message: err.Error(),
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	// Get reservation details to build update list
	reservation, getErr := h.inventoryService.GetReservation(ctx, req.ReservationId)
	updates := []*inventorypb.InventoryUpdate{}

	if getErr == nil && reservation != nil {
		for _, item := range reservation.Items {
			updates = append(updates, &inventorypb.InventoryUpdate{
				ProductId:      item.ProductID,
				QuantityChange: -item.Quantity, // Negative for confirmed purchase
				OperationType:  string(entity.OperationPurchase),
				ReferenceId:    req.OrderId,
			})
		}
	}

	response := &inventorypb.ConfirmReservationResponse{
		ReservationId: req.ReservationId,
		OrderId:       req.OrderId,
		Updates:       updates,
		Success:       true,
		ResultStatus: &commonpb.Status{
			Code:    commonpb.Status_OK,
			Message: "Reservation confirmed successfully",
		},
		LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
	}

	h.logger.Info("ConfirmReservation completed",
		zap.String("reservation_id", req.ReservationId),
		zap.String("order_id", req.OrderId),
		zap.Int("updates_count", len(updates)),
		zap.Float64("latency_ms", response.LatencyMs),
	)

	return response, nil
}

// CancelReservation cancels a reservation and releases the reserved inventory
func (h *InventoryHandler) CancelReservation(ctx context.Context, req *inventorypb.CancelReservationRequest) (*inventorypb.CancelReservationResponse, error) {
	start := time.Now()

	h.logger.Info("CancelReservation request received",
		zap.String("reservation_id", req.ReservationId),
		zap.String("reason", req.Reason),
	)

	// Validate request
	if req.ReservationId == "" {
		return &inventorypb.CancelReservationResponse{
			ReservationId: req.ReservationId,
			Success:       false,
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_INVALID_ARGUMENT,
				Message: "Reservation ID is required",
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	err := h.inventoryService.CancelReservation(ctx, req.ReservationId, req.Reason)
	if err != nil {
		h.logger.Error("Failed to cancel reservation",
			zap.String("reservation_id", req.ReservationId),
			zap.String("reason", req.Reason),
			zap.Error(err),
		)
		return &inventorypb.CancelReservationResponse{
			ReservationId: req.ReservationId,
			Success:       false,
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_ERROR,
				Message: err.Error(),
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	response := &inventorypb.CancelReservationResponse{
		ReservationId: req.ReservationId,
		Success:       true,
		ResultStatus: &commonpb.Status{
			Code:    commonpb.Status_OK,
			Message: "Reservation cancelled successfully",
		},
		LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
	}

	h.logger.Info("CancelReservation completed",
		zap.String("reservation_id", req.ReservationId),
		zap.String("reason", req.Reason),
		zap.Float64("latency_ms", response.LatencyMs),
	)

	return response, nil
}

// UpdateInventory updates inventory quantities for multiple products
func (h *InventoryHandler) UpdateInventory(ctx context.Context, req *inventorypb.UpdateInventoryRequest) (*inventorypb.UpdateInventoryResponse, error) {
	start := time.Now()

	h.logger.Info("UpdateInventory request received",
		zap.Int("updates_count", len(req.Updates)),
		zap.String("reason", req.Reason),
	)

	if len(req.Updates) == 0 {
		return &inventorypb.UpdateInventoryResponse{
			Results:    []*inventorypb.InventoryUpdateResult{},
			AllUpdated: true,
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_OK,
				Message: "Success - no updates to apply",
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	// Validate updates
	for i, update := range req.Updates {
		if update.ProductId == "" {
			return &inventorypb.UpdateInventoryResponse{
				Results:    []*inventorypb.InventoryUpdateResult{},
				AllUpdated: false,
				ResultStatus: &commonpb.Status{
					Code:    commonpb.Status_INVALID_ARGUMENT,
					Message: "Product ID is required for all updates",
				},
				LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
			}, nil
		}
		if update.QuantityChange == 0 {
			h.logger.Warn("Zero quantity change in update",
				zap.Int("update_index", i),
				zap.String("product_id", update.ProductId),
			)
		}
	}

	// Convert to service format
	updates := make([]struct {
		ProductID      string
		QuantityChange int32
		OperationType  entity.OperationType
		ReferenceID    string
		Reason         string
		CreatedBy      string
	}, len(req.Updates))

	for i, update := range req.Updates {
		operationType := entity.OperationAdjustment
		switch update.OperationType {
		case string(entity.OperationPurchase):
			operationType = entity.OperationPurchase
		case string(entity.OperationRestock):
			operationType = entity.OperationRestock
		case string(entity.OperationReturn):
			operationType = entity.OperationReturn
		case string(entity.OperationReserve):
			operationType = entity.OperationReserve
		case string(entity.OperationRelease):
			operationType = entity.OperationRelease
		default:
			operationType = entity.OperationAdjustment
		}

		updates[i] = struct {
			ProductID      string
			QuantityChange int32
			OperationType  entity.OperationType
			ReferenceID    string
			Reason         string
			CreatedBy      string
		}{
			ProductID:      update.ProductId,
			QuantityChange: update.QuantityChange,
			OperationType:  operationType,
			ReferenceID:    update.ReferenceId,
			Reason:         req.Reason,
			CreatedBy:      "grpc-request",
		}
	}

	// Apply updates
	err := h.inventoryService.UpdateInventory(ctx, updates)

	// Build results
	results := make([]*inventorypb.InventoryUpdateResult, len(req.Updates))
	allUpdated := err == nil

	for i, update := range req.Updates {
		success := err == nil
		var errorMessage string
		var newQuantity int32
		var newStatus string

		if success {
			// Get updated inventory to populate response
			if inv, _, getErr := h.inventoryService.CheckInventoryWithProductInfo(ctx, update.ProductId, 1, nil); getErr == nil && inv != nil {
				newQuantity = inv.Quantity
				newStatus = string(inv.Status)
			}
		} else {
			errorMessage = err.Error()
		}

		results[i] = &inventorypb.InventoryUpdateResult{
			ProductId:    update.ProductId,
			OldQuantity:  0, // Would need to be stored before update
			NewQuantity:  newQuantity,
			NewStatus:    newStatus,
			Success:      success,
			ErrorMessage: errorMessage,
		}
	}

	var resultStatus *commonpb.Status
	if allUpdated {
		resultStatus = &commonpb.Status{
			Code:    commonpb.Status_OK,
			Message: "All updates applied successfully",
		}
	} else {
		resultStatus = &commonpb.Status{
			Code:    commonpb.Status_ERROR,
			Message: err.Error(),
		}
	}

	response := &inventorypb.UpdateInventoryResponse{
		Results:      results,
		AllUpdated:   allUpdated,
		ResultStatus: resultStatus,
		LatencyMs:    float64(time.Since(start).Nanoseconds()) / 1000000,
	}

	h.logger.Info("UpdateInventory completed",
		zap.Int("updates_count", len(req.Updates)),
		zap.Bool("all_updated", allUpdated),
		zap.Int("successful_updates", func() int {
			count := 0
			for _, result := range results {
				if result.Success {
					count++
				}
			}
			return count
		}()),
		zap.Float64("latency_ms", response.LatencyMs),
	)

	return response, nil
}

// GetInventoryHistory retrieves inventory history for a product
func (h *InventoryHandler) GetInventoryHistory(ctx context.Context, req *inventorypb.GetInventoryHistoryRequest) (*inventorypb.GetInventoryHistoryResponse, error) {
	start := time.Now()

	h.logger.Info("GetInventoryHistory request received",
		zap.String("product_id", req.ProductId),
		zap.Int32("limit", req.Limit),
		zap.Int64("from_timestamp", req.FromTimestamp),
		zap.Int64("to_timestamp", req.ToTimestamp),
	)

	// Validate request
	if req.ProductId == "" {
		return &inventorypb.GetInventoryHistoryResponse{
			Entries: []*inventorypb.InventoryHistoryEntry{},
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_INVALID_ARGUMENT,
				Message: "Product ID is required",
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	limit := int(req.Limit)
	if limit <= 0 {
		limit = 100
	}
	if limit > 1000 {
		limit = 1000 // Cap at 1000 entries
	}

	fromTime := time.Unix(req.FromTimestamp, 0)
	toTime := time.Unix(req.ToTimestamp, 0)
	if req.FromTimestamp == 0 {
		fromTime = time.Now().AddDate(0, -1, 0) // Default to 1 month ago
	}
	if req.ToTimestamp == 0 {
		toTime = time.Now()
	}

	// Validate time range
	if fromTime.After(toTime) {
		return &inventorypb.GetInventoryHistoryResponse{
			Entries: []*inventorypb.InventoryHistoryEntry{},
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_INVALID_ARGUMENT,
				Message: "From timestamp must be before to timestamp",
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	histories, err := h.inventoryService.GetInventoryHistory(ctx, req.ProductId, limit, fromTime, toTime)
	if err != nil {
		h.logger.Error("Failed to get inventory history",
			zap.String("product_id", req.ProductId),
			zap.Error(err),
		)
		return &inventorypb.GetInventoryHistoryResponse{
			Entries: []*inventorypb.InventoryHistoryEntry{},
			ResultStatus: &commonpb.Status{
				Code:    commonpb.Status_ERROR,
				Message: err.Error(),
			},
			LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
		}, nil
	}

	// Convert to protobuf format
	entries := make([]*inventorypb.InventoryHistoryEntry, len(histories))
	for i, history := range histories {
		entries[i] = &inventorypb.InventoryHistoryEntry{
			Id:             history.ID,
			ProductId:      history.ProductID,
			QuantityBefore: history.QuantityBefore,
			QuantityAfter:  history.QuantityAfter,
			QuantityChange: history.QuantityChange,
			OperationType:  string(history.OperationType),
			ReferenceId:    history.ReferenceID,
			Reason:         history.Reason,
			CreatedAt:      history.CreatedAt.Unix(),
			CreatedBy:      history.CreatedBy,
		}
	}

	response := &inventorypb.GetInventoryHistoryResponse{
		Entries: entries,
		ResultStatus: &commonpb.Status{
			Code:    commonpb.Status_OK,
			Message: "Success",
		},
		LatencyMs: float64(time.Since(start).Nanoseconds()) / 1000000,
	}

	h.logger.Info("GetInventoryHistory completed",
		zap.String("product_id", req.ProductId),
		zap.Int("entries_count", len(entries)),
		zap.Time("from_time", fromTime),
		zap.Time("to_time", toTime),
		zap.Float64("latency_ms", response.LatencyMs),
	)

	return response, nil
}
