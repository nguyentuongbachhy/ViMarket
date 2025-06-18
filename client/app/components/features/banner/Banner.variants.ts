import { cva } from "class-variance-authority";

export const bannerVariants = cva(
    "w-full overflow-hidden",
    {
        variants: {
            height: {
                sm: "h-32 sm:h-40",
                md: "h-40 md:h-48",
                lg: "h-48 lg:h-56",
                xl: "h-56 lg:h-80",
            }
        },
        defaultVariants: {
            height: "xl"
        }
    }
);

export const navigationButtonVariants = cva(
    "absolute top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full transition-all duration-200 cursor-pointer",
    {
        variants: {
            position: {
                left: "left-2",
                right: "right-2",
            },
            size: {
                sm: "p-1",
                md: "p-2",
                lg: "p-3",
            }
        },
        defaultVariants: {
            size: "md"
        }
    }
);