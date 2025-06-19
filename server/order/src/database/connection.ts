import { config } from '@/config';
import { Logger } from '@/utils/logger';
import { Pool, PoolClient } from 'pg';

const logger = new Logger('Database');

class DatabaseConnection {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            host: config.database.host,
            port: config.database.port,
            database: config.database.database,
            user: config.database.user,
            password: config.database.password,
            ssl: config.database.ssl,
            max: config.database.maxConnections,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });

        this.pool.on('error', (err) => {
            logger.error('Database pool error', { error: err });
        });

        this.pool.on('connect', () => {
            logger.debug('New database connection established');
        });
    }

    async getClient(): Promise<PoolClient> {
        try {
            return await this.pool.connect();
        } catch (error) {
            logger.error('Failed to get database client', { error });
            throw error;
        }
    }

    async query(text: string, params?: any[]): Promise<any> {
        const client = await this.getClient();
        try {
            const result = await client.query(text, params);
            return result;
        } catch (error) {
            logger.error('Database query error', {
                error,
                query: text,
                params: params?.length || 0
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Transaction failed', { error });
            throw error;
        } finally {
            client.release();
        }
    }

    async close(): Promise<void> {
        await this.pool.end();
        logger.info('Database pool closed');
    }

    async testConnection(): Promise<boolean> {
        try {
            const result = await this.query('SELECT NOW()');
            logger.info('Database connection test successful', {
                timestamp: result.rows[0].now
            });
            return true;
        } catch (error) {
            logger.error('Database connection test failed', { error });
            return false;
        }
    }
}

export const database = new DatabaseConnection();