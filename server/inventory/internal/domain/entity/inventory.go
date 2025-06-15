package entity

import (
	"time"
)

type InventoryStatus string

const (
	StatusAvailable  InventoryStatus = "available"
	StatusOutOfStock InventoryStatus = "out_of_stock"
	StatusUpcoming   InventoryStatus = "upcoming"
	StatusEmpty      InventoryStatus = ""
)

type Inventory struct {
	ID                string          `json:"id" db:"id"`
	ProductID         string          `json:"product_id" db:"product_id"`
	Quantity          int32           `json:"quantity" db:"quantity"`
	ReservedQuantity  int32           `json:"reserved_quantity" db:"reserved_quantity"`
	AvailableQuantity int32           `json:"available_quantity" db:"available_quantity"`
	Status            InventoryStatus `json:"status" db:"status"`
	MinStockLevel     int32           `json:"min_stock_level" db:"min_stock_level"`
	MaxStockLevel     int32           `json:"max_stock_level" db:"max_stock_level"`
	ReorderPoint      int32           `json:"reorder_point" db:"reorder_point"`
	CreatedAt         time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at" db:"updated_at"`
	Version           int32           `json:"version" db:"version"`
}

type InventoryReservation struct {
	ID        string                     `json:"id" db:"id"`
	UserID    string                     `json:"user_id" db:"user_id"`
	OrderID   string                     `json:"order_id" db:"order_id"`
	Status    ReservationStatus          `json:"status" db:"status"`
	ExpiresAt time.Time                  `json:"expires_at" db:"expires_at"`
	CreatedAt time.Time                  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time                  `json:"updated_at" db:"updated_at"`
	Items     []InventoryReservationItem `json:"items" db:"-"`
}

type ReservationStatus string

const (
	ReservationPending   ReservationStatus = "pending"
	ReservationConfirmed ReservationStatus = "confirmed"
	ReservationCancelled ReservationStatus = "cancelled"
	ReservationExpired   ReservationStatus = "expired"
)

type InventoryReservationItem struct {
	ID            string    `json:"id" db:"id"`
	ReservationID string    `json:"reservation_id" db:"reservation_id"`
	ProductID     string    `json:"product_id" db:"product_id"`
	Quantity      int32     `json:"quantity" db:"quantity"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

type InventoryHistory struct {
	ID             string        `json:"id" db:"id"`
	ProductID      string        `json:"product_id" db:"product_id"`
	QuantityBefore int32         `json:"quantity_before" db:"quantity_before"`
	QuantityAfter  int32         `json:"quantity_after" db:"quantity_after"`
	QuantityChange int32         `json:"quantity_change" db:"quantity_change"`
	OperationType  OperationType `json:"operation_type" db:"operation_type"`
	ReferenceID    string        `json:"reference_id" db:"reference_id"`
	Reason         string        `json:"reason" db:"reason"`
	CreatedAt      time.Time     `json:"created_at" db:"created_at"`
	CreatedBy      string        `json:"created_by" db:"created_by"`
}

type OperationType string

const (
	OperationPurchase   OperationType = "purchase"
	OperationRestock    OperationType = "restock"
	OperationAdjustment OperationType = "adjustment"
	OperationReturn     OperationType = "return"
	OperationReserve    OperationType = "reserve"
	OperationRelease    OperationType = "release"
)

// Helper methods
func (i *Inventory) CalculateAvailableQuantity() int32 {
	return i.Quantity - i.ReservedQuantity
}

func (i *Inventory) CanReserve(quantity int32) bool {
	return i.CalculateAvailableQuantity() >= quantity
}

func (i *Inventory) UpdateStatus() {
	availableQty := i.CalculateAvailableQuantity()

	if availableQty <= 0 {
		i.Status = StatusOutOfStock
	} else if availableQty <= i.ReorderPoint {
		i.Status = StatusAvailable // Could be "low_stock" if you want more granularity
	} else {
		i.Status = StatusAvailable
	}
}

func (r *InventoryReservation) IsExpired() bool {
	return time.Now().After(r.ExpiresAt)
}

func (r *InventoryReservation) CanConfirm() bool {
	return r.Status == ReservationPending && !r.IsExpired()
}

func (r *InventoryReservation) CanCancel() bool {
	return r.Status == ReservationPending
}
