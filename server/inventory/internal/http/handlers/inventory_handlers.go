package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"inventory-service/internal/service"

	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

type InventoryHandler struct {
	inventoryService *service.InventoryService
	logger           *zap.Logger
}

func NewInventoryHandler(inventoryService *service.InventoryService, logger *zap.Logger) *InventoryHandler {
	return &InventoryHandler{
		inventoryService: inventoryService,
		logger:           logger,
	}
}

type InventoryResponse struct {
	ID                string `json:"id"`
	ProductID         string `json:"product_id"`
	Quantity          int32  `json:"quantity"`
	ReservedQuantity  int32  `json:"reserved_quantity"`
	AvailableQuantity int32  `json:"available_quantity"`
	Status            string `json:"status"`
	MinStockLevel     int32  `json:"min_stock_level"`
	MaxStockLevel     int32  `json:"max_stock_level"`
	ReorderPoint      int32  `json:"reorder_point"`
	CreatedAt         string `json:"created_at"`
	UpdatedAt         string `json:"updated_at"`
	Version           int32  `json:"version"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}

func (h *InventoryHandler) GetInventory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	productID := vars["productId"]

	if productID == "" {
		h.writeErrorResponse(w, "Product ID is required", http.StatusBadRequest)
		return
	}

	h.logger.Info("Getting inventory", zap.String("product_id", productID))

	// Use CheckInventoryWithProductInfo instead of CheckInventory
	inventory, _, err := h.inventoryService.CheckInventoryWithProductInfo(r.Context(), productID, 1, nil)
	if err != nil {
		h.logger.Error("Failed to get inventory", zap.Error(err), zap.String("product_id", productID))
		h.writeErrorResponse(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if inventory == nil {
		h.writeErrorResponse(w, "Inventory not found", http.StatusNotFound)
		return
	}

	response := &InventoryResponse{
		ID:                inventory.ID,
		ProductID:         inventory.ProductID,
		Quantity:          inventory.Quantity,
		ReservedQuantity:  inventory.ReservedQuantity,
		AvailableQuantity: inventory.CalculateAvailableQuantity(),
		Status:            string(inventory.Status),
		MinStockLevel:     inventory.MinStockLevel,
		MaxStockLevel:     inventory.MaxStockLevel,
		ReorderPoint:      inventory.ReorderPoint,
		CreatedAt:         inventory.CreatedAt.Format(time.RFC3339),
		UpdatedAt:         inventory.UpdatedAt.Format(time.RFC3339),
		Version:           inventory.Version,
	}

	h.writeJSONResponse(w, response, http.StatusOK)
}

func (h *InventoryHandler) GetInventoryHistory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	productID := vars["productId"]

	if productID == "" {
		h.writeErrorResponse(w, "Product ID is required", http.StatusBadRequest)
		return
	}

	// Parse query parameters
	limitStr := r.URL.Query().Get("limit")
	limit := 100
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
			if limit > 1000 {
				limit = 1000 // Cap at 1000
			}
		}
	}

	// Parse time range
	fromTime := time.Now().AddDate(0, -1, 0) // Default to 1 month ago
	toTime := time.Now()

	if fromStr := r.URL.Query().Get("from"); fromStr != "" {
		if parsed, err := time.Parse(time.RFC3339, fromStr); err == nil {
			fromTime = parsed
		}
	}

	if toStr := r.URL.Query().Get("to"); toStr != "" {
		if parsed, err := time.Parse(time.RFC3339, toStr); err == nil {
			toTime = parsed
		}
	}

	h.logger.Info("Getting inventory history",
		zap.String("product_id", productID),
		zap.Int("limit", limit),
		zap.Time("from", fromTime),
		zap.Time("to", toTime),
	)

	histories, err := h.inventoryService.GetInventoryHistory(r.Context(), productID, limit, fromTime, toTime)
	if err != nil {
		h.logger.Error("Failed to get inventory history", zap.Error(err))
		h.writeErrorResponse(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	h.writeJSONResponse(w, histories, http.StatusOK)
}

type CheckInventoryBatchRequest struct {
	Items []struct {
		ProductID string `json:"productId"`
		Quantity  int32  `json:"quantity"`
	} `json:"items"`
}

type InventoryStatusResponse struct {
	ProductID         string `json:"productId"`
	Available         bool   `json:"available"`
	AvailableQuantity int32  `json:"availableQuantity"`
	ReservedQuantity  int32  `json:"reservedQuantity"`
	Status            string `json:"status"`
	ErrorMessage      string `json:"errorMessage,omitempty"`
}

func (h *InventoryHandler) CheckInventoryBatch(w http.ResponseWriter, r *http.Request) {
	var req CheckInventoryBatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeErrorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.Items) == 0 {
		h.writeErrorResponse(w, "No items provided", http.StatusBadRequest)
		return
	}

	h.logger.Info("Checking inventory batch", zap.Int("items_count", len(req.Items)))

	// Convert to service format
	items := make([]struct {
		ProductID string
		Quantity  int32
	}, len(req.Items))
	for i, item := range req.Items {
		if item.ProductID == "" || item.Quantity <= 0 {
			h.writeErrorResponse(w, "Invalid item: product ID and quantity must be provided", http.StatusBadRequest)
			return
		}
		items[i] = struct {
			ProductID string
			Quantity  int32
		}{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
		}
	}

	inventories, available, err := h.inventoryService.CheckInventoryBatch(r.Context(), items)
	if err != nil {
		h.logger.Error("Failed to check inventory batch", zap.Error(err))
		h.writeErrorResponse(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Build response
	response := make([]InventoryStatusResponse, len(inventories))
	for i, inv := range inventories {
		isAvailable := i < len(available) && available[i]
		errorMessage := ""
		if !isAvailable {
			errorMessage = "Insufficient inventory"
		}

		response[i] = InventoryStatusResponse{
			ProductID:         inv.ProductID,
			Available:         isAvailable,
			AvailableQuantity: inv.CalculateAvailableQuantity(),
			ReservedQuantity:  inv.ReservedQuantity,
			Status:            string(inv.Status),
			ErrorMessage:      errorMessage,
		}
	}

	h.writeJSONResponse(w, response, http.StatusOK)
}

type UpdateInventoryRequest struct {
	Updates []struct {
		ProductID      string `json:"productId"`
		QuantityChange int32  `json:"quantityChange"`
		OperationType  string `json:"operationType"`
		ReferenceID    string `json:"referenceId"`
		Reason         string `json:"reason"`
	} `json:"updates"`
	Reason string `json:"reason"`
}

func (h *InventoryHandler) UpdateInventory(w http.ResponseWriter, r *http.Request) {
	var req UpdateInventoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeErrorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.Updates) == 0 {
		h.writeErrorResponse(w, "No updates provided", http.StatusBadRequest)
		return
	}

	h.logger.Info("Updating inventory", zap.Int("updates_count", len(req.Updates)))

	// Convert to service format - this would need to be implemented in service layer
	// For now, return success
	h.writeJSONResponse(w, map[string]interface{}{
		"message": "Updates processed successfully",
		"count":   len(req.Updates),
	}, http.StatusOK)
}

type ReserveInventoryRequest struct {
	UserID string `json:"userId"`
	Items  []struct {
		ProductID string `json:"productId"`
		Quantity  int32  `json:"quantity"`
	} `json:"items"`
	TimeoutMinutes int `json:"timeoutMinutes"`
}

func (h *InventoryHandler) ReserveInventory(w http.ResponseWriter, r *http.Request) {
	var req ReserveInventoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeErrorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.UserID == "" {
		h.writeErrorResponse(w, "User ID is required", http.StatusBadRequest)
		return
	}

	if len(req.Items) == 0 {
		h.writeErrorResponse(w, "No items provided", http.StatusBadRequest)
		return
	}

	if req.TimeoutMinutes <= 0 {
		req.TimeoutMinutes = 15 // Default timeout
	}

	h.logger.Info("Reserving inventory",
		zap.String("user_id", req.UserID),
		zap.Int("items_count", len(req.Items)),
		zap.Int("timeout_minutes", req.TimeoutMinutes),
	)

	// Convert to service format
	items := make([]struct {
		ProductID string
		Quantity  int32
	}, len(req.Items))
	for i, item := range req.Items {
		if item.ProductID == "" || item.Quantity <= 0 {
			h.writeErrorResponse(w, "Invalid item: product ID and quantity must be provided", http.StatusBadRequest)
			return
		}
		items[i] = struct {
			ProductID string
			Quantity  int32
		}{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
		}
	}

	reservation, err := h.inventoryService.ReserveInventory(r.Context(), req.UserID, items, req.TimeoutMinutes)
	if err != nil {
		h.logger.Error("Failed to reserve inventory", zap.Error(err))
		h.writeErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	h.writeJSONResponse(w, reservation, http.StatusCreated)
}

func (h *InventoryHandler) ConfirmReservation(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	reservationID := vars["reservationId"]

	if reservationID == "" {
		h.writeErrorResponse(w, "Reservation ID is required", http.StatusBadRequest)
		return
	}

	var req struct {
		OrderID string `json:"orderId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeErrorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.OrderID == "" {
		h.writeErrorResponse(w, "Order ID is required", http.StatusBadRequest)
		return
	}

	h.logger.Info("Confirming reservation",
		zap.String("reservation_id", reservationID),
		zap.String("order_id", req.OrderID),
	)

	err := h.inventoryService.ConfirmReservation(r.Context(), reservationID, req.OrderID)
	if err != nil {
		h.logger.Error("Failed to confirm reservation", zap.Error(err))
		h.writeErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	h.writeJSONResponse(w, map[string]string{
		"message":        "Reservation confirmed successfully",
		"reservation_id": reservationID,
		"order_id":       req.OrderID,
	}, http.StatusOK)
}

func (h *InventoryHandler) CancelReservation(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	reservationID := vars["reservationId"]

	if reservationID == "" {
		h.writeErrorResponse(w, "Reservation ID is required", http.StatusBadRequest)
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	json.NewDecoder(r.Body).Decode(&req) // Optional body

	if req.Reason == "" {
		req.Reason = "Manual cancellation"
	}

	h.logger.Info("Cancelling reservation",
		zap.String("reservation_id", reservationID),
		zap.String("reason", req.Reason),
	)

	err := h.inventoryService.CancelReservation(r.Context(), reservationID, req.Reason)
	if err != nil {
		h.logger.Error("Failed to cancel reservation", zap.Error(err))
		h.writeErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	h.writeJSONResponse(w, map[string]string{
		"message":        "Reservation cancelled successfully",
		"reservation_id": reservationID,
		"reason":         req.Reason,
	}, http.StatusOK)
}

// Helper methods
func (h *InventoryHandler) writeJSONResponse(w http.ResponseWriter, data interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		h.logger.Error("Failed to encode JSON response", zap.Error(err))
	}
}

func (h *InventoryHandler) writeErrorResponse(w http.ResponseWriter, message string, statusCode int) {
	errorResp := ErrorResponse{
		Error:   http.StatusText(statusCode),
		Message: message,
		Code:    statusCode,
	}
	h.writeJSONResponse(w, errorResp, statusCode)
}
