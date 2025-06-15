package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Kafka    KafkaConfig
	GRPC     GRPCConfig
	Service  ServiceConfig
	Logging  LoggingConfig
}

type ServerConfig struct {
	Port string
	Host string
}

type DatabaseConfig struct {
	Host            string
	Port            string
	Name            string
	User            string
	Password        string
	SSLMode         string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

type KafkaConfig struct {
	Brokers       []string
	ConsumerGroup string
	Topics        KafkaTopics
}

type KafkaTopics struct {
	ProductPurchased   string
	InventoryUpdate    string
	InventoryReserved  string
	InventoryConfirmed string
}

type GRPCConfig struct {
	Port        string
	Host        string
	ProductHost string
	ProductPort string
}

type ServiceConfig struct {
	ReservationTimeoutMinutes int
	InventoryCheckBatchSize   int
	HealthCheckInterval       time.Duration
}

type LoggingConfig struct {
	Level  string
	Format string
}

func Load() *Config {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}

	return &Config{
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8083"),
			Host: getEnv("SERVER_HOST", "localhost"),
		},
		Database: DatabaseConfig{
			Host:            getEnv("DB_HOST", "localhost"),
			Port:            getEnv("DB_PORT", "5432"),
			Name:            getEnv("DB_NAME", "ecommerce_inventory"),
			User:            getEnv("DB_USER", "inventory_user"),
			Password:        getEnv("DB_PASSWORD", "inventory_password"),
			SSLMode:         getEnv("DB_SSL_MODE", "disable"),
			MaxOpenConns:    getEnvAsInt("DB_MAX_OPEN_CONNS", 25),
			MaxIdleConns:    getEnvAsInt("DB_MAX_IDLE_CONNS", 5),
			ConnMaxLifetime: getEnvAsDuration("DB_CONN_MAX_LIFETIME", 300*time.Second),
		},
		Kafka: KafkaConfig{
			Brokers:       strings.Split(getEnv("KAFKA_BROKERS", "localhost:9092"), ","),
			ConsumerGroup: getEnv("KAFKA_CONSUMER_GROUP", "inventory-service-group"),
			Topics: KafkaTopics{
				ProductPurchased:   getEnv("KAFKA_TOPIC_PRODUCT_PURCHASED", "product.purchased"),
				InventoryUpdate:    getEnv("KAFKA_TOPIC_INVENTORY_UPDATE", "inventory.updated"),
				InventoryReserved:  getEnv("KAFKA_TOPIC_INVENTORY_RESERVED", "inventory.reserved"),
				InventoryConfirmed: getEnv("KAFKA_TOPIC_INVENTORY_CONFIRMED", "inventory.confirmed"),
			},
		},
		GRPC: GRPCConfig{
			Port:        getEnv("GRPC_PORT", "50054"),
			Host:        getEnv("GRPC_HOST", "localhost"),
			ProductHost: getEnv("PRODUCT_GRPC_HOST", "localhost"),
			ProductPort: getEnv("PRODUCT_GRPC_PORT", "50053"),
		},
		Service: ServiceConfig{
			ReservationTimeoutMinutes: getEnvAsInt("RESERVATION_TIMEOUT_MINUTES", 15),
			InventoryCheckBatchSize:   getEnvAsInt("INVENTORY_CHECK_BATCH_SIZE", 100),
			HealthCheckInterval:       getEnvAsDuration("HEALTH_CHECK_INTERVAL", 30*time.Second),
		},
		Logging: LoggingConfig{
			Level:  getEnv("LOG_LEVEL", "info"),
			Format: getEnv("LOG_FORMAT", "json"),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}
