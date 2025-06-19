# Cấu trúc thư mục

├── Dockerfile.sqlserver
├── Program.cs
├── UserService.API
│   ├── Controllers
│   │   ├── AuthController.cs
│   │   └── UserController.cs
│   ├── Program.cs
│   ├── Protos
│   │   ├── common.proto
│   │   └── user.proto
│   ├── Services
│   │   └── UserGrpcService.cs
│   ├── UserService.API.csproj
│   ├── UserService.API.http
│   ├── appsettings.Development.json
│   └── appsettings.json
├── UserService.Core
│   ├── DTOs
│   │   ├── LoginDto.cs
│   │   ├── RegisterDto.cs
│   │   ├── TokenDto.cs
│   │   └── UserDto.cs
│   ├── Entities
│   │   └── User.cs
│   ├── Interfaces
│   │   ├── IAuthService.cs
│   │   ├── ITokenService.cs
│   │   └── IUserRepository.cs
│   └── UserService.Core.csproj
├── UserService.Infrastructure
│   ├── Data
│   │   └── UserDbContext.cs
│   ├── Repositories
│   │   └── UserRepository.cs
│   ├── Services
│   │   ├── AuthService.cs
│   │   └── TokenService.cs
│   └── UserService.Infrastructure.csproj
├── UserService.sln
├── docker-compose.yml
└── scripts
    ├── init-sqlserver.sh
    └── init-userdb.sql