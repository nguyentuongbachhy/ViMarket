// ~/hooks/chatbot/useChatbot.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiUtils } from '~/api';
import type { Message } from '~/api/types';
import { useAppSelector } from "~/hooks/utils/reduxHooks";
import { useHydrated } from "~/hooks/utils/useHydrated";
import { selectToken } from "~/store/selectors/authSelectors";
import type { UseChatbotOptions, UseChatbotReturn } from "./useChatbot.types";

// Storage keys
const STORAGE_KEYS = {
    MESSAGES: 'chatbot-messages',
    SESSION_ID: 'chatbot-session-id',
    LAST_ACTIVITY: 'chatbot-last-activity'
} as const;

// Configuration
const CONFIG = {
    MAX_MESSAGES: 30,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
    AUTO_SAVE_DEBOUNCE: 200
} as const;

// Generate message ID
const generateMessageId = (): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Storage utilities
const StorageUtils = {
    get: <T>(key: string, defaultValue: T): T => {
        if (typeof window === 'undefined') return defaultValue;
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Failed to parse storage item ${key}:`, error);
            return defaultValue;
        }
    },

    set: (key: string, value: any): void => {
        if (typeof window === 'undefined') return;
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn(`Failed to set storage item ${key}:`, error);
        }
    },

    remove: (key: string): void => {
        if (typeof window === 'undefined') return;
        try {
            sessionStorage.removeItem(key);
        } catch (error) {
            console.warn(`Failed to remove storage item ${key}:`, error);
        }
    },

    isSessionExpired: (): boolean => {
        const lastActivity = StorageUtils.get(STORAGE_KEYS.LAST_ACTIVITY, 0);
        return Date.now() - lastActivity > CONFIG.SESSION_TIMEOUT;
    },

    updateActivity: (): void => {
        StorageUtils.set(STORAGE_KEYS.LAST_ACTIVITY, Date.now());
    }
};

export const useChatbot = (options: UseChatbotOptions = {}): UseChatbotReturn => {
    const {
        sessionId: initialSessionId,
        autoSave = true,
        maxMessages = CONFIG.MAX_MESSAGES,
        enableStreaming = true
    } = options;

    const hydrated = useHydrated();
    const token = useAppSelector(selectToken);

    // State
    const [messages, setMessages] = useState<Message[]>(() => {
        if (!hydrated) return [];
        if (StorageUtils.isSessionExpired()) {
            console.log('🧹 Session expired, clearing storage');
            StorageUtils.remove(STORAGE_KEYS.MESSAGES);
            StorageUtils.remove(STORAGE_KEYS.SESSION_ID);
            return [];
        }
        const savedMessages = StorageUtils.get(STORAGE_KEYS.MESSAGES, []);
        console.log('📥 Loaded messages from storage:', savedMessages.length);
        return savedMessages;
    });

    const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
        if (!hydrated) return initialSessionId || null;
        if (StorageUtils.isSessionExpired()) {
            StorageUtils.remove(STORAGE_KEYS.SESSION_ID);
            return null;
        }
        const savedSessionId = StorageUtils.get(STORAGE_KEYS.SESSION_ID, null);
        return savedSessionId || initialSessionId || null;
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestedUrl, setSuggestedUrl] = useState<string | null>(null);

    // Refs
    const streamingMessageRef = useRef<string>('');
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Immediate save function
    const saveMessagesImmediately = useCallback((messagesToSave: Message[]) => {
        if (!hydrated || !autoSave) return;

        try {
            const trimmedMessages = messagesToSave.slice(-maxMessages);
            StorageUtils.set(STORAGE_KEYS.MESSAGES, trimmedMessages);
            StorageUtils.updateActivity();
            console.log('💾 Saved messages immediately:', trimmedMessages.length);
        } catch (error) {
            console.error('❌ Failed to save messages immediately:', error);
        }
    }, [hydrated, autoSave, maxMessages]);

    // Debounced save function
    const saveMessagesDebounced = useCallback((messagesToSave: Message[]) => {
        if (!hydrated || !autoSave) return;

        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = setTimeout(() => {
            saveMessagesImmediately(messagesToSave);
        }, CONFIG.AUTO_SAVE_DEBOUNCE);
    }, [hydrated, autoSave, saveMessagesImmediately]);

    // Ensure session ID exists
    const ensureSessionId = useCallback(() => {
        if (!currentSessionId) {
            const newSessionId = api.chat.generateSessionId();
            setCurrentSessionId(newSessionId);
            StorageUtils.set(STORAGE_KEYS.SESSION_ID, newSessionId);
            console.log('🆕 Created new session:', newSessionId);
            return newSessionId;
        }
        return currentSessionId;
    }, [currentSessionId]);

    // Auto-save messages for debounce
    useEffect(() => {
        if (messages.length > 0) {
            saveMessagesDebounced(messages);
        }
    }, [messages, saveMessagesDebounced]);

    // Save immediately on unmount
    useEffect(() => {
        return () => {
            // Clear timeout và save ngay lập tức khi component unmount
            clearTimeout(autoSaveTimeoutRef.current);
            if (messages.length > 0) {
                saveMessagesImmediately(messages);
                console.log('🚪 Component unmounting, saved messages immediately');
            }
        };
    }, [messages, saveMessagesImmediately]);

    // Save immediately before page unloading
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (messages.length > 0) {
                saveMessagesImmediately(messages);
                console.log('🌐 Page unloading, saved messages immediately');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [messages, saveMessagesImmediately]);

    // Save session ID when it changes
    useEffect(() => {
        if (hydrated && currentSessionId) {
            StorageUtils.set(STORAGE_KEYS.SESSION_ID, currentSessionId);
            StorageUtils.updateActivity();
        }
    }, [currentSessionId, hydrated]);

    // Add message to state
    const addMessage = useCallback((message: Message) => {
        setMessages(prev => {
            const newMessages = [...prev, message];
            const trimmedMessages = newMessages.slice(-maxMessages);

            // Save immediately for critical actions
            saveMessagesImmediately(trimmedMessages);

            return trimmedMessages;
        });
    }, [maxMessages, saveMessagesImmediately]);

    // Update last message content (for streaming)
    const updateLastMessage = useCallback((content: string) => {
        setMessages(prev => {
            if (prev.length === 0) return prev;

            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];

            if (lastMessage.sender === 'bot') {
                updated[updated.length - 1] = {
                    ...lastMessage,
                    content
                };
            }

            return updated;
        });
    }, []);

    // Send message
    const sendMessage = useCallback(async (messageContent: string) => {
        if (!hydrated || !messageContent.trim()) return;

        setError(null);
        setSuggestedUrl(null);
        setIsLoading(!enableStreaming);
        setIsStreaming(enableStreaming);

        // Add user message
        const userMessage: Message = {
            id: generateMessageId(),
            sender: 'user',
            content: messageContent.trim(),
            timestamp: new Date()
        };
        addMessage(userMessage);

        try {
            const sessionId = ensureSessionId();

            if (enableStreaming) {
                // Add initial bot message for streaming
                const initialBotMessage: Message = {
                    id: generateMessageId(),
                    sender: 'bot',
                    content: '',
                    timestamp: new Date()
                };
                addMessage(initialBotMessage);
                streamingMessageRef.current = '';

                // Start streaming
                await api.chat.sendMessageStream(
                    {
                        message: messageContent.trim(),
                        session_id: sessionId,
                        user_token: token
                    },
                    token,
                    (chunk) => {
                        if (chunk.chunk) {
                            try {
                                const response = JSON.parse(chunk.chunk);
                                if (response.reply) {
                                    streamingMessageRef.current = response.reply;
                                    updateLastMessage(response.reply);
                                }
                                if (response.suggested_url) {
                                    setSuggestedUrl(response.suggested_url);
                                }
                            } catch {
                                streamingMessageRef.current += chunk.chunk;
                                updateLastMessage(streamingMessageRef.current);
                            }
                        }

                        if (chunk.done) {
                            setIsStreaming(false);
                            // ✅ Save immediately khi streaming hoàn thành
                            setMessages(prev => {
                                saveMessagesImmediately(prev);
                                return prev;
                            });
                        }
                    },
                    (error) => {
                        console.error('Stream error:', error);
                        setError(error);
                        setIsStreaming(false);
                        updateLastMessage('Xin lỗi, tôi gặp sự cố khi xử lý tin nhắn của bạn. Vui lòng thử lại sau.');
                    },
                    () => {
                        setIsStreaming(false);
                        // ✅ Save immediately khi streaming kết thúc
                        setMessages(prev => {
                            saveMessagesImmediately(prev);
                            return prev;
                        });
                    }
                );
            } else {
                // Regular message
                const response = await api.chat.sendMessage({
                    message: messageContent.trim(),
                    session_id: sessionId,
                    user_token: token
                }, token);

                const botMessage: Message = {
                    id: generateMessageId(),
                    sender: 'bot',
                    content: response.reply,
                    timestamp: new Date()
                };

                addMessage(botMessage);

                if (response.suggested_url) {
                    setSuggestedUrl(response.suggested_url);
                }
            }

        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);

            const errorBotMessage: Message = {
                id: generateMessageId(),
                sender: 'bot',
                content: 'Xin lỗi, tôi gặp sự cố khi xử lý tin nhắn của bạn. Vui lòng thử lại sau.',
                timestamp: new Date(),
                isError: true
            };

            if (enableStreaming && messages.length > 0) {
                updateLastMessage(errorBotMessage.content);
            } else {
                addMessage(errorBotMessage);
            }
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
        }
    }, [
        hydrated,
        enableStreaming,
        ensureSessionId,
        token,
        addMessage,
        updateLastMessage,
        messages.length,
        saveMessagesImmediately
    ]);

    // Create new conversation
    const createNewConversation = useCallback(async () => {
        console.log('🆕 Starting new conversation...');

        if (currentSessionId) {
            try {
                console.log('🧹 Clearing old session on server:', currentSessionId);
                if (token) {
                    await api.chat.clearSession(currentSessionId, token);
                    console.log('✅ Old session cleared on server');
                } else {
                    console.log('⚠️ No token, skipping server session clear');
                }
            } catch (error) {
                console.warn('⚠️ Failed to clear old session on server:', error);
            }
        }

        const newSessionId = api.chat.generateSessionId();
        console.log('🆔 Generated new session ID:', newSessionId);

        setCurrentSessionId(newSessionId);
        setMessages([]);
        setError(null);
        setSuggestedUrl(null);
        setIsLoading(false);
        setIsStreaming(false);

        StorageUtils.set(STORAGE_KEYS.SESSION_ID, newSessionId);
        StorageUtils.remove(STORAGE_KEYS.MESSAGES);
        StorageUtils.updateActivity();

        console.log('✨ New conversation created successfully');
    }, [currentSessionId, token]);

    // Clear messages
    const clearMessages = useCallback(() => {
        setMessages([]);
        setSuggestedUrl(null);
        StorageUtils.remove(STORAGE_KEYS.MESSAGES);
        console.log('🧹 Cleared messages');
    }, []);

    // Clear session
    const clearSession = useCallback(async () => {
        console.log('🧹 Clearing session...');

        if (currentSessionId) {
            try {
                if (token) {
                    console.log('🌐 Clearing session on server:', currentSessionId);
                    await api.chat.clearSession(currentSessionId, token);
                    console.log('✅ Session cleared on server');
                } else {
                    console.log('⚠️ No token, skipping server session clear');
                }
            } catch (error) {
                console.warn('⚠️ Failed to clear server session:', error);
            }
        }

        setCurrentSessionId(null);
        setMessages([]);
        setError(null);
        setSuggestedUrl(null);
        setIsLoading(false);
        setIsStreaming(false);

        StorageUtils.remove(STORAGE_KEYS.SESSION_ID);
        StorageUtils.remove(STORAGE_KEYS.MESSAGES);

        console.log('✨ Session cleared completely');
    }, [currentSessionId, token]);


    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Clear suggested URL
    const clearSuggestedUrl = useCallback(() => {
        setSuggestedUrl(null);
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            clearTimeout(autoSaveTimeoutRef.current);
        };
    }, []);

    return {
        messages,
        currentSessionId,
        isLoading,
        isStreaming,
        error,
        suggestedUrl,
        sendMessage,
        createNewConversation,
        clearMessages,
        clearSession,
        clearError,
        clearSuggestedUrl
    };
};