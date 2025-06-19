export * from './secureStorage';

// Helper functions
export const isValidState = (state: any): boolean => {
    return state && typeof state === 'object';
};

export const createAsyncThunkConfig = () => ({
    serializeError: (error: any) => ({
        message: error.message || 'Unknown error',
        code: error.code,
        status: error.status
    })
});