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
exports.cartGrpcServer = exports.CartGrpcServer = void 0;
const config_1 = require("@/config");
const cartService_1 = require("@/services/cartService");
const logger_1 = require("@/utils/logger");
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const path_1 = __importDefault(require("path"));
const logger = new logger_1.Logger('CartGrpcServer');
class CartGrpcServer {
    constructor() {
        this.server = new grpc.Server();
        this.setupServices();
    }
    setupServices() {
        var _a;
        try {
            const PROTO_ROOT = path_1.default.join(__dirname, '../../proto');
            const CART_PROTO_PATH = path_1.default.join(PROTO_ROOT, 'cart.proto');
            const COMMON_PROTO_PATH = path_1.default.join(PROTO_ROOT, 'common.proto');
            const packageDefinition = protoLoader.loadSync([CART_PROTO_PATH, COMMON_PROTO_PATH], {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
                includeDirs: [PROTO_ROOT]
            });
            const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
            const cartProto = (_a = protoDescriptor.ecommerce) === null || _a === void 0 ? void 0 : _a.cart;
            if (!cartProto || !cartProto.CartService) {
                throw new Error('Could not find CartService in loaded proto descriptor');
            }
            this.server.addService(cartProto.CartService.service, {
                GetCart: this.getCart.bind(this),
                PrepareCheckout: this.prepareCheckout.bind(this),
                ClearCart: this.clearCart.bind(this),
                ValidateCart: this.validateCart.bind(this),
            });
            logger.info('Cart gRPC services registered successfully');
        }
        catch (error) {
            logger.error('Failed to setup gRPC services', error);
            throw error;
        }
    }
    getCart(call, callback) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            const { user_id, metadata } = call.request;
            try {
                logger.debug('Getting cart via gRPC', {
                    userId: user_id,
                    source: (_a = metadata === null || metadata === void 0 ? void 0 : metadata.data) === null || _a === void 0 ? void 0 : _a.source,
                    requestId: (_b = metadata === null || metadata === void 0 ? void 0 : metadata.data) === null || _b === void 0 ? void 0 : _b.request_id
                });
                const cart = yield cartService_1.cartService.getCart(user_id);
                if (!cart) {
                    const response = {
                        cart: null,
                        result_status: {
                            code: 'NOT_FOUND',
                            message: 'Cart not found or empty'
                        },
                        latency_ms: Date.now() - startTime,
                    };
                    callback(null, response);
                    return;
                }
                const response = {
                    cart: this.mapCartToGrpcResponse(cart),
                    result_status: { code: 'OK', message: 'Success' },
                    latency_ms: Date.now() - startTime,
                };
                logger.debug('Cart retrieved via gRPC successfully', {
                    userId: user_id,
                    itemCount: cart.items.length,
                    totalAmount: cart.pricing.total
                });
                callback(null, response);
            }
            catch (error) {
                logger.error('Failed to get cart via gRPC', {
                    error: error instanceof Error ? error.message : error,
                    userId: user_id
                });
                const response = {
                    cart: null,
                    result_status: {
                        code: 'ERROR',
                        message: error instanceof Error ? error.message : 'Unknown error'
                    },
                    latency_ms: Date.now() - startTime,
                };
                callback(null, response);
            }
        });
    }
    prepareCheckout(call, callback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            const { user_id, metadata } = call.request;
            try {
                logger.debug('Preparing checkout via gRPC', {
                    userId: user_id,
                    source: (_a = metadata === null || metadata === void 0 ? void 0 : metadata.data) === null || _a === void 0 ? void 0 : _a.source
                });
                const checkoutData = yield cartService_1.cartService.prepareCheckout(user_id);
                const response = {
                    cart: this.mapCartToGrpcResponse(checkoutData.cart),
                    validation: {
                        is_valid: checkoutData.validation.isValid,
                        errors: checkoutData.validation.errors,
                        invalid_items: checkoutData.validation.invalidItems,
                    },
                    summary: {
                        item_count: checkoutData.summary.itemCount,
                        total_amount: checkoutData.summary.totalAmount,
                        is_ready_for_checkout: checkoutData.summary.isReadyForCheckout,
                    },
                    result_status: { code: 'OK', message: 'Success' },
                    latency_ms: Date.now() - startTime,
                };
                logger.debug('Checkout preparation completed via gRPC', {
                    userId: user_id,
                    isValid: checkoutData.validation.isValid,
                    isReady: checkoutData.summary.isReadyForCheckout,
                    totalAmount: checkoutData.summary.totalAmount
                });
                callback(null, response);
            }
            catch (error) {
                logger.error('Failed to prepare checkout via gRPC', {
                    error: error instanceof Error ? error.message : error,
                    userId: user_id
                });
                const response = {
                    cart: null,
                    validation: null,
                    summary: null,
                    result_status: {
                        code: 'ERROR',
                        message: error instanceof Error ? error.message : 'Unknown error'
                    },
                    latency_ms: Date.now() - startTime,
                };
                callback(null, response);
            }
        });
    }
    clearCart(call, callback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            const { user_id, reason, metadata } = call.request;
            try {
                logger.debug('Clearing cart via gRPC', {
                    userId: user_id,
                    reason,
                    source: (_a = metadata === null || metadata === void 0 ? void 0 : metadata.data) === null || _a === void 0 ? void 0 : _a.source
                });
                yield cartService_1.cartService.clearCart(user_id);
                const response = {
                    success: true,
                    result_status: { code: 'OK', message: 'Cart cleared successfully' },
                    latency_ms: Date.now() - startTime,
                };
                logger.info('Cart cleared via gRPC successfully', {
                    userId: user_id,
                    reason
                });
                callback(null, response);
            }
            catch (error) {
                logger.error('Failed to clear cart via gRPC', {
                    error: error instanceof Error ? error.message : error,
                    userId: user_id
                });
                const response = {
                    success: false,
                    result_status: {
                        code: 'ERROR',
                        message: error instanceof Error ? error.message : 'Unknown error'
                    },
                    latency_ms: Date.now() - startTime,
                };
                callback(null, response);
            }
        });
    }
    validateCart(call, callback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            const { user_id, metadata } = call.request;
            try {
                logger.debug('Validating cart via gRPC', {
                    userId: user_id,
                    source: (_a = metadata === null || metadata === void 0 ? void 0 : metadata.data) === null || _a === void 0 ? void 0 : _a.source
                });
                const validation = yield cartService_1.cartService.validateCart(user_id);
                const response = {
                    validation: {
                        is_valid: validation.isValid,
                        errors: validation.errors,
                        invalid_items: validation.invalidItems,
                    },
                    result_status: { code: 'OK', message: 'Success' },
                    latency_ms: Date.now() - startTime,
                };
                logger.debug('Cart validation completed via gRPC', {
                    userId: user_id,
                    isValid: validation.isValid,
                    errorCount: validation.errors.length
                });
                callback(null, response);
            }
            catch (error) {
                logger.error('Failed to validate cart via gRPC', {
                    error: error instanceof Error ? error.message : error,
                    userId: user_id
                });
                const response = {
                    validation: null,
                    result_status: {
                        code: 'ERROR',
                        message: error instanceof Error ? error.message : 'Unknown error'
                    },
                    latency_ms: Date.now() - startTime,
                };
                callback(null, response);
            }
        });
    }
    mapCartToGrpcResponse(cart) {
        return {
            user_id: cart.userId,
            items: cart.items.map((item) => ({
                product_id: item.productId,
                quantity: item.quantity,
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    short_description: item.product.shortDescription || '',
                    price: item.product.price,
                    original_price: item.product.originalPrice || 0,
                    rating_average: item.product.ratingAverage || 0,
                    review_count: item.product.reviewCount || 0,
                    inventory_status: item.product.inventoryStatus,
                    quantity_sold: item.product.quantitySold || 0,
                    brand: item.product.brand ? {
                        id: item.product.brand.id,
                        name: item.product.brand.name,
                        slug: item.product.brand.slug || '',
                        country_of_origin: item.product.brand.countryOfOrigin || '',
                    } : null,
                    images: item.product.images ? item.product.images.map((img) => ({
                        id: img.id,
                        url: img.url,
                        position: img.position,
                    })) : [],
                    categories: item.product.categories ? item.product.categories.map((cat) => ({
                        id: cat.id,
                        name: cat.name,
                        url: cat.url || '',
                        parent_id: cat.parentId || '',
                        level: cat.level || 0,
                    })) : [],
                },
                total_price: item.totalPrice,
                is_available: item.isAvailable,
                available_quantity: item.availableQuantity,
                added_at: item.addedAt.toISOString(),
                updated_at: item.updatedAt.toISOString(),
            })),
            total_items: cart.totalItems,
            pricing: {
                subtotal: cart.pricing.subtotal,
                tax: cart.pricing.tax,
                shipping: cart.pricing.shipping,
                discount: cart.pricing.discount,
                total: cart.pricing.total,
                currency: cart.pricing.currency,
                tax_rate: cart.pricing.taxRate,
                free_shipping_threshold: cart.pricing.freeShippingThreshold,
                item_count: cart.pricing.itemCount,
            },
            created_at: cart.createdAt.toISOString(),
            updated_at: cart.updatedAt.toISOString(),
            expires_at: cart.expiresAt.toISOString(),
        };
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const host = config_1.config.grpc.server.host;
                const port = config_1.config.grpc.server.port;
                this.server.bindAsync(`${host}:${port}`, grpc.ServerCredentials.createInsecure(), (error, boundPort) => {
                    if (error) {
                        logger.error('Failed to start Cart gRPC server', error);
                        reject(error);
                        return;
                    }
                    logger.info('Cart gRPC server started successfully', {
                        host,
                        port: boundPort,
                        services: ['GetCart', 'PrepareCheckout', 'ClearCart', 'ValidateCart']
                    });
                    resolve();
                });
            });
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                this.server.tryShutdown((error) => {
                    if (error) {
                        logger.error('Error stopping Cart gRPC server', error);
                        this.server.forceShutdown();
                    }
                    else {
                        logger.info('Cart gRPC server stopped gracefully');
                    }
                    resolve();
                });
            });
        });
    }
    getServer() {
        return this.server;
    }
}
exports.CartGrpcServer = CartGrpcServer;
exports.cartGrpcServer = new CartGrpcServer();
//# sourceMappingURL=cartGrpcServer.js.map