# Cấu trúc thư mục

├── .eslintrc.json
├── .prettierrc
├── dir
│   ├── config
│   │   ├── index.d.ts
│   │   ├── index.d.ts.map
│   │   ├── index.js
│   │   └── index.js.map
│   ├── controllers
│   │   ├── cartController.d.ts
│   │   ├── cartController.d.ts.map
│   │   ├── cartController.js
│   │   └── cartController.js.map
│   ├── grpc
│   │   ├── inventoryClient.d.ts
│   │   ├── inventoryClient.d.ts.map
│   │   ├── inventoryClient.js
│   │   ├── inventoryClient.js.map
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
│   │   ├── rateLimiter.d.ts
│   │   ├── rateLimiter.d.ts.map
│   │   ├── rateLimiter.js
│   │   ├── rateLimiter.js.map
│   │   ├── requestLogger.d.ts
│   │   ├── requestLogger.d.ts.map
│   │   ├── requestLogger.js
│   │   └── requestLogger.js.map
│   ├── routes
│   │   ├── cartRoutes.d.ts
│   │   ├── cartRoutes.d.ts.map
│   │   ├── cartRoutes.js
│   │   ├── cartRoutes.js.map
│   │   ├── index.d.ts
│   │   ├── index.d.ts.map
│   │   ├── index.js
│   │   └── index.js.map
│   ├── server.d.ts
│   ├── server.d.ts.map
│   ├── server.js
│   ├── server.js.map
│   ├── services
│   │   ├── cartService.d.ts
│   │   ├── cartService.d.ts.map
│   │   ├── cartService.js
│   │   ├── cartService.js.map
│   │   ├── kafkaService.d.ts
│   │   ├── kafkaService.d.ts.map
│   │   ├── kafkaService.js
│   │   ├── kafkaService.js.map
│   │   ├── pricingService.d.ts
│   │   ├── pricingService.d.ts.map
│   │   ├── pricingService.js
│   │   ├── pricingService.js.map
│   │   ├── redisService.d.ts
│   │   ├── redisService.d.ts.map
│   │   ├── redisService.js
│   │   └── redisService.js.map
│   ├── types
│   │   ├── index.d.ts
│   │   ├── index.d.ts.map
│   │   ├── index.js
│   │   └── index.js.map
│   └── utils
│       ├── hash.d.ts
│       ├── hash.d.ts.map
│       ├── hash.js
│       ├── hash.js.map
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
├── proto
│   ├── common.proto
│   ├── inventory.proto
│   └── product.proto
├── src
│   ├── config
│   │   └── index.ts
│   ├── controllers
│   │   └── cartController.ts
│   ├── grpc
│   │   ├── inventoryClient.ts
│   │   └── productClient.ts
│   ├── middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── requestLogger.ts
│   ├── routes
│   │   ├── cartRoutes.ts
│   │   └── index.ts
│   ├── server.ts
│   ├── services
│   │   ├── cartService.ts
│   │   ├── kafkaService.ts
│   │   ├── pricingRequestHandler.ts
│   │   ├── pricingService.ts
│   │   └── redisService.ts
│   ├── types
│   │   └── index.ts
│   └── utils
│       ├── hash.ts
│       ├── logger.ts
│       └── response.ts
└── tsconfig.json