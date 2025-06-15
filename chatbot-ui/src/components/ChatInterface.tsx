import React, { useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { Header } from './Header';
import { InputArea } from './InputArea';
import { MessageBubble } from './MessageBubble';

export const ChatInterface: React.FC = () => {
    const {
        messages,
        isLoading,
        error,
        sendMessage,
        clearChat,
        clearError,
    } = useChat();

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gray-50">
            <Header onClearChat={clearChat} />

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                {/* Welcome Message */}
                {messages.length === 0 && (
                    <div className="text-center py-12 px-4">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                                </svg>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Chào mừng đến với E-commerce Chatbot!
                            </h2>

                            <p className="text-gray-600 mb-4">
                                Tôi có thể giúp bạn tìm kiếm sản phẩm, quản lý giỏ hàng và đơn hàng.
                            </p>

                            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                                <p className="text-primary-700 text-sm">
                                    💡 Hãy thử hỏi: "Tôi muốn mua laptop Dell dưới 20 triệu"
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Messages */}
                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                ))}

                {/* Error Message */}
                {error && (
                    <div className="mx-4 mb-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 text-red-500 mt-0.5">
                                    <svg fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-red-800 font-medium">Có lỗi xảy ra</p>
                                    <p className="text-red-600 text-sm mt-1">{error}</p>
                                </div>
                            </div>

                            <button
                                onClick={clearError}
                                className="text-red-500 hover:text-red-700 transition-colors duration-200"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <InputArea
                onSendMessage={sendMessage}
                isLoading={isLoading}
            />
        </div>
    );
};