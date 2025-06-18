import { cva } from "class-variance-authority";

export const dealItemVariants = cva(
    "flex flex-col items-center justify-center text-center group",
    {
        variants: {
            size: {
                sm: "px-2 py-1",
                md: "px-2 sm:px-4 py-1",
                lg: "px-4 py-2",
            }
        },
        defaultVariants: {
            size: "md"
        }
    }
);

export const dealImageVariants = cva(
    "rounded-xl overflow-hidden shadow-sm border border-gray-100 group-hover:scale-105 transition-transform duration-300",
    {
        variants: {
            size: {
                sm: "w-8 h-8",
                md: "w-10 h-10 sm:w-12 sm:h-12",
                lg: "w-14 h-14 sm:w-16 sm:h-16",
            }
        },
        defaultVariants: {
            size: "md"
        }
    }
);