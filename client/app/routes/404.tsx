// app/routes/404.tsx - 404 page
import { isRouteErrorResponse, Link, useRouteError } from "react-router";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md mx-auto text-center">
                <div className="mb-8">
                    <h1 className="text-9xl font-bold text-gray-200">404</h1>
                    <h2 className="text-2xl font-bold text-gray-800 mt-4">
                        Trang không tồn tại
                    </h2>
                    <p className="text-gray-600 mt-2">
                        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
                    </p>
                </div>

                <div className="space-y-4">
                    <Link
                        to="/"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Về trang chủ
                    </Link>

                    <div className="text-sm text-gray-500">
                        <p>Hoặc thử tìm kiếm sản phẩm bạn cần</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Nếu muốn handle error trong ErrorBoundary
export function ErrorBoundary() {
    const error = useRouteError();

    if (isRouteErrorResponse(error) && error.status === 404) {
        return <NotFound />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md mx-auto text-center">
                <h1 className="text-4xl font-bold text-red-600 mb-4">Oops!</h1>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Đã xảy ra lỗi
                </h2>
                <p className="text-gray-600 mb-6">
                    {error instanceof Error ? error.message : "Lỗi không xác định"}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Thử lại
                </button>
            </div>
        </div>
    );
}
