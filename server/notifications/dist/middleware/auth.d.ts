import { NextFunction, Request, Response } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        username: string;
        email?: string;
        roles: string[];
    };
}
export declare class AuthMiddleware {
    static authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
}
//# sourceMappingURL=auth.d.ts.map