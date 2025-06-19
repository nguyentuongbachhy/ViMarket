import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useHydrated } from '~/hooks/utils/useHydrated';
import { cn } from '~/lib/utils';
import type { BannerItem, BannerProps } from './Banner.types';
import { bannerVariants, navigationButtonVariants } from './Banner.variants';

const defaultBanners: BannerItem[] = [
  { id: 1, src: '/banners/banner_1.webp', alt: 'banner_1' },
  { id: 2, src: '/banners/banner_2.webp', alt: 'banner_2' },
  { id: 3, src: '/banners/banner_3.webp', alt: 'banner_3' },
  { id: 4, src: '/banners/banner_4.webp', alt: 'banner_4' },
  { id: 5, src: '/banners/banner_5.webp', alt: 'banner_5' },
  { id: 6, src: '/banners/banner_6.webp', alt: 'banner_6' }
];

export const Banner: React.FC<BannerProps> = ({
  banners = defaultBanners,
  autoSlide = true,
  autoSlideInterval = 4000,
  showNavigation = true,
  className,
  height,
}) => {
  const hydrated = useHydrated();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fixed: Sử dụng giá trị mặc định consistent hoặc custom height
  const [visibleBanners, setVisibleBanners] = useState(2); // Desktop default
  const [bannerHeight, setBannerHeight] = useState<'sm' | 'md' | 'lg' | 'xl'>(height || 'xl'); // Use custom height or desktop default

  const sliderRef = useRef<HTMLDivElement>(null);

  // Fixed: Chỉ update responsive sau khi hydrated (chỉ update nếu không có custom height)
  useEffect(() => {
    if (!hydrated || height) return; // Không update nếu có custom height

    const updateLayout = () => {
      const width = window.innerWidth;

      if (width < 640) {
        setVisibleBanners(1);
        setBannerHeight('sm');
      } else if (width < 768) {
        setVisibleBanners(2);
        setBannerHeight('md');
      } else if (width < 1024) {
        setVisibleBanners(2);
        setBannerHeight('lg');
      } else {
        setVisibleBanners(2);
        setBannerHeight('xl');
      }
    };

    updateLayout();

    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [hydrated, height]);

  // Navigation functions
  const slideToNext = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    const nextIndex = (activeIndex + visibleBanners) % banners.length;
    setActiveIndex(nextIndex);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  const slideToPrev = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    const prevIndex = (activeIndex - visibleBanners + banners.length) % banners.length;
    setActiveIndex(prevIndex);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  // Auto-slide functionality
  useEffect(() => {
    if (!autoSlide || !hydrated) return;

    const interval = setInterval(slideToNext, autoSlideInterval);
    return () => clearInterval(interval);
  }, [activeIndex, isTransitioning, visibleBanners, autoSlide, autoSlideInterval, hydrated]);

  if (!hydrated) {
    return (
      <div className={cn(bannerVariants(), className)}>
        <div className="relative h-32 sm:h-40 md:h-48 lg:h-56 xl:h-80">
          <div className="flex absolute w-full h-full">
            {banners.slice(0, 2).map((banner) => (
              <div key={banner.id} className="flex-shrink-0 px-1 w-1/2">
                <img
                  src={banner.src}
                  alt={banner.alt}
                  className="w-full h-full object-cover rounded-md"
                  loading="eager"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(bannerVariants(), className)}>
      <div className={cn("relative", bannerVariants({ height: bannerHeight }))}>
        {/* Navigation Buttons */}
        {showNavigation && (
          <>
            <button
              className={navigationButtonVariants({ position: "left" })}
              onClick={slideToPrev}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
            </button>

            <button
              className={navigationButtonVariants({ position: "right" })}
              onClick={slideToNext}
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
            </button>
          </>
        )}

        {/* Slider Container */}
        <div
          ref={sliderRef}
          className={cn(
            "flex absolute w-full h-full",
            isTransitioning && "transition-transform duration-500 ease-in-out"
          )}
          style={{
            transform: `translateX(-${(activeIndex * 100) / visibleBanners}%)`,
          }}
        >
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="flex-shrink-0 px-1"
              style={{ width: `${100 / visibleBanners}%` }}
            >
              {banner.link ? (
                <a href={banner.link} className="block">
                  <img
                    src={banner.src}
                    alt={banner.alt}
                    className={cn(
                      "w-full object-cover rounded-md cursor-pointer hover:opacity-95 transition-opacity",
                      bannerVariants({ height: bannerHeight })
                    )}
                    loading={banner.id <= 2 ? "eager" : "lazy"}
                  />
                </a>
              ) : (
                <img
                  src={banner.src}
                  alt={banner.alt}
                  className={cn(
                    "w-full object-cover rounded-md cursor-pointer hover:opacity-95 transition-opacity",
                    bannerVariants({ height: bannerHeight })
                  )}
                  loading={banner.id <= 2 ? "eager" : "lazy"}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Banner;