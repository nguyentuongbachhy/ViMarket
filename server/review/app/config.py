from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    # Database
    databaseUrl: str = Field("postgresql://spring:spring@localhost:5444/review_db", alias="DATABASE_URL")
    
    # JWT
    jwtSecretKey: str = Field(..., alias="JWT_SECRET_KEY")
    jwtAlgorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    jwtIssuer: str = Field("ecommerce-api", alias="JWT_ISSUER")
    jwtAudience: str = Field("ecommerce-clients", alias="JWT_AUDIENCE")
    
    # User Service gRPC
    userServiceGrpcHost: str = Field("localhost", alias="USER_SERVICE_GRPC_HOST")
    userServiceGrpcPort: int = Field(50052, alias="USER_SERVICE_GRPC_PORT")
    
    # Google AI (for sentiment analysis)
    googleAiApiKey: Optional[str] = Field(None, alias="GOOGLE_AI_API_KEY")
    
    # Server
    port: int = Field(8002, alias="PORT")
    grpcPort: int = Field(50052, alias="GRPC_PORT")
    
    class Config:
        env_file = ".env"
        populate_by_name = True

settings = Settings()
