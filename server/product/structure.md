# Cấu trúc thư mục

├── docker-compose.yaml
├── download.py
├── pom.xml
├── scripts
│   └── init-db.sql
└── src
    └── main
        ├── java
        │   └── com
        │       └── ecommerce
        │           ├── grpc
        │           │   ├── common
        │           │   │   ├── CommonProto.java
        │           │   │   ├── Empty.java
        │           │   │   ├── EmptyOrBuilder.java
        │           │   │   ├── Metadata.java
        │           │   │   ├── MetadataOrBuilder.java
        │           │   │   ├── Status.java
        │           │   │   └── StatusOrBuilder.java
        │           │   ├── inventory
        │           │   │   ├── CheckInventoryBatchRequest.java
        │           │   │   ├── CheckInventoryBatchRequestOrBuilder.java
        │           │   │   ├── CheckInventoryBatchResponse.java
        │           │   │   ├── CheckInventoryBatchResponseOrBuilder.java
        │           │   │   ├── CheckInventoryRequest.java
        │           │   │   ├── CheckInventoryRequestOrBuilder.java
        │           │   │   ├── CheckInventoryResponse.java
        │           │   │   ├── CheckInventoryResponseOrBuilder.java
        │           │   │   ├── InventoryItem.java
        │           │   │   ├── InventoryItemOrBuilder.java
        │           │   │   ├── InventoryProto.java
        │           │   │   ├── InventoryServiceGrpc.java
        │           │   │   ├── InventoryStatus.java
        │           │   │   ├── InventoryStatusOrBuilder.java
        │           │   │   ├── ProductInfo.java
        │           │   │   └── ProductInfoOrBuilder.java
        │           │   └── product
        │           │       ├── BrandInfo.java
        │           │       ├── BrandInfoOrBuilder.java
        │           │       ├── CategoryInfo.java
        │           │       ├── CategoryInfoOrBuilder.java
        │           │       ├── CategoryRequest.java
        │           │       ├── CategoryRequestOrBuilder.java
        │           │       ├── ImageInfo.java
        │           │       ├── ImageInfoOrBuilder.java
        │           │       ├── ProductBatchRequest.java
        │           │       ├── ProductBatchRequestOrBuilder.java
        │           │       ├── ProductBatchResponse.java
        │           │       ├── ProductBatchResponseOrBuilder.java
        │           │       ├── ProductDetailRequest.java
        │           │       ├── ProductDetailRequestOrBuilder.java
        │           │       ├── ProductProto.java
        │           │       ├── ProductResponse.java
        │           │       ├── ProductResponseChunk.java
        │           │       ├── ProductResponseChunkOrBuilder.java
        │           │       ├── ProductResponseOrBuilder.java
        │           │       ├── ProductServiceGrpc.java
        │           │       ├── ProductSummary.java
        │           │       ├── ProductSummaryOrBuilder.java
        │           │       ├── ProductUIAction.java
        │           │       ├── ProductUIActionOrBuilder.java
        │           │       ├── SearchProductRequest.java
        │           │       └── SearchProductRequestOrBuilder.java
        │           └── product
        │               ├── ProductApplication.java
        │               ├── config
        │               │   ├── CacheConfig.java
        │               │   ├── ElasticsearchConfig.java
        │               │   ├── JwtConfig.java
        │               │   ├── KafkaConfig.java
        │               │   └── SecurityConfig.java
        │               ├── controller
        │               │   ├── BrandController.java
        │               │   ├── CacheAdminController.java
        │               │   ├── CategoryController.java
        │               │   ├── ProductController.java
        │               │   ├── ReviewController.java
        │               │   └── SearchController.java
        │               ├── dto
        │               │   ├── ApiResponseDTO.java
        │               │   ├── BrandDTO.java
        │               │   ├── CategoryDTO.java
        │               │   ├── ImageDTO.java
        │               │   ├── PageMetaDTO.java
        │               │   ├── PagedResponseDTO.java
        │               │   ├── ProductDetailDTO.java
        │               │   ├── ProductFilterDTO.java
        │               │   ├── ProductSummaryDTO.java
        │               │   ├── ReviewDTO.java
        │               │   ├── SearchRequestDTO.java
        │               │   ├── SearchResponseDTO.java
        │               │   ├── SearchSuggestionDTO.java
        │               │   ├── SellerDTO.java
        │               │   ├── SimilarityScoreDTO.java
        │               │   └── SpecificationDTO.java
        │               ├── entity
        │               │   ├── Brand.java
        │               │   ├── Category.java
        │               │   ├── Image.java
        │               │   ├── Product.java
        │               │   ├── Review.java
        │               │   ├── Seller.java
        │               │   └── Specification.java
        │               ├── event
        │               │   ├── listener
        │               │   │   └── ProductEventListener.java
        │               │   ├── model
        │               │   │   ├── InventoryStatusUpdateEvent.java
        │               │   │   ├── ProductRatingUpdateEvent.java
        │               │   │   └── ProductSalesUpdateEvent.java
        │               │   └── service
        │               │       └── ProductEventService.java
        │               ├── exception
        │               │   ├── ApiError.java
        │               │   ├── GlobalExceptionHandler.java
        │               │   ├── ProductServiceException.java
        │               │   ├── ResourceNotFoundException.java
        │               │   └── SearchException.java
        │               ├── grpc
        │               │   ├── client
        │               │   │   └── InventoryGrpcClient.java
        │               │   ├── interceptor
        │               │   │   └── LoggingInterceptor.java
        │               │   ├── mapper
        │               │   │   └── GrpcMapper.java
        │               │   └── server
        │               │       ├── GrpcServer.java
        │               │       └── ProductGrpcService.java
        │               ├── mapper
        │               │   ├── ProductMapper.java
        │               │   └── SearchMapper.java
        │               ├── repository
        │               │   ├── BrandRepository.java
        │               │   ├── CategoryRepository.java
        │               │   ├── ProductRepository.java
        │               │   └── ReviewRepository.java
        │               ├── search
        │               │   ├── document
        │               │   │   └── ProductSearchDocument.java
        │               │   ├── repository
        │               │   │   └── ProductSearchRepository.java
        │               │   └── service
        │               │       ├── EmbeddingService.java
        │               │       ├── SearchIndexService.java
        │               │       └── SearchService.java
        │               ├── security
        │               │   ├── JwtAuthenticationFilter.java
        │               │   └── JwtTokenValidator.java
        │               ├── service
        │               │   ├── InventoryIntegrationService.java
        │               │   ├── ProductService.java
        │               │   ├── ReviewService.java
        │               │   └── impl
        │               │       ├── ProductServiceImpl.java
        │               │       ├── ReviewServiceImpl.java
        │               │       └── TextPreprocessingService.java
        │               └── specification
        │                   └── ProductSpecification.java
        ├── proto
        │   ├── common.proto
        │   ├── inventory.proto
        │   └── product.proto
        └── resources
            ├── META-INF
            │   └── additional-spring-configuration-metadata.json
            ├── application.properties
            ├── db
            │   └── migration
            │       └── V1__Create_tables.sql
            └── models
                └── embeddings
                    └── sentence-transformer-model
                        ├── 1_Pooling
                        │   └── config.json
                        ├── 2_Normalize
                        ├── README.md
                        ├── config.json
                        ├── config_sentence_transformers.json
                        ├── model.safetensors
                        ├── modules.json
                        ├── sentence_bert_config.json
                        ├── special_tokens_map.json
                        ├── tokenizer.json
                        ├── tokenizer_config.json
                        └── vocab.txt