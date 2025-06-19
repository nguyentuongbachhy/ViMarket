import { ArrowLeft, ShoppingBag } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router';

interface CartEmptyProps {
    showBackButton?: boolean;
}

export const CartEmpty: React.FC<CartEmptyProps> = ({
    showBackButton = true
}) => {
    return (
        <div className="text-center py-16">
            {/* Back Button */}
            {showBackButton && (
                <div className="mb-8">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Quay lại mua sắm
                    </Link>
                </div>
            )}

            {/* Empty State Icon */}
            <div className="w-32 h-32 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                <ShoppingBag size={48} className="text-gray-600" />
            </div>

            {/* Empty State Content */}
            <h2 className="text-2xl font-bold text-white mb-4">
                Giỏ hàng của bạn đang trống
            </h2>

            <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Hãy khám phá các sản phẩm tuyệt vời của chúng tôi và thêm vào giỏ hàng để bắt đầu mua sắm!
            </p>

            {/* Action Buttons */}
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <Link
                    to="/"
                    className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    Tiếp tục mua sắm
                </Link>

                <Link
                    to="/category/deals"
                    className="inline-block border border-gray-600 text-gray-300 px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                    Xem ưu đãi
                </Link>
            </div>

            {/* Popular Categories */}
            <div className="mt-12">
                <h3 className="text-lg font-semibold text-white mb-4">
                    Danh mục phổ biến
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
                    {[
                        { name: 'Điện thoại', url: '/category/1' },
                        { name: 'Laptop', url: '/category/2' },
                        { name: 'Thời trang', url: '/category/3' },
                        { name: 'Gia dụng', url: '/category/4' },
                    ].map((category) => (
                        <Link
                            key={category.name}
                            to={category.url}
                            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors text-center"
                        >
                            <span className="text-sm text-gray-300">{category.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};