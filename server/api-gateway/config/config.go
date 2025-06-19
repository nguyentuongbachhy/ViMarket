package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Server     ServerConfig     `mapstructure:"server"`
	Services   ServicesConfig   `mapstructure:"services"`
	JWT        JWTConfig        `mapstructure:"jwt"`
	LogLevel   string           `mapstructure:"log_level"`
	Middleware MiddlewareConfig `mapstructure:"middleware"`
}

type ServerConfig struct {
	Port         int           `mapstructure:"port"`
	ReadTimeout  time.Duration `mapstructure:"read_timeout"`
	WriteTimeout time.Duration `mapstructure:"write_timeout"`
	IdleTimeout  time.Duration `mapstructure:"idle_timeout"`
}

type ServicesConfig struct {
	Chatbot       string `mapstructure:"chatbot"`
	User          string `mapstructure:"user"`
	Product       string `mapstructure:"product"`
	Cart          string `mapstructure:"cart"`
	Wishlist      string `mapstructure:"wishlist"`
	Order         string `mapstructure:"order"`
	Review        string `mapstructure:"review"`
	Notifications string `mapstructure:"notifications"`
}

type JWTConfig struct {
	SecretKey         string        `mapstructure:"secret_key"`
	Algorithm         string        `mapstructure:"algorithm"`
	ExpirationSeconds int64         `mapstructure:"expiration_seconds"`
	Issuer            string        `mapstructure:"issuer"`
	Audience          string        `mapstructure:"audience"`
	TokenExpiration   time.Duration `mapstructure:"-"`
}

type MiddlewareConfig struct {
	EnableCORS     bool     `mapstructure:"enable_cors"`
	AllowedOrigins []string `mapstructure:"allowed_origins"`
	AllowedMethods []string `mapstructure:"allowed_methods"`
	AllowedHeaders []string `mapstructure:"allowed_headers"`
	Environment    string   `mapstructure:"environment"`
}

func LoadConfig() (*Config, error) {
	viper.SetDefault("server.port", 9000)
	viper.SetDefault("server.read_timeout", "5s")
	viper.SetDefault("server.write_timeout", "10s")
	viper.SetDefault("server.idle_timeout", "120s")

	viper.SetDefault("services.chatbot", "http://localhost:8000")
	viper.SetDefault("services.user", "http://localhost:5009")
	viper.SetDefault("services.product", "http://localhost:8082")
	viper.SetDefault("services.cart", "http://localhost:8002")
	viper.SetDefault("services.wishlist", "http://localhost:8084")
	viper.SetDefault("services.order", "http://localhost:8004")
	viper.SetDefault("services.review", "http://localhost:8005")
	viper.SetDefault("services.notifications", "http://localhost:8006")

	viper.SetDefault("jwt.secret_key", "jYNKRd9KDzX+IG+6KWz31IXr+QX5GAQ1Svr3LWkzUSP3DpjKm4zsrlbf8B9b14EH")
	viper.SetDefault("jwt.algorithm", "HS512")
	viper.SetDefault("jwt.expiration_seconds", 86400)
	viper.SetDefault("jwt.issuer", "ecommerce-api")
	viper.SetDefault("jwt.audience", "ecommerce-clients")

	viper.SetDefault("log_level", "info")

	viper.SetDefault("middleware.enable_cors", true)
	viper.SetDefault("middleware.environment", "development")

	env := viper.GetString("middleware.environment")
	if env == "production" {
		viper.SetDefault("middleware.allowed_origins", []string{})
	} else {
		viper.SetDefault("middleware.allowed_origins", []string{
			"http://localhost:5173",
			"http://localhost:3000",
		})
	}
	viper.SetDefault("middleware.allowed_methods", []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"})
	viper.SetDefault("middleware.allowed_headers", []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"})

	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("unable to decode config into struct: %w", err)
	}

	config.JWT.TokenExpiration = time.Duration(config.JWT.ExpirationSeconds) * time.Second

	return &config, nil
}
