import { CreditCard, Package } from 'lucide-react';
import React from 'react';

interface PaymentMethod {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
}

interface PaymentMethodFormProps {
    selectedPayment: string;
    onPaymentChange: (paymentId: string) => void;
}

const paymentMethods: PaymentMethod[] = [
    {
        id: 'cod',
        name: 'Thanh toán khi nhận hàng (COD)',
        description: 'Thanh toán bằng tiền mặt khi nhận hàng',
        icon: <Package className="w-5 h-5" />
    },
    {
        id: 'banking',
        name: 'Chuyển khoản ngân hàng',
        description: 'Chuyển khoản qua ATM/Internet Banking',
        icon: <CreditCard className="w-5 h-5" />
    },
    {
        id: 'momo',
        name: 'Ví MoMo',
        description: 'Thanh toán qua ví điện tử MoMo',
        icon: <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">M</div>
    }
];

export const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
    selectedPayment,
    onPaymentChange
}) => {
    return (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-6">
                <CreditCard className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Phương thức thanh toán</h2>
            </div>

            <div className="space-y-3">
                {paymentMethods.map((method) => (
                    <label
                        key={method.id}
                        className="flex items-center space-x-3 p-4 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors"
                    >
                        <input
                            type="radio"
                            name="payment"
                            value={method.id}
                            checked={selectedPayment === method.id}
                            onChange={(e) => onPaymentChange(e.target.value)}
                            className="text-blue-600"
                        />
                        <div className="text-blue-400">{method.icon}</div>
                        <div>
                            <div className="text-white font-medium">{method.name}</div>
                            <div className="text-slate-400 text-sm">{method.description}</div>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
};