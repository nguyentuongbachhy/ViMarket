import { Grid3x3, List } from 'lucide-react';
import React from 'react';
import { cn } from '~/lib/utils';
import type { ViewToggleProps } from './ViewToggle.types';

export const ViewToggle: React.FC<ViewToggleProps> = ({
    viewMode,
    onViewModeChange,
    className
}) => {
    return (
        <div className={cn("flex items-center space-x-1 bg-slate-700 rounded-lg p-1", className)}>
            <button
                onClick={() => onViewModeChange('grid')}
                className={cn(
                    "p-2 rounded-md transition-colors flex items-center justify-center",
                    viewMode === 'grid'
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-slate-600"
                )}
                title="Grid View"
            >
                <Grid3x3 size={18} />
            </button>
            <button
                onClick={() => onViewModeChange('list')}
                className={cn(
                    "p-2 rounded-md transition-colors flex items-center justify-center",
                    viewMode === 'list'
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-slate-600"
                )}
                title="List View"
            >
                <List size={18} />
            </button>
        </div>
    );
};

export default ViewToggle;