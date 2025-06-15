import { useCallback, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { chatAPI } from '../services/chatAPI';
import type { ChatMessage, ChatResponse, ChatState } from '../types/chat';
import { useAuth } from './useAuth';

export const useChat = () => {
    const { token } = useAuth();
    const [state, setState] = useState<ChatState>({
        messages: [],
        isLoading: false,
        error: null,
        sessionId: uuidv4(),
        userToken: '',
    });

    const currentBotMessageRef = useRef<string>('');
    const currentBotMessageIdRef = useRef<string>('');

    const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        const newMessage: ChatMessage = {
            id: uuidv4(),
            timestamp: new Date(),
            ...message,
        };

        setState(prev => ({
            ...prev,
            messages: [...prev.messages, newMessage],
        }));

        return newMessage.id;
    }, []);

    const updateBotMessage = useCallback((id: string, content: string) => {
        setState(prev => ({
            ...prev,
            messages: prev.messages.map(msg =>
                msg.id === id ? { ...msg, content } : msg
            ),
        }));
    }, []);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || state.isLoading || !token) return;

        // Add user message
        addMessage({ content: content.trim(), type: 'user' });

        // Set loading state
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Create bot message placeholder
        currentBotMessageRef.current = '';
        currentBotMessageIdRef.current = addMessage({ content: '', type: 'bot' });

        try {
            await chatAPI.sendMessage(
                {
                    message: content.trim(),
                    session_id: state.sessionId,
                    user_token: token,
                },
                // onChunk
                (chunk: string) => {
                    currentBotMessageRef.current += chunk;
                    updateBotMessage(currentBotMessageIdRef.current, currentBotMessageRef.current);
                },
                // onComplete
                (response: ChatResponse) => {
                    updateBotMessage(currentBotMessageIdRef.current, response.reply);

                    // Handle navigation suggestion
                    if (response.suggested_url) {
                        console.log('Suggested navigation:', response.suggested_url);
                        // In a real app, you would handle navigation here
                        setTimeout(() => {
                            alert(`Chatbot suggests navigating to: ${response.suggested_url}`);
                        }, 1000);
                    }

                    setState(prev => ({ ...prev, isLoading: false }));
                },
                // onError
                (error: string) => {
                    setState(prev => ({
                        ...prev,
                        isLoading: false,
                        error
                    }));

                    updateBotMessage(
                        currentBotMessageIdRef.current,
                        'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.'
                    );
                }
            );
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }));
        }
    }, [state.sessionId, state.isLoading, token, addMessage, updateBotMessage]);

    const clearChat = useCallback(async () => {
        await chatAPI.clearSession(state.sessionId);
        setState(prev => ({
            ...prev,
            messages: [],
            sessionId: uuidv4(),
        }));
    }, [state.sessionId]);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    return {
        messages: state.messages,
        isLoading: state.isLoading,
        error: state.error,
        sendMessage,
        clearChat,
        clearError,
    };
};