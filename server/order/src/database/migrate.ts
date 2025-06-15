import { config } from '@/config';
import { Logger } from '@/utils/logger';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

const logger = new Logger('DatabaseMigrator');

class DatabaseMigrator {
    private client: Client;

    constructor() {
        this.client = new Client({
            host: config.database.host,
            port: config.database.port,
            database: config.database.database,
            user: config.database.user,
            password: config.database.password,
            ssl: config.database.ssl,
        });
    }

    async connect(): Promise<void> {
        try {
            await this.client.connect();
            logger.info('Connected to database for migration');
        } catch (error) {
            logger.error('Failed to connect to database', { error });
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.client.end();
            logger.info('Disconnected from database');
        } catch (error) {
            logger.error('Failed to disconnect from database', { error });
        }
    }

    async createMigrationsTable(): Promise<void> {
        const query = `
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        try {
            await this.client.query(query);
            logger.info('Migrations table created or already exists');
        } catch (error) {
            logger.error('Failed to create migrations table', { error });
            throw error;
        }
    }

    async getExecutedMigrations(): Promise<string[]> {
        try {
            const result = await this.client.query('SELECT filename FROM migrations ORDER BY id');
            return result.rows.map(row => row.filename);
        } catch (error) {
            logger.error('Failed to get executed migrations', { error });
            throw error;
        }
    }

    async executeMigration(filename: string, sql: string): Promise<void> {
        try {
            await this.client.query('BEGIN');

            // Execute migration SQL
            await this.client.query(sql);

            // Record migration as executed
            await this.client.query(
                'INSERT INTO migrations (filename) VALUES ($1)',
                [filename]
            );

            await this.client.query('COMMIT');
            logger.info('Migration executed successfully', { filename });
        } catch (error) {
            await this.client.query('ROLLBACK');
            logger.error('Migration failed', { filename, error });
            throw error;
        }
    }

    async runMigrations(): Promise<void> {
        try {
            await this.connect();
            await this.createMigrationsTable();

            const migrationsDir = path.join(__dirname, 'migrations');

            if (!fs.existsSync(migrationsDir)) {
                logger.warn('Migrations directory does not exist', { migrationsDir });
                return;
            }

            const migrationFiles = fs.readdirSync(migrationsDir)
                .filter(file => file.endsWith('.sql'))
                .sort();

            if (migrationFiles.length === 0) {
                logger.info('No migration files found');
                return;
            }

            const executedMigrations = await this.getExecutedMigrations();
            const pendingMigrations = migrationFiles.filter(
                file => !executedMigrations.includes(file)
            );

            if (pendingMigrations.length === 0) {
                logger.info('All migrations are up to date');
                return;
            }

            logger.info('Found pending migrations', {
                count: pendingMigrations.length,
                files: pendingMigrations
            });

            for (const filename of pendingMigrations) {
                const filePath = path.join(migrationsDir, filename);
                const sql = fs.readFileSync(filePath, 'utf8');

                logger.info('Executing migration', { filename });
                await this.executeMigration(filename, sql);
            }

            logger.info('All migrations completed successfully');
        } catch (error) {
            logger.error('Migration process failed', { error });
            throw error;
        } finally {
            await this.disconnect();
        }
    }

    async rollbackLastMigration(): Promise<void> {
        try {
            await this.connect();

            const result = await this.client.query(
                'SELECT filename FROM migrations ORDER BY id DESC LIMIT 1'
            );

            if (result.rows.length === 0) {
                logger.info('No migrations to rollback');
                return;
            }

            const lastMigration = result.rows[0].filename;
            logger.info('Rolling back migration', { filename: lastMigration });

            // Check if rollback file exists
            const rollbackFile = lastMigration.replace('.sql', '.rollback.sql');
            const rollbackPath = path.join(__dirname, 'migrations', rollbackFile);

            if (!fs.existsSync(rollbackPath)) {
                throw new Error(`Rollback file not found: ${rollbackFile}`);
            }

            const rollbackSql = fs.readFileSync(rollbackPath, 'utf8');

            await this.client.query('BEGIN');

            // Execute rollback SQL
            await this.client.query(rollbackSql);

            // Remove migration record
            await this.client.query(
                'DELETE FROM migrations WHERE filename = $1',
                [lastMigration]
            );

            await this.client.query('COMMIT');
            logger.info('Migration rolled back successfully', { filename: lastMigration });
        } catch (error) {
            await this.client.query('ROLLBACK');
            logger.error('Rollback failed', { error });
            throw error;
        } finally {
            await this.disconnect();
        }
    }

    async getMigrationStatus(): Promise<void> {
        try {
            await this.connect();
            await this.createMigrationsTable();

            const migrationsDir = path.join(__dirname, 'migrations');
            const migrationFiles = fs.existsSync(migrationsDir)
                ? fs.readdirSync(migrationsDir)
                    .filter(file => file.endsWith('.sql'))
                    .sort()
                : [];

            const executedMigrations = await this.getExecutedMigrations();

            logger.info('Migration Status', {
                totalFiles: migrationFiles.length,
                executed: executedMigrations.length,
                pending: migrationFiles.filter(file => !executedMigrations.includes(file)).length
            });

            console.log('\n=== Migration Status ===');
            console.log(`Total migration files: ${migrationFiles.length}`);
            console.log(`Executed migrations: ${executedMigrations.length}`);
            console.log(`Pending migrations: ${migrationFiles.filter(file => !executedMigrations.includes(file)).length}`);

            if (migrationFiles.length > 0) {
                console.log('\n=== Files ===');
                migrationFiles.forEach(file => {
                    const status = executedMigrations.includes(file) ? '✅ EXECUTED' : '⏳ PENDING';
                    console.log(`${status} - ${file}`);
                });
            }

        } catch (error) {
            logger.error('Failed to get migration status', { error });
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

// CLI interface
async function main() {
    const migrator = new DatabaseMigrator();
    const command = process.argv[2];

    try {
        switch (command) {
            case 'up':
            case 'migrate':
                await migrator.runMigrations();
                break;

            case 'down':
            case 'rollback':
                await migrator.rollbackLastMigration();
                break;

            case 'status':
                await migrator.getMigrationStatus();
                break;

            default:
                console.log('Usage:');
                console.log('  npm run db:migrate up     - Run pending migrations');
                console.log('  npm run db:migrate down   - Rollback last migration');
                console.log('  npm run db:migrate status - Show migration status');
                process.exit(1);
        }
    } catch (error) {
        logger.error('Migration command failed', { error, command });
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

export { DatabaseMigrator };
