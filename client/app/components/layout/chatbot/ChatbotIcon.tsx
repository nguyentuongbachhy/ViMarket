import { Bot, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { useChatbotLayout } from '~/contexts/ChatbotContext';
import { useChatbot } from '~/hooks/chatbot/useChatbot';
import { cn } from '~/lib/utils';
import { chatAnimations } from './Chatbot.variants';

export const ChatbotIcon: React.FC = () => {
    const { isOpen, toggleChatbot, openChatbot, setMode, mode } = useChatbotLayout();
    const [isHovered, setIsHovered] = useState(false);

    // Get processing state for icon indicators
    const { isLoading, isStreaming, error } = useChatbot({
        enableStreaming: true,
        maxMessages: 50,
        autoSave: true
    });

    const isProcessing = isLoading || isStreaming;

    const handleIconClick = () => {
        if (isOpen) {
            // Nếu đang mở thì toggle mode
            if (mode === 'popup') {
                setMode('sidebar');
            } else {
                toggleChatbot();
            }
        } else {
            // Nếu đang đóng thì mở sidebar mode
            openChatbot('sidebar');
        }
    };

    return (
        <>
            <style>{chatAnimations}</style>
            <div className="fixed bottom-6 right-6 z-30">
                <div className="relative group">
                    <div
                        className={cn(
                            "w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl shadow-lg border border-blue-500/30 cursor-pointer transition-all duration-300 flex items-center justify-center",
                            isHovered && "shadow-xl shadow-blue-500/30 transform scale-105",
                            isOpen && "shadow-2xl shadow-blue-500/40 transform scale-110"
                        )}
                        onClick={handleIconClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {/* Animated background gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-2xl animate-pulse" />

                        {/* Main icon */}
                        <div className={cn(
                            "relative z-10 transition-all duration-300",
                            isHovered || isOpen ? "animate-float" : ""
                        )}>
                            <Bot className={cn(
                                "w-8 h-8 text-white transition-all duration-300",
                                isProcessing && "animate-spin"
                            )} />
                        </div>

                        {/* Status indicators */}
                        {isProcessing && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                            </div>
                        )}
                        {error && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                        )}

                        {/* Ripple effect on hover */}
                        <div className={cn(
                            "absolute inset-0 rounded-2xl transition-all duration-300",
                            isHovered && "bg-white/10 animate-ping"
                        )} />
                    </div>

                    {/* Floating label */}
                    <div className={cn(
                        "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 pointer-events-none transition-all duration-200",
                        isHovered && "opacity-100 translate-y-0",
                        !isHovered && "translate-y-2"
                    )}>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                            <span>AI Assistant</span>
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800" />
                    </div>
                </div>
            </div>
        </>
    );
};