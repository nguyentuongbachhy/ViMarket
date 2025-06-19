export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    isError?: boolean;
}

export interface ChatRequest {
    message: string;
    session_id: string;
    user_token?: string;
}

export interface ChatResponse {
    reply: string;
    suggested_url?: string;
}

export interface ChatStreamChunk {
    chunk: string;
    done?: boolean;
}

export interface SendMessageOptions {
    stream?: boolean;
    onChunk?: (chunk: string) => void;
    onComplete?: () => void;
    onError?: (error: string) => void;
}