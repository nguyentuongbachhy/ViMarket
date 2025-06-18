import { MapPin } from 'lucide-react';
import React from 'react';
import { cn } from '~/lib/utils';

interface ShippingInfo {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

interface ShippingFormProps {
    shippingInfo: ShippingInfo;
    onChange: (info: ShippingInfo) => void;
    errors: Record<string, string>;
}

export const ShippingForm: React.FC<ShippingFormProps> = ({
    shippingInfo,
    onChange,
    errors
}) => {
    const cities = [
        { value: 'TP.HCM', label: 'TP. Hồ Chí Minh', state: 'Hồ Chí Minh' },
        { value: 'Hà Nội', label: 'Hà Nội', state: 'Hà Nội' },
        { value: 'Đà Nẵng', label: 'Đà Nẵng', state: 'Đà Nẵng' },
        { value: 'Cần Thơ', label: 'Cần Thơ', state: 'Cần Thơ' },
    ];

    const updateField = (field: keyof ShippingInfo, value: string) => {
        onChange({ ...shippingInfo, [field]: value });
    };

    return (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-6">
                <MapPin className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Thông tin giao hàng</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                        Họ và tên *
                    </label>
                    <input
                        type="text"
                        value={shippingInfo.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        className={cn(
                            "w-full px-3 py-2 bg-slate-700 border rounded-lg text-white",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500",
                            errors.fullName ? "border-red-500" : "border-slate-600"
                        )}
                        placeholder="Nhập họ và tên"
                    />
                    {errors.fullName && (
                        <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>
                    )}
                </div>

                <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                        Số điện thoại *
                    </label>
                    <input
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        className={cn(
                            "w-full px-3 py-2 bg-slate-700 border rounded-lg text-white",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500",
                            errors.phone ? "border-red-500" : "border-slate-600"
                        )}
                        placeholder="Nhập số điện thoại"
                    />
                    {errors.phone && (
                        <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
                    )}
                </div>

                <div className="md:col-span-2">
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                        Địa chỉ *
                    </label>
                    <input
                        type="text"
                        value={shippingInfo.street}
                        onChange={(e) => updateField('street', e.target.value)}
                        className={cn(
                            "w-full px-3 py-2 bg-slate-700 border rounded-lg text-white",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500",
                            errors.street ? "border-red-500" : "border-slate-600"
                        )}
                        placeholder="Số nhà, tên đường, phường/xã"
                    />
                    {errors.street && (
                        <p className="text-red-400 text-sm mt-1">{errors.street}</p>
                    )}
                </div>

                <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                        Thành phố
                    </label>
                    <select
                        value={shippingInfo.city}
                        onChange={(e) => {
                            const selectedCity = cities.find(city => city.value === e.target.value);
                            updateField('city', e.target.value);
                            if (selectedCity) {
                                updateField('state', selectedCity.state);
                            }
                        }}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {cities.map(city => (
                            <option key={city.value} value={city.value}>
                                {city.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                        Mã bưu điện
                    </label>
                    <input
                        type="text"
                        value={shippingInfo.zipCode}
                        onChange={(e) => updateField('zipCode', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="70000"
                    />
                </div>
            </div>
        </div>
    );
};