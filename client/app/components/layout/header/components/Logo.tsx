import React from 'react';
import { Link } from 'react-router';
import { cn } from '~/lib/utils';

interface LogoProps {
    className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
    return (
        <Link to="/" className={cn("block", className)} >
            <p className="text-2xl sm:text-3xl font-bold text-white hover:text-gray-200 transition-colors" >
                E - Commerce
            </p>
        </Link>
    );
};