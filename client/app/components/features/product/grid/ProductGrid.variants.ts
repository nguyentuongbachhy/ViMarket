import { cva } from "class-variance-authority";

export const productGridVariants = cva(
    "w-full",
    {
        variants: {
            spacing: {
                tight: "space-y-3",
                normal: "space-y-4 sm:space-y-6",
                loose: "space-y-6 sm:space-y-8",
            },
            padding: {
                none: "",
                sm: "p-2 sm:p-3",
                md: "p-2 sm:p-4",
                lg: "p-4 sm:p-6",
            }
        },
        defaultVariants: {
            spacing: "normal",
            padding: "md"
        }
    }
);

export const gridContainerVariants = cva(
    "grid gap-3 sm:gap-4",
    {
        variants: {
            cols: {
                1: "grid-cols-1",
                2: "grid-cols-1 sm:grid-cols-2",
                3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                4: "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
                5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
                6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
            },
            gap: {
                sm: "gap-2 sm:gap-3",
                md: "gap-3 sm:gap-4",
                lg: "gap-4 sm:gap-6",
            }
        },
        defaultVariants: {
            cols: 4,
            gap: "md"
        }
    }
);

export const skeletonGridVariants = cva(
    "bg-white rounded-lg shadow-md overflow-hidden animate-pulse",
    {
        variants: {
            size: {
                sm: "h-64",
                md: "h-72 sm:h-80",
                lg: "h-80 sm:h-96",
            }
        },
        defaultVariants: {
            size: "md"
        }
    }
);

export const errorContainerVariants = cva(
    "border rounded-lg p-4 mb-4",
    {
        variants: {
            severity: {
                warning: "bg-yellow-50 border-yellow-300",
                error: "bg-red-50 border-red-300",
                info: "bg-blue-50 border-blue-300",
            }
        },
        defaultVariants: {
            severity: "error"
        }
    }
);

export const emptyStateVariants = cva(
    "text-center py-12",
    {
        variants: {
            size: {
                sm: "py-8",
                md: "py-12",
                lg: "py-16",
            }
        },
        defaultVariants: {
            size: "md"
        }
    }
);

export const loadMoreButtonVariants = cva(
    "px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer",
    {
        variants: {
            variant: {
                primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
                secondary: "bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800",
                outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100",
            },
            size: {
                sm: "px-4 py-2 text-sm",
                md: "px-6 py-3 text-base",
                lg: "px-8 py-4 text-lg",
            }
        },
        defaultVariants: {
            variant: "primary",
            size: "md"
        }
    }
);

export const titleVariants = cva(
    "font-bold text-white",
    {
        variants: {
            size: {
                sm: "text-lg sm:text-xl",
                md: "text-xl sm:text-2xl",
                lg: "text-2xl sm:text-3xl",
            }
        },
        defaultVariants: {
            size: "md"
        }
    }
);

export const loadingIndicatorVariants = cva(
    "flex items-center gap-2",
    {
        variants: {
            variant: {
                simple: "text-gray-400",
                branded: "text-blue-400",
                muted: "text-gray-500",
            },
            size: {
                sm: "text-sm",
                md: "text-base",
                lg: "text-lg",
            }
        },
        defaultVariants: {
            variant: "simple",
            size: "md"
        }
    }
);