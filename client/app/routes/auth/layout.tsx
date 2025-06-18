import { Outlet } from "react-router";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full h-full bg-red-500">
            <Outlet />
        </div>
    )
}
