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
exports.inventoryGrpcClient = exports.InventoryGrpcClient = void 0;
const config_1 = require("@/config");
const logger_1 = require("@/utils/logger");
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const path_1 = __importDefault(require("path"));
const logger = new logger_1.Logger('InventoryGrpcClient');
class InventoryGrpcClient {
    constructor() {
        this.client = null;
        this.initialize();
    }
    initialize() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const INVENTORY_PROTO_PATH = path_1.default.join(__dirname, '../../proto/inventory.proto');
                const COMMON_PROTO_PATH = path_1.default.join(__dirname, '../../proto/common.proto');
                const packageDefinition = protoLoader.loadSync([INVENTORY_PROTO_PATH, COMMON_PROTO_PATH], {
                    keepCase: true,
                    longs: String,
                    enums: String,
                    defaults: true,
                    oneofs: true,
                    includeDirs: [path_1.default.join(__dirname, '../../proto')]
                });
                const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
                const inventoryProto = (_a = protoDescriptor.ecommerce) === null || _a === void 0 ? void 0 : _a.inventory;
                if (!inventoryProto || !inventoryProto.InventoryService) {
                    throw new Error('Could not find InventoryService in loaded proto descriptor');
                }
                const serverAddress = `${config_1.config.grpc.inventoryService.host}:${config_1.config.grpc.inventoryService.port}`;
                this.client = new inventoryProto.InventoryService(serverAddress, grpc.credentials.createInsecure(), {
                    'grpc.keepalive_time_ms': 30000,
                    'grpc.keepalive_timeout_ms': 5000,
                    'grpc.keepalive_permit_without_calls': true,
                    'grpc.max_receive_message_length': 10 * 1024 * 1024,
                    'grpc.max_send_message_length': 10 * 1024 * 1024,
                });
                logger.info('Inventory gRPC client initialized', { serverAddress });
                yield this.testConnection();
            }
            catch (error) {
                logger.error('Failed to initialize Inventory gRPC client', error);
                throw error;
            }
        });
    }
    testConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.client) {
                    reject(new Error('Client not initialized'));
                    return;
                }
                const testRequest = {
                    product_id: '0000fd37-3c4f-4566-8015-a2421d1918f2',
                    quantity: 1,
                    metadata: {
                        data: {
                            source: 'cart-service-test',
                            timestamp: new Date().toISOString(),
                            operation: 'connection_test'
                        },
                    },
                };
                const timeout = setTimeout(() => {
                    logger.warn('gRPC connection test timeout');
                    resolve();
                }, 5000);
                this.client.CheckInventory(testRequest, (error, response) => {
                    var _a, _b;
                    clearTimeout(timeout);
                    if (error) {
                        logger.warn('gRPC connection test failed', {
                            error: error.message,
                            code: error.code
                        });
                        resolve();
                        return;
                    }
                    const statusCode = (_a = response === null || response === void 0 ? void 0 : response.result_status) === null || _a === void 0 ? void 0 : _a.code;
                    const isSuccess = statusCode === 'OK';
                    if (isSuccess) {
                        logger.info('gRPC connection test successful');
                    }
                    else {
                        logger.warn('gRPC connection test returned error status', {
                            statusCode,
                            message: (_b = response === null || response === void 0 ? void 0 : response.result_status) === null || _b === void 0 ? void 0 : _b.message
                        });
                    }
                    resolve();
                });
            });
        });
    }
    checkInventory(productId, quantity, productInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error('gRPC client not initialized');
            }
            return new Promise((resolve, reject) => {
                const request = {
                    product_id: productId,
                    quantity,
                    metadata: {
                        data: {
                            source: 'cart-service',
                            timestamp: new Date().toISOString(),
                            operation: 'check_inventory'
                        },
                    },
                    product_info: {
                        inventory_status: productInfo.inventoryStatus || '',
                        name: productInfo.name || '',
                        price: productInfo.price || 0
                    },
                };
                logger.debug('Sending inventory check request', {
                    productId,
                    quantity,
                    productInfo: request.product_info
                });
                const timeout = setTimeout(() => {
                    reject(new Error('Request timeout'));
                }, 10000);
                this.client.CheckInventory(request, (error, response) => {
                    var _a, _b, _c;
                    clearTimeout(timeout);
                    if (error) {
                        logger.error('Failed to check inventory', {
                            error: {
                                message: error.message,
                                code: error.code,
                                details: error.details
                            },
                            productId,
                            quantity,
                            productInfo,
                        });
                        reject(error);
                        return;
                    }
                    logger.debug('Inventory check response received', {
                        productId,
                        response: {
                            available: response === null || response === void 0 ? void 0 : response.available,
                            availableQuantity: response === null || response === void 0 ? void 0 : response.available_quantity,
                            status: response === null || response === void 0 ? void 0 : response.status,
                            resultStatus: response === null || response === void 0 ? void 0 : response.result_status
                        }
                    });
                    const statusCode = (_a = response === null || response === void 0 ? void 0 : response.result_status) === null || _a === void 0 ? void 0 : _a.code;
                    const isSuccess = statusCode === 'OK';
                    if (!isSuccess) {
                        const errorMessage = ((_b = response === null || response === void 0 ? void 0 : response.result_status) === null || _b === void 0 ? void 0 : _b.message) || 'Unknown inventory service error';
                        logger.error('Inventory service returned error', {
                            productId,
                            statusCode,
                            statusMessage: (_c = response === null || response === void 0 ? void 0 : response.result_status) === null || _c === void 0 ? void 0 : _c.message
                        });
                        reject(new Error(errorMessage));
                        return;
                    }
                    resolve({
                        available: response.available,
                        availableQuantity: response.available_quantity,
                        status: response.status,
                    });
                });
            });
        });
    }
    checkInventoryBatch(items) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error('gRPC client not initialized');
            }
            if (!items || items.length === 0) {
                return [];
            }
            return new Promise((resolve, reject) => {
                const request = {
                    items: items.map(item => ({
                        product_id: item.productId,
                        quantity: item.quantity,
                    })),
                    metadata: {
                        data: {
                            source: 'cart-service',
                            timestamp: new Date().toISOString(),
                            operation: 'check_inventory_batch',
                            item_count: items.length.toString(),
                        },
                    },
                };
                const timeout = setTimeout(() => {
                    reject(new Error('Batch request timeout'));
                }, 15000);
                this.client.CheckInventoryBatch(request, (error, response) => {
                    var _a, _b, _c;
                    clearTimeout(timeout);
                    if (error) {
                        logger.error('Failed to check inventory batch', {
                            error: error.message,
                            itemCount: items.length,
                        });
                        reject(error);
                        return;
                    }
                    const statusCode = (_a = response === null || response === void 0 ? void 0 : response.result_status) === null || _a === void 0 ? void 0 : _a.code;
                    const isSuccess = statusCode === 'OK';
                    if (!isSuccess) {
                        const errorMessage = ((_b = response === null || response === void 0 ? void 0 : response.result_status) === null || _b === void 0 ? void 0 : _b.message) || 'Unknown inventory service error';
                        reject(new Error(errorMessage));
                        return;
                    }
                    const results = ((_c = response.items) === null || _c === void 0 ? void 0 : _c.map(item => ({
                        productId: item.product_id,
                        available: item.available,
                        availableQuantity: item.available_quantity,
                        reservedQuantity: item.reserved_quantity,
                        status: item.status,
                        errorMessage: item.error_message,
                    }))) || [];
                    resolve(results);
                });
            });
        });
    }
    reserveInventory(reservationId, userId, items, expiresAt) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error('gRPC client not initialized');
            }
            return new Promise((resolve, reject) => {
                const request = {
                    reservation_id: reservationId,
                    user_id: userId,
                    items: items.map(item => ({
                        product_id: item.productId,
                        quantity: item.quantity,
                    })),
                    expires_at: Math.floor(expiresAt.getTime() / 1000),
                    metadata: {
                        data: {
                            source: 'cart-service',
                            timestamp: new Date().toISOString(),
                        },
                    },
                };
                const timeout = setTimeout(() => {
                    reject(new Error('Reserve request timeout'));
                }, 15000);
                this.client.ReserveInventory(request, (error, response) => {
                    var _a, _b, _c;
                    clearTimeout(timeout);
                    if (error) {
                        logger.error('Failed to reserve inventory', {
                            error: error.message,
                            reservationId,
                            userId,
                            itemCount: items.length,
                        });
                        reject(error);
                        return;
                    }
                    const statusCode = (_a = response === null || response === void 0 ? void 0 : response.result_status) === null || _a === void 0 ? void 0 : _a.code;
                    const isSuccess = statusCode === 'OK';
                    if (!isSuccess) {
                        const errorMessage = ((_b = response === null || response === void 0 ? void 0 : response.result_status) === null || _b === void 0 ? void 0 : _b.message) || 'Unknown inventory service error';
                        reject(new Error(errorMessage));
                        return;
                    }
                    const results = ((_c = response.results) === null || _c === void 0 ? void 0 : _c.map(result => ({
                        productId: result.product_id,
                        requestedQuantity: result.requested_quantity,
                        reservedQuantity: result.reserved_quantity,
                        success: result.success,
                        errorMessage: result.error_message,
                    }))) || [];
                    resolve({
                        reservationId: response.reservation_id,
                        allReserved: response.all_reserved,
                        results,
                    });
                });
            });
        });
    }
    close() {
        if (this.client) {
            logger.info('Closing Inventory gRPC client');
            this.client = null;
        }
    }
}
exports.InventoryGrpcClient = InventoryGrpcClient;
exports.inventoryGrpcClient = new InventoryGrpcClient();
//# sourceMappingURL=inventoryClient.js.map