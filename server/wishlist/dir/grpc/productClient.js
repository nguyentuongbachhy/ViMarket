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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.productGrpcClient = void 0;
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const PROTO_PATH = path_1.default.join(__dirname, '../../proto/product.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const productProto = grpc.loadPackageDefinition(packageDefinition);
class ProductGrpcClient {
    constructor() {
        this.client = new productProto.product.ProductService(config_1.CONFIG.GRPC_PRODUCT_SERVICE_URL, grpc.credentials.createInsecure());
    }
    getProductsBatch(productIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const request = {
                    product_ids: productIds,
                    metadata: {
                        data: {
                            source: 'wishlist-service',
                        },
                    },
                };
                this.client.GetProductsBatch(request, (error, response) => {
                    if (error) {
                        logger_1.logger.error('gRPC GetProductsBatch error:', error);
                        reject(error);
                        return;
                    }
                    if (response.status.code !== 0) {
                        logger_1.logger.error('gRPC GetProductsBatch failed:', response.status.message);
                        reject(new Error(response.status.message));
                        return;
                    }
                    resolve(response.products || []);
                });
            });
        });
    }
    getProductDetail(productId, productName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const request = {
                    product_id: productId,
                    product_name: productName || '',
                    metadata: {
                        data: {
                            source: 'wishlist-service',
                        },
                    },
                };
                this.client.GetProductDetail(request, (error, response) => {
                    if (error) {
                        logger_1.logger.error('gRPC GetProductDetail error:', error);
                        reject(error);
                        return;
                    }
                    if (response.status.code !== 0) {
                        logger_1.logger.error('gRPC GetProductDetail failed:', response.status.message);
                        reject(new Error(response.status.message));
                        return;
                    }
                    resolve(response);
                });
            });
        });
    }
    disconnect() {
        if (this.client) {
            this.client.close();
        }
    }
}
exports.productGrpcClient = new ProductGrpcClient();
//# sourceMappingURL=productClient.js.map