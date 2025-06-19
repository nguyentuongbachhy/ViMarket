package repository

import (
	"context"
	"time"

	"inventory-service/internal/domain/entity"
)

type InventoryRepository interface {
	// Inventory operations
	GetByProductID(ctx context.Context, productID string) (*entity.Inventory, error)
	GetByProductIDs(ctx context.Context, productIDs []string) ([]*entity.Inventory, error)
	Create(ctx context.Context, inventory *entity.Inventory) error
	Update(ctx context.Context, inventory *entity.Inventory) error
	UpdateQuantity(ctx context.Context, productID string, quantityChange int32, operationType entity.OperationType, referenceID, reason, createdBy string) error

	// Reservation operations
	CreateReservation(ctx context.Context, reservation *entity.InventoryReservation) error
	GetReservation(ctx context.Context, reservationID string) (*entity.InventoryReservation, error)
	UpdateReservationStatus(ctx context.Context, reservationID string, status entity.ReservationStatus, orderID string) error
	GetExpiredReservations(ctx context.Context) ([]*entity.InventoryReservation, error)

	// History operations
	CreateHistoryEntry(ctx context.Context, history *entity.InventoryHistory) error
	GetHistoryByProductID(ctx context.Context, productID string, limit int, fromTime, toTime time.Time) ([]*entity.InventoryHistory, error)

	// Batch operations
	ReserveInventoryBatch(ctx context.Context, reservation *entity.InventoryReservation) error
	ConfirmReservation(ctx context.Context, reservationID string, orderID string) error
	CancelReservation(ctx context.Context, reservationID string, reason string) error
}
