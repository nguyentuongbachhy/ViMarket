// ~/components/chatbot/Chatbot.types.ts
import type { Message } from '~/api/types';

export interface ChatbotProps {
    onSendMessage?: (message: string) => Promise<string>;
    initialMessages?: Message[];
    enableNotifications?: boolean;
    className?: string;
}