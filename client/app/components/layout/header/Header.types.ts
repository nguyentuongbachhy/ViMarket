export interface NavItem {
    name: string;
    path: string;
    badge?: string;
    icon?: React.ReactNode;
}

export interface HeaderProps {
    isLogged?: boolean;
    navItems?: NavItem[];
    onSearch?: (query: string) => void;
    className?: string;
    sticky?: boolean;
    showQuickCheckout?: boolean;
}