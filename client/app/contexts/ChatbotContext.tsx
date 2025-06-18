import React, { createContext, useCallback, useContext, useState } from 'react';

interface ChatbotState {
    isOpen: boolean;
    mode: 'popup' | 'sidebar';
}

interface ChatbotContext extends ChatbotState {
    toggleChatbot: () => void;
    openChatbot: (mode?: 'popup' | 'sidebar') => void;
    closeChatbot: () => void;
    setMode: (mode: 'popup' | 'sidebar') => void;
}

const ChatbotContext = createContext<ChatbotContext | undefined>(undefined);

export const ChatbotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ChatbotState>({
        isOpen: false,
        mode: 'popup'
    });

    const toggleChatbot = useCallback(() => {
        setState(prev => ({
            ...prev,
            isOpen: !prev.isOpen
        }));
    }, []);

    const openChatbot = useCallback((newMode: 'popup' | 'sidebar' = 'popup') => {
        setState({
            isOpen: true,
            mode: newMode
        });
    }, []);

    const closeChatbot = useCallback(() => {
        setState(prev => ({
            ...prev,
            isOpen: false
        }));
    }, []);

    const setMode = useCallback((newMode: 'popup' | 'sidebar') => {
        setState(prev => ({
            ...prev,
            mode: newMode
        }));
    }, []);

    const contextValue: ChatbotContext = {
        ...state,
        toggleChatbot,
        openChatbot,
        closeChatbot,
        setMode
    };

    return (
        <ChatbotContext.Provider value={contextValue}>
            {children}
        </ChatbotContext.Provider>
    );
};

export const useChatbotLayout = () => {
    const context = useContext(ChatbotContext);
    if (context === undefined) {
        throw new Error('useChatbotLayout must be used within a ChatbotProvider');
    }
    return context;
};