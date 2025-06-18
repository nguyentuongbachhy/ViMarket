import { ChevronDown } from 'lucide-react';
import React from 'react';
import { cn } from '~/lib/utils';
import { filterSectionVariants } from '../Sidebar.variants';

interface FilterSectionProps {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    className?: string;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
    title,
    isExpanded,
    onToggle,
    children,
    className
}) => {
    return (
        <div className={cn(filterSectionVariants({ expanded: isExpanded }), className)}>
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full text-left p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors group"
            >
                <h4 className="font-medium text-white group-hover:text-blue-300 transition-colors">{title}</h4>
                <ChevronDown
                    className={cn(
                        "w-5 h-5 text-slate-400 transition-all group-hover:text-blue-300",
                        isExpanded && "rotate-180"
                    )}
                />
            </button>

            {isExpanded && (
                <div className="mt-3 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
};