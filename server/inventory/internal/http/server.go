package http

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"inventory-service/internal/config"
	"inventory-service/internal/http/handlers"

	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

type Server struct {
	config  *config.ServerConfig
	logger  *zap.Logger
	server  *http.Server
	handler *handlers.InventoryHandler
}

func NewServer(cfg *config.ServerConfig, handler *handlers.InventoryHandler, logger *zap.Logger) *Server {
	return &Server{
		config:  cfg,
		logger:  logger,
		handler: handler,
	}
}

func (s *Server) Start() error {
	router := mux.NewRouter()

	// Health check
	router.HandleFunc("/health", s.healthCheck).Methods("GET")
	router.HandleFunc("/ready", s.readinessCheck).Methods("GET")

	// API endpoints with middleware
	api := router.PathPrefix("/api/v1").Subrouter()
	api.Use(s.loggingMiddleware)
	api.Use(s.corsMiddleware)

	// Inventory endpoints
	api.HandleFunc("/inventory/{productId}", s.handler.GetInventory).Methods("GET")
	api.HandleFunc("/inventory/{productId}/history", s.handler.GetInventoryHistory).Methods("GET")
	api.HandleFunc("/inventory/batch", s.handler.CheckInventoryBatch).Methods("POST")
	api.HandleFunc("/inventory/update", s.handler.UpdateInventory).Methods("POST")

	// Reservation endpoints
	api.HandleFunc("/reservations", s.handler.ReserveInventory).Methods("POST")
	api.HandleFunc("/reservations/{reservationId}/confirm", s.handler.ConfirmReservation).Methods("POST")
	api.HandleFunc("/reservations/{reservationId}/cancel", s.handler.CancelReservation).Methods("POST")

	address := fmt.Sprintf("%s:%s", s.config.Host, s.config.Port)

	s.server = &http.Server{
		Addr:         address,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	s.logger.Info("Starting HTTP server", zap.String("address", address))

	return s.server.ListenAndServe()
}

func (s *Server) Stop(ctx context.Context) error {
	if s.server != nil {
		s.logger.Info("Stopping HTTP server")
		return s.server.Shutdown(ctx)
	}
	return nil
}

func (s *Server) healthCheck(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().Unix(),
		"service":   "inventory-service",
		"version":   "1.0.0",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (s *Server) readinessCheck(w http.ResponseWriter, r *http.Request) {
	// TODO: Add actual readiness checks (database, kafka, etc.)
	response := map[string]interface{}{
		"status":    "ready",
		"timestamp": time.Now().Unix(),
		"service":   "inventory-service",
		"checks": map[string]string{
			"database": "ok",
			"kafka":    "ok",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (s *Server) loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		s.logger.Info("HTTP request started",
			zap.String("method", r.Method),
			zap.String("path", r.URL.Path),
			zap.String("remote_addr", r.RemoteAddr),
			zap.String("user_agent", r.UserAgent()),
		)

		// Wrap ResponseWriter to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: 200}
		next.ServeHTTP(wrapped, r)

		duration := time.Since(start)
		s.logger.Info("HTTP request completed",
			zap.String("method", r.Method),
			zap.String("path", r.URL.Path),
			zap.Int("status_code", wrapped.statusCode),
			zap.Duration("duration", duration),
		)
	})
}

func (s *Server) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
