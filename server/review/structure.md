# Cấu trúc thư mục

├── app
│   ├── api
│   │   ├── dependencies.py
│   │   └── endpoints
│   │       ├── __init__.py
│   │       └── reviews.py
│   ├── config.py
│   ├── database.py
│   ├── grpc_server
│   │   └── services
│   │       └── reviewService.py
│   ├── main.py
│   ├── models
│   │   └── review.py
│   ├── proto
│   │   ├── __init__.py
│   │   ├── common.proto
│   │   ├── common_pb2.py
│   │   ├── common_pb2_grpc.py
│   │   ├── review.proto
│   │   ├── review_pb2.py
│   │   ├── review_pb2_grpc.py
│   │   ├── user.proto
│   │   ├── user_pb2.py
│   │   └── user_pb2_grpc.py
│   ├── schemas
│   │   ├── common.py
│   │   └── review.py
│   └── services
│       ├── reviewService.py
│       ├── sentimentService.py
│       └── userService.py
└── docker-compose.yaml