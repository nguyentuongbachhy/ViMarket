import { ChevronDown, Filter, RefreshCw, RotateCcw, Sliders, Wifi, WifiOff } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { useCategories } from '~/hooks/category/useCategories';
import { cn } from '~/lib/utils';
import type { BrandOption, InventoryStatusOption, LayoutContext, PriceRangeOption, SidebarProps } from './Sidebar.types';
import { sidebarVariants, tabVariants } from './Sidebar.variants';
import { CategoryList } from './components/CategoryList';
import { FilterSection } from './components/FilterSection';
import { SidebarHeader } from './components/SidebarHeader';

// Breakpoints
const TABLET_BREAKPOINT = 768;
const DESKTOP_BREAKPOINT = 1024;

// Mock data - Replace with real data from your API
const BRAND_OPTIONS: BrandOption[] = [
    { id: '1', name: 'Apple', count: 45 },
    { id: '2', name: 'Samsung', count: 67 },
    { id: '3', name: 'Sony', count: 23 },
    { id: '4', name: 'Xiaomi', count: 34 },
    { id: '5', name: 'LG', count: 28 },
    { id: '6', name: 'Huawei', count: 19 },
    { id: '7', name: 'Oppo', count: 15 },
    { id: '8', name: 'Vivo', count: 12 },
];

const PRICE_RANGES: PriceRangeOption[] = [
    { label: 'Dưới 1 triệu', min: 0, max: 1000000 },
    { label: '1 - 5 triệu', min: 1000000, max: 5000000 },
    { label: '5 - 10 triệu', min: 5000000, max: 10000000 },
    { label: '10 - 20 triệu', min: 10000000, max: 20000000 },
    { label: 'Trên 20 triệu', min: 20000000 },
];

const INVENTORY_STATUS_OPTIONS: InventoryStatusOption[] = [
    { value: 'available', label: 'Còn hàng' },
    { value: 'out_of_stock', label: 'Hết hàng' },
    { value: 'upcoming', label: 'Sắp có hàng' },
];

export const Sidebar: React.FC<SidebarProps> = ({
    windowWidth,
    menuOpen,
    setMenuOpen,
    currentFilters = {},
    onCategorySelect,
    onFilterChange,
    onClearFilters,
    showFilters = true,
    showCategories = true,
    className,
}) => {
    // Get sidebar state from layout context
    const layoutContext = useOutletContext<LayoutContext>();
    const { sidebarCollapsed = false } = layoutContext || {};

    // Use the categories hook to fetch data from API
    const {
        categories,
        loading: categoriesLoading,
        error: categoriesError,
        refetch: refetchCategories,
        clearError
    } = useCategories({
        enableCache: true,
        cacheTime: 10 * 60 * 1000,
    });

    // Local UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('');
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [activeTab, setActiveTab] = useState<'categories' | 'filters'>('categories');
    const [expandedSections, setExpandedSections] = useState({
        price: true,
        category: true,
        brand: true,
        rating: true,
        inventory: true,
    });

    // Local filter state for UI
    const [localPriceRange, setLocalPriceRange] = useState({
        min: currentFilters.minPrice || 0,
        max: currentFilters.maxPrice || 0,
    });

    // Determine responsive states
    const isMobile = windowWidth < TABLET_BREAKPOINT;
    const isTablet = windowWidth >= TABLET_BREAKPOINT && windowWidth < DESKTOP_BREAKPOINT;
    const isDesktop = windowWidth >= DESKTOP_BREAKPOINT;

    // Determine if sidebar should be collapsed
    const isCollapsed = useMemo(() => {
        if (isMobile) return true;
        return sidebarCollapsed;
    }, [isMobile, sidebarCollapsed]);

    // Sync local price range with props
    useEffect(() => {
        setLocalPriceRange({
            min: currentFilters.minPrice || 0,
            max: currentFilters.maxPrice || 0,
        });
    }, [currentFilters.minPrice, currentFilters.maxPrice]);

    // Filter categories based on search term
    const filteredCategories = useMemo(() =>
        categories.filter(cat =>
            cat.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [categories, searchTerm]
    );

    // Display categories with show more/less functionality
    const displayCategories = useMemo(() =>
        showAllCategories ? filteredCategories : filteredCategories.slice(0, 10),
        [showAllCategories, filteredCategories]
    );

    // Handle category selection
    const handleCategorySelect = useCallback((category: any) => {
        setActiveCategory(category.category);
        onCategorySelect?.(category);

        // Close mobile menu after selection
        if (isMobile) {
            setMenuOpen(false);
        }
    }, [onCategorySelect, isMobile, setMenuOpen]);

    // Handle retry when categories fail to load
    const handleRetryCategories = useCallback(async () => {
        clearError();
        await refetchCategories();
    }, [clearError, refetchCategories]);

    // Filter handlers
    const toggleSection = useCallback((section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    }, []);

    const handlePriceRangeSelect = useCallback((range: PriceRangeOption) => {
        const filters = {
            min: range.min,
            max: range.max,
        };
        setLocalPriceRange({
            min: filters.min,
            max: filters.max ?? 0,
        });
        onFilterChange?.({
            minPrice: range.min,
            maxPrice: range.max,
        });
    }, [onFilterChange]);

    const handleCustomPriceFilter = useCallback(() => {
        const filters = {
            minPrice: localPriceRange.min > 0 ? localPriceRange.min : undefined,
            maxPrice: localPriceRange.max > 0 ? localPriceRange.max : undefined,
        };
        onFilterChange?.(filters);
    }, [localPriceRange, onFilterChange]);

    const handleBrandToggle = useCallback((brandName: string) => {
        const currentBrandNames = currentFilters.brandNames || [];
        const newBrandNames = currentBrandNames.includes(brandName)
            ? currentBrandNames.filter(name => name !== brandName)
            : [...currentBrandNames, brandName];

        onFilterChange?.({
            brandNames: newBrandNames.length > 0 ? newBrandNames : undefined,
        });
    }, [currentFilters.brandNames, onFilterChange]);

    const handleRatingFilter = useCallback((rating: number) => {
        onFilterChange?.({
            minRating: rating,
        });
    }, [onFilterChange]);

    const handleInventoryStatusFilter = useCallback((status: string) => {
        onFilterChange?.({
            inventoryStatus: currentFilters.inventoryStatus === status ? undefined : status,
        });
    }, [currentFilters.inventoryStatus, onFilterChange]);

    const handleClearAllFilters = useCallback(() => {
        setLocalPriceRange({ min: 0, max: 0 });
        onClearFilters?.();
    }, [onClearFilters]);

    // Check if there are active filters
    const hasActiveFilters = useMemo(() => !!(
        currentFilters.categoryIds?.length ||
        currentFilters.brandIds?.length ||
        currentFilters.brandNames?.length ||
        currentFilters.minPrice ||
        currentFilters.maxPrice ||
        currentFilters.minRating ||
        currentFilters.maxRating ||
        currentFilters.inventoryStatus
    ), [currentFilters]);

    // Don't render on mobile if not open
    const shouldShowSidebar = !isMobile || menuOpen;
    if (!shouldShowSidebar) {
        return null;
    }

    // Determine sidebar state
    const getSidebarState = () => {
        if (isMobile) return 'mobile';
        if (isCollapsed) return 'collapsed';
        return 'expanded';
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
                    onClick={() => setMenuOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div
                className={cn(
                    sidebarVariants({ state: getSidebarState() }),
                    !isMobile && "sticky self-start top-0",
                    isMobile && menuOpen && "animate-slide-in-left",
                    className
                )}
            >
                {/* Header */}
                <SidebarHeader
                    isCollapsed={isCollapsed}
                    isMobile={isMobile}
                    onClose={() => setMenuOpen(false)}
                />

                {/* Tab Navigation */}
                {(!isCollapsed || isMobile) && showCategories && showFilters && (
                    <div className="p-4 border-b border-slate-700/50">
                        <div className="flex bg-slate-800/50 rounded-xl p-1 backdrop-blur-sm">
                            <button
                                onClick={() => setActiveTab('categories')}
                                className={tabVariants({ active: activeTab === 'categories' })}
                            >
                                <span>Danh mục</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('filters')}
                                className={tabVariants({ active: activeTab === 'filters' })}
                            >
                                <Sliders className="w-4 h-4" />
                                <span>Bộ lọc</span>
                                {hasActiveFilters && (
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {categoriesError && (!isCollapsed || isMobile) && showCategories && (
                    <div className="p-4 bg-red-900/20 border-l-4 border-red-500 text-red-300 mx-4 rounded-r-lg">
                        <div className="flex items-start">
                            <WifiOff className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Không thể tải danh mục</p>
                                <p className="text-xs mt-1 opacity-75">{categoriesError}</p>
                                <button
                                    onClick={handleRetryCategories}
                                    className="text-xs mt-2 flex items-center text-red-200 hover:text-red-100 underline transition-colors"
                                    disabled={categoriesLoading}
                                >
                                    <RefreshCw className={cn("w-3 h-3 mr-1", categoriesLoading && "animate-spin")} />
                                    Thử lại
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Connection Status (when collapsed) */}
                {isCollapsed && !isMobile && showCategories && (
                    <div className="p-2 flex justify-center">
                        {categoriesError ? (
                            <span title="Kết nối lỗi - Click để thử lại">
                                <WifiOff
                                    className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-400 transition-colors"
                                    onClick={handleRetryCategories}
                                />
                            </span>
                        ) : (
                            <span title="Đã kết nối">
                                <Wifi className="w-5 h-5 text-green-500" />
                            </span>
                        )}
                    </div>
                )}

                {/* Content Area */}
                <div
                    className="overflow-y-auto scrollbar-hide flex-1"
                    style={{
                        height: isCollapsed && !isMobile
                            ? 'calc(100vh - 120px)'
                            : 'calc(100vh - 200px)'
                    }}
                >
                    {/* Categories Tab */}
                    {(activeTab === 'categories' || isCollapsed || !showFilters) && showCategories && (
                        <>
                            {/* Search Filter for Categories */}
                            {(!isCollapsed || isMobile) && (
                                <div className="p-4 border-b border-slate-700/50">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Tìm danh mục..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            disabled={categoriesLoading}
                                            className="w-full px-4 py-3 pl-10 pr-8 rounded-xl bg-slate-800/50 border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-white placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                                        />
                                        <Filter className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                                    </div>
                                </div>
                            )}

                            {/* Loading State */}
                            {categoriesLoading && (!isCollapsed || isMobile) && (
                                <div className="p-4 space-y-2">
                                    <div className="flex items-center justify-center">
                                        <RefreshCw className="w-5 h-5 animate-spin text-blue-500 mr-2" />
                                        <span className="text-sm text-slate-400">Đang tải danh mục...</span>
                                    </div>
                                    {/* Loading skeleton */}
                                    {[...Array(8)].map((_, index) => (
                                        <div key={index} className="flex items-center p-3 rounded-xl animate-pulse">
                                            <div className="w-5 h-5 bg-slate-700 rounded mr-3" />
                                            <div className="flex-1 h-4 bg-slate-700 rounded" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Categories List */}
                            {!categoriesLoading && (
                                <CategoryList
                                    categories={displayCategories}
                                    activeCategory={activeCategory}
                                    isCollapsed={isCollapsed}
                                    isMobile={isMobile}
                                    onCategorySelect={handleCategorySelect}
                                />
                            )}

                            {/* Show More/Less Button */}
                            {(!isCollapsed || isMobile) && !categoriesLoading && filteredCategories.length > 10 && (
                                <div className="p-4">
                                    <button
                                        className="flex items-center justify-center w-full p-3 text-blue-400 hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer group"
                                        onClick={() => setShowAllCategories(!showAllCategories)}
                                    >
                                        <span className="text-sm font-medium">
                                            {showAllCategories ? 'Hiển thị ít hơn' : `Xem tất cả (${filteredCategories.length})`}
                                        </span>
                                        <ChevronDown
                                            className={cn(
                                                "ml-2 w-4 h-4 transition-transform group-hover:scale-110",
                                                showAllCategories && "rotate-180"
                                            )}
                                        />
                                    </button>
                                </div>
                            )}

                            {/* Empty State */}
                            {!categoriesLoading && filteredCategories.length === 0 && searchTerm && (
                                <div className="p-4 text-center text-slate-400">
                                    <p className="text-sm">Không tìm thấy danh mục nào</p>
                                    <p className="text-xs mt-1">Thử từ khóa khác</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Filters Tab */}
                    {activeTab === 'filters' && (!isCollapsed || isMobile) && showFilters && (
                        <div className="p-4 space-y-6">
                            {/* Filter Header */}
                            <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-blue-400" />
                                    <h3 className="text-lg font-semibold text-white">Bộ lọc</h3>
                                </div>
                                {hasActiveFilters && (
                                    <button
                                        onClick={handleClearAllFilters}
                                        className="flex items-center gap-1 text-slate-400 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-lg transition-colors"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        <span className="text-sm">Reset</span>
                                    </button>
                                )}
                            </div>

                            {/* Price Range Filter */}
                            <FilterSection
                                title="Khoảng giá"
                                isExpanded={expandedSections.price}
                                onToggle={() => toggleSection('price')}
                            >
                                <div className="space-y-3">
                                    {/* Quick Price Ranges */}
                                    <div className="space-y-2">
                                        {PRICE_RANGES.map((range, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handlePriceRangeSelect(range)}
                                                className={cn(
                                                    "block w-full text-left px-4 py-3 rounded-lg text-sm transition-all",
                                                    currentFilters.minPrice === range.min &&
                                                        currentFilters.maxPrice === range.max
                                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                                                        : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                                                )}
                                            >
                                                {range.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Custom Price Range */}
                                    <div className="border-t border-slate-700/50 pt-3">
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">Từ</label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={localPriceRange.min || ''}
                                                    onChange={(e) => setLocalPriceRange(prev => ({
                                                        ...prev,
                                                        min: Number(e.target.value)
                                                    }))}
                                                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">Đến</label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={localPriceRange.max || ''}
                                                    onChange={(e) => setLocalPriceRange(prev => ({
                                                        ...prev,
                                                        max: Number(e.target.value)
                                                    }))}
                                                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCustomPriceFilter}
                                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl"
                                        >
                                            Áp dụng
                                        </button>
                                    </div>
                                </div>
                            </FilterSection>

                            {/* Brands Filter */}
                            <FilterSection
                                title="Thương hiệu"
                                isExpanded={expandedSections.brand}
                                onToggle={() => toggleSection('brand')}
                            >
                                <div className="space-y-2">
                                    {BRAND_OPTIONS.map((brand) => (
                                        <label key={brand.id} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-slate-800/30 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={currentFilters.brandNames?.includes(brand.name) || false}
                                                onChange={() => handleBrandToggle(brand.name)}
                                                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                                            />
                                            <div className="flex-1 flex items-center justify-between">
                                                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                                                    {brand.name}
                                                </span>
                                                {brand.count && (
                                                    <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full">
                                                        {brand.count}
                                                    </span>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </FilterSection>

                            {/* Rating Filter */}
                            <FilterSection
                                title="Đánh giá"
                                isExpanded={expandedSections.rating}
                                onToggle={() => toggleSection('rating')}
                            >
                                <div className="space-y-2">
                                    {[5, 4, 3, 2, 1].map((rating) => (
                                        <label key={rating} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-slate-800/30 transition-colors">
                                            <input
                                                type="radio"
                                                name="rating"
                                                value={rating}
                                                checked={currentFilters.minRating === rating}
                                                onChange={() => handleRatingFilter(rating)}
                                                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500 focus:ring-2"
                                            />
                                            <div className="flex items-center gap-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <svg
                                                        key={star}
                                                        className={cn(
                                                            "w-4 h-4 transition-colors",
                                                            star <= rating ? "text-yellow-400 fill-current" : "text-slate-600"
                                                        )}
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                                    </svg>
                                                ))}
                                                <span className="text-sm text-slate-300 ml-2 group-hover:text-white transition-colors">
                                                    {rating} sao trở lên
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </FilterSection>

                            {/* Inventory Status */}
                            <FilterSection
                                title="Tình trạng kho"
                                isExpanded={expandedSections.inventory}
                                onToggle={() => toggleSection('inventory')}
                            >
                                <div className="space-y-2">
                                    {INVENTORY_STATUS_OPTIONS.map((option) => (
                                        <label key={option.value} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-slate-800/30 transition-colors">
                                            <input
                                                type="radio"
                                                name="inventoryStatus"
                                                value={option.value}
                                                checked={currentFilters.inventoryStatus === option.value}
                                                onChange={() => handleInventoryStatusFilter(option.value)}
                                                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500 focus:ring-2"
                                            />
                                            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                                                {option.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </FilterSection>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                {!isCollapsed && !isMobile && showCategories && (
                    <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
                        <div className="text-xs text-slate-500 flex items-center justify-between">
                            <span>
                                {categoriesError ? 'Offline' : `${categories.length} danh mục`}
                            </span>
                            {!categoriesError && (
                                <button
                                    onClick={refetchCategories}
                                    className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded hover:bg-slate-800/50"
                                    disabled={categoriesLoading}
                                    title="Làm mới danh mục"
                                >
                                    <RefreshCw className={cn("w-3 h-3", categoriesLoading && "animate-spin")} />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Global Styles */}
            <style>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                
                @keyframes slide-in-left {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .animate-slide-in-left {
                    animation: slide-in-left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default Sidebar;