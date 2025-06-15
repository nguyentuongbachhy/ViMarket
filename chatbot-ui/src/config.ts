// src/config.ts
export const config = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
    APP_NAME: 'E-commerce Chatbot',
    VERSION: '1.0.0',
};