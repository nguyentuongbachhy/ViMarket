import axios from 'axios';
import type { ChatRequest, ChatResponse, StreamingChunk } from '../types/chat';

const API_BASE_URL = 'http://localhost:8000/api/v1';

class ChatAPI {
    private baseURL: string;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    async sendMessage(
        request: ChatRequest,
        onChunk: (chunk: string) => void,
        onComplete: (response: ChatResponse) => void,
        onError: (error: string) => void
    ): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body reader');
            }

            let accumulatedResponse = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6)) as StreamingChunk;

                            if (data.chunk) {
                                accumulatedResponse += data.chunk;
                                onChunk(data.chunk);
                            }

                            if (data.done) {
                                try {
                                    const finalResponse = JSON.parse(accumulatedResponse) as ChatResponse;
                                    onComplete(finalResponse);
                                } catch (e) {
                                    console.error('Error when sending message:', e)
                                    // If not valid JSON, treat as plain text
                                    onComplete({ reply: accumulatedResponse });
                                }
                                return;
                            }
                        } catch (e) {
                            console.warn('Error parsing streaming data:', e);
                        }
                    }
                }
            }
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }

    async clearSession(sessionId: string): Promise<void> {
        try {
            await axios.delete(`${this.baseURL}/chat/${sessionId}`);
        } catch (error) {
            console.error('Error clearing session:', error);
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            await axios.get(`${this.baseURL.replace('/api/v1', '')}/health`);
            return true;
        } catch {
            return false;
        }
    }
}

export const chatAPI = new ChatAPI();