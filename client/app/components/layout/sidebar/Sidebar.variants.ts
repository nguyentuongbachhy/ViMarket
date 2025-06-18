import { cva } from "class-variance-authority";

export const sidebarVariants = cva(
    "bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl rounded-xl overflow-hidden transition-all duration-300 ease-in-out border border-slate-700/50 backdrop-blur-sm",
    {
        variants: {
            state: {
                collapsed: "w-16 h-screen",
                expanded: "w-80 h-screen",
                mobile: "w-80 fixed left-0 top-0 z-50 h-screen",
            }
        }
    }
);

export const categoryItemVariants = cva(
    "flex items-center p-3 rounded-xl mb-2 transition-all duration-200 group cursor-pointer",
    {
        variants: {
            active: {
                true: "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25",
                false: "text-slate-300 hover:bg-slate-800/50 hover:text-white",
            },
            collapsed: {
                true: "justify-center",
                false: "",
            }
        }
    }
);

export const tabVariants = cva(
    "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
    {
        variants: {
            active: {
                true: "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg",
                false: "text-slate-400 hover:text-white hover:bg-slate-800/50",
            }
        }
    }
);

export const filterSectionVariants = cva(
    "space-y-3 border-b border-slate-700/50 pb-4 last:border-b-0",
    {
        variants: {
            expanded: {
                true: "",
                false: "pb-0",
            }
        }
    }
);