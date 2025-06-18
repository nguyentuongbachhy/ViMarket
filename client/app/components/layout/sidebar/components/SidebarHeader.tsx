import { X } from 'lucide-react';
import React from 'react';

interface SidebarHeaderProps {
    isCollapsed: boolean;
    isMobile: boolean;
    onClose?: () => void;
    title?: string;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
    isCollapsed,
    isMobile,
    onClose,
    title = "Danh Mục",
}) => {
    return (
        <div className="sticky top-0 z-10 p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center rounded-t-lg">
            {(!isCollapsed || isMobile) && (
                <h2 className="text-xl font-semibold text-white">{title}</h2>
            )}

            {/* Close button (mobile) */}
            {isMobile && onClose && (
                <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                    aria-label="Đóng menu"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};