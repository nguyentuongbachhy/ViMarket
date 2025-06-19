import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
    {
        variants: {
            variant: {
                primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
                secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400",
                outline: "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 active:bg-gray-100",
                ghost: "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200",
                danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
            },
            size: {
                sm: "h-8 px-3 text-xs",
                md: "h-10 px-4 text-sm",
                lg: "h-12 px-6 text-base",
                xl: "h-14 px-8 text-lg",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    }
);