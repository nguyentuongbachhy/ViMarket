import { Order, OrderStatus } from '@/types';
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

    // Send order status update email
    async sendOrderStatusUpdate(userEmail: string, order: Order, oldStatus: OrderStatus, newStatus: OrderStatus): Promise<void> {
        try {
            const emailContent = this.generateOrderStatusUpdateEmail(order, oldStatus, newStatus);
            const subject = this.getStatusUpdateSubject(newStatus, order.id);

            await this.transporter.sendMail({
                from: process.env.SMTP_FROM || 'noreply@vimarket.com',
                to: userEmail,
                subject,
                html: emailContent
            });

            logger.info('Order status update email sent', {
                orderId: order.id,
                userEmail,
                oldStatus,
                newStatus
            });
        } catch (error) {
            logger.error('Failed to send order status update email', {
                error,
                orderId: order.id,
                userEmail,
                oldStatus,
                newStatus
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

    // Generate order status update email
    private generateOrderStatusUpdateEmail(order: Order, oldStatus: OrderStatus, newStatus: OrderStatus): string {
        const statusInfo = this.getStatusInfo(newStatus);

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Cập nhật đơn hàng</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: ${statusInfo.bgColor}; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h1 style="color: ${statusInfo.textColor}; margin: 0;">${statusInfo.icon} ${statusInfo.title}</h1>
                    <p style="margin: 10px 0 0 0; color: ${statusInfo.textColor};">${statusInfo.description}</p>
                </div>

                <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <h2 style="margin-top: 0; color: #495057;">Thông tin đơn hàng</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Mã đơn hàng:</td>
                            <td style="padding: 8px 0;">#${order.id.slice(-8)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Trạng thái cũ:</td>
                            <td style="padding: 8px 0;">
                                <span style="background: #e9ecef; color: #6c757d; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-decoration: line-through;">
                                    ${this.getStatusText(oldStatus)}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Trạng thái mới:</td>
                            <td style="padding: 8px 0;">
                                <span style="background: ${statusInfo.badgeColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                                    ${this.getStatusText(newStatus)}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Cập nhật lúc:</td>
                            <td style="padding: 8px 0;">${new Date().toLocaleString('vi-VN')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Tổng tiền:</td>
                            <td style="padding: 8px 0; font-weight: bold; color: #dc3545;">
                                ${this.formatCurrency(order.totalAmount)}
                            </td>
                        </tr>
                    </table>
                </div>

                ${this.getNextStepsSection(newStatus)}

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

    private getStatusInfo(status: OrderStatus): {
        icon: string;
        title: string;
        description: string;
        bgColor: string;
        textColor: string;
        badgeColor: string;
    } {
        switch (status) {
            case OrderStatus.CONFIRMED:
                return {
                    icon: '✅',
                    title: 'Đơn hàng đã được xác nhận',
                    description: 'Chúng tôi đã xác nhận đơn hàng của bạn và đang chuẩn bị hàng.',
                    bgColor: '#d4edda',
                    textColor: '#155724',
                    badgeColor: '#28a745'
                };
            case OrderStatus.SHIPPED:
                return {
                    icon: '🚚',
                    title: 'Đơn hàng đang được giao',
                    description: 'Đơn hàng của bạn đã được giao cho đơn vị vận chuyển.',
                    bgColor: '#d1ecf1',
                    textColor: '#0c5460',
                    badgeColor: '#17a2b8'
                };
            case OrderStatus.DELIVERED:
                return {
                    icon: '🎉',
                    title: 'Đơn hàng đã được giao thành công',
                    description: 'Đơn hàng của bạn đã được giao thành công. Cảm ơn bạn đã mua sắm!',
                    bgColor: '#fff3cd',
                    textColor: '#856404',
                    badgeColor: '#ffc107'
                };
            case OrderStatus.CANCELLED:
                return {
                    icon: '❌',
                    title: 'Đơn hàng đã được hủy',
                    description: 'Đơn hàng của bạn đã được hủy theo yêu cầu.',
                    bgColor: '#f8d7da',
                    textColor: '#721c24',
                    badgeColor: '#dc3545'
                };
            default:
                return {
                    icon: '📦',
                    title: 'Cập nhật đơn hàng',
                    description: 'Đơn hàng của bạn đã được cập nhật.',
                    bgColor: '#e2e3e5',
                    textColor: '#383d41',
                    badgeColor: '#6c757d'
                };
        }
    }

    private getNextStepsSection(status: OrderStatus): string {
        switch (status) {
            case OrderStatus.CONFIRMED:
                return `
                <div style="background: #e7f3ff; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: #0c5460;">Bước tiếp theo:</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Chúng tôi sẽ chuẩn bị và đóng gói sản phẩm</li>
                        <li>Bạn sẽ nhận được thông báo khi hàng được giao cho đơn vị vận chuyển</li>
                        <li>Thời gian giao hàng dự kiến: 2-5 ngày làm việc</li>
                    </ul>
                </div>
                `;
            case OrderStatus.SHIPPED:
                return `
                <div style="background: #e7f3ff; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: #0c5460;">Theo dõi đơn hàng:</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Đơn hàng đang trên đường giao đến bạn</li>
                        <li>Vui lòng chuẩn bị để nhận hàng</li>
                        <li>Kiểm tra kỹ sản phẩm khi nhận hàng</li>
                    </ul>
                </div>
                `;
            case OrderStatus.DELIVERED:
                return `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: #856404;">Cảm ơn bạn đã mua sắm!</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Nếu có vấn đề với sản phẩm, vui lòng liên hệ trong vòng 7 ngày</li>
                        <li>Đánh giá sản phẩm để giúp khách hàng khác</li>
                        <li>Theo dõi các khuyến mãi mới nhất</li>
                    </ul>
                </div>
                `;
            default:
                return '';
        }
    }

    private getStatusUpdateSubject(status: OrderStatus, orderId: string): string {
        const orderCode = orderId.slice(-8);
        switch (status) {
            case OrderStatus.CONFIRMED:
                return `✅ Đơn hàng #${orderCode} đã được xác nhận`;
            case OrderStatus.SHIPPED:
                return `🚚 Đơn hàng #${orderCode} đang được giao`;
            case OrderStatus.DELIVERED:
                return `🎉 Đơn hàng #${orderCode} đã giao thành công`;
            case OrderStatus.CANCELLED:
                return `❌ Đơn hàng #${orderCode} đã được hủy`;
            default:
                return `📦 Cập nhật đơn hàng #${orderCode}`;
        }
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