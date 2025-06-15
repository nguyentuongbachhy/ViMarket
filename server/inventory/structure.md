# Cấu trúc thư mục

├── cmd
│   └── server
│       └── main.go
├── docker-compose.yaml
├── go.mod
├── go.sum
├── internal
│   ├── config
│   │   └── config.go
│   ├── domain
│   │   ├── entity
│   │   │   └── inventory.go
│   │   └── repository
│   │       └── inventory_repository.go
│   ├── http
│   │   ├── handlers
│   │   │   └── inventory_handlers.go
│   │   └── server.go
│   ├── infrastructure
│   │   ├── database
│   │   │   ├── migrations
│   │   │   │   └── 001_create_inventory_table.sql
│   │   │   └── postgres.go
│   │   ├── grpc
│   │   │   ├── handlers
│   │   │   │   └── inventory_handler.go
│   │   │   └── server.go
│   │   └── kafka
│   │       ├── consumer.go
│   │       ├── handlers
│   │       │   └── inventory_event_handler.go
│   │       └── producer.go
│   └── service
│       └── inventory_service.go
└── proto
    ├── common
    │   └── common.proto
    └── inventory
        └── inventory.proto