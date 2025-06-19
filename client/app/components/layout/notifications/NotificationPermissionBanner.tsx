import { AlertTriangle, Bell, X } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '~/lib/utils';

interface NotificationPermissionBannerProps {
    // ✅ FIXED: Use correct types
    notificationSupported: boolean;
    permissionStatus: 'default' | 'granted' | 'denied';
    permissionError: string | null;
    isRequestingPermission: boolean;
    canRequestPermission: boolean;
    wasPermissionDenied: boolean;
    onRequestPermission: () => void;
    onDismiss?: () => void;
}

export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({
    notificationSupported,
    permissionStatus,
    permissionError,
    isRequestingPermission,
    canRequestPermission,
    wasPermissionDenied,
    onRequestPermission,
    onDismiss
}) => {
    const [isDismissed, setIsDismissed] = useState(false);

    const handleDismiss = () => {
        setIsDismissed(true);
        onDismiss?.();
    };

    // Don't show if dismissed or permission already granted
    if (isDismissed || permissionStatus === 'granted') {
        return null;
    }

    // Don't show if notifications not supported
    if (!notificationSupported) {
        return null;
    }

    const getBannerConfig = () => {
        if (permissionError) {
            return {
                type: 'error' as const,
                icon: AlertTriangle,
                title: 'Lỗi thông báo',
                message: permissionError,
                bgColor: 'bg-red-50 border-red-200',
                iconColor: 'text-red-500',
                textColor: 'text-red-800',
                buttonColor: 'bg-red-600 hover:bg-red-700',
                showAction: wasPermissionDenied,
                actionText: 'Hướng dẫn bật thông báo'
            };
        }

        if (wasPermissionDenied) {
            return {
                type: 'denied' as const,
                icon: AlertTriangle,
                title: 'Thông báo đã bị tắt',
                message: 'Vui lòng bật thông báo trong cài đặt trình duyệt để nhận thông báo mới.',
                bgColor: 'bg-yellow-50 border-yellow-200',
                iconColor: 'text-yellow-500',
                textColor: 'text-yellow-800',
                buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
                showAction: true,
                actionText: 'Hướng dẫn bật thông báo'
            };
        }

        return {
            type: 'request' as const,
            icon: Bell,
            title: 'Bật thông báo',
            message: 'Nhận thông báo về đơn hàng, khuyến mãi và cập nhật sản phẩm.',
            bgColor: 'bg-blue-50 border-blue-200',
            iconColor: 'text-blue-500',
            textColor: 'text-blue-800',
            buttonColor: 'bg-blue-600 hover:bg-blue-700',
            showAction: canRequestPermission,
            actionText: isRequestingPermission ? 'Đang yêu cầu...' : 'Bật thông báo'
        };
    };

    const config = getBannerConfig();

    const handleAction = () => {
        if (config.type === 'request' && canRequestPermission) {
            onRequestPermission();
        } else if (config.type === 'denied' || config.type === 'error') {
            // Show instructions modal or redirect to help page
            showNotificationInstructions();
        }
    };

    return (
        <div className={cn(
            "rounded-lg border p-4 mb-4 shadow-sm",
            config.bgColor
        )}>
            <div className="flex items-start space-x-3">
                <config.icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", config.iconColor)} />
                
                <div className="flex-1 min-w-0">
                    <h4 className={cn("text-sm font-medium", config.textColor)}>
                        {config.title}
                    </h4>
                    <p className={cn("text-sm mt-1", config.textColor, "opacity-90")}>
                        {config.message}
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    {config.showAction && (
                        <button
                            onClick={handleAction}
                            disabled={isRequestingPermission}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium text-white rounded transition-colors disabled:opacity-50",
                                config.buttonColor
                            )}
                        >
                            {config.actionText}
                        </button>
                    )}
                    
                    <button
                        onClick={handleDismiss}
                        className={cn("p-1 rounded hover:bg-black/5 transition-colors", config.iconColor)}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper function to show notification instructions
const showNotificationInstructions = () => {
    const instructions = `
Để bật thông báo:

Chrome/Edge:
1. Nhấp vào biểu tượng 🔒 bên trái thanh địa chỉ
2. Chọn "Thông báo" → "Cho phép"
3. Tải lại trang

Firefox:
1. Nhấp vào biểu tượng 🛡️ bên trái thanh địa chỉ
2. Chọn "Permissions" → "Notifications" → "Allow"
3. Tải lại trang

Safari:
1. Safari → Preferences → Websites → Notifications
2. Tìm website và chọn "Allow"
3. Tải lại trang
    `;

    if ('navigator' in window && 'clipboard' in navigator) {
        navigator.clipboard.writeText(instructions.trim());
    }

    alert(instructions);
};