// ~/api/services/chatService.ts
import { type AxiosResponse } from "axios";
import instance, { handleApiError } from "~/api/axios";
import type {
    ChatRequest,
    ChatResponse,
    ChatStreamChunk
} from '~/api/types';

const API_URL = import.meta.env.VITE_CHAT_URL || 'http://localhost:8000/api/v1';

// Generate UUID4
function generateUUID4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export class ChatService {
    /**
     * Generate a new session ID using UUID4
     */
    generateSessionId(): string {
        return generateUUID4();
    }

    /**
     * Send a regular chat message using the chatbot service API
     */
    async sendMessage(request: ChatRequest, token?: string): Promise<ChatResponse> {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            console.log('🚀 Sending message to chatbot service:', {
                url: `${API_URL}/chat`,
                payload: {
                    message: request.message,
                    session_id: request.session_id,
                    user_token: token
                }
            });

            const response: AxiosResponse = await instance.post(
                `/chat`,
                {
                    message: request.message,
                    session_id: request.session_id,
                    user_token: token
                },
                {
                    headers,
                    baseURL: API_URL
                }
            );

            console.log('✅ Chatbot service response:', response.data);

            return {
                reply: response.data.reply || '',
                suggested_url: response.data.suggested_url
            };
        } catch (error) {
            console.error('❌ Error in sendMessage:', error);
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Send streaming chat message using the chatbot service API
     */
    async sendMessageStream(
        request: ChatRequest,
        token: string | undefined,
        onChunk: (chunk: ChatStreamChunk) => void,
        onError?: (error: string) => void,
        onComplete?: () => void
    ): Promise<void> {
        const abortController = new AbortController();

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'text/plain',
                'Cache-Control': 'no-cache',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const payload = {
                message: request.message,
                session_id: request.session_id,
                user_token: token
            };

            console.log('🚀 Starting stream request to chatbot service:', {
                url: `${API_URL}/chat`,
                payload
            });

            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: abortController.signal
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ HTTP Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (!response.body) {
                throw new Error('No response body available');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        console.log('✅ Stream reading completed');
                        break;
                    }

                    // Decode chunk
                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;

                    // Process complete lines
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (trimmedLine === '') continue;

                        if (trimmedLine.startsWith('data: ')) {
                            try {
                                const jsonStr = trimmedLine.slice(6).trim();

                                if (jsonStr === '[DONE]') {
                                    console.log('🏁 Received [DONE] signal');
                                    onComplete?.();
                                    return;
                                }

                                const data = JSON.parse(jsonStr);

                                if (data.chunk) {
                                    onChunk({
                                        chunk: data.chunk,
                                        done: data.done || false
                                    });
                                }

                                if (data.done) {
                                    console.log('🏁 Stream completed');
                                    onComplete?.();
                                    return;
                                }

                            } catch (parseError) {
                                console.warn('⚠️ Failed to parse SSE data:', parseError, 'Line:', trimmedLine);
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
                onComplete?.();
            }

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('🛑 Stream aborted by user');
                return;
            }

            console.error('❌ Streaming error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
            onError?.(errorMessage);
        } finally {
            abortController.abort();
        }
    }

    /**
     * Clear chat session
     */
    async clearSession(sessionId: string, token?: string): Promise<void> {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            await instance.delete(`/chat/${sessionId}`, {
                headers,
                baseURL: API_URL
            });

            console.log('✅ Session cleared:', sessionId);
        } catch (error) {
            console.error('❌ Error clearing session:', error);
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Check API health
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL.replace('/api/v1', '')}/health`);
            return response.ok;
        } catch {
            return false;
        }
    }
}

export const chatService = new ChatService();
export default chatService;