import { Bot } from 'lucide-react';
import React from 'react';

export const TypingIndicator: React.FC = () => {
    return (
        <div className="w-full flex justify-start mb-6 animate-fade-in">
            <div className="flex items-start max-w-[85%]">
                {/* Avatar */}
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mr-3 shadow-lg flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                </div>

                {/* Typing bubble */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl rounded-bl-md p-4 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-300 mr-2">AI đang suy nghĩ</span>
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s] shadow-lg shadow-blue-400/50" />
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s] shadow-lg shadow-purple-400/50" />
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-lg shadow-cyan-400/50" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};