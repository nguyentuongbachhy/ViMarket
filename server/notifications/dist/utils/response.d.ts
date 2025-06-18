import { Response } from 'express';
export declare class ResponseUtils {
    static success<T>(res: Response, data: T, message?: string, code?: number, meta?: any): Response;
    static error(res: Response, message?: string, code?: number, meta?: any): Response;
    static notFound(res: Response, message?: string): Response;
    static badRequest(res: Response, message?: string): Response;
    static unauthorized(res: Response, message?: string): Response;
    static forbidden(res: Response, message?: string): Response;
}
//# sourceMappingURL=response.d.ts.map