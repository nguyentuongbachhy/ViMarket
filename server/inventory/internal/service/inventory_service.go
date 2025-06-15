package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"inventory-service/internal/domain/entity"
	"inventory-service/internal/domain/repository"

	"github.com/google/uuid"
	"github.com/pkg/errors"
	"go.uber.org/zap"
)

type InventoryService struct {
	repo   repository.InventoryRepository
	logger *zap.Logger
}

type ProductInfo struct {
	InventoryStatus string
	Name            string
	Price           float64
}

func NewInventoryService(repo repository.InventoryRepository, logger *zap.Logger) *InventoryService {
	return &InventoryService{
		repo:   repo,
		logger: logger,
	}
}

func (s *InventoryService) CheckInventoryWithProductInfo(ctx context.Context, productID string, quantity int32, productInfo *ProductInfo) (*entity.Inventory, bool, error) {
	s.logger.Info("=== INVENTORY CHECK START ===",
		zap.String("product_id", productID),
		zap.Int32("quantity", quantity))

	if productInfo != nil {
		s.logger.Info("Product info received",
			zap.String("product_id", productID),
			zap.String("inventory_status", productInfo.InventoryStatus),
			zap.String("name", productInfo.Name),
			zap.Float64("price", productInfo.Price))
	} else {
		s.logger.Warn("No product info provided", zap.String("product_id", productID))
	}

	// Handle test connections
	if productID == "test-connection" {
		s.logger.Info("Processing test connection request")
		return &entity.Inventory{
			ProductID:        productID,
			Quantity:         0,
			ReservedQuantity: 0,
			Status:           entity.StatusOutOfStock,
		}, false, nil
	}

	// Tìm inventory trong database
	inv, err := s.repo.GetByProductID(ctx, productID)
	if err != nil {
		s.logger.Error("Failed to get inventory from repository",
			zap.String("product_id", productID),
			zap.Error(err))
		return nil, false, err
	}

	if inv != nil {
		s.logger.Info("Found existing inventory",
			zap.String("product_id", productID),
			zap.Int32("quantity", inv.Quantity),
			zap.Int32("reserved_quantity", inv.ReservedQuantity),
			zap.Int32("available_quantity", inv.CalculateAvailableQuantity()),
			zap.String("status", string(inv.Status)))
	} else {
		s.logger.Info("No existing inventory found, will create new one",
			zap.String("product_id", productID))
	}

	// Nếu không tìm thấy -> Smart create
	if inv == nil {
		var createProductInfo *ProductInfo

		if productInfo != nil {
			createProductInfo = productInfo
			s.logger.Info("Using provided product info for creation")
		} else {
			// Create default product info
			createProductInfo = &ProductInfo{
				InventoryStatus: "available", // DEFAULT TO AVAILABLE
				Name:            "Auto-created Product",
				Price:           0,
			}
			s.logger.Info("Using default product info for creation",
				zap.String("default_status", createProductInfo.InventoryStatus))
		}

		inv, err = s.smartCreateInventory(ctx, productID, createProductInfo)
		if err != nil {
			s.logger.Error("Failed to create inventory",
				zap.String("product_id", productID),
				zap.Error(err))
			return nil, false, err
		}

		s.logger.Info("New inventory created",
			zap.String("product_id", productID),
			zap.Int32("quantity", inv.Quantity),
			zap.Int32("reserved_quantity", inv.ReservedQuantity),
			zap.Int32("available_quantity", inv.CalculateAvailableQuantity()),
			zap.String("status", string(inv.Status)))
	}

	// Check availability
	available := inv.CanReserve(quantity)

	s.logger.Info("=== INVENTORY CHECK RESULT ===",
		zap.String("product_id", productID),
		zap.Int32("requested_quantity", quantity),
		zap.Int32("available_quantity", inv.CalculateAvailableQuantity()),
		zap.Bool("can_reserve", available),
		zap.String("status", string(inv.Status)))

	return inv, available, nil
}

func (s *InventoryService) smartCreateInventory(ctx context.Context, productID string, productInfo *ProductInfo) (*entity.Inventory, error) {
	s.logger.Info("=== SMART CREATE INVENTORY START ===",
		zap.String("product_id", productID),
		zap.String("inventory_status", productInfo.InventoryStatus),
		zap.String("product_name", productInfo.Name),
		zap.Float64("product_price", productInfo.Price))

	var quantity int32
	var status entity.InventoryStatus

	switch strings.ToLower(strings.TrimSpace(productInfo.InventoryStatus)) {
	case "upcoming":
		quantity = 50 // Medium stock for upcoming products
		status = entity.StatusUpcoming
		s.logger.Info("Creating UPCOMING inventory with medium stock",
			zap.String("product_id", productID),
			zap.Int32("quantity", quantity))

	case "available", "out_of_stock", "":
		quantity = 100
		status = entity.StatusAvailable
		s.logger.Info("Creating AVAILABLE inventory with high stock (ignoring product catalog status)",
			zap.String("product_id", productID),
			zap.String("original_catalog_status", productInfo.InventoryStatus),
			zap.Int32("quantity", quantity))

	default:
		// Default to available with high stock
		quantity = 100
		status = entity.StatusAvailable
		s.logger.Info("Unknown status, defaulting to AVAILABLE with high stock",
			zap.String("product_id", productID),
			zap.String("original_status", productInfo.InventoryStatus),
			zap.Int32("quantity", quantity))
	}

	// Create inventory record
	inventory := &entity.Inventory{
		ID:                uuid.New().String(),
		ProductID:         productID,
		Quantity:          quantity,
		ReservedQuantity:  0,
		AvailableQuantity: quantity, // Explicitly set this
		Status:            status,
		MinStockLevel:     10,
		MaxStockLevel:     1000,
		ReorderPoint:      20,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
		Version:           1,
	}

	s.logger.Info("Inventory object created in memory",
		zap.String("product_id", productID),
		zap.Int32("quantity", inventory.Quantity),
		zap.Int32("reserved_quantity", inventory.ReservedQuantity),
		zap.Int32("available_quantity", inventory.AvailableQuantity),
		zap.String("status", string(inventory.Status)))

	// Save to database
	err := s.repo.Create(ctx, inventory)
	if err != nil {
		s.logger.Error("Failed to create inventory in database",
			zap.String("product_id", productID),
			zap.Error(err))
		return nil, fmt.Errorf("failed to create inventory: %w", err)
	}

	// Verify saved inventory
	savedInv, err := s.repo.GetByProductID(ctx, productID)
	if err == nil && savedInv != nil {
		s.logger.Info("Verified saved inventory",
			zap.String("product_id", productID),
			zap.Int32("saved_quantity", savedInv.Quantity),
			zap.Int32("saved_reserved", savedInv.ReservedQuantity),
			zap.Int32("saved_available", savedInv.CalculateAvailableQuantity()),
			zap.String("saved_status", string(savedInv.Status)))
	}

	s.logger.Info("=== SMART CREATE INVENTORY COMPLETED ===",
		zap.String("product_id", productID),
		zap.Int32("final_quantity", inventory.Quantity),
		zap.Int32("final_available", inventory.CalculateAvailableQuantity()),
		zap.String("final_status", string(inventory.Status)))

	return inventory, nil
}

func (s *InventoryService) CheckInventoryBatch(ctx context.Context, items []struct {
	ProductID string
	Quantity  int32
}) ([]*entity.Inventory, []bool, error) {
	if len(items) == 0 {
		return []*entity.Inventory{}, []bool{}, nil
	}

	productIDs := make([]string, len(items))
	for i, item := range items {
		productIDs[i] = item.ProductID
	}

	inventories, err := s.repo.GetByProductIDs(ctx, productIDs)
	if err != nil {
		return nil, nil, errors.Wrap(err, "failed to check inventory batch")
	}

	// Create a map for quick lookup
	inventoryMap := make(map[string]*entity.Inventory)
	for _, inv := range inventories {
		inventoryMap[inv.ProductID] = inv
	}

	// Build results
	results := make([]*entity.Inventory, len(items))
	available := make([]bool, len(items))

	for i, item := range items {
		if inv, exists := inventoryMap[item.ProductID]; exists {
			results[i] = inv
			available[i] = inv.CanReserve(item.Quantity)
		} else {
			// Create default inventory
			defaultInv := &entity.Inventory{
				ProductID:        item.ProductID,
				Quantity:         0,
				ReservedQuantity: 0,
				Status:           entity.StatusOutOfStock,
				MinStockLevel:    0,
				MaxStockLevel:    1000,
				ReorderPoint:     10,
			}
			results[i] = defaultInv
			available[i] = false
		}
	}

	return results, available, nil
}

func (s *InventoryService) GetReservation(ctx context.Context, reservationID string) (*entity.InventoryReservation, error) {
	reservation, err := s.repo.GetReservation(ctx, reservationID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get reservation")
	}
	return reservation, nil
}

func (s *InventoryService) ReserveInventory(ctx context.Context, userID string, items []struct {
	ProductID string
	Quantity  int32
}, timeoutMinutes int) (*entity.InventoryReservation, error) {
	reservationID := uuid.New().String()
	expiresAt := time.Now().Add(time.Duration(timeoutMinutes) * time.Minute)

	// Check availability first
	_, available, err := s.CheckInventoryBatch(ctx, items)
	if err != nil {
		return nil, errors.Wrap(err, "failed to check inventory availability")
	}

	for i, isAvailable := range available {
		if !isAvailable {
			return nil, errors.Errorf("insufficient inventory for product %s", items[i].ProductID)
		}
	}

	// Create reservation
	reservationItems := make([]entity.InventoryReservationItem, len(items))
	for i, item := range items {
		reservationItems[i] = entity.InventoryReservationItem{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
		}
	}

	reservation := &entity.InventoryReservation{
		ID:        reservationID,
		UserID:    userID,
		Status:    entity.ReservationPending,
		ExpiresAt: expiresAt,
		Items:     reservationItems,
	}

	err = s.repo.ReserveInventoryBatch(ctx, reservation)
	if err != nil {
		return nil, errors.Wrap(err, "failed to reserve inventory")
	}

	s.logger.Info("Inventory reserved",
		zap.String("reservation_id", reservationID),
		zap.String("user_id", userID),
		zap.Int("items_count", len(items)),
		zap.Time("expires_at", expiresAt),
	)

	return reservation, nil
}

func (s *InventoryService) ConfirmReservation(ctx context.Context, reservationID, orderID string) error {
	reservation, err := s.repo.GetReservation(ctx, reservationID)
	if err != nil {
		return errors.Wrap(err, "failed to get reservation")
	}

	if reservation == nil {
		return errors.New("reservation not found")
	}

	if !reservation.CanConfirm() {
		return errors.Errorf("reservation cannot be confirmed: status=%s, expired=%v",
			reservation.Status, reservation.IsExpired())
	}

	err = s.repo.ConfirmReservation(ctx, reservationID, orderID)
	if err != nil {
		return errors.Wrap(err, "failed to confirm reservation")
	}

	s.logger.Info("Reservation confirmed",
		zap.String("reservation_id", reservationID),
		zap.String("order_id", orderID),
		zap.String("user_id", reservation.UserID),
	)

	return nil
}

func (s *InventoryService) CancelReservation(ctx context.Context, reservationID, reason string) error {
	reservation, err := s.repo.GetReservation(ctx, reservationID)
	if err != nil {
		return errors.Wrap(err, "failed to get reservation")
	}

	if reservation == nil {
		return errors.New("reservation not found")
	}

	if !reservation.CanCancel() {
		return errors.Errorf("reservation cannot be cancelled: status=%s", reservation.Status)
	}

	err = s.repo.CancelReservation(ctx, reservationID, reason)
	if err != nil {
		return errors.Wrap(err, "failed to cancel reservation")
	}

	s.logger.Info("Reservation cancelled",
		zap.String("reservation_id", reservationID),
		zap.String("reason", reason),
		zap.String("user_id", reservation.UserID),
	)

	return nil
}

func (s *InventoryService) UpdateInventory(ctx context.Context, updates []struct {
	ProductID      string
	QuantityChange int32
	OperationType  entity.OperationType
	ReferenceID    string
	Reason         string
	CreatedBy      string
}) error {
	for _, update := range updates {
		err := s.repo.UpdateQuantity(ctx,
			update.ProductID,
			update.QuantityChange,
			update.OperationType,
			update.ReferenceID,
			update.Reason,
			update.CreatedBy,
		)
		if err != nil {
			return errors.Wrapf(err, "failed to update inventory for product %s", update.ProductID)
		}

		s.logger.Info("Inventory updated",
			zap.String("product_id", update.ProductID),
			zap.Int32("quantity_change", update.QuantityChange),
			zap.String("operation_type", string(update.OperationType)),
			zap.String("reference_id", update.ReferenceID),
		)
	}

	return nil
}

func (s *InventoryService) GetInventoryHistory(ctx context.Context, productID string, limit int, fromTime, toTime time.Time) ([]*entity.InventoryHistory, error) {
	if limit <= 0 {
		limit = 100
	}
	if limit > 1000 {
		limit = 1000
	}

	histories, err := s.repo.GetHistoryByProductID(ctx, productID, limit, fromTime, toTime)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get inventory history")
	}

	return histories, nil
}

func (s *InventoryService) CleanupExpiredReservations(ctx context.Context) error {
	expiredReservations, err := s.repo.GetExpiredReservations(ctx)
	if err != nil {
		return errors.Wrap(err, "failed to get expired reservations")
	}

	for _, reservation := range expiredReservations {
		err := s.repo.CancelReservation(ctx, reservation.ID, "Reservation expired")
		if err != nil {
			s.logger.Error("Failed to cleanup expired reservation",
				zap.String("reservation_id", reservation.ID),
				zap.Error(err),
			)
			continue
		}

		s.logger.Info("Expired reservation cleaned up",
			zap.String("reservation_id", reservation.ID),
			zap.String("user_id", reservation.UserID),
		)
	}

	return nil
}

func (s *InventoryService) SyncInventoryStatus(ctx context.Context, productID string) error {
	inventory, err := s.repo.GetByProductID(ctx, productID)
	if err != nil {
		return errors.Wrap(err, "failed to get inventory for sync")
	}

	if inventory == nil {
		return errors.New("inventory not found")
	}

	oldStatus := inventory.Status
	inventory.UpdateStatus()

	if oldStatus != inventory.Status {
		err = s.repo.Update(ctx, inventory)
		if err != nil {
			return errors.Wrap(err, "failed to update inventory status")
		}

		s.logger.Info("Inventory status synced",
			zap.String("product_id", productID),
			zap.String("old_status", string(oldStatus)),
			zap.String("new_status", string(inventory.Status)),
		)
	}

	return nil
}
