# Cấu trúc thư mục

├── Makefile
├── api-gateway
│   ├── config
│   │   └── config.go
│   ├── config.yaml
│   ├── go.mod
│   ├── go.sum
│   ├── main.go
│   ├── middleware
│   │   └── auth.go
│   └── proxy
│       └── handler.go
├── cart
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── dir
│   │   ├── config
│   │   │   ├── index.d.ts
│   │   │   ├── index.d.ts.map
│   │   │   ├── index.js
│   │   │   └── index.js.map
│   │   ├── controllers
│   │   │   ├── cartController.d.ts
│   │   │   ├── cartController.d.ts.map
│   │   │   ├── cartController.js
│   │   │   └── cartController.js.map
│   │   ├── grpc
│   │   │   ├── cartGrpcServer.d.ts
│   │   │   ├── cartGrpcServer.d.ts.map
│   │   │   ├── cartGrpcServer.js
│   │   │   ├── cartGrpcServer.js.map
│   │   │   ├── inventoryClient.d.ts
│   │   │   ├── inventoryClient.d.ts.map
│   │   │   ├── inventoryClient.js
│   │   │   ├── inventoryClient.js.map
│   │   │   ├── productClient.d.ts
│   │   │   ├── productClient.d.ts.map
│   │   │   ├── productClient.js
│   │   │   └── productClient.js.map
│   │   ├── middleware
│   │   │   ├── auth.d.ts
│   │   │   ├── auth.d.ts.map
│   │   │   ├── auth.js
│   │   │   ├── auth.js.map
│   │   │   ├── errorHandler.d.ts
│   │   │   ├── errorHandler.d.ts.map
│   │   │   ├── errorHandler.js
│   │   │   ├── errorHandler.js.map
│   │   │   ├── rateLimiter.d.ts
│   │   │   ├── rateLimiter.d.ts.map
│   │   │   ├── rateLimiter.js
│   │   │   ├── rateLimiter.js.map
│   │   │   ├── requestLogger.d.ts
│   │   │   ├── requestLogger.d.ts.map
│   │   │   ├── requestLogger.js
│   │   │   └── requestLogger.js.map
│   │   ├── routes
│   │   │   ├── cartRoutes.d.ts
│   │   │   ├── cartRoutes.d.ts.map
│   │   │   ├── cartRoutes.js
│   │   │   ├── cartRoutes.js.map
│   │   │   ├── index.d.ts
│   │   │   ├── index.d.ts.map
│   │   │   ├── index.js
│   │   │   └── index.js.map
│   │   ├── server.d.ts
│   │   ├── server.d.ts.map
│   │   ├── server.js
│   │   ├── server.js.map
│   │   ├── services
│   │   │   ├── cartService.d.ts
│   │   │   ├── cartService.d.ts.map
│   │   │   ├── cartService.js
│   │   │   ├── cartService.js.map
│   │   │   ├── pricingService.d.ts
│   │   │   ├── pricingService.d.ts.map
│   │   │   ├── pricingService.js
│   │   │   ├── pricingService.js.map
│   │   │   ├── redisService.d.ts
│   │   │   ├── redisService.d.ts.map
│   │   │   ├── redisService.js
│   │   │   └── redisService.js.map
│   │   ├── types
│   │   │   ├── index.d.ts
│   │   │   ├── index.d.ts.map
│   │   │   ├── index.js
│   │   │   └── index.js.map
│   │   └── utils
│   │       ├── hash.d.ts
│   │       ├── hash.d.ts.map
│   │       ├── hash.js
│   │       ├── hash.js.map
│   │       ├── logger.d.ts
│   │       ├── logger.d.ts.map
│   │       ├── logger.js
│   │       ├── logger.js.map
│   │       ├── response.d.ts
│   │       ├── response.d.ts.map
│   │       ├── response.js
│   │       └── response.js.map
│   ├── docker-compose.yaml
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── pnpm-workspace.yaml
│   ├── proto
│   │   ├── cart.proto
│   │   ├── common.proto
│   │   ├── inventory.proto
│   │   └── product.proto
│   ├── src
│   │   ├── config
│   │   │   └── index.ts
│   │   ├── controllers
│   │   │   └── cartController.ts
│   │   ├── grpc
│   │   │   ├── cartGrpcServer.ts
│   │   │   ├── inventoryClient.ts
│   │   │   └── productClient.ts
│   │   ├── middleware
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── rateLimiter.ts
│   │   │   └── requestLogger.ts
│   │   ├── routes
│   │   │   ├── cartRoutes.ts
│   │   │   └── index.ts
│   │   ├── server.ts
│   │   ├── services
│   │   │   ├── cartService.ts
│   │   │   ├── pricingService.ts
│   │   │   └── redisService.ts
│   │   ├── types
│   │   │   └── index.ts
│   │   └── utils
│   │       ├── hash.ts
│   │       ├── logger.ts
│   │       └── response.ts
│   └── tsconfig.json
├── chatbot
│   ├── config.py
│   ├── lg
│   │   ├── __init__.py
│   │   ├── graph.py
│   │   ├── nodes
│   │   │   ├── __init__.py
│   │   │   ├── context.py
│   │   │   ├── finish.py
│   │   │   ├── intent.py
│   │   │   ├── navigation.py
│   │   │   ├── present.py
│   │   │   ├── search.py
│   │   │   ├── selection.py
│   │   │   └── tools.py
│   │   ├── state.py
│   │   └── tools
│   │       ├── __init__.py
│   │       ├── cart.py
│   │       ├── order.py
│   │       ├── product.py
│   │       └── wishlist.py
│   ├── main.py
│   ├── models
│   │   └── chat.py
│   └── routers
│       └── chat.py
├── docs
│   ├── chatbot.md
│   ├── messaging-service.md
│   ├── product-service.md
│   ├── sentiment-analysis.md
│   └── user-service.md
├── infrastructure
│   └── docker-compose.yaml
├── inventory
│   ├── cmd
│   │   └── server
│   │       └── main.go
│   ├── docker-compose.yaml
│   ├── go.mod
│   ├── go.sum
│   ├── internal
│   │   ├── config
│   │   │   └── config.go
│   │   ├── domain
│   │   │   ├── entity
│   │   │   │   └── inventory.go
│   │   │   └── repository
│   │   │       └── inventory_repository.go
│   │   ├── http
│   │   │   ├── handlers
│   │   │   │   └── inventory_handlers.go
│   │   │   └── server.go
│   │   ├── infrastructure
│   │   │   ├── database
│   │   │   │   ├── migrations
│   │   │   │   │   └── 001_create_inventory_table.sql
│   │   │   │   └── postgres.go
│   │   │   ├── grpc
│   │   │   │   ├── handlers
│   │   │   │   │   └── inventory_handler.go
│   │   │   │   └── server.go
│   │   │   └── kafka
│   │   │       ├── consumer.go
│   │   │       ├── handlers
│   │   │       │   └── inventory_event_handler.go
│   │   │       └── producer.go
│   │   └── service
│   │       └── inventory_service.go
│   └── proto
│       ├── common
│       │   ├── common.pb.go
│       │   └── common.proto
│       └── inventory
│           ├── inventory.pb.go
│           ├── inventory.proto
│           └── inventory_grpc.pb.go
├── order
│   ├── docker-compose.yaml
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── pnpm-workspace.yaml
│   ├── proto
│   │   ├── cart.proto
│   │   ├── common.proto
│   │   ├── inventory.proto
│   │   └── product.proto
│   ├── src
│   │   ├── clients
│   │   │   ├── cartClient.ts
│   │   │   ├── inventoryClient.ts
│   │   │   └── productClient.ts
│   │   ├── config
│   │   │   └── index.ts
│   │   ├── database
│   │   │   ├── connection.ts
│   │   │   ├── migrate.ts
│   │   │   ├── migrations
│   │   │   │   └── 001_create_orders_tables.sql
│   │   │   └── repositories
│   │   │       └── orderRepository.ts
│   │   ├── middleware
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── requestLogger.ts
│   │   ├── routes
│   │   │   ├── index.ts
│   │   │   └── orderRoutes.ts
│   │   ├── server.ts
│   │   ├── services
│   │   │   ├── orderService.ts
│   │   │   └── paymentService.ts
│   │   ├── types
│   │   │   └── index.ts
│   │   └── utils
│   │       ├── logger.ts
│   │       └── response.ts
│   └── tsconfig.json
├── product
│   ├── docker-compose.yaml
│   ├── pom.xml
│   ├── scripts
│   │   └── init-db.sql
│   └── src
│       └── main
│           ├── java
│           │   └── com
│           │       └── ecommerce
│           │           ├── grpc
│           │           │   ├── common
│           │           │   │   ├── CommonProto.java
│           │           │   │   ├── Empty.java
│           │           │   │   ├── EmptyOrBuilder.java
│           │           │   │   ├── Metadata.java
│           │           │   │   ├── MetadataOrBuilder.java
│           │           │   │   ├── Status.java
│           │           │   │   └── StatusOrBuilder.java
│           │           │   ├── inventory
│           │           │   │   ├── CheckInventoryBatchRequest.java
│           │           │   │   ├── CheckInventoryBatchRequestOrBuilder.java
│           │           │   │   ├── CheckInventoryBatchResponse.java
│           │           │   │   ├── CheckInventoryBatchResponseOrBuilder.java
│           │           │   │   ├── CheckInventoryRequest.java
│           │           │   │   ├── CheckInventoryRequestOrBuilder.java
│           │           │   │   ├── CheckInventoryResponse.java
│           │           │   │   ├── CheckInventoryResponseOrBuilder.java
│           │           │   │   ├── InventoryItem.java
│           │           │   │   ├── InventoryItemOrBuilder.java
│           │           │   │   ├── InventoryProto.java
│           │           │   │   ├── InventoryServiceGrpc.java
│           │           │   │   ├── InventoryStatus.java
│           │           │   │   ├── InventoryStatusOrBuilder.java
│           │           │   │   ├── ProductInfo.java
│           │           │   │   └── ProductInfoOrBuilder.java
│           │           │   └── product
│           │           │       ├── BrandInfo.java
│           │           │       ├── BrandInfoOrBuilder.java
│           │           │       ├── CategoryInfo.java
│           │           │       ├── CategoryInfoOrBuilder.java
│           │           │       ├── CategoryRequest.java
│           │           │       ├── CategoryRequestOrBuilder.java
│           │           │       ├── ImageInfo.java
│           │           │       ├── ImageInfoOrBuilder.java
│           │           │       ├── ProductBatchRequest.java
│           │           │       ├── ProductBatchRequestOrBuilder.java
│           │           │       ├── ProductBatchResponse.java
│           │           │       ├── ProductBatchResponseOrBuilder.java
│           │           │       ├── ProductDetailRequest.java
│           │           │       ├── ProductDetailRequestOrBuilder.java
│           │           │       ├── ProductProto.java
│           │           │       ├── ProductResponse.java
│           │           │       ├── ProductResponseChunk.java
│           │           │       ├── ProductResponseChunkOrBuilder.java
│           │           │       ├── ProductResponseOrBuilder.java
│           │           │       ├── ProductServiceGrpc.java
│           │           │       ├── ProductSummary.java
│           │           │       ├── ProductSummaryOrBuilder.java
│           │           │       ├── ProductUIAction.java
│           │           │       ├── ProductUIActionOrBuilder.java
│           │           │       ├── SearchProductRequest.java
│           │           │       └── SearchProductRequestOrBuilder.java
│           │           └── product
│           │               ├── ProductApplication.java
│           │               ├── config
│           │               │   ├── CacheConfig.java
│           │               │   ├── JwtConfig.java
│           │               │   ├── KafkaConfig.java
│           │               │   └── SecurityConfig.java
│           │               ├── controller
│           │               │   ├── BrandController.java
│           │               │   ├── CacheAdminController.java
│           │               │   ├── CategoryController.java
│           │               │   ├── ProductController.java
│           │               │   └── ReviewController.java
│           │               ├── dto
│           │               │   ├── ApiResponseDTO.java
│           │               │   ├── BrandDTO.java
│           │               │   ├── CategoryDTO.java
│           │               │   ├── ImageDTO.java
│           │               │   ├── PageMetaDTO.java
│           │               │   ├── PagedResponseDTO.java
│           │               │   ├── ProductDetailDTO.java
│           │               │   ├── ProductFilterDTO.java
│           │               │   ├── ProductSummaryDTO.java
│           │               │   ├── ReviewDTO.java
│           │               │   ├── SellerDTO.java
│           │               │   └── SpecificationDTO.java
│           │               ├── entity
│           │               │   ├── Brand.java
│           │               │   ├── Category.java
│           │               │   ├── Image.java
│           │               │   ├── Product.java
│           │               │   ├── Review.java
│           │               │   ├── Seller.java
│           │               │   └── Specification.java
│           │               ├── event
│           │               │   ├── listener
│           │               │   │   └── ProductEventListener.java
│           │               │   ├── model
│           │               │   │   ├── InventoryStatusUpdateEvent.java
│           │               │   │   ├── ProductRatingUpdateEvent.java
│           │               │   │   └── ProductSalesUpdateEvent.java
│           │               │   └── service
│           │               │       └── ProductEventService.java
│           │               ├── exception
│           │               │   ├── ApiError.java
│           │               │   ├── GlobalExceptionHandler.java
│           │               │   ├── ProductServiceException.java
│           │               │   └── ResourceNotFoundException.java
│           │               ├── grpc
│           │               │   ├── client
│           │               │   │   └── InventoryGrpcClient.java
│           │               │   ├── interceptor
│           │               │   │   └── LoggingInterceptor.java
│           │               │   ├── mapper
│           │               │   │   └── GrpcMapper.java
│           │               │   └── server
│           │               │       ├── GrpcServer.java
│           │               │       └── ProductGrpcService.java
│           │               ├── mapper
│           │               │   └── ProductMapper.java
│           │               ├── repository
│           │               │   ├── BrandRepository.java
│           │               │   ├── CategoryRepository.java
│           │               │   ├── ProductRepository.java
│           │               │   └── ReviewRepository.java
│           │               ├── security
│           │               │   ├── JwtAuthenticationFilter.java
│           │               │   └── JwtTokenValidator.java
│           │               ├── service
│           │               │   ├── InventoryIntegrationService.java
│           │               │   ├── ProductService.java
│           │               │   ├── ReviewService.java
│           │               │   └── impl
│           │               │       ├── ProductServiceImpl.java
│           │               │       └── ReviewServiceImpl.java
│           │               └── specification
│           │                   └── ProductSpecification.java
│           ├── proto
│           │   ├── common.proto
│           │   ├── inventory.proto
│           │   └── product.proto
│           └── resources
│               ├── META-INF
│               │   └── additional-spring-configuration-metadata.json
│               ├── application.properties
│               └── db
│                   └── migration
│                       └── V1__Create_tables.sql
├── user
│   ├── API
│   ├── Dockerfile.sqlserver
│   ├── Program.cs
│   ├── UserService.API
│   │   ├── Controllers
│   │   │   ├── AuthController.cs
│   │   │   └── UserController.cs
│   │   ├── Program.cs
│   │   ├── UserService.API.csproj
│   │   ├── UserService.API.http
│   │   ├── appsettings.Development.json
│   │   └── appsettings.json
│   ├── UserService.Core
│   │   ├── DTOs
│   │   │   ├── LoginDto.cs
│   │   │   ├── RegisterDto.cs
│   │   │   ├── TokenDto.cs
│   │   │   └── UserDto.cs
│   │   ├── Entities
│   │   │   └── User.cs
│   │   ├── Interfaces
│   │   │   ├── IAuthService.cs
│   │   │   ├── ITokenService.cs
│   │   │   └── IUserRepository.cs
│   │   └── UserService.Core.csproj
│   ├── UserService.Infrastructure
│   │   ├── Data
│   │   │   └── UserDbContext.cs
│   │   ├── Repositories
│   │   │   └── UserRepository.cs
│   │   ├── Services
│   │   │   ├── AuthService.cs
│   │   │   └── TokenService.cs
│   │   └── UserService.Infrastructure.csproj
│   ├── UserService.sln
│   ├── docker-compose.yml
│   └── scripts
│       ├── init-sqlserver.sh
│       └── init-userdb.sql
└── wishlist
    ├── dir
    │   ├── config
    │   │   ├── index.d.ts
    │   │   ├── index.d.ts.map
    │   │   ├── index.js
    │   │   └── index.js.map
    │   ├── controllers
    │   │   ├── wishlistController.d.ts
    │   │   ├── wishlistController.d.ts.map
    │   │   ├── wishlistController.js
    │   │   └── wishlistController.js.map
    │   ├── grpc
    │   │   ├── productClient.d.ts
    │   │   ├── productClient.d.ts.map
    │   │   ├── productClient.js
    │   │   └── productClient.js.map
    │   ├── middleware
    │   │   ├── auth.d.ts
    │   │   ├── auth.d.ts.map
    │   │   ├── auth.js
    │   │   ├── auth.js.map
    │   │   ├── errorHandler.d.ts
    │   │   ├── errorHandler.d.ts.map
    │   │   ├── errorHandler.js
    │   │   ├── errorHandler.js.map
    │   │   ├── requestLogger.d.ts
    │   │   ├── requestLogger.d.ts.map
    │   │   ├── requestLogger.js
    │   │   └── requestLogger.js.map
    │   ├── routes
    │   │   ├── index.d.ts
    │   │   ├── index.d.ts.map
    │   │   ├── index.js
    │   │   ├── index.js.map
    │   │   ├── wishlistRoutes.d.ts
    │   │   ├── wishlistRoutes.d.ts.map
    │   │   ├── wishlistRoutes.js
    │   │   └── wishlistRoutes.js.map
    │   ├── server.d.ts
    │   ├── server.d.ts.map
    │   ├── server.js
    │   ├── server.js.map
    │   ├── services
    │   │   ├── kafkaService.d.ts
    │   │   ├── kafkaService.d.ts.map
    │   │   ├── kafkaService.js
    │   │   ├── kafkaService.js.map
    │   │   ├── prismaService.d.ts
    │   │   ├── prismaService.d.ts.map
    │   │   ├── prismaService.js
    │   │   ├── prismaService.js.map
    │   │   ├── redisService.d.ts
    │   │   ├── redisService.d.ts.map
    │   │   ├── redisService.js
    │   │   ├── redisService.js.map
    │   │   ├── wishlistService.d.ts
    │   │   ├── wishlistService.d.ts.map
    │   │   ├── wishlistService.js
    │   │   └── wishlistService.js.map
    │   ├── types
    │   │   ├── index.d.ts
    │   │   ├── index.d.ts.map
    │   │   ├── index.js
    │   │   └── index.js.map
    │   └── utils
    │       ├── logger.d.ts
    │       ├── logger.d.ts.map
    │       ├── logger.js
    │       ├── logger.js.map
    │       ├── response.d.ts
    │       ├── response.d.ts.map
    │       ├── response.js
    │       └── response.js.map
    ├── docker-compose.yaml
    ├── package.json
    ├── pnpm-lock.yaml
    ├── pnpm-workspace.yaml
    ├── prisma
    │   ├── migrations
    │   │   ├── 20250602185821_wishlist_db
    │   │   │   └── migration.sql
    │   │   ├── 20250608142631_wishlist_db
    │   │   │   └── migration.sql
    │   │   └── migration_lock.toml
    │   └── schema.prisma
    ├── proto
    │   ├── common.proto
    │   └── product.proto
    ├── scripts
    │   └── init-db.sql
    ├── src
    │   ├── config
    │   │   └── index.ts
    │   ├── controllers
    │   │   └── wishlistController.ts
    │   ├── generated
    │   │   └── prisma
    │   │       ├── client.d.ts
    │   │       ├── client.js
    │   │       ├── default.d.ts
    │   │       ├── default.js
    │   │       ├── edge.d.ts
    │   │       ├── edge.js
    │   │       ├── index-browser.js
    │   │       ├── index.d.ts
    │   │       ├── index.js
    │   │       ├── libquery_engine-debian-openssl-3.0.x.so.node
    │   │       ├── package.json
    │   │       ├── runtime
    │   │       │   ├── edge-esm.js
    │   │       │   ├── edge.js
    │   │       │   ├── index-browser.d.ts
    │   │       │   ├── index-browser.js
    │   │       │   ├── library.d.ts
    │   │       │   ├── library.js
    │   │       │   ├── react-native.js
    │   │       │   └── wasm.js
    │   │       ├── schema.prisma
    │   │       ├── wasm.d.ts
    │   │       └── wasm.js
    │   ├── grpc
    │   │   └── productClient.ts
    │   ├── middleware
    │   │   ├── auth.ts
    │   │   ├── errorHandler.ts
    │   │   ├── rateLimiter.ts
    │   │   └── requestLogger.ts
    │   ├── routes
    │   │   ├── index.ts
    │   │   └── wishlistRoutes.ts
    │   ├── server.ts
    │   ├── services
    │   │   ├── kafkaService.ts
    │   │   ├── prismaService.ts
    │   │   ├── redisService.ts
    │   │   └── wishlistService.ts
    │   ├── types
    │   │   └── index.ts
    │   └── utils
    │       ├── logger.ts
    │       └── response.ts
    └── tsconfig.json