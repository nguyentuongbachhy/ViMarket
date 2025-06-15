import React from 'react';
import type { ChatMessage } from '../types/chat';

interface MessageBubbleProps {
    message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isUser = message.type === 'user';

    return (
        <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`
                max-w-[70%] px-4 py-3 rounded-2xl shadow-sm relative
                ${isUser
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                }
            `}>
                <div className="whitespace-pre-wrap break-words leading-relaxed">
                    {message.content}
                </div>
                <div className={`
                    text-xs mt-1 opacity-70
                    ${isUser ? 'text-right' : 'text-left'}
                `}>
                    {formatTime(message.timestamp)}
                </div>
            </div>
        </div>
    );
};