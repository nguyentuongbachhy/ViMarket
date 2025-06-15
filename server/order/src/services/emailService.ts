import { Order } from '@/types';
import { Logger } from '@/utils/logger';
import nodemailer from 'nodemailer';

const logger = new Logger('EmailService');

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendOrderConfirmation(userEmail: string, order: Order): Promise<void> {
        try {
            const emailContent = this.generateOrderConfirmationEmail(order);

            await this.transporter.sendMail({
                from: process.env.SMTP_FROM || 'noreply@vimarket.com',
                to: userEmail,
                subject: `Xác nhận đơn hàng #${order.id.slice(-8)}`,
                html: emailContent
            });

            logger.info('Order confirmation email sent', {
                orderId: order.id,
                userEmail,
                totalAmount: order.totalAmount
            });
        } catch (error) {
            logger.error('Failed to send order confirmation email', {
                error,
                orderId: order.id,
                userEmail
            });
        }
    }

    private generateOrderConfirmationEmail(order: Order): string {
        const itemsHtml = order.items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <div style="display: flex; align-items: center;">
                        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.productName}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; border-radius: 4px;">` : ''}
                        <div>
                            <strong>${item.productName}</strong><br>
                            <span style="color: #666;">Số lượng: ${item.quantity}</span>
                        </div>
                    </div>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    ${this.formatCurrency(item.totalPrice)}
                </td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Xác nhận đơn hàng</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h1 style="color: #28a745; margin: 0;">✅ Đơn hàng đã được xác nhận!</h1>
                    <p style="margin: 10px 0 0 0;">Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.</p>
                </div>

                <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <h2 style="margin-top: 0; color: #495057;">Thông tin đơn hàng</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Mã đơn hàng:</td>
                            <td style="padding: 8px 0;">#${order.id.slice(-8)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Ngày đặt:</td>
                            <td style="padding: 8px 0;">${new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Trạng thái:</td>
                            <td style="padding: 8px 0;">
                                <span style="background: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                                    ${this.getStatusText(order.status)}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Thanh toán:</td>
                            <td style="padding: 8px 0;">${this.getPaymentMethodText(order.paymentMethod)}</td>
                        </tr>
                    </table>
                </div>

                <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <h2 style="margin-top: 0; color: #495057;">Sản phẩm đã đặt</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${itemsHtml}
                        <tr style="border-top: 2px solid #dee2e6;">
                            <td style="padding: 15px 10px; font-weight: bold; font-size: 16px;">Tổng cộng:</td>
                            <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 16px; color: #dc3545;">
                                ${this.formatCurrency(order.totalAmount)}
                            </td>
                        </tr>
                    </table>
                </div>

                <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <h2 style="margin-top: 0; color: #495057;">Địa chỉ giao hàng</h2>
                    <p style="margin: 0; line-height: 1.8;">
                        ${order.shippingAddress.street}<br>
                        ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
                        ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}
                    </p>
                </div>

                ${order.notes ? `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: #856404;">Ghi chú đơn hàng:</h3>
                    <p style="margin: 0;">${order.notes}</p>
                </div>
                ` : ''}

                <div style="background: #e9ecef; padding: 20px; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; color: #6c757d;">
                        Cảm ơn bạn đã tin tướng và mua sắm tại cửa hàng của chúng tôi!<br>
                        Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ: <strong>support@vimarket.com</strong>
                    </p>
                </div>
            </body>
            </html>
        `;
    }

    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
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

    private getPaymentMethodText(method: string): string {
        const methodMap: Record<string, string> = {
            'credit_card': 'Thẻ tín dụng',
            'debit_card': 'Thẻ ghi nợ',
            'bank_transfer': 'Chuyển khoản ngân hàng',
            'cash_on_delivery': 'Thanh toán khi nhận hàng',
            'paypal': 'PayPal'
        };
        return methodMap[method] || method;
    }
}

export const emailService = new EmailService();