// src/types/chat.ts
export interface ChatMessage {
    id: string;
    content: string;
    type: 'user' | 'bot';
    timestamp: Date;
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

export interface StreamingChunk {
    chunk?: string;
    done?: boolean;
}

export interface ChatState {
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    sessionId: string;
    userToken: string;
}