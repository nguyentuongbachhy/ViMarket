import CryptoJS from 'crypto-js';

const { AES, HmacSHA512 } = CryptoJS;

class SecureStorage {
    private secretKey: string;
    private keyVersion: string;

    constructor(secretKey: string, keyVersion: string = 'v1') {
        this.secretKey = secretKey;
        this.keyVersion = keyVersion;
    }

    setItem(key: string, data: any): void {
        try {
            const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);

            // Add version info to detect key changes
            const dataWithVersion = {
                version: this.keyVersion,
                data: dataStr,
                timestamp: Date.now()
            };

            const encryptedData = AES.encrypt(JSON.stringify(dataWithVersion), this.secretKey).toString();
            localStorage.setItem(key, encryptedData);

        } catch (error) {
            console.error('Error encrypting and saving data to localStorage:', error);
            throw error;
        }
    }

    getItem<T>(key: string, defaultValue: T | null = null): T | null {
        try {
            const encryptedData = localStorage.getItem(key);

            if (!encryptedData) {
                return defaultValue;
            }

            // Try to decrypt
            let decryptedData: string;
            try {
                const bytes = AES.decrypt(encryptedData, this.secretKey);
                decryptedData = bytes.toString(CryptoJS.enc.Utf8);
            } catch (decryptError) {
                console.warn('Failed to decrypt data, possibly due to key change. Clearing corrupted data.');
                this.removeItem(key);
                return defaultValue;
            }

            if (!decryptedData) {
                console.warn('Decrypted data is empty. Clearing corrupted data.');
                this.removeItem(key);
                return defaultValue;
            }

            // Try to parse the decrypted data
            let parsedData: any;
            try {
                parsedData = JSON.parse(decryptedData);
            } catch (parseError) {
                // If can't parse as JSON with version, try parsing directly (backward compatibility)
                try {
                    return JSON.parse(decryptedData) as T;
                } catch (directParseError) {
                    console.warn('Failed to parse decrypted data. Clearing corrupted data.');
                    this.removeItem(key);
                    return defaultValue;
                }
            }

            // Check version compatibility
            if (parsedData.version && parsedData.version !== this.keyVersion) {
                console.warn(`Key version mismatch. Expected: ${this.keyVersion}, Found: ${parsedData.version}. Clearing old data.`);
                this.removeItem(key);
                return defaultValue;
            }

            // Extract actual data
            const actualData = parsedData.data || parsedData;

            try {
                return JSON.parse(actualData) as T;
            } catch (finalParseError) {
                // If it's not JSON, return as string
                return actualData as T;
            }

        } catch (error) {
            console.error('Error getting and decrypting data:', error);
            // Clear corrupted data
            this.removeItem(key);
            return defaultValue;
        }
    }

    removeItem(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing item from localStorage:', error);
        }
    }

    clear(): void {
        try {
            // Only clear auth-related items to avoid affecting other app data
            const authKeys = ['auth_data', 'auth_basic'];
            authKeys.forEach(key => {
                localStorage.removeItem(key);
            });
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    }

    // Method to check if data exists and is valid
    isValidData(key: string): boolean {
        try {
            const encryptedData = localStorage.getItem(key);
            if (!encryptedData) return false;

            const bytes = AES.decrypt(encryptedData, this.secretKey);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedData) return false;

            JSON.parse(decryptedData);
            return true;
        } catch (error) {
            return false;
        }
    }
}

export const generateSecretKey = (userId: string, appSecret: string): string => {
    // Use a more stable approach that doesn't rely on navigator.userAgent
    // which can change and cause decryption issues
    const stableIdentifier = `${userId}:${appSecret}`;

    // Add a consistent machine identifier that's more stable than userAgent
    let machineId = '';
    try {
        // Try to get a more stable identifier
        machineId = localStorage.getItem('machine_id') || '';
        if (!machineId) {
            // Generate a stable machine ID once and store it
            machineId = CryptoJS.lib.WordArray.random(16).toString();
            localStorage.setItem('machine_id', machineId);
        }
    } catch (error) {
        // Fallback to a simple timestamp-based approach
        machineId = 'fallback_' + Date.now().toString();
    }

    return HmacSHA512(`${stableIdentifier}:${machineId}`, appSecret).toString();
};

export const createSecureStorage = (secretKey: string, keyVersion?: string): SecureStorage => {
    return new SecureStorage(secretKey, keyVersion);
};

// Utility function to handle storage migration
export const migrateSecureStorage = (userId: string, appSecret: string): void => {
    try {
        const oldKey = HmacSHA512(`${userId}:${appSecret}:${navigator.userAgent}`, appSecret).toString();
        const newKey = generateSecretKey(userId, appSecret);

        if (oldKey === newKey) return; // No migration needed

        const oldStorage = new SecureStorage(oldKey);
        const newStorage = createSecureStorage(newKey);

        // Try to migrate auth_data
        const authData = oldStorage.getItem('auth_data');
        if (authData) {
            newStorage.setItem('auth_data', authData);
            oldStorage.removeItem('auth_data');
            console.log('Successfully migrated auth data to new key format');
        }
    } catch (error) {
        console.warn('Failed to migrate storage, clearing old data:', error);
        // Clear potentially corrupted data
        localStorage.removeItem('auth_data');
    }
};

export default SecureStorage;