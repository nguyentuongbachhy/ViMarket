// src/components/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'white' | 'gray';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    color = 'primary'
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    const colorClasses = {
        primary: 'border-primary-200 border-t-primary-500',
        white: 'border-white/30 border-t-white',
        gray: 'border-gray-200 border-t-gray-500'
    };

    return (
        <div className={`
      ${sizeClasses[size]} 
      border-2 ${colorClasses[color]} 
      rounded-full animate-spin
    `}></div>
    );
};