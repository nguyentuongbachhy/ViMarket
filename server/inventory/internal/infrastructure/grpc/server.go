package grpc

import (
	"context"
	"fmt"
	"net"
	"time"

	"inventory-service/internal/config"
	"inventory-service/internal/infrastructure/grpc/handlers"
	inventorypb "inventory-service/proto/inventory"

	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type Server struct {
	config  *config.GRPCConfig
	logger  *zap.Logger
	server  *grpc.Server
	handler *handlers.InventoryHandler
}

func NewServer(cfg *config.GRPCConfig, handler *handlers.InventoryHandler, logger *zap.Logger) *Server {
	return &Server{
		config:  cfg,
		logger:  logger,
		handler: handler,
	}
}

func (s *Server) Start() error {
	address := fmt.Sprintf("%s:%s", s.config.Host, s.config.Port)

	listener, err := net.Listen("tcp", address)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", address, err)
	}

	// Create gRPC server with interceptors
	s.server = grpc.NewServer(
		grpc.UnaryInterceptor(s.loggingInterceptor),
	)

	// Register services
	inventorypb.RegisterInventoryServiceServer(s.server, s.handler) // Update registration

	// Enable reflection for development
	reflection.Register(s.server)

	s.logger.Info("Starting gRPC server", zap.String("address", address))

	return s.server.Serve(listener)
}

func (s *Server) Stop() {
	if s.server != nil {
		s.logger.Info("Stopping gRPC server")
		s.server.GracefulStop()
	}
}

func (s *Server) loggingInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	start := time.Now()

	s.logger.Info("gRPC request started",
		zap.String("method", info.FullMethod),
	)

	resp, err := handler(ctx, req)

	duration := time.Since(start)

	if err != nil {
		s.logger.Error("gRPC request failed",
			zap.String("method", info.FullMethod),
			zap.Duration("duration", duration),
			zap.Error(err),
		)
	} else {
		s.logger.Info("gRPC request completed",
			zap.String("method", info.FullMethod),
			zap.Duration("duration", duration),
		)
	}

	return resp, err
}
