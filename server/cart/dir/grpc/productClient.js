"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productGrpcClient = exports.ProductGrpcClient = void 0;
const config_1 = require("@/config");
const logger_1 = require("@/utils/logger");
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const path_1 = __importDefault(require("path"));
const logger = new logger_1.Logger('ProductGrpcClient');
class ProductGrpcClient {
    constructor() {
        this.client = null;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        this.initialize();
    }
    initialize() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const PROTO_PATH = path_1.default.join(__dirname, '../../proto/product.proto');
                const COMMON_PROTO_PATH = path_1.default.join(__dirname, '../../proto/common.proto');
                const packageDefinition = protoLoader.loadSync([PROTO_PATH, COMMON_PROTO_PATH], {
                    keepCase: true,
                    longs: String,
                    enums: String,
                    defaults: true,
                    oneofs: true,
                    includeDirs: [path_1.default.join(__dirname, '../../proto')]
                });
                const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
                const productProto = (_a = protoDescriptor.ecommerce) === null || _a === void 0 ? void 0 : _a.product;
                if (!productProto || !productProto.ProductService) {
                    throw new Error('Could not find ProductService in loaded proto descriptor');
                }
                const serverAddress = `${config_1.config.grpc.productService.host}:${config_1.config.grpc.productService.port}`;
                this.client = new productProto.ProductService(serverAddress, grpc.credentials.createInsecure(), {
                    'grpc.keepalive_time_ms': 30000,
                    'grpc.keepalive_timeout_ms': 5000,
                    'grpc.keepalive_permit_without_calls': true,
                });
                logger.info('Product gRPC client initialized', { serverAddress });
            }
            catch (error) {
                logger.error('Failed to initialize Product gRPC client', error);
                throw error;
            }
        });
    }
    getProductsBatch(productIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error('gRPC client not initialized');
            }
            if (!productIds || productIds.length === 0) {
                return [];
            }
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const makeRequest = () => {
                    attempts++;
                    const request = {
                        product_ids: productIds,
                        metadata: {
                            data: {
                                source: 'cart-service',
                                timestamp: new Date().toISOString(),
                            },
                        },
                    };
                    this.client.GetProductsBatch(request, (error, response) => {
                        var _a, _b, _c;
                        if (error) {
                            logger.error(`gRPC request failed (attempt ${attempts})`, {
                                error: error.message,
                                productIds,
                                attempts,
                            });
                            if (attempts < this.retryAttempts) {
                                setTimeout(makeRequest, this.retryDelay * attempts);
                                return;
                            }
                            reject(error);
                            return;
                        }
                        const isSuccessStatus = ((_a = response === null || response === void 0 ? void 0 : response.status) === null || _a === void 0 ? void 0 : _a.code) === 'OK';
                        if (!response || !isSuccessStatus) {
                            const errorMessage = ((_b = response === null || response === void 0 ? void 0 : response.status) === null || _b === void 0 ? void 0 : _b.message) || 'Unknown gRPC error';
                            logger.error('gRPC response error', {
                                status: response === null || response === void 0 ? void 0 : response.status,
                                productIds,
                                expectedCode: 0,
                                actualCode: (_c = response === null || response === void 0 ? void 0 : response.status) === null || _c === void 0 ? void 0 : _c.code,
                            });
                            reject(new Error(errorMessage));
                            return;
                        }
                        try {
                            if (!response.products || !Array.isArray(response.products)) {
                                logger.warn('No products in response', {
                                    products: response.products,
                                    responseKeys: Object.keys(response || {})
                                });
                                resolve([]);
                                return;
                            }
                            const products = this.mapGrpcResponseToProducts(response.products);
                            logger.info('Successfully fetched products via gRPC', {
                                productCount: products.length,
                                requestedCount: productIds.length,
                                latencyMs: response.latency_ms,
                            });
                            resolve(products);
                        }
                        catch (mappingError) {
                            logger.error('Failed to map gRPC response', { error: mappingError });
                            reject(mappingError);
                        }
                    });
                };
                makeRequest();
            });
        });
    }
    mapGrpcResponseToProducts(grpcProducts) {
        return grpcProducts.map((grpcProduct) => {
            const product = {
                id: grpcProduct.id,
                name: grpcProduct.name,
                shortDescription: grpcProduct.short_description || '',
                price: grpcProduct.price,
                originalPrice: grpcProduct.original_price || undefined,
                ratingAverage: grpcProduct.rating_average || undefined,
                reviewCount: grpcProduct.review_count || undefined,
                inventoryStatus: grpcProduct.inventory_status || 'unknown',
                quantitySold: grpcProduct.quantity_sold || undefined,
            };
            if (grpcProduct.brand) {
                product.brand = {
                    id: grpcProduct.brand.id,
                    name: grpcProduct.brand.name,
                    slug: grpcProduct.brand.slug || undefined,
                    countryOfOrigin: grpcProduct.brand.country_of_origin || undefined,
                };
            }
            if (grpcProduct.images && grpcProduct.images.length > 0) {
                product.images = grpcProduct.images.map((img) => ({
                    id: img.id,
                    url: img.url,
                    position: img.position || 0,
                }));
            }
            if (grpcProduct.categories && grpcProduct.categories.length > 0) {
                product.categories = grpcProduct.categories.map((cat) => ({
                    id: cat.id,
                    name: cat.name,
                    url: cat.url || undefined,
                    parentId: cat.parent_id || undefined,
                    level: cat.level || undefined,
                }));
            }
            return product;
        });
    }
    close() {
        if (this.client) {
            logger.info('Closing Product gRPC client');
            this.client = null;
        }
    }
}
exports.ProductGrpcClient = ProductGrpcClient;
exports.productGrpcClient = new ProductGrpcClient();
//# sourceMappingURL=productClient.js.map