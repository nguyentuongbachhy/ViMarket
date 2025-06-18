export interface TopDealItem {
    id: string;
    img_url: string;
    title: string;
    link_url: string;
    color: string;
}

export interface TopDealsProps {
    deals?: TopDealItem[];
    visibleItems?: number;
    showScrollbar?: boolean;
    className?: string;
    onDealClick?: (deal: TopDealItem) => void;
}