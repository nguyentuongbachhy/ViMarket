import hljs from 'highlight.js';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import React, { useMemo } from 'react';
import type { Message } from '~/api/types';
import { cn } from '~/lib/utils';

import 'highlight.js/styles/github-dark.css';

interface ChatMessageProps {
    message: Message;
}

// Configure marked with syntax highlighting
const configureMarked = () => {
    return marked.use(
        markedHighlight({
            langPrefix: 'hljs language-',
            highlight(code, lang) {
                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                return hljs.highlight(code, { language }).value;
            }
        })
    );
};

// Configure marked options
const markedOptions = {
    breaks: true, // Enable line breaks
    gfm: true, // GitHub Flavored Markdown
    smartypants: true, // Smart quotes and dashes
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const isUser = message.sender === 'user';

    const formatTime = (timestamp: Date) => {
        return timestamp.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Memoize markdown parsing for performance
    const parsedContent = useMemo(() => {
        const markedInstance = configureMarked();
        markedInstance.setOptions(markedOptions);

        try {
            return markedInstance.parse(message.content);
        } catch (error) {
            console.error('Markdown parsing error:', error);
            return message.content; // Fallback to plain text
        }
    }, [message.content]);

    return (
        <div
            className={cn(
                "message mb-4 w-full flex animate-fade-in",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            <div
                className={cn(
                    "flex flex-col max-w-[85%] min-w-0",
                    isUser ? "items-end" : "items-start"
                )}
            >
                <div
                    className={cn(
                        "p-4 rounded-xl shadow-sm break-words transition-all duration-200",
                        isUser
                            ? "bg-gradient-to-br from-cyan-600 to-cyan-700 text-white rounded-br-sm hover:shadow-md"
                            : "bg-gray-700 text-gray-100 rounded-bl-sm border border-gray-600 hover:bg-gray-650 hover:shadow-md",
                        message.isError && "bg-gradient-to-br from-red-600 to-red-700 border-red-500"
                    )}
                >
                    <div
                        className={cn(
                            "markdown-content text-sm leading-relaxed break-words overflow-wrap-anywhere",
                            isUser ? "text-white" : "text-gray-100"
                        )}
                        dangerouslySetInnerHTML={{
                            __html: parsedContent
                        }}
                    />
                </div>

                <div className={cn(
                    "text-xs text-gray-400 mt-2 px-2 flex items-center gap-2",
                    isUser ? "text-right flex-row-reverse" : "text-left"
                )}>
                    <span>{formatTime(message.timestamp)}</span>
                    {message.isError && (
                        <span className="flex items-center text-red-400">
                            <span className="w-1 h-1 bg-red-400 rounded-full mr-1"></span>
                            Error
                        </span>
                    )}
                    {isUser && (
                        <span className="flex items-center text-cyan-400">
                            <span className="w-1 h-1 bg-cyan-400 rounded-full mr-1"></span>
                            Sent
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};