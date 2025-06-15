import { database } from '@/database/connection';
import { Order, OrderItem, OrderStatus, PaymentStatus } from '@/types';
import { Logger } from '@/utils/logger';
import { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('OrderRepository');

export class OrderRepository {
    async createOrder(orderData: Partial<Order>): Promise<Order> {
        return database.transaction(async (client: PoolClient) => {
            const orderId = uuidv4();

            // Create order
            const orderQuery = `
                INSERT INTO orders (
                    id, user_id, status, total_amount, currency,
                    shipping_address, payment_method, payment_status, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;

            const orderResult = await client.query(orderQuery, [
                orderId,
                orderData.userId,
                OrderStatus.PENDING,
                orderData.totalAmount,
                'VND',
                JSON.stringify(orderData.shippingAddress),
                orderData.paymentMethod,
                PaymentStatus.PENDING,
                orderData.notes
            ]);

            // Create order items
            const items: OrderItem[] = [];
            if (orderData.items) {
                for (const item of orderData.items) {
                    const itemResult = await client.query(`
                        INSERT INTO order_items (
                            id, order_id, product_id, product_name, 
                            image_url, price, quantity, total_price
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        RETURNING *
                    `, [
                        uuidv4(),
                        orderId,
                        item.productId,
                        item.productName,
                        item.imageUrl,
                        item.price,
                        item.quantity,
                        item.totalPrice
                    ]);

                    const row = itemResult.rows[0];
                    items.push({
                        id: row.id,
                        orderId: row.order_id,
                        productId: row.product_id,
                        productName: row.product_name,
                        imageUrl: row.image_url,
                        price: parseFloat(row.price),
                        quantity: row.quantity,
                        totalPrice: parseFloat(row.total_price)
                    });
                }
            }

            const orderRow = orderResult.rows[0];
            return {
                id: orderRow.id,
                userId: orderRow.user_id,
                status: orderRow.status,
                totalAmount: parseFloat(orderRow.total_amount),
                currency: orderRow.currency,
                shippingAddress: orderRow.shipping_address,
                items,
                paymentMethod: orderRow.payment_method,
                paymentStatus: orderRow.payment_status,
                notes: orderRow.notes,
                createdAt: orderRow.created_at,
                updatedAt: orderRow.updated_at
            };
        });
    }

    async getOrderById(orderId: string): Promise<Order | null> {
        const orderQuery = `
            SELECT * FROM orders WHERE id = $1
        `;
        const orderResult = await database.query(orderQuery, [orderId]);

        if (orderResult.rows.length === 0) return null;

        const itemsResult = await database.query(`
            SELECT * FROM order_items WHERE order_id = $1
        `, [orderId]);

        const orderRow = orderResult.rows[0];
        return {
            id: orderRow.id,
            userId: orderRow.user_id,
            status: orderRow.status,
            totalAmount: parseFloat(orderRow.total_amount),
            currency: orderRow.currency,
            shippingAddress: orderRow.shipping_address,
            items: itemsResult.rows.map((row: any) => ({
                id: row.id,
                orderId: row.order_id,
                productId: row.product_id,
                productName: row.product_name,
                imageUrl: row.image_url,
                price: parseFloat(row.price),
                quantity: row.quantity,
                totalPrice: parseFloat(row.total_price)
            })),
            paymentMethod: orderRow.payment_method,
            paymentStatus: orderRow.payment_status,
            notes: orderRow.notes,
            createdAt: orderRow.created_at,
            updatedAt: orderRow.updated_at
        };
    }

    async getOrdersByUserId(userId: string, limit: number = 20): Promise<Order[]> {
        const orderQuery = `
            SELECT * FROM orders 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2
        `;
        const orderResult = await database.query(orderQuery, [userId, limit]);

        if (orderResult.rows.length === 0) return [];

        const orderIds = orderResult.rows.map((row: any) => row.id);
        const itemsResult = await database.query(`
            SELECT * FROM order_items 
            WHERE order_id = ANY($1)
        `, [orderIds]);

        const itemsByOrderId = itemsResult.rows.reduce((acc: Record<string, OrderItem[]>, row: any) => {
            if (!acc[row.order_id]) acc[row.order_id] = [];
            acc[row.order_id].push({
                id: row.id,
                orderId: row.order_id,
                productId: row.product_id,
                productName: row.product_name,
                imageUrl: row.image_url,
                price: parseFloat(row.price),
                quantity: row.quantity,
                totalPrice: parseFloat(row.total_price)
            });
            return acc;
        }, {});

        return orderResult.rows.map((orderRow: any) => ({
            id: orderRow.id,
            userId: orderRow.user_id,
            status: orderRow.status,
            totalAmount: parseFloat(orderRow.total_amount),
            currency: orderRow.currency,
            shippingAddress: orderRow.shipping_address,
            items: itemsByOrderId[orderRow.id] || [],
            paymentMethod: orderRow.payment_method,
            paymentStatus: orderRow.payment_status,
            notes: orderRow.notes,
            createdAt: orderRow.created_at,
            updatedAt: orderRow.updated_at
        }));
    }

    async updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
        const result = await database.query(`
            UPDATE orders 
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [status, orderId]);

        return result.rowCount > 0;
    }

    async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<boolean> {
        const result = await database.query(`
            UPDATE orders 
            SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [paymentStatus, orderId]);

        return result.rowCount > 0;
    }
}

export const orderRepository = new OrderRepository();