export declare class HashUtils {
    private static readonly HASH_ROUNDS;
    static hashUserId(userId: string): string;
    static generateSessionKey(userId: string, timestamp: number): string;
    static createDistributedKey(userId: string): string;
}
//# sourceMappingURL=hash.d.ts.map