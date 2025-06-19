import React from 'react';
import { Link } from 'react-router';
import { cn } from '~/lib/utils';
import type { Category } from '../Sidebar.types';
import { categoryItemVariants } from '../Sidebar.variants';

interface CategoryListProps {
    categories: Category[];
    activeCategory: string;
    isCollapsed: boolean;
    isMobile: boolean;
    onCategorySelect: (category: Category) => void;
    onMobileCategorySelect?: () => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
    categories,
    activeCategory,
    isCollapsed,
    isMobile,
    onCategorySelect,
    onMobileCategorySelect,
}) => {
    const handleCategoryClick = (category: Category) => {
        onCategorySelect(category);
        if (isMobile) {
            onMobileCategorySelect?.();
        }
    };

    return (
        <div className="p-2">
            {categories.map((category) => {
                const IconComponent = category.icon;
                const isActive = activeCategory === category.category;

                return (
                    <Link
                        key={category.category}
                        to={`/category/${category.category}`}
                        state={{ categoryName: category.name }}
                        className={categoryItemVariants({ active: isActive })}
                        onClick={() => handleCategoryClick(category)}
                    >
                        <IconComponent
                            className={cn(
                                "w-5 h-5",
                                isCollapsed && !isMobile ? "mx-auto" : "mr-3"
                            )}
                        />
                        {(!isCollapsed || isMobile) && (
                            <span className="text-sm font-medium truncate">
                                {category.name}
                            </span>
                        )}
                    </Link>
                );
            })}
        </div>
    );
};
