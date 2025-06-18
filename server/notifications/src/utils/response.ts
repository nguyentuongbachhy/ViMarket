import { ApiResponse } from '@/types';
import { Response } from 'express';

export class ResponseUtils {
    static success<T>(
        res: Response,
        data: T,
        message: string = 'Operation completed successfully',
        code: number = 200,
        meta?: any
    ): Response {
        const response: ApiResponse<T> = {
            status: 'success',
            code,
            message,
            data,
            timestamp: new Date().toISOString(),
            ...(meta && { meta }),
        };
        return res.status(code).json(response);
    }

    static error(
        res: Response,
        message: string = 'An error occurred',
        code: number = 500,
        meta?: any
    ): Response {
        const response: ApiResponse = {
            status: 'error',
            code,
            message,
            timestamp: new Date().toISOString(),
            ...(meta && { meta }),
        };

        return res.status(code).json(response);
    }

    static notFound(res: Response, message: string = 'Resource not found'): Response {
        return this.error(res, message, 404);
    }

    static badRequest(res: Response, message: string = 'Bad request'): Response {
        return this.error(res, message, 400);
    }

    static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
        return this.error(res, message, 401);
    }

    static forbidden(res: Response, message: string = 'Forbidden'): Response {
        return this.error(res, message, 403);
    }
}