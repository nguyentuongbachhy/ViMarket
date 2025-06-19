import { Loader2, Minimize2, Plus, X } from 'lucide-react';
import React from 'react';

interface ChatHeaderProps {
    title?: string;
    onClose: () => void;
    onExpand?: () => void;
    onMinimize?: () => void;
    onNewConversation?: () => void;
    showExpand?: boolean;
    showMinimize?: boolean;
    isCreatingConversation?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    title = "💬 AI Assistant",
    onClose,
    onExpand,
    onMinimize,
    onNewConversation,
    showExpand = false,
    showMinimize = false,
    isCreatingConversation = false
}) => {
    return (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="text-white font-semibold text-lg">
                    {title}
                </h3>
            </div>

            <div className="flex items-center gap-2">
                {/* ✅ New Conversation Button với loading state */}
                {onNewConversation && (
                    <button
                        onClick={onNewConversation}
                        disabled={isCreatingConversation}
                        className={`
                            p-2 rounded-lg transition-all duration-200 group relative
                            ${isCreatingConversation
                                ? 'bg-blue-600/20 text-blue-400 cursor-not-allowed'
                                : 'hover:bg-slate-700 text-slate-300 hover:text-white'
                            }
                        `}
                        title={isCreatingConversation ? "Đang tạo hội thoại mới..." : "Tạo hội thoại mới"}
                    >
                        {isCreatingConversation ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                        )}
                    </button>
                )}

                {showExpand && onExpand && (
                    <button
                        onClick={onExpand}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white"
                        title="Mở rộng"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                    </button>
                )}

                {showMinimize && onMinimize && (
                    <button
                        onClick={onMinimize}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white"
                        title="Thu nhỏ"
                    >
                        <Minimize2 className="w-5 h-5" />
                    </button>
                )}

                <button
                    onClick={onClose}
                    className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-slate-300 hover:text-red-400"
                    title="Đóng"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};