export interface Subcategory {
    id: string;
    name: string;
    url?: string;
    productCount?: number;
}

export interface SubcategorySidebarProps {
    subcategories: Subcategory[];
    selectedSubcategory: string | null;
    onSubcategoryChange: (subcategoryId: string | null) => void;
    className?: string;
}