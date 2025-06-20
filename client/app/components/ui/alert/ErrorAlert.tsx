import type { ErrorAlertProps } from './Alert.types';

export function ErrorAlert({
    message,
    onRetry,
    onDismiss,
    type = 'error'
}: ErrorAlertProps) {
    const typeConfig = {
        error: {
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            iconColor: 'text-red-400',
            textColor: 'text-red-800',
            buttonColor: 'bg-red-100 hover:bg-red-200 text-red-800',
            icon: (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            )
        },
        warning: {
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
            iconColor: 'text-yellow-400',
            textColor: 'text-yellow-800',
            buttonColor: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800',
            icon: (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            )
        },
        info: {
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            iconColor: 'text-blue-400',
            textColor: 'text-blue-800',
            buttonColor: 'bg-blue-100 hover:bg-blue-200 text-blue-800',
            icon: (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
            )
        }
    };

    const config = typeConfig[type];

    return (
        <div className={`rounded-md p-4 ${config.bgColor} ${config.borderColor} border`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    <div className={config.iconColor}>
                        {config.icon}
                    </div>
                </div>
                <div className="ml-3 flex-1">
                    <h3 className={`text-sm font-medium ${config.textColor}`}>
                        {type === 'error' ? 'Đã xảy ra lỗi' :
                            type === 'warning' ? 'Cảnh báo' : 'Thông báo'}
                    </h3>
                    <div className={`mt-2 text-sm ${config.textColor}`}>
                        <p>{message}</p>
                    </div>
                    {(onRetry || onDismiss) && (
                        <div className="mt-4">
                            <div className="-mx-2 -my-1.5 flex space-x-2">
                                {onRetry && (
                                    <button
                                        onClick={onRetry}
                                        className={`px-3 py-2 rounded-md text-sm font-medium ${config.buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600`}
                                    >
                                        Thử lại
                                    </button>
                                )}
                                {onDismiss && (
                                    <button
                                        onClick={onDismiss}
                                        className={`px-3 py-2 rounded-md text-sm font-medium ${config.buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600`}
                                    >
                                        Đóng
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}