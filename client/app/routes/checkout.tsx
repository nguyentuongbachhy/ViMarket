import { ArrowLeft, Package } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { type CheckoutRequest } from '~/api';
import {
    OrderSummary,
    PaymentMethodForm,
    ShippingForm
} from '~/components/features/checkout';
import { useCartContext } from '~/contexts';
import { useCheckout } from '~/hooks/orders';

interface ShippingInfo {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { cart } = useCartContext();
    const { checkout, loading, error } = useCheckout();

    const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
        fullName: '',
        phone: '',
        street: '',
        city: 'TP.HCM',
        state: 'Hồ Chí Minh',
        zipCode: '70000',
        country: 'Vietnam'
    });

    const [selectedPayment, setSelectedPayment] = useState('cod');
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!shippingInfo.fullName.trim()) {
            newErrors.fullName = 'Vui lòng nhập họ tên';
        }
        if (!shippingInfo.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại';
        }
        if (!shippingInfo.street.trim()) {
            newErrors.street = 'Vui lòng nhập địa chỉ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCheckout = async () => {
        if (!validateForm()) return;
        if (!cart || cart.items.length === 0) return;

        try {
            const checkoutRequest: CheckoutRequest = {
                useCart: true,
                shippingAddress: {
                    street: shippingInfo.street,
                    city: shippingInfo.city,
                    state: shippingInfo.state,
                    zipCode: shippingInfo.zipCode,
                    country: shippingInfo.country
                },
                paymentMethod: selectedPayment,
                notes: notes.trim() || undefined
            };

            const order = await checkout(checkoutRequest);

            if (order) {
                navigate(`/order-success/${order.id}`);
            }
        } catch (error) {
            console.error('Checkout failed:', error);
        }
    };

    // Redirect if no cart
    if (!cart || cart.items.length === 0) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Giỏ hàng trống</h2>
                    <p className="text-slate-400 mb-6">Thêm sản phẩm vào giỏ hàng để tiếp tục thanh toán</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Tiếp tục mua sắm
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/cart')}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold text-white">Thanh toán</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Checkout Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <ShippingForm
                            shippingInfo={shippingInfo}
                            onChange={setShippingInfo}
                            errors={errors}
                        />

                        <PaymentMethodForm
                            selectedPayment={selectedPayment}
                            onPaymentChange={setSelectedPayment}
                        />

                        {/* Order Notes */}
                        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                            <h2 className="text-xl font-bold text-white mb-4">Ghi chú đơn hàng</h2>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ghi chú thêm cho đơn hàng (không bắt buộc)"
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-1">
                        <OrderSummary
                            cart={cart}
                            loading={loading}
                            error={error}
                            onCheckout={handleCheckout}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}