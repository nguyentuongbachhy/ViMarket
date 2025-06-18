import type { LoadingSpinnerProps } from './LoadingSpinner.types';

export function LoadingSpinner({
    size = 'medium',
    color = 'indigo',
    text
}: LoadingSpinnerProps) {
    const sizeClasses = {
        small: 'h-4 w-4',
        medium: 'h-8 w-8',
        large: 'h-12 w-12'
    };

    const colorClasses = {
        indigo: 'text-indigo-600',
        gray: 'text-gray-400',
        white: 'text-white'
    };

    return (
        <div className="flex flex-col items-center justify-center">
            <svg
                className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
            {text && (
                <p className={`mt-2 text-sm ${colorClasses[color]}`}>
                    {text}
                </p>
            )}
        </div>
    );
}

// Alternative inline spinner component
export function InlineSpinner({ size = 'small' }: { size?: 'small' | 'medium' }) {
    const sizeClasses = {
        small: 'h-4 w-4',
        medium: 'h-5 w-5'
    };

    return (
        <svg
            className={`animate-spin ${sizeClasses[size]} text-current`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}