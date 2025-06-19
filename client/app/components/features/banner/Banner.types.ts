export interface BannerItem {
    id: number;
    src: string;
    alt: string;
    link?: string;
}

export interface BannerProps {
    banners?: BannerItem[];
    autoSlide?: boolean;
    autoSlideInterval?: number;
    showNavigation?: boolean;
    showDots?: boolean;
    className?: string;
    height?: 'sm' | 'md' | 'lg' | 'xl';
}