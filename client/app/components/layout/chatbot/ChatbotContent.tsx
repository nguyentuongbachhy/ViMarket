// ~/components/layout/chatbot/ChatbotContent.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type { Message } from '~/api/types';
import { useChatbotLayout } from '~/contexts/ChatbotContext';
import { useChatbot } from '~/hooks/chatbot/useChatbot';
import { useHydrated } from '~/hooks/utils/useHydrated';
import { chatAnimations, chatContainerVariants, chatPopupVariants } from './Chatbot.variants';
import { ChatHeader } from './components/ChatHeader';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './components/ChatMessage';
import { SuggestedUrlBanner } from './components/SuggestedUrlBanner';
import { TypingIndicator } from './components/TypingIndicator';

const getStableTime = () => new Date();

const defaultWelcomeMessage: Message = {
    id: 'welcome_msg',
    sender: 'bot',
    content: `🎉 **Chào mừng bạn đến với ViMarket AI!**

Tôi là trợ lý thông minh được thiết kế để giúp bạn:

✨ **Tìm kiếm sản phẩm** - "Tìm điện thoại Samsung dưới 10 triệu"
📊 **So sánh giá cả** - "So sánh sản phẩm A và B"  
📈 **Phân tích xu hướng** - "Xu hướng giá laptop"
🎯 **Gợi ý mua sắm** - "Khi nào nên mua sản phẩm này?"

**Hãy bắt đầu bằng cách nhập câu hỏi của bạn!** 💬`,
    timestamp: getStableTime()
};

interface ChatbotContentProps {
    mode: 'popup' | 'sidebar';
    className?: string;
}

export const ChatbotContent: React.FC<ChatbotContentProps> = ({
    mode,
    className
}) => {
    const hydrated = useHydrated();
    const navigate = useNavigate();
    const { isOpen, closeChatbot, setMode, mode: currentMode } = useChatbotLayout();
    const [showWelcome, setShowWelcome] = useState(true);
    const [isCreatingConversation, setIsCreatingConversation] = useState(false);
    const chatBodyRef = useRef<HTMLDivElement>(null);

    // Use chatbot hook
    const {
        messages: apiMessages,
        isLoading,
        isStreaming,
        error,
        suggestedUrl,
        sendMessage,
        clearError,
        clearSuggestedUrl,
        createNewConversation
    } = useChatbot({
        enableStreaming: true,
        maxMessages: 50,
        autoSave: true
    });

    // Debug logging
    useEffect(() => {
        console.log('🤖 ChatbotContent rendered:', {
            mode,
            isOpen,
            currentMode,
            apiMessagesCount: apiMessages.length,
            showWelcome
        });
    }, [mode, isOpen, currentMode, apiMessages.length, showWelcome]);

    // Debug messages changes
    useEffect(() => {
        console.log('💬 Messages changed:', apiMessages.length, apiMessages);
    }, [apiMessages]);

    const messages = apiMessages.length > 0 ? apiMessages : (showWelcome ? [defaultWelcomeMessage] : []);

    // Handle navigation when suggested URL is available
    useEffect(() => {
        if (suggestedUrl) {
            console.log('🚀 Suggested URL received:', suggestedUrl);
            const timer = setTimeout(() => {
                if (suggestedUrl.startsWith('/')) {
                    navigate(suggestedUrl);
                    clearSuggestedUrl();
                } else if (suggestedUrl.startsWith('http')) {
                    window.open(suggestedUrl, '_blank');
                    clearSuggestedUrl();
                }
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [suggestedUrl, navigate, clearSuggestedUrl]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (chatBodyRef.current && isOpen) {
            const element = chatBodyRef.current;
            element.scrollTo({
                top: element.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isOpen, isStreaming]);

    // Hide welcome message after first user interaction
    useEffect(() => {
        if (apiMessages.length > 0) {
            console.log('👋 Hiding welcome message, API messages exist');
            setShowWelcome(false);
        }
    }, [apiMessages.length]);

    const handleSendMessage = async (content: string) => {
        if (!hydrated || !content.trim()) return;
        console.log('📤 Sending message:', content);
        setShowWelcome(false);
        await sendMessage(content);
    };

    const handleModeSwitch = (newMode: 'popup' | 'sidebar') => {
        console.log('🔄 Switching mode:', currentMode, '→', newMode);
        setMode(newMode);
    };

    const handleNavigateToUrl = () => {
        if (suggestedUrl) {
            if (suggestedUrl.startsWith('/')) {
                navigate(suggestedUrl);
            } else if (suggestedUrl.startsWith('http')) {
                window.open(suggestedUrl, '_blank');
            }
            clearSuggestedUrl();
        }
    };

    const handleNewConversation = async () => {
        console.log('🆕 Starting new conversation...');
        setIsCreatingConversation(true);

        try {
            await createNewConversation();
            setShowWelcome(true);
            console.log('✨ New conversation created successfully');
        } catch (error) {
            console.error('❌ Failed to create new conversation:', error);
        } finally {
            setIsCreatingConversation(false);
        }
    };

    const isProcessing = isLoading || isStreaming || isCreatingConversation;

    // Render popup mode
    if (mode === 'popup') {
        if (!isOpen || currentMode !== 'popup') return null;

        return (
            <>
                <style>{chatAnimations}</style>
                <div className={chatPopupVariants()}>
                    <div className={chatContainerVariants({ theme: "dark" })}>
                        <ChatHeader
                            onClose={closeChatbot}
                            onExpand={() => handleModeSwitch('sidebar')}
                            onNewConversation={handleNewConversation}
                            showExpand={true}
                            isCreatingConversation={isCreatingConversation} // ✅ Pass loading state
                        />

                        {error && (
                            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 text-sm flex items-center justify-between">
                                <span>⚠️ {error}</span>
                                <button
                                    onClick={clearError}
                                    className="text-white hover:text-red-200 ml-2 p-1 rounded-full hover:bg-red-800/30 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        {/* ✅ Show creating conversation indicator */}
                        {isCreatingConversation && (
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 text-sm flex items-center gap-3">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Đang tạo hội thoại mới...</span>
                            </div>
                        )}

                        {suggestedUrl && (
                            <SuggestedUrlBanner
                                url={suggestedUrl}
                                onNavigate={handleNavigateToUrl}
                                onDismiss={clearSuggestedUrl}
                            />
                        )}

                        <div
                            ref={chatBodyRef}
                            className="h-96 overflow-y-auto overflow-x-hidden p-6 bg-gradient-to-br from-slate-900 to-slate-950 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
                        >
                            {messages.map((message) => (
                                <ChatMessage key={message.id} message={message} />
                            ))}
                            {(isLoading || isStreaming) && <TypingIndicator />}
                        </div>

                        <div className="flex-shrink-0">
                            <ChatInput
                                onSend={handleSendMessage}
                                disabled={isProcessing}
                                placeholder={
                                    isCreatingConversation ? "🆕 Đang tạo hội thoại mới..." :
                                        isStreaming ? "🤖 Đang suy nghĩ..." :
                                            "💬 Nhập tin nhắn..."
                                }
                            />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Render sidebar mode
    if (mode === 'sidebar') {
        if (!isOpen || currentMode !== 'sidebar') return null;

        return (
            <div className='w-full h-screen'>
                <style>{chatAnimations}</style>
                <div className="flex-shrink-0">
                    <ChatHeader
                        onClose={closeChatbot}
                        onMinimize={() => handleModeSwitch('popup')}
                        onNewConversation={handleNewConversation}
                        showMinimize={true}
                        title="🤖 ViMarket AI Assistant"
                        isCreatingConversation={isCreatingConversation} // ✅ Pass loading state
                    />
                </div>

                {error && (
                    <div className="flex-shrink-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-4 text-sm flex items-center justify-between border-b border-red-500/30">
                        <span>⚠️ {error}</span>
                        <button
                            onClick={clearError}
                            className="text-white hover:text-red-200 ml-2 p-1 rounded-full hover:bg-red-800/30 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* ✅ Show creating conversation indicator */}
                {isCreatingConversation && (
                    <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 text-sm flex items-center gap-3 border-b border-blue-500/30">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang tạo hội thoại mới...</span>
                    </div>
                )}

                {suggestedUrl && (
                    <SuggestedUrlBanner
                        url={suggestedUrl}
                        onNavigate={handleNavigateToUrl}
                        onDismiss={clearSuggestedUrl}
                    />
                )}

                <div
                    ref={chatBodyRef}
                    className="h-[calc(100vh-18rem)] flex-1 overflow-y-auto overflow-x-hidden p-6 bg-gradient-to-br from-slate-900/50 to-slate-950/50 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
                >
                    {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                    ))}
                    {(isLoading || isStreaming) && <TypingIndicator />}
                </div>

                <div className="flex-shrink-0">
                    <ChatInput
                        onSend={handleSendMessage}
                        disabled={isProcessing}
                        placeholder={
                            isCreatingConversation ? "🆕 Đang tạo hội thoại mới..." :
                                isStreaming ? "🤖 Đang suy nghĩ..." :
                                    "💬 Hỏi AI assistant..."
                        }
                    />
                </div>
            </div>
        );
    }

    return null;
};