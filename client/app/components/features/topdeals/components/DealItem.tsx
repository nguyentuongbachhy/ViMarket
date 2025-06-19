import React from 'react';
import { Link } from 'react-router';
import { cn } from '~/lib/utils';
import type { TopDealItem } from '../TopDeals.types';
import { dealImageVariants, dealItemVariants } from '../TopDeals.variants';

interface DealItemProps {
    deal: TopDealItem;
    size?: 'sm' | 'md' | 'lg';
    onClick?: (deal: TopDealItem) => void;
}

const colorMap = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#eab308',
    purple: '#8b5cf6',
    pink: '#ec4899',
    indigo: '#6366f1',
    amber: '#f59e0b',
};

export const DealItem: React.FC<DealItemProps> = ({
    deal,
    size = 'md',
    onClick
}) => {
    const getTextColor = (color: string) => {
        return colorMap[color as keyof typeof colorMap] || '#000000';
    };

    const handleClick = () => {
        onClick?.(deal);
    };

    return (
        <Link
            to={deal.link_url}
            className={dealItemVariants({ size })}
            onClick={handleClick}
        >
            <div className={dealImageVariants({ size })}>
                <img
                    src={deal.img_url}
                    alt={deal.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>
            <span
                className={cn(
                    "font-bold mt-1 sm:mt-2 overflow-hidden text-ellipsis whitespace-nowrap group-hover:opacity-85",
                    size === 'sm' && "text-xs",
                    size === 'md' && "text-xs sm:text-sm md:text-md",
                    size === 'lg' && "text-sm md:text-base"
                )}
                style={{ color: getTextColor(deal.color) }}
            >
                {deal.title}
            </span>
        </Link>
    );
};