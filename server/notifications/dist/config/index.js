"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function getRequiredEnvVar(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Required environment variable ${name} is not set`);
    }
    return value;
}
function getEnvVar(name, defaultValue) {
    return process.env[name] || defaultValue;
}
function getEnvNumber(name, defaultValue) {
    const value = process.env[name];
    if (!value)
        return defaultValue;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(`Environment variable ${name} must be a valid number`);
    }
    return parsed;
}
exports.config = {
    server: {
        port: getEnvNumber('PORT', 8005),
        nodeEnv: getEnvVar('NODE_ENV', 'development'),
        host: getEnvVar('HOST', '0.0.0.0'),
    },
    kafka: {
        clientId: getEnvVar('KAFKA_CLIENT_ID', 'notification-service'),
        brokers: getEnvVar('KAFKA_BROKERS', 'localhost:9092').split(','),
        groupId: getEnvVar('KAFKA_GROUP_ID', 'notification-service-group'),
        topics: {
            wishlistUpdated: getEnvVar('KAFKA_TOPIC_WISHLIST_UPDATED', 'wishlist.updated'),
            inventoryUpdated: getEnvVar('KAFKA_TOPIC_INVENTORY_UPDATED', 'inventory.updated'),
            cartUpdated: getEnvVar('KAFKA_TOPIC_CART_UPDATED', 'cart.updated'),
            productPriceChanged: getEnvVar('KAFKA_TOPIC_PRODUCT_PRICE_CHANGED', 'product.price.changed'),
            inventoryLowStock: getEnvVar('KAFKA_TOPIC_INVENTORY_LOW_STOCK', 'inventory.low.stock'),
            cartAbandoned: getEnvVar('KAFKA_TOPIC_CART_ABANDONED', 'cart.abandoned.reminder'),
        },
    },
    firebase: {
        projectId: getRequiredEnvVar('FIREBASE_PROJECT_ID'),
        privateKey: getRequiredEnvVar('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
        clientEmail: getRequiredEnvVar('FIREBASE_CLIENT_EMAIL'),
        databaseUrl: getRequiredEnvVar('FIREBASE_DATABASE_URL'),
    },
    redis: {
        host: getEnvVar('REDIS_HOST', 'localhost'),
        port: getEnvNumber('REDIS_PORT', 6379),
        password: getEnvVar('REDIS_PASSWORD', ''),
        db: getEnvNumber('REDIS_DB', 2),
    },
    jwt: {
        secretKey: getRequiredEnvVar('JWT_SECRET_KEY'),
        algorithm: getEnvVar('JWT_ALGORITHM', 'HS512'),
        expirationSeconds: getEnvNumber('JWT_EXPIRATION_SECONDS', 86400),
        issuer: getEnvVar('JWT_ISSUER', 'ecommerce-api'),
        audience: getEnvVar('JWT_AUDIENCE', 'ecommerce-clients'),
    },
    notification: {
        batchSize: getEnvNumber('NOTIFICATION_BATCH_SIZE', 100),
        retryAttempts: getEnvNumber('NOTIFICATION_RETRY_ATTEMPTS', 3),
        retryDelay: getEnvNumber('NOTIFICATION_RETRY_DELAY', 5000),
        cleanupInterval: getEnvNumber('NOTIFICATION_CLEANUP_INTERVAL', 24 * 60 * 60 * 1000), // 24 hours
        maxNotificationsPerUser: getEnvNumber('MAX_NOTIFICATIONS_PER_USER', 1000),
    },
    logging: {
        level: getEnvVar('LOG_LEVEL', 'info'),
        format: getEnvVar('LOG_FORMAT', 'json'),
    },
};
// Validate required configurations
const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_DATABASE_URL',
    'JWT_SECRET_KEY'
];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Required environment variable ${envVar} is missing`);
    }
}
console.log('Notification Service Config loaded:', {
    server: exports.config.server,
    kafka: {
        clientId: exports.config.kafka.clientId,
        brokers: exports.config.kafka.brokers,
        groupId: exports.config.kafka.groupId,
        topics: exports.config.kafka.topics,
    },
    firebase: {
        projectId: exports.config.firebase.projectId,
        clientEmail: exports.config.firebase.clientEmail,
        databaseUrl: exports.config.firebase.databaseUrl,
    },
    redis: {
        host: exports.config.redis.host,
        port: exports.config.redis.port,
        hasPassword: !!exports.config.redis.password,
        db: exports.config.redis.db,
    },
    notification: exports.config.notification,
});
//# sourceMappingURL=index.js.map