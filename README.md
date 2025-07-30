# E-commerce Platform

A modern, scalable e-commerce platform built with microservices architecture, featuring a React frontend and Go-based backend services.

## 🏗️ Architecture Overview

This project implements a **microservices architecture** with the following components:

- **Frontend**: React-based web application with TypeScript and Tailwind CSS
- **API Gateway**: Central routing and proxy service
- **Microservices**: Individual services for different business domains
- **Databases**: Multiple database systems optimized for specific services
- **Containerization**: Docker containers for easy deployment and scalability

## 🚀 Features

### Core E-commerce Features
- 🛍️ **Product Catalog**: Browse products by categories with advanced filtering
- 🛒 **Shopping Cart**: Add, remove, and manage cart items
- ❤️ **Wishlist**: Save favorite products for later
- 👤 **User Management**: Registration, authentication, and profile management
- 📋 **Order Management**: Complete order processing workflow
- ⭐ **Review System**: Product reviews and ratings
- 📦 **Inventory Management**: Real-time stock tracking
- 🤖 **Chatbot Integration**: AI-powered customer support

### Technical Features
- 📱 **Responsive Design**: Mobile-first approach with adaptive UI
- 🔍 **Advanced Search**: Smart search with suggestions and filtering
- 🔐 **JWT Authentication**: Secure token-based authentication
- 📊 **Real-time Updates**: Live inventory and cart updates
- 🌐 **RESTful APIs**: Well-structured API endpoints
- 📈 **Health Monitoring**: Service health checks and monitoring
- 🐳 **Docker Support**: Containerized services for easy deployment

## 🛠️ Technology Stack

### Frontend (Client)
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite/Remix
- **State Management**: React Hooks & Context API
- **HTTP Client**: Fetch API with custom utilities
- **Icons**: Lucide React
- **Responsive**: Mobile-first design approach

### Backend (Server)
- **Language**: Go (Golang)
- **Framework**: HTTP standard library with custom routing
- **Architecture**: Microservices
- **Authentication**: JWT tokens
- **Logging**: Structured logging with Zap/Logrus
- **Configuration**: Viper for configuration management
- **Health Checks**: Built-in health monitoring

### Databases
- **MySQL 8.0**: Product catalog and related data
- **PostgreSQL 15**: Orders, reviews, inventory, and user data
- **Connection Pooling**: Optimized database connections

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: API Gateway with request routing
- **Service Discovery**: Container-based service communication
- **Health Monitoring**: Health check endpoints for all services
- **CORS**: Cross-origin resource sharing configuration

## 📁 Project Structure

```
├── client/                          # Frontend React application
│   ├── app/
│   │   ├── components/             # Reusable React components
│   │   │   ├── layout/            # Layout components (Header, Sidebar, etc.)
│   │   │   └── ui/                # UI components
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── contexts/              # React context providers
│   │   ├── routes/                # Application routes
│   │   └── api/                   # API utilities and types
│   └── public/                    # Static assets
│
├── server/                         # Backend microservices
│   ├── api-gateway/               # Central API gateway service
│   │   ├── config/               # Configuration management
│   │   ├── proxy/                # Request routing and proxying
│   │   └── middleware/           # CORS, logging, authentication
│   │
│   ├── user/                     # User management service
│   ├── product/                  # Product catalog service
│   ├── cart/                     # Shopping cart service
│   ├── wishlist/                 # Wishlist management service
│   ├── order/                    # Order processing service
│   ├── review/                   # Product review service
│   ├── inventory/                # Inventory management service
│   └── chatbot/                  # AI chatbot service
│
└── docker-compose.yml            # Multi-service container orchestration
```

## 🔧 Services Overview

### API Gateway (Port: 9000)
- **Purpose**: Central entry point for all client requests
- **Features**: Request routing, CORS handling, authentication middleware
- **Technology**: Go with reverse proxy

### Microservices

| Service | Port | Database | Purpose |
|---------|------|----------|---------|
| User Service | 5009 | PostgreSQL | User authentication & profile management |
| Product Service | 8082 | MySQL | Product catalog & category management |
| Cart Service | 8002 | PostgreSQL | Shopping cart operations |
| Wishlist Service | 8084 | PostgreSQL | Wishlist management |
| Order Service | 8004 | PostgreSQL | Order processing & history |
| Review Service | 8003 | PostgreSQL | Product reviews & ratings |
| Inventory Service | 5440 | PostgreSQL | Stock management & tracking |
| Chatbot Service | 8000 | - | AI-powered customer support |

## 🚀 Getting Started

### Prerequisites
- **Docker** (version 20.0 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Node.js** (version 18 or higher) - for frontend development
- **Go** (version 1.21 or higher) - for backend development

### Quick Setup with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-platform
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Verify services are running**
   ```bash
   docker-compose ps
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:9000
   - Health Check: http://localhost:9000/health

### Development Setup

#### Backend Development

1. **Navigate to service directory**
   ```bash
   cd server/[service-name]
   ```

2. **Install dependencies**
   ```bash
   go mod download
   ```

3. **Start the service**
   ```bash
   go run main.go
   ```

#### Frontend Development

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## 🔑 Environment Configuration

### Backend Services
Each service uses environment variables for configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=service_db
DB_USER=username
DB_PASSWORD=password

# Service Configuration
PORT=8080
LOG_LEVEL=info

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
```

### API Gateway Configuration
```yaml
server:
  port: 9000
  read_timeout: 5s
  write_timeout: 10s

services:
  user: "http://localhost:5009"
  product: "http://localhost:8082"
  cart: "http://localhost:8002"
  # ... other services

jwt:
  secret_key: "your-secret-key"
  expiration_seconds: 86400
```

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/profile` - Get user profile

### Products
- `GET /api/v1/products` - Get products with filtering
- `GET /api/v1/products/{id}` - Get product details
- `GET /api/v1/products/categories` - Get product categories
- `GET /api/v1/products/search` - Search products

### Shopping Cart
- `GET /api/v1/cart` - Get cart items
- `POST /api/v1/cart/items` - Add item to cart
- `PUT /api/v1/cart/items/{id}` - Update cart item
- `DELETE /api/v1/cart/items/{id}` - Remove item from cart

### Orders
- `GET /api/v1/orders` - Get order history
- `POST /api/v1/orders` - Create new order
- `GET /api/v1/orders/{id}` - Get order details

### Reviews
- `GET /api/v1/reviews/product/{productId}` - Get product reviews
- `POST /api/v1/reviews` - Create review
- `PUT /api/v1/reviews/{id}` - Update review

## 🧪 Testing

### Backend Testing
```bash
# Run tests for specific service
cd server/[service-name]
go test ./...

# Run tests with coverage
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### Frontend Testing
```bash
cd client
npm run test
```

## 📊 Monitoring & Health Checks

### Health Endpoints
- API Gateway: `GET /health`
- Individual Services: `GET /api/v1/health`

### Response Format
```json
{
  "status": "ready",
  "timestamp": 1234567890,
  "service": "service-name",
  "checks": {
    "database": "ok",
    "kafka": "ok"
  }
}
```

## 🐳 Docker Configuration

### Individual Service Deployment
Each service includes its own `docker-compose.yaml`:

```yaml
services:
  service-name:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=postgres
    depends_on:
      - postgres
    networks:
      - ecommerce-network
```

### Network Configuration
All services communicate through a shared Docker network:
```yaml
networks:
  ecommerce-shared-network:
    external: true
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password encryption
- **CORS Configuration**: Properly configured cross-origin requests
- **Input Validation**: Request validation and sanitization
- **SQL Injection Protection**: Parameterized queries
- **Rate Limiting**: Request rate limiting (planned)

## 📈 Performance Optimization

- **Database Indexing**: Optimized database queries with proper indexing
- **Connection Pooling**: Efficient database connection management
- **Caching**: Response caching for frequently accessed data (planned)
- **CDN Integration**: Static asset delivery optimization (planned)
- **Load Balancing**: Service load balancing support

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow Go best practices and conventions
- Use TypeScript for all frontend code
- Write comprehensive tests for new features
- Update documentation for any API changes
- Follow the existing code style and formatting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Full-stack Developer**: System architecture and implementation
- **Frontend Developer**: React application development
- **Backend Developer**: Microservices development
- **DevOps Engineer**: Containerization and deployment

## 📞 Support

For support and questions:
- **Issues**: Create a GitHub issue
- **Documentation**: Check the wiki for detailed guides
- **Email**: nguyentuongbachhy.phuong1@gmail.com

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core e-commerce functionality
- ✅ Microservices architecture
- ✅ Docker containerization
- ✅ Basic UI components

### Phase 2 (Planned)
- 🔄 Payment gateway integration
- 🔄 Real-time notifications
- 🔄 Advanced analytics
- 🔄 Mobile app development

### Phase 3 (Future)
- 📋 Kubernetes deployment
- 📋 Multi-language support
- 📋 Advanced AI features
- 📋 Social commerce features

---

**Built with ❤️ using modern technologies and best practices**
