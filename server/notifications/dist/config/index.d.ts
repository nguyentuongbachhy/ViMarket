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
export declare const config: NotificationConfig;
export {};
//# sourceMappingURL=index.d.ts.map