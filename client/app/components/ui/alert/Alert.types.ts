export interface ErrorAlertProps {
    message: string;
    onRetry?: () => void;
    onDismiss?: () => void;
    type?: 'error' | 'warning' | 'info';
}
