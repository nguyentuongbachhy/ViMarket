import { config } from '@/config';
import { Logger } from '@/utils/logger';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('UserClient');

interface UserServiceClient {
    GetUser(request: any, callback: (error: grpc.ServiceError | null, response: any) => void): void;
    GetUsers(request: any, callback: (error: grpc.ServiceError | null, response: any) => void): void;
}

export interface UserInfo {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
    createdAt: string;
}

export class UserClient {
    private client: UserServiceClient | null = null;
    private isConnected: boolean = false;

    constructor() {
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            const PROTO_ROOT = path.join(__dirname, '../../proto');
            const USER_PROTO_PATH = path.join(PROTO_ROOT, 'user.proto');
            const COMMON_PROTO_PATH = path.join(PROTO_ROOT, 'common.proto');

            const packageDefinition = protoLoader.loadSync([USER_PROTO_PATH, COMMON_PROTO_PATH], {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
                includeDirs: [PROTO_ROOT]
            });

            const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
            const userProto = (protoDescriptor as any).ecommerce?.user;

            if (!userProto || !userProto.UserService) {
                throw new Error('Could not find UserService in loaded proto descriptor');
            }

            const serverAddress = `${config.grpc.userService.host}:${config.grpc.userService.port}`;

            this.client = new userProto.UserService(
                serverAddress,
                grpc.credentials.createInsecure(),
                {
                    'grpc.keepalive_time_ms': 30000,
                    'grpc.keepalive_timeout_ms': 5000,
                    'grpc.keepalive_permit_without_calls': true,
                }
            );

            logger.info('User gRPC client initialized', { serverAddress });
            this.isConnected = true;

        } catch (error) {
            logger.error('Failed to initialize User gRPC client', error);
            this.isConnected = false;
            // Don't throw - service can work without user service
        }
    }

    async getUserById(userId: string): Promise<UserInfo | null> {
        if (!this.client) {
            logger.warn('User gRPC client not available');
            return null;
        }

        return new Promise((resolve, reject) => {
            const request = {
                userId,
                metadata: {
                    data: {
                        source: 'order-service',
                        timestamp: new Date().toISOString(),
                        operation: 'get_user',
                        request_id: uuidv4(),
                    },
                },
            };

            logger.debug('Sending get user request', { userId });

            const timeout = setTimeout(() => {
                resolve(null); // Return null instead of rejecting
            }, config.grpc.userService.timeout);

            this.client!.GetUser(request, (error, response) => {
                clearTimeout(timeout);

                if (error) {
                    logger.warn('Failed to get user info', {
                        error: error.message,
                        code: error.code,
                        userId
                    });
                    resolve(null);
                    return;
                }

                const statusCode = response?.status?.code;
                if (statusCode !== 'OK' && statusCode !== 0) {
                    logger.warn('User service returned error', {
                        statusCode,
                        message: response?.status?.message,
                        userId
                    });
                    resolve(null);
                    return;
                }

                if (!response.user) {
                    logger.debug('User not found', { userId });
                    resolve(null);
                    return;
                }

                const user: UserInfo = {
                    id: response.user.id,
                    username: response.user.username,
                    email: response.user.email,
                    fullName: response.user.fullName,
                    role: response.user.role,
                    createdAt: response.user.createdAt,
                };

                logger.debug('User retrieved successfully', { userId, email: user.email });
                resolve(user);
            });
        });
    }

    async getUsersByIds(userIds: string[]): Promise<UserInfo[]> {
        if (!this.client || userIds.length === 0) {
            return [];
        }

        return new Promise((resolve, reject) => {
            const request = {
                userIds,
                metadata: {
                    data: {
                        source: 'order-service',
                        timestamp: new Date().toISOString(),
                        operation: 'get_users',
                        request_id: uuidv4(),
                    },
                },
            };

            const timeout = setTimeout(() => {
                resolve([]);
            }, config.grpc.userService.timeout);

            this.client!.GetUsers(request, (error, response) => {
                clearTimeout(timeout);

                if (error) {
                    logger.warn('Failed to get users info', {
                        error: error.message,
                        userCount: userIds.length
                    });
                    resolve([]);
                    return;
                }

                const users = (response.users || []).map((user: any) => ({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    createdAt: user.createdAt,
                }));

                resolve(users);
            });
        });
    }

    isHealthy(): boolean {
        return this.isConnected && this.client !== null;
    }

    close(): void {
        if (this.client) {
            logger.info('Closing User gRPC client');
            this.client = null;
            this.isConnected = false;
        }
    }
}

export const userClient = new UserClient();