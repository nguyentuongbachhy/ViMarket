import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";
import type { SubcategorySidebarProps } from "./SubcategorySidebar.types";

export const SubcategorySidebar: React.FC<SubcategorySidebarProps> = ({
    subcategories,
    selectedSubcategory,
    onSubcategoryChange,
    className
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!subcategories || subcategories.length === 0) {
        return null;
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Danh mục con</h3>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>

            {/* Subcategories List */}
            {isExpanded && (
                <div className="space-y-2">
                    {/* All option */}
                    <button
                        onClick={() => onSubcategoryChange(null)}
                        className={cn(
                            "w-full text-left px-3 py-2 rounded transition-colors text-sm",
                            selectedSubcategory === null
                                ? "bg-blue-600 text-white"
                                : "text-gray-300 hover:bg-slate-700 hover:text-white"
                        )}
                    >
                        Tất cả
                    </button>

                    {/* Subcategory options */}
                    {subcategories.map((subcategory) => (
                        <button
                            key={subcategory.id}
                            onClick={() => onSubcategoryChange(subcategory.id)}
                            className={cn(
                                "w-full text-left px-3 py-2 rounded transition-colors text-sm",
                                selectedSubcategory === subcategory.id
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-300 hover:bg-slate-700 hover:text-white"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span>{subcategory.name}</span>
                                {subcategory.productCount && (
                                    <span className="text-xs text-gray-400">
                                        ({subcategory.productCount})
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SubcategorySidebar;