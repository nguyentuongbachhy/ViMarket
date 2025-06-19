// ~/routes/layout.tsx
import { Suspense, lazy, useEffect, useState } from "react";
import { Outlet } from "react-router";
import { Header } from "~/components";
import { ClientOnly } from "~/components/shared/ClientOnly";
import { useChatbotLayout } from "~/contexts/ChatbotContext";
import { useSSRWindowSize } from "~/hooks/window/useWindowSize";

// Lazy load components
const ChatbotIcon = lazy(() => import("app/components/layout/chatbot/ChatbotIcon").then(m => ({ default: m.ChatbotIcon })));
const ChatbotContent = lazy(() => import("app/components/layout/chatbot/ChatbotContent").then(m => ({ default: m.ChatbotContent })));

export default function Layout() {
  const { isOpen, mode } = useChatbotLayout();
  const { width: windowWidth } = useSSRWindowSize();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto manage sidebar state based on chatbot and window size
  useEffect(() => {
    if (windowWidth < 768) {
      setSidebarCollapsed(true);
    } else if (isOpen && mode === 'sidebar') {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [windowWidth, isOpen, mode]);

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-slate-900">
      {/* Header */}
      <div className="w-full h-16 sm:h-20 flex-shrink-0 sticky top-0 z-40 bg-black shadow-md">
        <Header />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <main
          className={`
            transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden scrollbar-thin
            ${isOpen && mode === 'sidebar'
              ? 'w-2/3 border-r border-gray-700'
              : 'w-full'
            }
          `}
        >
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-slate-400 text-sm">Đang tải...</div>
              </div>
            </div>
          }>
            <Outlet context={{ sidebarCollapsed, setSidebarCollapsed }} />
          </Suspense>
        </main>

        {isOpen && mode === 'sidebar' && (
          <div className="w-1/3 bg-slate-900 border-l border-slate-700 flex flex-col shadow-2xl z-40">
            <ClientOnly>
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-slate-400 text-sm">Đang khởi tạo AI...</div>
                  </div>
                </div>
              }>
                <ChatbotContent mode="sidebar" />
              </Suspense>
            </ClientOnly>
          </div>
        )}
      </div>

      <ClientOnly>
        <Suspense fallback={
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl animate-pulse shadow-lg fixed bottom-6 right-6 z-50"></div>
        }>
          <ChatbotIcon />
        </Suspense>
      </ClientOnly>

      {mode === 'popup' && (
        <ClientOnly>
          <Suspense fallback={null}>
            <ChatbotContent mode="popup" />
          </Suspense>
        </ClientOnly>
      )}

      {/* Scrollbar styles */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #1e293b;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #475569, #64748b);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #64748b, #94a3b8);
        }
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #475569 #1e293b;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}