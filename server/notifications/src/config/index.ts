import dotenv from 'dotenv';

dotenv.config();

interface NotificationConfig {
    server: {
        port: number;
        nodeEnv: string;
        host: string;
    };
    kafka: {
        clientId: string;
        brokers: string[];
        groupId: string;
        topics: {
            wishlistUpdated: string;
            inventoryUpdated: string;
            cartUpdated: string;
            productPriceChanged: string;
            inventoryLowStock: string;
            cartAbandoned: string;
            cartExpiration: string;
            cartItemAdded: string;
            // ✅ Thêm order topics
            orderCreated: string;
            orderStatusUpdated: string;
            orderCancelled: string;
        };
    };
    firebase: {
        projectId: string;
        privateKey: string;
        clientEmail: string;
        databaseUrl: string;
    };
    redis: {
        host: string;
        port: number;
        password: string;
        db: number;
    };
    jwt: {
        secretKey: string;
        algorithm: string;
        expirationSeconds: number;
        issuer: string;
        audience: string;
    };
    notification: {
        batchSize: number;
        retryAttempts: number;
        retryDelay: number;
        cleanupInterval: number;
        maxNotificationsPerUser: number;
    };
    logging: {
        level: string;
        format: string;
    };
}

function getRequiredEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Required environment variable ${name} is not set`);
    }
    return value;
}

function getEnvVar(name: string, defaultValue: string): string {
    return process.env[name] || defaultValue;
}

function getEnvNumber(name: string, defaultValue: number): number {
    const value = process.env[name];
    if (!value) return defaultValue;

    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(`Environment variable ${name} must be a valid number`);
    }
    return parsed;
}

export const config: NotificationConfig = {
    server: {
        port: getEnvNumber('PORT', 8006),
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
            cartExpiration: getEnvVar('KAFKA_TOPIC_CART_EXPIRATION', 'cart.expiration.reminder'),
            cartItemAdded: getEnvVar('KAFKA_TOPIC_CART_ITEM_ADDED', 'cart.item.added'),
            // ✅ Order topics
            orderCreated: getEnvVar('KAFKA_TOPIC_ORDER_CREATED', 'order.created'),
            orderStatusUpdated: getEnvVar('KAFKA_TOPIC_ORDER_STATUS_UPDATED', 'order.status.updated'),
            orderCancelled: getEnvVar('KAFKA_TOPIC_ORDER_CANCELLED', 'order.cancelled'),
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
        cleanupInterval: getEnvNumber('NOTIFICATION_CLEANUP_INTERVAL', 24 * 60 * 60 * 1000),
        maxNotificationsPerUser: getEnvNumber('MAX_NOTIFICATIONS_PER_USER', 1000),
    },
    logging: {
        level: getEnvVar('LOG_LEVEL', 'debug'),
        format: getEnvVar('LOG_FORMAT', 'json'),
    },
};

// Validation
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
    server: config.server,
    kafka: {
        clientId: config.kafka.clientId,
        brokers: config.kafka.brokers,
        groupId: config.kafka.groupId,
        topics: config.kafka.topics,
    },
    firebase: {
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        databaseUrl: config.firebase.databaseUrl,
    },
    redis: {
        host: config.redis.host,
        port: config.redis.port,
        hasPassword: !!config.redis.password,
        db: config.redis.db,
    },
    notification: config.notification,
});