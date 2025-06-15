package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"inventory-service/internal/config"
	"inventory-service/internal/domain/entity"
	"inventory-service/internal/domain/repository"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq" // Quan trọng: thêm import này
	_ "github.com/lib/pq"
	"github.com/pkg/errors"
	"go.uber.org/zap"
)

type PostgresInventoryRepository struct {
	db     *sqlx.DB
	logger *zap.Logger
}

func NewPostgresConnection(cfg *config.DatabaseConfig) (*sqlx.DB, error) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Name, cfg.SSLMode)

	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		return nil, errors.Wrap(err, "failed to connect to postgres")
	}

	db.SetMaxOpenConns(cfg.MaxOpenConns)
	db.SetMaxIdleConns(cfg.MaxIdleConns)
	db.SetConnMaxLifetime(cfg.ConnMaxLifetime)

	// Test connection
	if err := db.Ping(); err != nil {
		return nil, errors.Wrap(err, "failed to ping postgres")
	}

	return db, nil
}

func NewPostgresInventoryRepository(db *sqlx.DB, logger *zap.Logger) repository.InventoryRepository {
	return &PostgresInventoryRepository{
		db:     db,
		logger: logger,
	}
}

func (r *PostgresInventoryRepository) GetByProductID(ctx context.Context, productID string) (*entity.Inventory, error) {
	var inventory entity.Inventory
	query := `
		SELECT id, product_id, quantity, reserved_quantity, available_quantity, 
		       status, min_stock_level, max_stock_level, reorder_point, 
		       created_at, updated_at, version
		FROM inventory 
		WHERE product_id = $1`

	err := r.db.GetContext(ctx, &inventory, query, productID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, errors.Wrap(err, "failed to get inventory by product ID")
	}

	return &inventory, nil
}

func (r *PostgresInventoryRepository) GetByProductIDs(ctx context.Context, productIDs []string) ([]*entity.Inventory, error) {
	if len(productIDs) == 0 {
		return []*entity.Inventory{}, nil
	}

	r.logger.Debug("Getting inventories by product IDs",
		zap.Strings("product_ids", productIDs),
		zap.Int("count", len(productIDs)))

	query := `
		SELECT id, product_id, quantity, reserved_quantity, available_quantity, 
		       status, min_stock_level, max_stock_level, reorder_point, 
		       created_at, updated_at, version
		FROM inventory 
		WHERE product_id = ANY($1)`

	var inventories []*entity.Inventory
	err := r.db.SelectContext(ctx, &inventories, query, pq.Array(productIDs))
	if err != nil {
		r.logger.Error("Failed to execute GetByProductIDs query",
			zap.Error(err),
			zap.Strings("product_ids", productIDs))
		return nil, errors.Wrap(err, "failed to get inventories by product IDs")
	}

	r.logger.Debug("Retrieved inventories",
		zap.Int("found_count", len(inventories)),
		zap.Int("requested_count", len(productIDs)))

	return inventories, nil
}

func (r *PostgresInventoryRepository) Create(ctx context.Context, inventory *entity.Inventory) error {
	if inventory.ID == "" {
		inventory.ID = uuid.New().String()
	}

	now := time.Now()
	inventory.CreatedAt = now
	inventory.UpdatedAt = now
	inventory.Version = 1

	if inventory.Status == "" {
		inventory.UpdateStatus()
	}

	query := `
		INSERT INTO inventory (id, product_id, quantity, reserved_quantity, status, 
		                      min_stock_level, max_stock_level, reorder_point, 
		                      created_at, updated_at, version)
		VALUES (:id, :product_id, :quantity, :reserved_quantity, :status, 
		        :min_stock_level, :max_stock_level, :reorder_point, 
		        :created_at, :updated_at, :version)`

	_, err := r.db.NamedExecContext(ctx, query, inventory)
	if err != nil {
		r.logger.Error("Failed to create inventory",
			zap.Error(err),
			zap.String("product_id", inventory.ProductID))
		return errors.Wrap(err, "failed to create inventory")
	}

	r.logger.Debug("Created inventory",
		zap.String("product_id", inventory.ProductID),
		zap.String("id", inventory.ID))

	return nil
}

func (r *PostgresInventoryRepository) Update(ctx context.Context, inventory *entity.Inventory) error {
	oldVersion := inventory.Version
	inventory.UpdatedAt = time.Now()
	inventory.Version++
	inventory.UpdateStatus()

	result, err := r.db.ExecContext(ctx,
		`UPDATE inventory 
		 SET quantity = $1, reserved_quantity = $2, status = $3, 
		     min_stock_level = $4, max_stock_level = $5, reorder_point = $6,
		     updated_at = $7, version = $8
		 WHERE id = $9 AND version = $10`,
		inventory.Quantity, inventory.ReservedQuantity, inventory.Status,
		inventory.MinStockLevel, inventory.MaxStockLevel, inventory.ReorderPoint,
		inventory.UpdatedAt, inventory.Version, inventory.ID, oldVersion)

	if err != nil {
		r.logger.Error("Failed to update inventory",
			zap.Error(err),
			zap.String("product_id", inventory.ProductID),
			zap.String("id", inventory.ID))
		return errors.Wrap(err, "failed to update inventory")
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errors.Wrap(err, "failed to get rows affected")
	}

	if rowsAffected == 0 {
		r.logger.Warn("Optimistic lock conflict",
			zap.String("product_id", inventory.ProductID),
			zap.Int32("attempted_version", inventory.Version),
			zap.Int32("old_version", oldVersion))
		return errors.New("optimistic lock error: inventory was modified by another transaction")
	}

	r.logger.Debug("Updated inventory",
		zap.String("product_id", inventory.ProductID),
		zap.Int32("new_version", inventory.Version))

	return nil
}

func (r *PostgresInventoryRepository) UpdateQuantity(ctx context.Context, productID string, quantityChange int32, operationType entity.OperationType, referenceID, reason, createdBy string) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return errors.Wrap(err, "failed to begin transaction")
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Get current inventory with lock
	var inventory entity.Inventory
	query := `
		SELECT id, product_id, quantity, reserved_quantity, available_quantity, 
		       status, min_stock_level, max_stock_level, reorder_point, 
		       created_at, updated_at, version
		FROM inventory 
		WHERE product_id = $1 FOR UPDATE`

	err = tx.GetContext(ctx, &inventory, query, productID)
	if err != nil {
		if err == sql.ErrNoRows {
			r.logger.Info("Creating new inventory record",
				zap.String("product_id", productID))

			newInventory := &entity.Inventory{
				ID:               uuid.New().String(),
				ProductID:        productID,
				Quantity:         0,
				ReservedQuantity: 0,
				MinStockLevel:    10,
				MaxStockLevel:    1000,
				ReorderPoint:     20,
				Status:           entity.StatusOutOfStock,
				CreatedAt:        time.Now(),
				UpdatedAt:        time.Now(),
				Version:          1,
			}

			// Create the inventory record first
			createQuery := `
				INSERT INTO inventory (id, product_id, quantity, reserved_quantity, status, 
				                      min_stock_level, max_stock_level, reorder_point, 
				                      created_at, updated_at, version)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

			_, err = tx.ExecContext(ctx, createQuery,
				newInventory.ID, newInventory.ProductID, newInventory.Quantity,
				newInventory.ReservedQuantity, newInventory.Status,
				newInventory.MinStockLevel, newInventory.MaxStockLevel,
				newInventory.ReorderPoint, newInventory.CreatedAt,
				newInventory.UpdatedAt, newInventory.Version)

			if err != nil {
				return errors.Wrap(err, "failed to create new inventory record")
			}

			inventory = *newInventory
		} else {
			return errors.Wrap(err, "failed to get inventory for update")
		}
	}

	// Calculate new quantity
	oldQuantity := inventory.Quantity
	newQuantity := oldQuantity + quantityChange

	if newQuantity < 0 {
		return errors.Errorf("insufficient inventory quantity: current=%d, change=%d", oldQuantity, quantityChange)
	}

	// Update inventory
	inventory.Quantity = newQuantity
	inventory.UpdateStatus()
	inventory.UpdatedAt = time.Now()
	inventory.Version++

	updateQuery := `
		UPDATE inventory 
		SET quantity = $1, status = $2, updated_at = $3, version = $4
		WHERE id = $5 AND version = $6`

	result, err := tx.ExecContext(ctx, updateQuery,
		inventory.Quantity, inventory.Status, inventory.UpdatedAt, inventory.Version,
		inventory.ID, inventory.Version-1)
	if err != nil {
		return errors.Wrap(err, "failed to update inventory quantity")
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errors.Wrap(err, "failed to get rows affected")
	}

	if rowsAffected == 0 {
		return errors.New("optimistic lock error during quantity update")
	}

	// Create history entry
	history := &entity.InventoryHistory{
		ID:             uuid.New().String(),
		ProductID:      productID,
		QuantityBefore: oldQuantity,
		QuantityAfter:  newQuantity,
		QuantityChange: quantityChange,
		OperationType:  operationType,
		ReferenceID:    referenceID,
		Reason:         reason,
		CreatedAt:      time.Now(),
		CreatedBy:      createdBy,
	}

	historyQuery := `
		INSERT INTO inventory_history (id, product_id, quantity_before, quantity_after, 
		                              quantity_change, operation_type, reference_id, 
		                              reason, created_at, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	_, err = tx.ExecContext(ctx, historyQuery,
		history.ID, history.ProductID, history.QuantityBefore, history.QuantityAfter,
		history.QuantityChange, history.OperationType, history.ReferenceID,
		history.Reason, history.CreatedAt, history.CreatedBy)
	if err != nil {
		return errors.Wrap(err, "failed to create history entry")
	}

	r.logger.Debug("Updated inventory quantity",
		zap.String("product_id", productID),
		zap.Int32("old_quantity", oldQuantity),
		zap.Int32("new_quantity", newQuantity),
		zap.Int32("change", quantityChange),
		zap.String("operation", string(operationType)))

	return tx.Commit()
}

func (r *PostgresInventoryRepository) CreateReservation(ctx context.Context, reservation *entity.InventoryReservation) error {
	if reservation.ID == "" {
		reservation.ID = uuid.New().String()
	}

	now := time.Now()
	reservation.CreatedAt = now
	reservation.UpdatedAt = now

	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return errors.Wrap(err, "failed to begin transaction")
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Create reservation
	reservationQuery := `
		INSERT INTO inventory_reservations (id, user_id, order_id, status, expires_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`

	_, err = tx.ExecContext(ctx, reservationQuery,
		reservation.ID, reservation.UserID, reservation.OrderID, reservation.Status,
		reservation.ExpiresAt, reservation.CreatedAt, reservation.UpdatedAt)
	if err != nil {
		return errors.Wrap(err, "failed to create reservation")
	}

	// Create reservation items and update inventory
	for i, item := range reservation.Items {
		// Validate item
		if item.ProductID == "" || item.Quantity <= 0 {
			return errors.Errorf("invalid reservation item at index %d: productId=%s, quantity=%d",
				i, item.ProductID, item.Quantity)
		}

		// Create reservation item
		itemID := uuid.New().String()
		itemQuery := `
			INSERT INTO inventory_reservation_items (id, reservation_id, product_id, quantity, created_at)
			VALUES ($1, $2, $3, $4, $5)`

		_, err = tx.ExecContext(ctx, itemQuery,
			itemID, reservation.ID, item.ProductID, item.Quantity, now)
		if err != nil {
			return errors.Wrap(err, "failed to create reservation item")
		}

		// Update inventory reserved quantity
		updateQuery := `
			UPDATE inventory 
			SET reserved_quantity = reserved_quantity + $1, updated_at = CURRENT_TIMESTAMP, version = version + 1
			WHERE product_id = $2 AND available_quantity >= $1`

		result, err := tx.ExecContext(ctx, updateQuery, item.Quantity, item.ProductID)
		if err != nil {
			return errors.Wrap(err, "failed to update inventory reserved quantity")
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return errors.Wrap(err, "failed to get rows affected")
		}

		if rowsAffected == 0 {
			return errors.Errorf("insufficient inventory for product %s: requested %d",
				item.ProductID, item.Quantity)
		}
	}

	r.logger.Debug("Created reservation",
		zap.String("reservation_id", reservation.ID),
		zap.String("user_id", reservation.UserID),
		zap.Int("items_count", len(reservation.Items)))

	return tx.Commit()
}

// Các method còn lại giữ nguyên nhưng thêm logging
func (r *PostgresInventoryRepository) GetReservation(ctx context.Context, reservationID string) (*entity.InventoryReservation, error) {
	var reservation entity.InventoryReservation
	reservationQuery := `
		SELECT id, user_id, order_id, status, expires_at, created_at, updated_at
		FROM inventory_reservations 
		WHERE id = $1`

	err := r.db.GetContext(ctx, &reservation, reservationQuery, reservationID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, errors.Wrap(err, "failed to get reservation")
	}

	// Get reservation items
	itemsQuery := `
		SELECT id, reservation_id, product_id, quantity, created_at
		FROM inventory_reservation_items 
		WHERE reservation_id = $1
		ORDER BY created_at`

	err = r.db.SelectContext(ctx, &reservation.Items, itemsQuery, reservationID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get reservation items")
	}

	return &reservation, nil
}

func (r *PostgresInventoryRepository) UpdateReservationStatus(ctx context.Context, reservationID string, status entity.ReservationStatus, orderID string) error {
	query := `
		UPDATE inventory_reservations 
		SET status = $1, order_id = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $3`

	result, err := r.db.ExecContext(ctx, query, status, orderID, reservationID)
	if err != nil {
		return errors.Wrap(err, "failed to update reservation status")
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errors.Wrap(err, "failed to get rows affected")
	}

	if rowsAffected == 0 {
		return errors.Errorf("reservation not found: %s", reservationID)
	}

	r.logger.Debug("Updated reservation status",
		zap.String("reservation_id", reservationID),
		zap.String("status", string(status)),
		zap.String("order_id", orderID))

	return nil
}

func (r *PostgresInventoryRepository) GetExpiredReservations(ctx context.Context) ([]*entity.InventoryReservation, error) {
	var reservations []*entity.InventoryReservation
	query := `
		SELECT id, user_id, order_id, status, expires_at, created_at, updated_at
		FROM inventory_reservations 
		WHERE status = 'pending' AND expires_at < CURRENT_TIMESTAMP
		ORDER BY expires_at`

	err := r.db.SelectContext(ctx, &reservations, query)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get expired reservations")
	}

	// Get items for each reservation
	for _, res := range reservations {
		itemsQuery := `
			SELECT id, reservation_id, product_id, quantity, created_at
			FROM inventory_reservation_items 
			WHERE reservation_id = $1`

		err = r.db.SelectContext(ctx, &res.Items, itemsQuery, res.ID)
		if err != nil {
			r.logger.Error("Failed to get items for expired reservation",
				zap.Error(err),
				zap.String("reservation_id", res.ID))
			continue
		}
	}

	return reservations, nil
}

func (r *PostgresInventoryRepository) ReserveInventoryBatch(ctx context.Context, reservation *entity.InventoryReservation) error {
	return r.CreateReservation(ctx, reservation)
}

func (r *PostgresInventoryRepository) ConfirmReservation(ctx context.Context, reservationID string, orderID string) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return errors.Wrap(err, "failed to begin transaction")
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Get reservation items
	var items []entity.InventoryReservationItem
	itemsQuery := `
		SELECT id, reservation_id, product_id, quantity, created_at
		FROM inventory_reservation_items 
		WHERE reservation_id = $1`

	err = tx.SelectContext(ctx, &items, itemsQuery, reservationID)
	if err != nil {
		return errors.Wrap(err, "failed to get reservation items")
	}

	if len(items) == 0 {
		return errors.Errorf("no items found for reservation %s", reservationID)
	}

	// Update inventory: convert reserved to actual reduction
	for _, item := range items {
		updateQuery := `
			UPDATE inventory 
			SET quantity = quantity - $1, reserved_quantity = reserved_quantity - $1, 
			    updated_at = CURRENT_TIMESTAMP, version = version + 1
			WHERE product_id = $2 AND reserved_quantity >= $1`

		result, err := tx.ExecContext(ctx, updateQuery, item.Quantity, item.ProductID)
		if err != nil {
			return errors.Wrap(err, "failed to confirm inventory reduction")
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return errors.Wrap(err, "failed to get rows affected")
		}

		if rowsAffected == 0 {
			return errors.Errorf("insufficient reserved inventory for product %s", item.ProductID)
		}

		// Create history entry
		historyID := uuid.New().String()
		historyQuery := `
			INSERT INTO inventory_history (id, product_id, quantity_before, quantity_after, 
			                              quantity_change, operation_type, reference_id, 
			                              reason, created_at, created_by)
			VALUES ($1, $2, 
			       (SELECT quantity + $3 FROM inventory WHERE product_id = $2),
			       (SELECT quantity FROM inventory WHERE product_id = $2),
			       -$3, 'purchase', $4, 'Order confirmation', CURRENT_TIMESTAMP, 'system')`

		_, err = tx.ExecContext(ctx, historyQuery, historyID, item.ProductID, item.Quantity, orderID)
		if err != nil {
			return errors.Wrap(err, "failed to create history entry")
		}
	}

	// Update reservation status
	updateReservationQuery := `
		UPDATE inventory_reservations 
		SET status = 'confirmed', order_id = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2`

	_, err = tx.ExecContext(ctx, updateReservationQuery, orderID, reservationID)
	if err != nil {
		return errors.Wrap(err, "failed to update reservation status")
	}

	r.logger.Info("Confirmed reservation",
		zap.String("reservation_id", reservationID),
		zap.String("order_id", orderID),
		zap.Int("items_count", len(items)))

	return tx.Commit()
}

func (r *PostgresInventoryRepository) CancelReservation(ctx context.Context, reservationID string, reason string) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return errors.Wrap(err, "failed to begin transaction")
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Get reservation items
	var items []entity.InventoryReservationItem
	itemsQuery := `
		SELECT id, reservation_id, product_id, quantity, created_at
		FROM inventory_reservation_items 
		WHERE reservation_id = $1`

	err = tx.SelectContext(ctx, &items, itemsQuery, reservationID)
	if err != nil {
		return errors.Wrap(err, "failed to get reservation items")
	}

	// Release reserved inventory
	for _, item := range items {
		updateQuery := `
			UPDATE inventory 
			SET reserved_quantity = reserved_quantity - $1, 
			    updated_at = CURRENT_TIMESTAMP, version = version + 1
			WHERE product_id = $2 AND reserved_quantity >= $1`

		result, err := tx.ExecContext(ctx, updateQuery, item.Quantity, item.ProductID)
		if err != nil {
			return errors.Wrap(err, "failed to release reserved inventory")
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return errors.Wrap(err, "failed to get rows affected")
		}

		if rowsAffected == 0 {
			r.logger.Warn("Could not release reserved inventory",
				zap.String("product_id", item.ProductID),
				zap.Int32("quantity", item.Quantity))
		}
	}

	// Update reservation status
	updateReservationQuery := `
		UPDATE inventory_reservations 
		SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
		WHERE id = $1`

	_, err = tx.ExecContext(ctx, updateReservationQuery, reservationID)
	if err != nil {
		return errors.Wrap(err, "failed to update reservation status")
	}

	r.logger.Info("Cancelled reservation",
		zap.String("reservation_id", reservationID),
		zap.String("reason", reason),
		zap.Int("items_count", len(items)))

	return tx.Commit()
}

func (r *PostgresInventoryRepository) CreateHistoryEntry(ctx context.Context, history *entity.InventoryHistory) error {
	if history.ID == "" {
		history.ID = uuid.New().String()
	}
	history.CreatedAt = time.Now()

	query := `
		INSERT INTO inventory_history (id, product_id, quantity_before, quantity_after, 
		                              quantity_change, operation_type, reference_id, 
		                              reason, created_at, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	_, err := r.db.ExecContext(ctx, query,
		history.ID, history.ProductID, history.QuantityBefore, history.QuantityAfter,
		history.QuantityChange, history.OperationType, history.ReferenceID,
		history.Reason, history.CreatedAt, history.CreatedBy)
	if err != nil {
		return errors.Wrap(err, "failed to create history entry")
	}

	return nil
}

func (r *PostgresInventoryRepository) GetHistoryByProductID(ctx context.Context, productID string, limit int, fromTime, toTime time.Time) ([]*entity.InventoryHistory, error) {
	var histories []*entity.InventoryHistory
	query := `
		SELECT id, product_id, quantity_before, quantity_after, quantity_change, 
		       operation_type, reference_id, reason, created_at, created_by
		FROM inventory_history 
		WHERE product_id = $1 AND created_at BETWEEN $2 AND $3
		ORDER BY created_at DESC 
		LIMIT $4`

	err := r.db.SelectContext(ctx, &histories, query, productID, fromTime, toTime, limit)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get inventory history")
	}

	return histories, nil
}
