import { Cart } from '~/components/features/cart';

export function meta() {
    return [
        { title: 'Giỏ hàng | ViMarket' },
        { name: 'description', content: 'Xem và quản lý giỏ hàng của bạn' },
    ];
}

export default function CartPage() {
    return <Cart />;
}