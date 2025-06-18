import { Send } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { cn } from '~/lib/utils';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    onSend,
    disabled = false,
    placeholder = "💬 Nhập tin nhắn...",
}) => {
    const [inputValue, setInputValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        if (!inputValue.trim() || disabled) return;
        onSend(inputValue.trim());
        setInputValue('');

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const target = e.target as HTMLTextAreaElement;
        setInputValue(target.value);

        // Auto-resize textarea
        target.style.height = 'auto';
        const scrollHeight = target.scrollHeight;
        const maxHeight = 120; // Max 4-5 lines
        target.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    };

    return (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-t border-slate-700/50 backdrop-blur-sm">
            {/* Input area */}
            <div className="p-4 flex items-end gap-3">
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        placeholder={placeholder}
                        value={inputValue}
                        onChange={handleInput}
                        onKeyPress={handleKeyPress}
                        disabled={disabled}
                        rows={1}
                        className={cn(
                            "w-full p-4 pr-14 rounded-xl text-sm transition-all duration-200 resize-none",
                            "bg-slate-800/50 border border-slate-600 text-slate-100 placeholder-slate-400",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                            "disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed",
                            "backdrop-blur-sm",
                            // Ngăn chặn scroll
                            "overflow-hidden"
                        )}
                        style={{
                            minHeight: '52px',
                            maxHeight: '120px',
                            height: 'auto'
                        }}
                        autoComplete="off"
                        spellCheck="false"
                    />

                    {/* Send button */}
                    <button
                        onClick={handleSend}
                        disabled={disabled || !inputValue.trim()}
                        className={cn(
                            "absolute right-3 bottom-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                            inputValue.trim() && !disabled
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 active:scale-95 shadow-lg hover:shadow-xl"
                                : "bg-slate-700 text-slate-500 cursor-not-allowed"
                        )}
                        title="Gửi tin nhắn (Enter)"
                    >
                        <Send className={cn(
                            "w-5 h-5 transition-transform",
                            inputValue.trim() && !disabled && "group-hover:translate-x-0.5"
                        )} />
                    </button>
                </div>
            </div>

            {/* Quick actions (optional) */}
            <div className="px-4 pb-4">
                <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>💡 Hỏi về sản phẩm, giá cả, xu hướng...</span>
                    <span className="text-slate-600">Enter để gửi</span>
                </div>
            </div>
        </div>
    );
};