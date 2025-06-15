import { AuthenticatedRequest } from '@/middleware/auth';
import { Response } from 'express';
export declare class CartController {
    static getCart(req: AuthenticatedRequest, res: Response): Promise<void>;
    static addToCart(req: AuthenticatedRequest, res: Response): Promise<void>;
    static updateCartItem(req: AuthenticatedRequest, res: Response): Promise<void>;
    static removeFromCart(req: AuthenticatedRequest, res: Response): Promise<void>;
    static clearCart(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getCartItemCount(req: AuthenticatedRequest, res: Response): Promise<void>;
    static validateCart(req: AuthenticatedRequest, res: Response): Promise<void>;
    static mergeGuestCart(req: AuthenticatedRequest, res: Response): Promise<void>;
    static prepareCheckout(req: AuthenticatedRequest, res: Response): Promise<void>;
    static extractNumberFromMessage(message: string, prefix: string): number | undefined;
}
//# sourceMappingURL=cartController.d.ts.map