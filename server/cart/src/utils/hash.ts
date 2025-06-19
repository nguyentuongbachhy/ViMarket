import CryptoJS from 'crypto-js';

export class HashUtils {
    private static readonly HASH_ROUNDS = 5;

    /**
     * Hash user ID to create cache key
     * Sử dụng multiple rounds để tạo hash phức tạp hơn
    */
    static hashUserId(userId: string): string {
        let hash = userId;

        for (let i = 0; i < this.HASH_ROUNDS; i++) {
            hash = CryptoJS.SHA256(hash).toString(CryptoJS.enc.Hex);
        }

        // Lấy 16 ký tự đầu để làm cache key
        return `cart:${hash.substring(0, 16)}`;
    }

    /**
   * Generate session key for additional security
   */
    static generateSessionKey(userId: string, timestamp: number): string {
        const combined = `${userId}:${timestamp}`;
        return CryptoJS.HmacSHA256(combined, 'cart-session-secret').toString(CryptoJS.enc.Hex);
    }

    /**
     * Create distributed cache key for load balancing
     */
    static createDistributedKey(userId: string): string {
        const hash = this.hashUserId(userId);
        const bucket = parseInt(hash.slice(-2), 16) % 10; // 10 buckets (0-9)
        return `${hash}:bucket${bucket}`;
    }
}