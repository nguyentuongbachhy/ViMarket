package main

import (
	"context"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"inventory-service/internal/config"
	httpServer "inventory-service/internal/http"
	httpHandlers "inventory-service/internal/http/handlers"
	"inventory-service/internal/infrastructure/database"
	grpcServer "inventory-service/internal/infrastructure/grpc"
	grpcHandlers "inventory-service/internal/infrastructure/grpc/handlers"
	"inventory-service/internal/infrastructure/kafka"
	kafkaHandlers "inventory-service/internal/infrastructure/kafka/handlers"
	"inventory-service/internal/service"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize logger
	logger := initLogger(cfg.Logging)
	defer logger.Sync()

	logger.Info("Starting Inventory Service",
		zap.String("version", "1.0.0"),
		zap.String("log_level", cfg.Logging.Level),
	)

	// Initialize database
	db, err := database.NewPostgresConnection(&cfg.Database)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	logger.Info("Database connected successfully")

	// Initialize repository
	inventoryRepo := database.NewPostgresInventoryRepository(db, logger)

	// Initialize service
	inventoryService := service.NewInventoryService(inventoryRepo, logger)

	// Initialize Kafka producer
	kafkaProducer, err := kafka.NewProducer(&cfg.Kafka, logger)
	if err != nil {
		logger.Fatal("Failed to create Kafka producer", zap.Error(err))
	}
	defer kafkaProducer.Close()

	// Initialize event handler
	eventHandler := kafkaHandlers.NewInventoryEventHandler(inventoryService, kafkaProducer, logger)

	// Initialize Kafka consumer
	kafkaConsumer := kafka.NewConsumer(&cfg.Kafka, logger, eventHandler)

	// Initialize gRPC handler and server
	grpcHandler := grpcHandlers.NewInventoryHandler(inventoryService, logger)
	grpcSrv := grpcServer.NewServer(&cfg.GRPC, grpcHandler, logger)

	// Initialize HTTP handler and server
	httpHandler := httpHandlers.NewInventoryHandler(inventoryService, logger)
	httpSrv := httpServer.NewServer(&cfg.Server, httpHandler, logger)

	// Start services
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var wg sync.WaitGroup

	// Start Kafka consumer
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := kafkaConsumer.Start(ctx); err != nil {
			logger.Error("Kafka consumer failed", zap.Error(err))
		}
	}()

	// Start gRPC server
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := grpcSrv.Start(); err != nil {
			logger.Error("gRPC server failed", zap.Error(err))
		}
	}()

	// Start HTTP server
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := httpSrv.Start(); err != nil {
			logger.Error("HTTP server failed", zap.Error(err))
		}
	}()

	// Start cleanup routine for expired reservations
	wg.Add(1)
	go func() {
		defer wg.Done()
		ticker := time.NewTicker(cfg.Service.HealthCheckInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := inventoryService.CleanupExpiredReservations(ctx); err != nil {
					logger.Error("Failed to cleanup expired reservations", zap.Error(err))
				}
			}
		}
	}()

	logger.Info("All services started successfully")

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan

	logger.Info("Shutdown signal received, starting graceful shutdown...")

	// Cancel context to stop all goroutines
	cancel()

	// Stop servers
	grpcSrv.Stop()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := httpSrv.Stop(shutdownCtx); err != nil {
		logger.Error("Failed to stop HTTP server", zap.Error(err))
	}

	// Wait for all goroutines to finish
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		logger.Info("All services stopped gracefully")
	case <-time.After(30 * time.Second):
		logger.Warn("Timeout waiting for services to stop")
	}
}

func initLogger(cfg config.LoggingConfig) *zap.Logger {
	var level zapcore.Level
	switch cfg.Level {
	case "debug":
		level = zapcore.DebugLevel
	case "info":
		level = zapcore.InfoLevel
	case "warn":
		level = zapcore.WarnLevel
	case "error":
		level = zapcore.ErrorLevel
	default:
		level = zapcore.InfoLevel
	}

	config := zap.NewProductionConfig()
	config.Level = zap.NewAtomicLevelAt(level)

	if cfg.Format == "console" {
		config = zap.NewDevelopmentConfig()
		config.Level = zap.NewAtomicLevelAt(level)
	}

	logger, err := config.Build()
	if err != nil {
		panic(err)
	}

	return logger
}
