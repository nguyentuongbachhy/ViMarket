import { Request, Response } from 'express';
declare class WishlistController {
    addToWishlist(req: Request, res: Response): Promise<void>;
    removeFromWishlist(req: Request, res: Response): Promise<void>;
    getUserWishlist(req: Request, res: Response): Promise<void>;
    checkWishlistStatus(req: Request, res: Response): Promise<void>;
    getWishlistCount(req: Request, res: Response): Promise<void>;
    clearWishlist(req: Request, res: Response): Promise<void>;
    getWishlistWithPrices(req: Request, res: Response): Promise<void>;
    getMostWishlistedProducts(req: Request, res: Response): Promise<void>;
    getWishlistStats(req: Request, res: Response): Promise<void>;
}
export declare const wishlistController: WishlistController;
export {};
//# sourceMappingURL=wishlistController.d.ts.map