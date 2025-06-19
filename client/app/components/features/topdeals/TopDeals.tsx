import React, { useEffect, useRef, useState } from 'react';
import { useHydrated } from '~/hooks/utils/useHydrated';
import { cn } from '~/lib/utils';
import { DealItem } from './components/DealItem';
import type { TopDealsProps } from './TopDeals.types';

const defaultDeals = [
    { id: '1', img_url: '/features/TopDeal.png', title: 'Top Deals', link_url: '/top-deals', color: 'red' },
    { id: '2', img_url: '/features/SalesAgents.png', title: 'Sales Agents', link_url: '/sales-agents', color: 'amber' },
    { id: '3', img_url: '/features/Coupon.png', title: 'Coupons', link_url: '/coupons', color: 'blue' },
    { id: '4', img_url: '/features/Sale.png', title: 'Sales', link_url: '/sales', color: 'yellow' },
    { id: '5', img_url: '/features/BeautyHealth.png', title: 'Beauty & Health', link_url: '/beauty-health', color: 'green' },
    { id: '6', img_url: '/features/Bestsellings.png', title: 'Best Sellings', link_url: '/best-sellings', color: 'indigo' },
    { id: '7', img_url: '/features/ValentineGifts.png', title: 'Valentine Gifts', link_url: '/valentine-gifts', color: 'red' },
    { id: '8', img_url: '/features/Traveling.png', title: 'Traveling', link_url: '/traveling', color: 'blue' },
    { id: '9', img_url: '/features/VitaminForBaby.png', title: 'Vitamin For Baby', link_url: '/vitamin-for-baby', color: 'yellow' },
];

export const TopDeals: React.FC<TopDealsProps> = ({
    deals = defaultDeals,
    showScrollbar = false,
    className,
    onDealClick,
}) => {
    const hydrated = useHydrated();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fixed: Sử dụng giá trị mặc định consistent (desktop) để tránh hydration mismatch
    const [visibleItems, setVisibleItems] = useState(6); // Desktop default
    const [itemWidth, setItemWidth] = useState("16.666%"); // Desktop default

    const [scrollProgress, setScrollProgress] = useState(0);
    const [contentWidth, setContentWidth] = useState(0);
    const [viewportWidth, setViewportWidth] = useState(0);

    // Fixed: Chỉ update responsive configuration sau khi hydrated
    useEffect(() => {
        if (!hydrated) return;

        const handleResize = () => {
            const width = window.innerWidth;

            if (width < 640) {
                setVisibleItems(6);
                setItemWidth("16.666%");
            } else if (width < 768) {
                setVisibleItems(7);
                setItemWidth("14.285%");
            } else {
                setVisibleItems(8);
                setItemWidth("12.5%");
            }

            // Update dimensions
            if (scrollRef.current) {
                setViewportWidth(scrollRef.current.clientWidth);
                setContentWidth(scrollRef.current.scrollWidth);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [hydrated]);

    // Touch scrolling functionality
    useEffect(() => {
        if (!hydrated) return;

        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let isDown = false;
        let startX: number;
        let scrollLeft: number;

        const handleStart = (e: MouseEvent | TouchEvent) => {
            isDown = true;
            scrollContainer.classList.add('cursor-grabbing');
            startX = 'touches' in e ? e.touches[0].pageX : e.pageX;
            scrollLeft = scrollContainer.scrollLeft;
        };

        const handleEnd = () => {
            isDown = false;
            scrollContainer.classList.remove('cursor-grabbing');
        };

        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!isDown) return;
            e.preventDefault();
            const x = 'touches' in e ? e.touches[0].pageX : e.pageX;
            const walk = (x - startX) * 2;
            scrollContainer.scrollLeft = scrollLeft - walk;
        };

        const handleScroll = () => {
            const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
            if (maxScrollLeft > 0) {
                const currentProgress = (scrollContainer.scrollLeft / maxScrollLeft) * 100;
                setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
            }
        };

        // Mouse events
        scrollContainer.addEventListener('mousedown', handleStart as EventListener);
        scrollContainer.addEventListener('mouseleave', handleEnd);
        scrollContainer.addEventListener('mouseup', handleEnd);
        scrollContainer.addEventListener('mousemove', handleMove as EventListener);

        // Touch events
        scrollContainer.addEventListener('touchstart', handleStart as EventListener);
        scrollContainer.addEventListener('touchend', handleEnd);
        scrollContainer.addEventListener('touchmove', handleMove as EventListener);

        // Scroll event
        scrollContainer.addEventListener('scroll', handleScroll);

        // Initial calculation
        setViewportWidth(scrollContainer.clientWidth);
        setContentWidth(scrollContainer.scrollWidth);

        return () => {
            scrollContainer.removeEventListener('mousedown', handleStart as EventListener);
            scrollContainer.removeEventListener('mouseleave', handleEnd);
            scrollContainer.removeEventListener('mouseup', handleEnd);
            scrollContainer.removeEventListener('mousemove', handleMove as EventListener);
            scrollContainer.removeEventListener('touchstart', handleStart as EventListener);
            scrollContainer.removeEventListener('touchend', handleEnd);
            scrollContainer.removeEventListener('touchmove', handleMove as EventListener);
            scrollContainer.removeEventListener('scroll', handleScroll);
        };
    }, [hydrated]);

    const needsScroll = contentWidth > viewportWidth;

    // Fixed: SSR fallback với layout consistent
    if (!hydrated) {
        return (
            <div className={cn("w-full overflow-hidden my-2", className)}>
                <div className="overflow-x-auto scrollbar-hide">
                    <ul className="flex" style={{ width: `${(deals.length / 6) * 100}%` }}>
                        {deals.map((deal) => (
                            <li
                                key={deal.id}
                                className="flex-none"
                                style={{ width: "16.666%" }} // Desktop default
                            >
                                <DealItem deal={deal} onClick={onDealClick} />
                            </li>
                        ))}
                    </ul>
                </div>
                <style>{`
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className={cn("w-full overflow-hidden my-2", className)}>
            {/* Scrollable Container */}
            <div
                ref={scrollRef}
                className={cn(
                    "overflow-x-auto cursor-grab",
                    !showScrollbar && "scrollbar-hide"
                )}
                style={{
                    msOverflowStyle: showScrollbar ? 'auto' : 'none',
                    scrollbarWidth: showScrollbar ? 'auto' : 'none',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                <style>{`
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                    .cursor-grabbing {
                        cursor: grabbing !important;
                    }
                `}</style>

                <ul
                    className="flex"
                    style={{ width: `${(deals.length / visibleItems) * 100}%` }}
                >
                    {deals.map((deal) => (
                        <li
                            key={deal.id}
                            className="flex-none"
                            style={{ width: itemWidth }}
                        >
                            <DealItem
                                deal={deal}
                                onClick={onDealClick}
                            />
                        </li>
                    ))}
                </ul>
            </div>

            {/* Progress Bar */}
            {needsScroll && (
                <div className="mt-3 px-1">
                    <div className="relative w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-100 ease-out"
                            style={{ width: `${scrollProgress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopDeals;