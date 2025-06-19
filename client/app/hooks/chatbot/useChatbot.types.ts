// ~/hooks/chatbot/useChatbot.types.ts
import type { Message } from '~/api/types';

export interface UseChatbotOptions {
    sessionId?: string;
    autoSave?: boolean;
    maxMessages?: number;
    enableStreaming?: boolean;
}

export interface UseChatbotReturn {
    // State
    messages: Message[];
    currentSessionId: string | null;
    isLoading: boolean;
    isStreaming: boolean;
    error: string | null;
    suggestedUrl: string | null;

    // Actions
    sendMessage: (message: string) => Promise<void>;
    createNewConversation: () => void;
    clearMessages: () => void;
    clearSession: () => Promise<void>;
    clearError: () => void;
    clearSuggestedUrl: () => void;
}