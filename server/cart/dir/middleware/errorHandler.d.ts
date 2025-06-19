import { NextFunction, Request, Response } from 'express';
export interface ErrorWithStatus extends Error {
    status?: number;
    statusCode?: number;
}
export declare class ErrorHandler {
    static handle(error: ErrorWithStatus, req: Request, res: Response, next: NextFunction): void;
    static notFound(req: Request, res: Response, next: NextFunction): void;
}
//# sourceMappingURL=errorHandler.d.ts.map