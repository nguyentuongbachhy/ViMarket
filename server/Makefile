.PHONY: help infrastructure inventory product user cart order wishlist api-gateway start stop clean logs

# Default target
help:
	@echo "Available commands:"
	@echo "  start          - Start all services in order"
	@echo "  stop           - Stop all services"
	@echo "  clean          - Clean up containers and volumes"
	@echo "  infrastructure - Start infrastructure services"
	@echo "  inventory      - Start inventory service"
	@echo "  product        - Start product service"
	@echo "  user           - Start user service"
	@echo "  cart           - Start cart service"
	@echo "  order          - Start order service"
	@echo "  wishlist       - Start wishlist service"
	@echo "  api-gateway    - Start API gateway"
	@echo "  logs           - Show logs for all services"
	@echo "  status         - Check status of all services"

# Start infrastructure and wait for it to be ready
infrastructure:
	@echo "🚀 Starting infrastructure services..."
	cd infrastructure && docker compose up -d
	@echo "⏳ Waiting for infrastructure to be ready..."
	@sleep 80
	@echo "✅ Infrastructure started"

# Start inventory service
inventory:
	@echo "🚀 Starting inventory service..."
	cd inventory && docker compose up -d && go run cmd/server/main.go &
	@sleep 5
	@echo "✅ Inventory service started"

# Start product service
product:
	@echo "🚀 Starting product service..."
	cd product && docker compose up -d && mvn spring-boot:run &
	@sleep 10
	@echo "✅ Product service started"

# Start user service
user:
	@echo "🚀 Starting user service..."
	cd user/UserService.API && dotnet run &
	@sleep 5
	@echo "✅ User service started"

# Start cart service
cart:
	@echo "🚀 Starting cart service..."
	cd cart && docker compose up -d && pnpm run dev &
	@sleep 5
	@echo "✅ Cart service started"

# Start order service
order:
	@echo "🚀 Starting order service..."
	cd order && docker compose up -d && pnpm run dev &
	@sleep 5
	@echo "✅ Order service started"

# Start wishlist service
wishlist:
	@echo "🚀 Starting wishlist service..."
	cd wishlist && docker compose up -d && pnpm run dev &
	@sleep 5
	@echo "✅ Wishlist service started"

# Start API gateway
api-gateway:
	@echo "🚀 Starting API gateway..."
	cd api-gateway && go run main.go &
	@sleep 3
	@echo "✅ API gateway started"

# Start all services in order
start: infrastructure inventory product user cart order wishlist api-gateway
	@echo "🎉 All services started successfully!"
	@echo ""
	@echo "Services are running on:"
	@echo "  - API Gateway: http://localhost:8080"
	@echo "  - Product Service: http://localhost:8081"
	@echo "  - User Service: http://localhost:8082"
	@echo "  - Cart Service: http://localhost:8083"
	@echo "  - Order Service: http://localhost:8084"
	@echo "  - Wishlist Service: http://localhost:8085"
	@echo "  - Inventory Service: gRPC on port 50051"
	@echo ""
	@echo "Use 'make logs' to view logs or 'make stop' to stop all services"

# Stop all services
stop:
	@echo "🛑 Stopping all services..."
	@pkill -f "go run cmd/server/main.go" || true
	@pkill -f "mvn spring-boot:run" || true
	@pkill -f "dotnet run" || true
	@pkill -f "pnpm run dev" || true
	@pkill -f "go run main.go" || true
	cd infrastructure && docker compose down
	@echo "✅ All services stopped"

# Clean up containers and volumes
clean:
	@echo "🧹 Cleaning up..."
	@pkill -f "go run cmd/server/main.go" || true
	@pkill -f "mvn spring-boot:run" || true
	@pkill -f "dotnet run" || true
	@pkill -f "pnpm run dev" || true
	@pkill -f "go run main.go" || true
	cd infrastructure && docker compose down -v --remove-orphans
	@echo "✅ Cleanup completed"

# Show logs for infrastructure services
logs:
	@echo "📋 Showing infrastructure logs..."
	cd infrastructure && docker compose logs -f

# Check status of services
status:
	@echo "📊 Checking service status..."
	@echo "Infrastructure containers:"
	@cd infrastructure && docker compose ps
	@echo ""
	@echo "Running processes:"
	@pgrep -f "go run cmd/server/main.go" > /dev/null && echo "✅ Inventory service is running" || echo "❌ Inventory service is not running"
	@pgrep -f "mvn spring-boot:run" > /dev/null && echo "✅ Product service is running" || echo "❌ Product service is not running"
	@pgrep -f "dotnet run" > /dev/null && echo "✅ User service is running" || echo "❌ User service is not running"
	@pgrep -f "pnpm run dev" > /dev/null && echo "✅ Node.js services are running" || echo "❌ Some Node.js services may not be running"
	@pgrep -f "go run main.go" > /dev/null && echo "✅ API Gateway is running" || echo "❌ API Gateway is not running"

# Development helpers
dev-install:
	@echo "📦 Installing dependencies..."
	cd cart && pnpm install
	cd order && pnpm install
	cd wishlist && pnpm install
	@echo "✅ Dependencies installed"

dev-build:
	@echo "🔨 Building services..."
	cd product && mvn clean compile
	cd user && dotnet build
	cd inventory && go mod tidy
	cd api-gateway && go mod tidy
	@echo "✅ Build completed"

# Quick restart individual services
restart-inventory:
	@pkill -f "go run cmd/server/main.go" || true
	@sleep 2
	@make inventory

restart-product:
	@pkill -f "mvn spring-boot:run" || true
	@sleep 2
	@make product

restart-user:
	@pkill -f "dotnet run" || true
	@sleep 2
	@make user

restart-api-gateway:
	@pkill -f "go run main.go" || true
	@sleep 2
	@make api-gateway

# Database migrations (if needed)
migrate:
	@echo "🗄️ Running database migrations..."
	cd wishlist && npx prisma migrate deploy
	@echo "✅ Migrations completed"