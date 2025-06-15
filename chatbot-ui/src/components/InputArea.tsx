import React, { useState, type KeyboardEvent } from 'react';

interface InputAreaProps {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    disabled?: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({
    onSendMessage,
    isLoading,
    disabled = false
}) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim() && !isLoading && !disabled) {
            onSendMessage(message);
            setMessage('');
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickMessages = [
        'Tôi muốn mua laptop',
        'Xem giỏ hàng',
        'Sản phẩm bán chạy',
        'Laptop Dell dưới 20 triệu'
    ];

    return (
        <div className="bg-white border-t border-gray-200 p-4">
            {/* Quick Messages */}
            <div className="hidden sm:flex flex-wrap gap-2 mb-3">
                {quickMessages.map((msg, index) => (
                    <button
                        key={index}
                        className="
              px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 
              text-gray-600 rounded-full border border-gray-200 
              transition-colors duration-200 whitespace-nowrap
              disabled:opacity-50 disabled:cursor-not-allowed
            "
                        onClick={() => onSendMessage(msg)}
                        disabled={isLoading || disabled}
                    >
                        {msg}
                    </button>
                ))}
            </div>

            {/* Input Container */}
            <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nhập tin nhắn của bạn..."
                        disabled={isLoading || disabled}
                        rows={1}
                        className="
                            w-full px-4 py-3 rounded-2xl border border-gray-300 
                            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                            resize-none min-h-[48px] max-h-32
                            disabled:bg-gray-50 disabled:opacity-60
                            transition-all duration-200
                        "
                        style={{
                            height: 'auto',
                            minHeight: '48px',
                        }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                        }}
                    />
                </div>

                <button
                    onClick={handleSend}
                    disabled={!message.trim() || isLoading || disabled}
                    className="
                        w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 
                        text-white flex items-center justify-center
                        disabled:bg-gray-300 disabled:cursor-not-allowed
                        transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100
                        shadow-lg hover:shadow-xl disabled:shadow-md
                    "
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
};