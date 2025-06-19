import { cartClient } from '@/clients/cartClient';
import { productClient } from '@/clients/productClient';
import { userClient } from '@/clients/userClient';
import { orderRepository } from '@/database/repositories/orderRepository';
import { CheckoutRequest, CreateOrderFromCartRequest, CreateOrderRequest, Order, OrderStatus, PaymentStatus } from '@/types';
import { Logger } from '@/utils/logger';
import { Cell, Row, Workbook } from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { emailService } from './emailService';
import { orderKafkaService, OrderCreatedEvent, OrderStatusUpdatedEvent, OrderCancelledEvent } from './kafkaService';

const logger = new Logger('OrderService');

export class OrderService {
    // ✅ Main checkout endpoint
    async checkout(userId: string, userEmail: string, request: CheckoutRequest): Promise<Order> {
        logger.info('Starting checkout process', { userId, useCart: request.useCart });

        try {
            let order: Order;

            if (request.useCart) {
                order = await this.createOrderFromCart(userId, {
                    shippingAddress: request.shippingAddress,
                    paymentMethod: request.paymentMethod,
                    notes: request.notes
                });
            } else {
                if (!request.items || request.items.length === 0) {
                    throw new Error('Items are required when not using cart');
                }
                order = await this.createOrder(userId, {
                    items: request.items,
                    shippingAddress: request.shippingAddress,
                    paymentMethod: request.paymentMethod,
                    notes: request.notes
                });
            }

            // Send confirmation email (async)
            this.sendOrderConfirmationEmail(userEmail, order);
            
            // ✅ Publish order created event to Kafka
            this.publishOrderCreatedEvent(order, userEmail);
            
            return order;
        } catch (error) {
            logger.error('Checkout failed', { error, userId });
            throw error;
        }
    }

    private async publishOrderCreatedEvent(order: Order, userEmail: string): Promise<void> {
        try {
            const event: OrderCreatedEvent = {
                eventId: uuidv4(),
                orderId: order.id,
                userId: order.userId,
                userEmail: userEmail,
                orderStatus: order.status,
                totalAmount: order.totalAmount,
                currency: order.currency,
                paymentMethod: order.paymentMethod,
                items: order.items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    imageUrl: item.imageUrl,
                    quantity: item.quantity,
                    price: item.price,
                    totalPrice: item.totalPrice,
                })),
                shippingAddress: order.shippingAddress,
                timestamp: new Date().toISOString(),
            };

            await orderKafkaService.publishOrderCreated(event);
            
            logger.info('📨 Order created event published', {
                orderId: order.id,
                userId: order.userId,
                eventId: event.eventId,
            });
        } catch (error) {
            logger.error('Failed to publish order created event', {
                error,
                orderId: order.id,
                userId: order.userId,
            });
            // Don't throw - we don't want to break order creation
        }
    }

    private async publishOrderStatusUpdatedEvent(
        order: Order, 
        oldStatus: OrderStatus, 
        newStatus: OrderStatus, 
        updatedBy?: string
    ): Promise<void> {
        try {
            // Get user info for email
            const userInfo = await userClient.getUserById(order.userId);
            const userEmail = userInfo?.email || '';

            const event: OrderStatusUpdatedEvent = {
                eventId: uuidv4(),
                orderId: order.id,
                userId: order.userId,
                userEmail: userEmail,
                oldStatus: oldStatus,
                newStatus: newStatus,
                totalAmount: order.totalAmount,
                items: order.items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    imageUrl: item.imageUrl,
                    quantity: item.quantity,
                    price: item.price,
                })),
                updatedBy: updatedBy,
                timestamp: new Date().toISOString(),
            };

            await orderKafkaService.publishOrderStatusUpdated(event);
            
            logger.info('📨 Order status updated event published', {
                orderId: order.id,
                userId: order.userId,
                oldStatus,
                newStatus,
                eventId: event.eventId,
            });
        } catch (error) {
            logger.error('Failed to publish order status updated event', {
                error,
                orderId: order.id,
                oldStatus,
                newStatus,
            });
        }
    }

    private async publishOrderCancelledEvent(
        order: Order, 
        reason: string, 
        cancelledBy?: string
    ): Promise<void> {
        try {
            // Get user info for email
            const userInfo = await userClient.getUserById(order.userId);
            const userEmail = userInfo?.email || '';

            const event: OrderCancelledEvent = {
                eventId: uuidv4(),
                orderId: order.id,
                userId: order.userId,
                userEmail: userEmail,
                reason: reason,
                totalAmount: order.totalAmount,
                items: order.items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.price,
                })),
                cancelledBy: cancelledBy,
                timestamp: new Date().toISOString(),
            };

            await orderKafkaService.publishOrderCancelled(event);
            
            logger.info('📨 Order cancelled event published', {
                orderId: order.id,
                userId: order.userId,
                reason,
                eventId: event.eventId,
            });
        } catch (error) {
            logger.error('Failed to publish order cancelled event', {
                error,
                orderId: order.id,
                reason,
            });
        }
    }

    // ✅ Create order from items
    async createOrder(userId: string, request: CreateOrderRequest): Promise<Order> {
        logger.info('Creating order from items', { userId, itemCount: request.items.length });

        // Validate products
        const productIds = request.items.map(item => item.productId);
        const products = await productClient.getProductsBatch(productIds);
        const productMap = new Map(products.map((p: any) => [p.id, p]));

        // Build order items
        let totalAmount = 0;
        const orderItems = request.items.map(item => {
            const product = productMap.get(item.productId);
            if (!product) throw new Error(`Product not found: ${item.productId}`);

            const totalPrice = product.price * item.quantity;
            totalAmount += totalPrice;

            return {
                id: uuidv4(),
                orderId: '',
                productId: item.productId,
                productName: product.name,
                imageUrl: this.getImageUrl(product),
                price: product.price,
                quantity: item.quantity,
                totalPrice
            };
        });

        // Create order
        const order = await orderRepository.createOrder({
            userId,
            totalAmount,
            shippingAddress: request.shippingAddress,
            paymentMethod: request.paymentMethod,
            notes: request.notes,
            items: orderItems
        });

        // Process payment
        await this.processPayment(order);
        return order;
    }

    // ✅ Create order from cart
    async createOrderFromCart(userId: string, request: CreateOrderFromCartRequest): Promise<Order> {
        logger.info('Creating order from cart', { userId });

        // Get cart
        const cartData = await cartClient.getCart(userId);
        if (!cartData.items || cartData.items.length === 0) {
            throw new Error('Cart is empty');
        }

        // Build order items from cart
        let totalAmount = 0;
        const orderItems = cartData.items.map((cartItem: any) => {
            totalAmount += cartItem.total_price;
            return {
                id: uuidv4(),
                orderId: '',
                productId: cartItem.product_id,
                productName: cartItem.product.name,
                imageUrl: this.getImageUrl(cartItem.product),
                price: cartItem.product.price,
                quantity: cartItem.quantity,
                totalPrice: cartItem.total_price
            };
        });

        // Create order
        const order = await orderRepository.createOrder({
            userId,
            totalAmount,
            shippingAddress: request.shippingAddress,
            paymentMethod: request.paymentMethod,
            notes: request.notes,
            items: orderItems
        });

        // Clear cart and process payment
        await Promise.all([
            cartClient.clearCart(userId, 'Order created'),
            this.processPayment(order)
        ]);

        return order;
    }

    // ✅ Get user orders
    async getUserOrders(userId: string, limit: number = 20): Promise<Order[]> {
        return orderRepository.getOrdersByUserId(userId, limit);
    }

    // ✅ Get order by ID
    async getOrderById(orderId: string): Promise<Order> {
        const order = await orderRepository.getOrderById(orderId);
        if (!order) throw new Error('Order not found');
        return order;
    }

    // ✅ Cancel order
    async cancelOrder(orderId: string, userId: string): Promise<Order> {
        const order = await this.getOrderById(orderId);

        if (order.userId !== userId) {
            throw new Error('Unauthorized');
        }

        if (order.status !== OrderStatus.PENDING) {
            throw new Error('Cannot cancel order');
        }

        await orderRepository.updateOrderStatus(orderId, OrderStatus.CANCELLED);
        const cancelledOrder = await this.getOrderById(orderId);
        
        // ✅ Publish order cancelled event to Kafka
        this.publishOrderCancelledEvent(cancelledOrder, 'Cancelled by user', userId);
        
        return cancelledOrder;
    }

    // ✅ Check user purchase
    async hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
        return orderRepository.hasUserPurchasedProduct(userId, productId);
    }

    // ✅ Admin: Get all orders
    async getAllOrders(page: number = 1, limit: number = 20, status?: OrderStatus): Promise<{
        orders: Order[];
        total: number;
        totalPages: number;
        currentPage: number;
    }> {
        return orderRepository.getAllOrders(page, limit, status);
    }

    // ✅ Admin: Update order status
    async updateOrderStatus(orderId: string, newStatus: OrderStatus, adminUserId: string): Promise<Order> {
        const order = await this.getOrderById(orderId);
        const oldStatus = order.status;

        // Validate status transition
        this.validateStatusTransition(oldStatus, newStatus);

        // Update status
        await orderRepository.updateOrderStatus(orderId, newStatus);
        const updatedOrder = await this.getOrderById(orderId);

        // Send email notification
        this.sendStatusUpdateNotification(updatedOrder, oldStatus, newStatus);

        // ✅ Publish order status updated event to Kafka
        this.publishOrderStatusUpdatedEvent(updatedOrder, oldStatus, newStatus, adminUserId);

        logger.info('Order status updated', { orderId, oldStatus, newStatus, adminUserId });
        return updatedOrder;
    }

    // ✅ Admin: Get order stats
    async getOrderStats(): Promise<{
        total: number;
        pending: number;
        confirmed: number;
        shipped: number;
        delivered: number;
        cancelled: number;
        totalRevenue: number;
        averageOrderValue: number;
    }> {
        return orderRepository.getOrderStats();
    }

    // ✅ Admin: Export orders
    async exportOrders(params: {
        status?: OrderStatus;
        dateFrom?: string;
        dateTo?: string;
        format?: 'excel' | 'pdf';
    }): Promise<Buffer> {
        logger.info('Exporting orders', { params });

        try {
            const orders = await orderRepository.getOrdersForExport(params);

            logger.info('Orders retrieved for export', {
                count: orders.length,
                format: params.format
            });

            if (params.format === 'pdf') {
                return await this.generateOrdersPDF(orders);
            } else {
                return await this.generateOrdersExcel(orders);
            }
        } catch (error) {
            logger.error('Failed to export orders', { error, params });
            throw error;
        }
    }

    // ✅ Admin: Resend order email
    async resendOrderEmail(orderId: string, type: 'confirmation' | 'status_update'): Promise<void> {
        const order = await this.getOrderById(orderId);
        const userInfo = await userClient.getUserById(order.userId);

        if (!userInfo?.email) {
            throw new Error('User email not found');
        }

        if (type === 'confirmation') {
            await emailService.sendOrderConfirmation(userInfo.email, order);
        } else {
            await emailService.sendOrderStatusUpdate(userInfo.email, order, order.status, order.status);
        }
    }

    // Private methods
    private validateStatusTransition(oldStatus: OrderStatus, newStatus: OrderStatus): void {
        const validTransitions: Record<OrderStatus, OrderStatus[]> = {
            [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
            [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
            [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
            [OrderStatus.DELIVERED]: [],
            [OrderStatus.CANCELLED]: [],
        };

        const allowedTransitions = validTransitions[oldStatus] || [];
        if (!allowedTransitions.includes(newStatus)) {
            throw new Error(`Invalid status transition from ${oldStatus} to ${newStatus}`);
        }
    }

    private async sendStatusUpdateNotification(order: Order, oldStatus: OrderStatus, newStatus: OrderStatus): Promise<void> {
        try {
            const userInfo = await userClient.getUserById(order.userId);
            if (userInfo?.email) {
                await emailService.sendOrderStatusUpdate(userInfo.email, order, oldStatus, newStatus);
            }
        } catch (error) {
            logger.error('Failed to send status update notification', { error, orderId: order.id });
        }
    }

    private async sendOrderConfirmationEmail(userEmail: string, order: Order): Promise<void> {
        try {
            await emailService.sendOrderConfirmation(userEmail, order);
        } catch (error) {
            logger.error('Failed to send confirmation email', { error, orderId: order.id });
        }
    }

    private getImageUrl(product: any): string {
        return product.images?.[0]?.url || '';
    }

    private async processPayment(order: Order): Promise<void> {
        // Mock payment processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        await Promise.all([
            orderRepository.updatePaymentStatus(order.id, PaymentStatus.PAID),
            orderRepository.updateOrderStatus(order.id, OrderStatus.CONFIRMED)
        ]);
    }

    // Excel/PDF generation methods (simplified)
    private async generateOrdersExcel(orders: Order[]): Promise<Buffer> {
        logger.info('Generating Excel file for orders', { count: orders.length });

        try {
            const workbook = new Workbook();

            // Metadata
            workbook.creator = 'ViMarket Admin';
            workbook.lastModifiedBy = 'ViMarket System';
            workbook.created = new Date();
            workbook.modified = new Date();

            // ✅ Main Orders Sheet
            const ordersWorksheet = workbook.addWorksheet('Danh sách đơn hàng', {
                views: [{ state: 'frozen', ySplit: 1 }] // Freeze header row
            });

            // Define columns
            ordersWorksheet.columns = [
                { header: 'Mã đơn hàng', key: 'orderId', width: 15 },
                { header: 'Mã khách hàng', key: 'userId', width: 25 },
                { header: 'Trạng thái', key: 'status', width: 15 },
                { header: 'Tổng tiền (VND)', key: 'totalAmount', width: 18 },
                { header: 'Phương thức TT', key: 'paymentMethod', width: 20 },
                { header: 'Trạng thái TT', key: 'paymentStatus', width: 15 },
                { header: 'Số sản phẩm', key: 'itemCount', width: 12 },
                { header: 'Tổng số lượng', key: 'totalQuantity', width: 15 },
                { header: 'Thành phố', key: 'city', width: 20 },
                { header: 'Quốc gia', key: 'country', width: 15 },
                { header: 'Ghi chú', key: 'notes', width: 30 },
                { header: 'Ngày tạo', key: 'createdAt', width: 20 },
                { header: 'Cập nhật lần cuối', key: 'updatedAt', width: 20 },
            ];

            // Style header row
            const headerRow = ordersWorksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF366092' }
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.height = 25;

            // Add data
            orders.forEach((order, index) => {
                const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

                const row = ordersWorksheet.addRow({
                    orderId: `#${order.id.slice(-8)}`,
                    userId: order.userId,
                    status: this.getStatusText(order.status),
                    totalAmount: order.totalAmount,
                    paymentMethod: this.getPaymentMethodText(order.paymentMethod),
                    paymentStatus: this.getPaymentStatusText(order.paymentStatus),
                    itemCount: order.items.length,
                    totalQuantity,
                    city: order.shippingAddress.city,
                    country: order.shippingAddress.country,
                    notes: order.notes || '',
                    createdAt: new Date(order.createdAt).toLocaleString('vi-VN'),
                    updatedAt: new Date(order.updatedAt).toLocaleString('vi-VN'),
                });

                // Alternate row colors
                if (index % 2 === 1) {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF8F9FA' }
                    };
                }

                // Format currency
                row.getCell('totalAmount').numFmt = '#,##0 "₫"';
            });

            // Add borders to all cells
            ordersWorksheet.eachRow((row: Row, rowNumber: number) => {
                row.eachCell((cell: Cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
                    };
                });
            });

            // ✅ Order Items Detail Sheet
            const itemsWorksheet = workbook.addWorksheet('Chi tiết sản phẩm', {
                views: [{ state: 'frozen', ySplit: 1 }]
            });

            itemsWorksheet.columns = [
                { header: 'Mã đơn hàng', key: 'orderId', width: 15 },
                { header: 'Mã sản phẩm', key: 'productId', width: 20 },
                { header: 'Tên sản phẩm', key: 'productName', width: 40 },
                { header: 'Đơn giá (VND)', key: 'price', width: 15 },
                { header: 'Số lượng', key: 'quantity', width: 12 },
                { header: 'Thành tiền (VND)', key: 'totalPrice', width: 18 },
            ];

            // Style header
            const itemsHeaderRow = itemsWorksheet.getRow(1);
            itemsHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
            itemsHeaderRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF28A745' }
            };
            itemsHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
            itemsHeaderRow.height = 25;

            // Add items data
            let itemRowIndex = 0;
            orders.forEach(order => {
                order.items.forEach(item => {
                    const row = itemsWorksheet.addRow({
                        orderId: `#${order.id.slice(-8)}`,
                        productId: item.productId,
                        productName: item.productName,
                        price: item.price,
                        quantity: item.quantity,
                        totalPrice: item.totalPrice,
                    });

                    // Alternate row colors
                    if (itemRowIndex % 2 === 1) {
                        row.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF8F9FA' }
                        };
                    }

                    // Format currency
                    row.getCell('price').numFmt = '#,##0 "₫"';
                    row.getCell('totalPrice').numFmt = '#,##0 "₫"';

                    itemRowIndex++;
                });
            });

            // Add borders to items sheet
            itemsWorksheet.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
                    };
                });
            });

            // ✅ Statistics Sheet
            const statsWorksheet = workbook.addWorksheet('Thống kê');
            const stats = this.calculateExportStats(orders);

            // Title
            statsWorksheet.addRow(['BÁO CÁO THỐNG KÊ ĐƠN HÀNG']);
            statsWorksheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF366092' } };
            statsWorksheet.getRow(1).alignment = { horizontal: 'center' };
            statsWorksheet.mergeCells('A1:B1');

            statsWorksheet.addRow([]);
            statsWorksheet.addRow(['Thời gian xuất báo cáo:', new Date().toLocaleString('vi-VN')]);
            statsWorksheet.addRow([]);

            // Stats data
            const statsData = [
                ['Tổng số đơn hàng:', stats.totalOrders],
                ['Đơn hàng chờ xử lý:', stats.pendingOrders],
                ['Đơn hàng đã xác nhận:', stats.confirmedOrders],
                ['Đơn hàng đang giao:', stats.shippedOrders],
                ['Đơn hàng đã giao:', stats.deliveredOrders],
                ['Đơn hàng đã hủy:', stats.cancelledOrders],
                [],
                ['Tổng doanh thu (VND):', stats.totalRevenue],
                ['Giá trị đơn hàng TB (VND):', stats.averageOrderValue],
            ];

            statsData.forEach((data, index) => {
                if (data.length === 0) {
                    statsWorksheet.addRow([]);
                    return;
                }

                const row = statsWorksheet.addRow(data);
                row.getCell(1).font = { bold: true };

                if (data[1] && typeof data[1] === 'number' && data[0].toString().includes('VND')) {
                    row.getCell(2).numFmt = '#,##0 "₫"';
                }
            });

            // Style stats sheet
            statsWorksheet.getColumn(1).width = 25;
            statsWorksheet.getColumn(2).width = 20;

            const buffer = await workbook.xlsx.writeBuffer();

            logger.info('Excel file generated successfully', {
                ordersCount: orders.length,
                bufferSize: buffer.byteLength
            });

            return Buffer.from(buffer);

        } catch (error) {
            logger.error('Failed to generate Excel file', { error });
            throw new Error('Không thể tạo file Excel');
        }
    }

    // ✅ Generate PDF file - Full implementation
    private async generateOrdersPDF(orders: Order[]): Promise<Buffer> {
        logger.info('Generating PDF file for orders', { count: orders.length });

        try {
            const puppeteer = require('puppeteer');
            const htmlContent = this.generateOrdersHTML(orders);

            const browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });

            const page = await browser.newPage();

            // Set viewport and content
            await page.setViewport({ width: 1200, height: 800 });
            await page.setContent(htmlContent, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                },
                displayHeaderFooter: true,
                headerTemplate: `
                    <div style="font-size: 10px; color: #666; width: 100%; text-align: center; padding: 5px;">
                        <span>Báo cáo đơn hàng - ViMarket</span>
                    </div>
                `,
                footerTemplate: `
                    <div style="font-size: 10px; color: #666; width: 100%; text-align: center; padding: 5px;">
                        <span>Trang <span class="pageNumber"></span> / <span class="totalPages"></span> - Xuất lúc: ${new Date().toLocaleString('vi-VN')}</span>
                    </div>
                `
            });

            await browser.close();

            logger.info('PDF file generated successfully', {
                ordersCount: orders.length,
                bufferSize: pdfBuffer.length
            });

            return pdfBuffer;

        } catch (error) {
            logger.error('Failed to generate PDF file', { error });
            throw new Error('Không thể tạo file PDF');
        }
    }

    // ✅ Generate HTML for PDF
    private generateOrdersHTML(orders: Order[]): string {
        const stats = this.calculateExportStats(orders);

        const ordersHTML = orders.map((order, index) => `
            <tr style="${index % 2 === 1 ? 'background-color: #f8f9fa;' : ''}">
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">#${order.id.slice(-8)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${order.userId.slice(0, 20)}...</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">
                    <span style="background: ${this.getStatusColor(order.status)}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">
                        ${this.getStatusText(order.status)}
                    </span>
                </td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 12px; font-weight: bold;">
                    ${this.formatCurrency(order.totalAmount)}
                </td>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">
                    ${this.getPaymentMethodText(order.paymentMethod)}
                </td>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">
                    ${order.items.length} SP (${order.items.reduce((sum, item) => sum + item.quantity, 0)} cái)
                </td>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 11px;">
                    ${order.shippingAddress.city}, ${order.shippingAddress.country}
                </td>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 11px;">
                    ${new Date(order.createdAt).toLocaleDateString('vi-VN')}
                </td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Báo cáo đơn hàng</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        margin: 0; 
                        padding: 20px; 
                        color: #333;
                        line-height: 1.4;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px; 
                        border-bottom: 3px solid #366092;
                        padding-bottom: 15px;
                    }
                    .header h1 {
                        color: #366092;
                        font-size: 24px;
                        margin-bottom: 5px;
                    }
                    .header p {
                        color: #666;
                        font-size: 14px;
                    }
                    .stats { 
                        margin-bottom: 30px; 
                        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); 
                        padding: 20px; 
                        border-radius: 8px; 
                        border: 1px solid #e1e5e9;
                    }
                    .stats h2 {
                        color: #366092;
                        margin-bottom: 15px;
                        font-size: 18px;
                    }
                    .stats-grid { 
                        display: grid; 
                        grid-template-columns: repeat(4, 1fr); 
                        gap: 15px; 
                    }
                    .stat-item {
                        background: white;
                        padding: 12px;
                        border-radius: 6px;
                        border: 1px solid #dee2e6;
                        text-align: center;
                    }
                    .stat-label {
                        font-size: 11px;
                        color: #666;
                        margin-bottom: 4px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .stat-value {
                        font-size: 16px;
                        font-weight: bold;
                        color: #366092;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-top: 20px;
                        background: white;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }
                    th { 
                        background: linear-gradient(135deg, #366092 0%, #4a6fa5 100%); 
                        color: white; 
                        padding: 12px 8px; 
                        text-align: left; 
                        border: 1px solid #2c5282;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    td { 
                        padding: 8px; 
                        border: 1px solid #ddd; 
                        vertical-align: middle;
                    }
                    .currency { 
                        text-align: right; 
                        font-family: 'Courier New', monospace;
                    }
                    .page-break {
                        page-break-before: always;
                    }
                    .summary-box {
                        background: #f8f9fa;
                        border: 2px solid #366092;
                        border-radius: 8px;
                        padding: 15px;
                        margin-top: 20px;
                    }
                    .summary-title {
                        color: #366092;
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📊 BÁO CÁO ĐƠN HÀNG</h1>
                    <p><strong>ViMarket E-commerce Platform</strong></p>
                    <p>Thời gian xuất: ${new Date().toLocaleString('vi-VN')} | Tổng số đơn hàng: ${orders.length}</p>
                </div>

                <div class="stats">
                    <h2>📈 THỐNG KÊ TỔNG QUAN</h2>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">Tổng đơn hàng</div>
                            <div class="stat-value">${stats.totalOrders}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Chờ xử lý</div>
                            <div class="stat-value" style="color: #ffc107;">${stats.pendingOrders}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Đã giao</div>
                            <div class="stat-value" style="color: #28a745;">${stats.deliveredOrders}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Đã hủy</div>
                            <div class="stat-value" style="color: #dc3545;">${stats.cancelledOrders}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Tổng doanh thu</div>
                            <div class="stat-value" style="color: #17a2b8; font-size: 14px;">${this.formatCurrency(stats.totalRevenue)}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Giá trị TB</div>
                            <div class="stat-value" style="color: #6f42c1; font-size: 14px;">${this.formatCurrency(stats.averageOrderValue)}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Đang giao</div>
                            <div class="stat-value" style="color: #6610f2;">${stats.shippedOrders}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Đã xác nhận</div>
                            <div class="stat-value" style="color: #007bff;">${stats.confirmedOrders}</div>
                        </div>
                    </div>
                </div>

                <h2 style="color: #366092; margin-bottom: 15px;">📋 CHI TIẾT ĐƠN HÀNG</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Mã đơn hàng</th>
                            <th>Khách hàng</th>
                            <th>Trạng thái</th>
                            <th>Tổng tiền</th>
                            <th>Thanh toán</th>
                            <th>Sản phẩm</th>
                            <th>Địa chỉ</th>
                            <th>Ngày tạo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ordersHTML}
                    </tbody>
                </table>

                <div class="summary-box">
                    <div class="summary-title">📌 Tóm tắt báo cáo</div>
                    <p><strong>• Tổng số đơn hàng:</strong> ${stats.totalOrders} đơn hàng</p>
                    <p><strong>• Doanh thu:</strong> ${this.formatCurrency(stats.totalRevenue)}</p>
                    <p><strong>• Tỷ lệ thành công:</strong> ${stats.totalOrders > 0 ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100) : 0}%</p>
                    <p><strong>• Tỷ lệ hủy:</strong> ${stats.totalOrders > 0 ? Math.round((stats.cancelledOrders / stats.totalOrders) * 100) : 0}%</p>
                    <p style="margin-top: 10px; font-size: 12px; color: #666;">
                        <em>Báo cáo được tạo tự động bởi hệ thống ViMarket. Mọi thông tin trong báo cáo này là chính xác tại thời điểm xuất.</em>
                    </p>
                </div>
            </body>
            </html>
        `;
    }

    // ✅ Helper methods for export
    private calculateExportStats(orders: Order[]) {
        const stats = {
            totalOrders: orders.length,
            pendingOrders: 0,
            confirmedOrders: 0,
            shippedOrders: 0,
            deliveredOrders: 0,
            cancelledOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0
        };

        orders.forEach(order => {
            switch (order.status) {
                case 'pending':
                    stats.pendingOrders++;
                    break;
                case 'confirmed':
                    stats.confirmedOrders++;
                    stats.totalRevenue += order.totalAmount;
                    break;
                case 'shipped':
                    stats.shippedOrders++;
                    stats.totalRevenue += order.totalAmount;
                    break;
                case 'delivered':
                    stats.deliveredOrders++;
                    stats.totalRevenue += order.totalAmount;
                    break;
                case 'cancelled':
                    stats.cancelledOrders++;
                    break;
            }
        });

        const revenueGeneratingOrders = stats.confirmedOrders + stats.shippedOrders + stats.deliveredOrders;
        stats.averageOrderValue = revenueGeneratingOrders > 0 ? stats.totalRevenue / revenueGeneratingOrders : 0;

        return stats;
    }

    private getStatusText(status: string): string {
        const statusMap: Record<string, string> = {
            'pending': 'Chờ xử lý',
            'confirmed': 'Đã xác nhận',
            'shipped': 'Đang giao hàng',
            'delivered': 'Đã giao hàng',
            'cancelled': 'Đã hủy'
        };
        return statusMap[status] || status;
    }

    private getStatusColor(status: string): string {
        const colorMap: Record<string, string> = {
            'pending': '#ffc107',
            'confirmed': '#007bff',
            'shipped': '#6610f2',
            'delivered': '#28a745',
            'cancelled': '#dc3545'
        };
        return colorMap[status] || '#6c757d';
    }

    private getPaymentMethodText(method: string): string {
        const methodMap: Record<string, string> = {
            'credit_card': 'Thẻ tín dụng',
            'debit_card': 'Thẻ ghi nợ',
            'bank_transfer': 'Chuyển khoản',
            'cash_on_delivery': 'COD',
            'paypal': 'PayPal'
        };
        return methodMap[method] || method;
    }

    private getPaymentStatusText(status: string): string {
        const statusMap: Record<string, string> = {
            'pending': 'Chờ thanh toán',
            'paid': 'Đã thanh toán',
            'failed': 'Thất bại'
        };
        return statusMap[status] || status;
    }

    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }
}

export const orderService = new OrderService();