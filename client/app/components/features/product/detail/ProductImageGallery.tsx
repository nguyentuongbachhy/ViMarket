import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { cn } from '~/lib/utils';

interface ProductImageGalleryProps {
    images: Array<{ id: string; url: string; position: number }>;
    productName: string;
    brand?: string;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
    images,
    productName,
    brand
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const sortedImages = images.sort((a, b) => a.position - b.position);
    const hasMultipleImages = sortedImages.length > 1;
    const currentImage = sortedImages[selectedIndex];

    const handlePrevious = useCallback(() => {
        setSelectedIndex(prev => prev > 0 ? prev - 1 : sortedImages.length - 1);
        setImageLoading(true);
    }, [sortedImages.length]);

    const handleNext = useCallback(() => {
        setSelectedIndex(prev => prev < sortedImages.length - 1 ? prev + 1 : 0);
        setImageLoading(true);
    }, [sortedImages.length]);

    const handleThumbnailClick = useCallback((index: number) => {
        setSelectedIndex(index);
        setImageLoading(true);
    }, []);

    const handleImageLoad = useCallback(() => {
        setImageLoading(false);
    }, []);

    const handleZoomToggle = useCallback(() => {
        setIsZoomed(!isZoomed);
    }, [isZoomed]);

    if (!sortedImages.length) {
        return (
            <div className="sticky top-6">
                <div className="aspect-square bg-slate-800 rounded-lg flex items-center justify-center">
                    <div className="text-center text-slate-400">
                        <div className="w-16 h-16 mx-auto mb-4 bg-slate-700 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">📷</span>
                        </div>
                        <p>Không có hình ảnh</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="sticky top-6 space-y-4">
            {/* Main Image */}
            <div className="relative group">
                <div className="aspect-square bg-slate-800 rounded-lg overflow-hidden">
                    {/* Loading Overlay */}
                    {imageLoading && (
                        <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center z-10">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* Main Image */}
                    <img
                        src={currentImage?.url}
                        alt={`${productName} - ${brand} - Hình ${selectedIndex + 1}`}
                        className={cn(
                            "w-full h-full object-cover transition-all duration-300",
                            isZoomed && "scale-150 cursor-zoom-out",
                            !isZoomed && "cursor-zoom-in"
                        )}
                        onLoad={handleImageLoad}
                        onClick={handleZoomToggle}
                        loading="eager"
                    />

                    {/* Navigation Arrows */}
                    {hasMultipleImages && (
                        <>
                            <button
                                onClick={handlePrevious}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                                aria-label="Previous image"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <button
                                onClick={handleNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                                aria-label="Next image"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </>
                    )}

                    {/* Zoom Icon */}
                    <div className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn size={16} />
                    </div>

                    {/* Image Counter */}
                    {hasMultipleImages && (
                        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                            {selectedIndex + 1} / {sortedImages.length}
                        </div>
                    )}
                </div>

                {/* Brand Badge */}
                {brand && (
                    <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {brand}
                    </div>
                )}
            </div>

            {/* Thumbnails */}
            {hasMultipleImages && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                    {sortedImages.map((image, index) => (
                        <button
                            key={image.id}
                            onClick={() => handleThumbnailClick(index)}
                            className={cn(
                                "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                                selectedIndex === index
                                    ? "border-blue-500 ring-2 ring-blue-500/20"
                                    : "border-slate-600 hover:border-slate-500"
                            )}
                        >
                            <img
                                src={image.url}
                                alt={`${productName} thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Image Features */}
            <div className="text-xs text-slate-400 space-y-1">
                <p>• Click để phòng to/thu nhỏ</p>
                <p>• Cuộn để xem thêm hình ảnh</p>
                <p>• Hình ảnh thực tế sản phẩm</p>
            </div>
        </div>
    );
};