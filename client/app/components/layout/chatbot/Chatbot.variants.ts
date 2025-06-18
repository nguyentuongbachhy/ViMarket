import { cva } from "class-variance-authority";

export const chatbotIconVariants = cva(
    "w-full flex flex-col bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-xl border border-slate-700",
    {
        variants: {
            state: {
                idle: "hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-300",
                hovered: "shadow-[0_12px_40px_rgba(59,130,246,0.3)] border-blue-500/50 transform scale-105",
                active: "shadow-[0_12px_40px_rgba(59,130,246,0.4)] border-blue-500 transform scale-105",
            }
        }
    }
);

export const iconButtonVariants = cva(
    "p-5 flex flex-col items-center cursor-pointer transition-all duration-300 relative overflow-hidden",
    {
        variants: {
            state: {
                default: "text-slate-300 hover:text-blue-300",
                hovered: "text-blue-400 transform scale-105",
                active: "text-blue-400 transform scale-105",
            }
        }
    }
);

export const chatPopupVariants = cva(
    "fixed right-6 bottom-32 z-50 w-96 max-w-[calc(100vw-2rem)] animate-slide-up",
    {
        variants: {
            theme: {
                light: "",
                dark: "",
            }
        }
    }
);

export const chatContainerVariants = cva(
    "bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl shadow-2xl border flex flex-col h-screen backdrop-blur-sm",
    {
        variants: {
            theme: {
                light: "border-slate-200 bg-white",
                dark: "border-slate-700/50 bg-slate-900/95",
            }
        },
        defaultVariants: {
            theme: "dark"
        }
    }
);

// Add CSS animations
export const chatAnimations = `
@keyframes slide-up {
    from { 
        opacity: 0;
        transform: translateY(20px) scale(0.95);
    }
    to { 
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes slide-down {
    from { 
        opacity: 0;
        transform: translateY(-20px);
    }
    to { 
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulse-glow {
    0%, 100% {
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
    }
    50% {
        box-shadow: 0 0 30px rgba(59, 130, 246, 0.6);
    }
}

@keyframes float {
    0%, 100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-4px);
    }
}

@keyframes progress-bar {
    0% {
        width: 100%;
    }
    100% {
        width: 0%;
    }
}

.animate-slide-up {
    animation: slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.animate-slide-down {
    animation: slide-down 0.3s ease-out;
}

.animate-pulse-glow {
    animation: pulse-glow 2s infinite;
}

.animate-float {
    animation: float 3s ease-in-out infinite;
}

.animate-progress {
    animation: progress-bar 3s linear forwards;
}

.glass-effect {
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(148, 163, 184, 0.1);
}
`;