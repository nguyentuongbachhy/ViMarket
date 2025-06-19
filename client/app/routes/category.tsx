// app/routes/category.tsx
import { ChevronRight, Filter, Home, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useLoaderData, useSearchParams } from "react-router";
import { api } from '~/api';
import { ProductGrid } from "~/components/features/product/grid";
import { ProductListView } from "~/components/features/product/list/ProductListView";
import { SubcategorySidebar } from "~/components/features/subcategory/SubcategorySidebar";
import { ViewToggle, type ViewMode } from "~/components/ui/view-toggle";
import { useCategoryHierarchy } from "~/hooks/category";
import { useProductsByCategory } from "~/hooks/product";
import { useSubcategories } from "~/hooks/subcategory/useSubcategories";
import type { Route } from "./+types/category";

export async function loader({ params }: Route.LoaderArgs) {
    const { id } = params;
    const categoryId = id.replace('c', '');

    try {
        const category = await api.categories.getCategoryById(categoryId);
        return {
            id: category.id,
            name: category.name,
            url: category.url
        };
    } catch (error) {
        throw new Response("Category not found", { status: 404 });
    }
}

export function meta({ data }: Route.MetaArgs) {
    if (!data) {
        return [
            { title: "Danh mục | ViMarket" },
            { name: "description", content: "Khám phá các sản phẩm đa dạng." },
        ];
    }

    const { name } = data;

    return [
        { title: `${name} | ViMarket` },
        { name: "description", content: `Khám phá các sản phẩm ${name}. Giao hàng miễn phí, thanh toán dễ dàng.` },
        { property: "og:title", content: `${name} | ViMarket` },
        { property: "og:description", content: `Khám phá các sản phẩm ${name}. Giao hàng miễn phí, thanh toán dễ dàng.` },
    ];
}

// Breadcrumb Component
const Breadcrumb = ({ categoryId, categoryName }: { categoryId: string; categoryName: string }) => {
    const { hierarchy, loading } = useCategoryHierarchy(categoryId);
    const [isRootCategory, setIsRootCategory] = useState(false);

    useEffect(() => {
        const checkIfRoot = async () => {
            try {
                const rootCategories = await api.categories.getAllRootCategories();
                const isRoot = rootCategories.some(cat => cat.id === categoryId);
                setIsRootCategory(isRoot);
            } catch (error) {
                console.error('Failed to check root categories:', error);
            }
        };

        checkIfRoot();
    }, [categoryId]);

    if (loading) {
        return (
            <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
                <div className="h-4 w-16 bg-slate-700 rounded animate-pulse"></div>
                <ChevronRight size={16} />
                <div className="h-4 w-24 bg-slate-700 rounded animate-pulse"></div>
            </nav>
        );
    }

    return (
        <nav className="flex items-center space-x-2 text-sm text-gray-300 mb-6 overflow-x-auto pb-2">
            <Link
                to="/"
                className="flex items-center text-gray-400 hover:text-white transition-colors whitespace-nowrap"
            >
                <Home size={16} className="mr-1" />
                Trang chủ
            </Link>

            {isRootCategory ? (
                <>
                    <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
                    <span className="text-white font-medium whitespace-nowrap">{categoryName}</span>
                </>
            ) : (
                <>
                    {hierarchy.length > 0 && (
                        <>
                            <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
                            {hierarchy.map((category, index) => (
                                <div key={category.category} className="flex items-center">
                                    {index > 0 && <ChevronRight size={16} className="text-gray-600 mx-2 flex-shrink-0" />}
                                    <Link
                                        to={`/category/${category.category}`}
                                        className="text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                    >
                                        {category.name}
                                    </Link>
                                </div>
                            ))}
                        </>
                    )}
                    <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
                    <span className="text-white font-medium whitespace-nowrap">{categoryName}</span>
                </>
            )}
        </nav>
    );
};

// Category Header
const CategoryHeader = ({ name, productCount }: { name: string; productCount?: number }) => {
    return (
        <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {name}
            </h1>
            {productCount !== undefined && (
                <p className="text-gray-400">
                    {productCount > 0
                        ? `${productCount.toLocaleString()} sản phẩm`
                        : 'Không có sản phẩm nào'
                    }
                </p>
            )}
        </div>
    );
};

// Enhanced FilterSort Component
const FilterSort = ({
    viewMode,
    onViewModeChange,
    sortBy,
    onSortChange,
    totalProducts
}: {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    sortBy: string;
    onSortChange: (sort: string) => void;
    totalProducts: number;
}) => {
    return (
        <div className="mb-6 bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <span className="text-gray-300 text-sm font-medium">Sắp xếp:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => onSortChange(e.target.value)}
                            className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-48"
                        >
                            <option value="default">Mặc định</option>
                            <option value="price_asc">Giá: Thấp đến cao</option>
                            <option value="price_desc">Giá: Cao đến thấp</option>
                            <option value="newest">Mới nhất</option>
                            <option value="bestselling">Bán chạy nhất</option>
                            <option value="rating">Đánh giá cao nhất</option>
                            <option value="name_asc">Tên: A-Z</option>
                            <option value="name_desc">Tên: Z-A</option>
                        </select>
                    </div>

                    {totalProducts > 0 && (
                        <span className="text-gray-400 text-sm">
                            {totalProducts.toLocaleString()} sản phẩm
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between sm:justify-end">
                    <span className="text-gray-400 text-sm sm:hidden">Hiển thị:</span>
                    <ViewToggle
                        viewMode={viewMode}
                        onViewModeChange={onViewModeChange}
                    />
                </div>
            </div>
        </div>
    );
};

// Mobile Sidebar Overlay
const MobileSidebarOverlay = ({
    isOpen,
    onClose,
    children
}: {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="absolute left-0 top-0 h-full w-80 bg-slate-900 border-r border-slate-700 overflow-y-auto">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold">Bộ lọc</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default function Category() {
    const { id, name } = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();

    // State management
    const selectedSubcategory = searchParams.get('sub') || null;
    const [page, setPage] = useState(0);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState('default');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Load saved view mode
    useEffect(() => {
        const savedViewMode = localStorage.getItem('categoryViewMode') as ViewMode;
        if (savedViewMode && (savedViewMode === 'grid' || savedViewMode === 'list')) {
            setViewMode(savedViewMode);
        }
    }, []);

    // Save view mode
    const handleViewModeChange = useCallback((mode: ViewMode) => {
        setViewMode(mode);
        localStorage.setItem('categoryViewMode', mode);
    }, []);

    // Get subcategories
    const { subcategories, loading: subcategoriesLoading } = useSubcategories(id);

    // Get products
    const categoryIdToUse = selectedSubcategory || id;
    const {
        products,
        loading,
        error,
        meta,
        refetch
    } = useProductsByCategory(categoryIdToUse, page, 20);

    // Handle subcategory change
    const handleSubcategoryChange = useCallback((subcategoryId: string | null) => {
        setPage(0);
        setAllProducts([]);

        if (subcategoryId) {
            setSearchParams({ sub: subcategoryId });
        } else {
            setSearchParams({});
        }
    }, [setSearchParams]);

    // Handle sort change
    const handleSortChange = useCallback((sort: string) => {
        setSortBy(sort);
        setPage(0);
        setAllProducts([]);
        // TODO: Implement actual sorting logic
    }, []);

    // Handle load more
    const handleLoadMore = useCallback(() => {
        if (meta && !meta.last && !loading) {
            setPage(prev => prev + 1);
        }
    }, [meta, loading]);

    // Accumulate products
    useEffect(() => {
        if (page === 0) {
            setAllProducts(products);
        } else {
            setAllProducts(prev => [...prev, ...products]);
        }
    }, [products, page]);

    // Reset when category/subcategory changes
    useEffect(() => {
        setPage(0);
        setAllProducts([]);
    }, [id, selectedSubcategory]);

    const hasMore = meta ? !meta.last : false;
    const totalProducts = meta ? meta.totalElements : 0;
    const hasSubcategories = subcategories.length > 0;

    return (
        <div className="min-h-screen bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Breadcrumb */}
                <Breadcrumb categoryId={id} categoryName={name} />

                {/* Mobile Filter Button */}
                {hasSubcategories && (
                    <div className="lg:hidden mb-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                        >
                            <Filter size={16} />
                            <span>Bộ lọc</span>
                        </button>
                    </div>
                )}

                {/* Layout */}
                <div className="flex gap-6">
                    {/* Desktop Sidebar */}
                    {hasSubcategories && (
                        <aside className="hidden lg:block w-64 flex-shrink-0">
                            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 sticky top-6">
                                {!subcategoriesLoading ? (
                                    <SubcategorySidebar
                                        subcategories={subcategories}
                                        selectedSubcategory={selectedSubcategory}
                                        onSubcategoryChange={handleSubcategoryChange}
                                    />
                                ) : (
                                    <div>
                                        <div className="h-6 bg-slate-700 rounded mb-4 animate-pulse"></div>
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="h-8 bg-slate-700 rounded mb-2 animate-pulse"></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </aside>
                    )}

                    {/* Main Content */}
                    <main className="flex-grow min-w-0">
                        {/* Category Header */}
                        <CategoryHeader name={name} productCount={totalProducts} />

                        {/* Filter and Sort */}
                        <FilterSort
                            viewMode={viewMode}
                            onViewModeChange={handleViewModeChange}
                            sortBy={sortBy}
                            onSortChange={handleSortChange}
                            totalProducts={totalProducts}
                        />

                        {/* Error State */}
                        {error && (
                            <div className="mb-6 bg-red-900/20 border border-red-800 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-red-400 font-medium">Có lỗi xảy ra</h3>
                                        <p className="text-red-300 text-sm mt-1">{error}</p>
                                    </div>
                                    <button
                                        onClick={() => refetch()}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                                        disabled={loading}
                                    >
                                        {loading ? 'Đang thử lại...' : 'Thử lại'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Products Display */}
                        {viewMode === 'grid' ? (
                            <ProductGrid
                                products={allProducts}
                                loading={loading && page === 0}
                                error={page === 0 ? error : null}
                                hasMore={hasMore}
                                onLoadMore={handleLoadMore}
                                onRetry={refetch}
                                cols={hasSubcategories ? 3 : 4}
                                gap="md"
                                spacing="normal"
                                padding="none"
                                showBrand={true}
                                showSeller={false}
                                emptyMessage={`Không có sản phẩm nào trong danh mục "${name}"`}
                                showLoadMoreButton={true}
                                cardHeight="md"
                                imageHeight="md"
                                className="mb-8"
                            />
                        ) : (
                            <div className="mb-8">
                                <ProductListView
                                    products={allProducts}
                                    loading={loading && page === 0}
                                    error={page === 0 ? error : null}
                                    showBrand={true}
                                    showSeller={false}
                                />

                                {/* Load More for List View */}
                                {hasMore && !loading && (
                                    <div className="flex justify-center mt-6">
                                        <button
                                            onClick={handleLoadMore}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Xem thêm sản phẩm
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Loading More Indicator */}
                        {loading && page > 0 && (
                            <div className="flex justify-center py-8">
                                <div className="flex items-center space-x-2 text-gray-400">
                                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Đang tải thêm sản phẩm...</span>
                                </div>
                            </div>
                        )}

                        {/* End Message */}
                        {!loading && !hasMore && allProducts.length > 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-400">Đã hiển thị tất cả sản phẩm trong danh mục này</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Sidebar */}
            <MobileSidebarOverlay
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            >
                {!subcategoriesLoading && (
                    <SubcategorySidebar
                        subcategories={subcategories}
                        selectedSubcategory={selectedSubcategory}
                        onSubcategoryChange={(subcategoryId) => {
                            handleSubcategoryChange(subcategoryId);
                            setSidebarOpen(false);
                        }}
                    />
                )}
            </MobileSidebarOverlay>
        </div>
    );
}