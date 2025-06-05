import { Resend } from 'resend';
import type { Order, Customer, Product } from '@shared/schema';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class EmailService {
  private fromEmail = 'orders@geelonggaragedoors.com.au';
  private adminEmail = 'info@geelonggaragedoors.com.au';

  async sendEmail(data: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await resend.emails.send({
        from: data.from || this.fromEmail,
        to: data.to,
        subject: data.subject,
        html: data.html,
      });

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
      };
    }
  }

  async sendOrderConfirmation(order: Order, customer: Customer, items: any[]): Promise<void> {
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product?.name || 'Product'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            Order Confirmation
          </h1>
          
          <p>Dear ${customer.firstName} ${customer.lastName},</p>
          
          <p>Thank you for your order! We've received your order and will begin processing it shortly.</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Order Number:</strong> ${order.id}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt || new Date()).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>
          
          <h3>Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Product</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e2e8f0;">Quantity</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e2e8f0;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="text-align: right; margin: 20px 0;">
            <p style="font-size: 18px; font-weight: bold;">
              Total: $${parseFloat(order.total).toFixed(2)}
            </p>
          </div>
          
          <div style="background: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0369a1;">What's Next?</h3>
            <p>We'll send you another email when your order ships with tracking information.</p>
            <p>If you have any questions, please contact us at (03) 5221 8999 or reply to this email.</p>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; color: #64748b;">
            <p><strong>Geelong Garage Doors</strong></p>
            <p>Professional garage door solutions across Geelong and surrounding areas</p>
            <p>Phone: (03) 5221 8999 | Email: info@geelonggaragedoors.com.au</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: customer.email,
      subject: `Order Confirmation - Order #${order.id}`,
      html,
    });
  }

  async sendOrderStatusUpdate(order: Order, customer: Customer, oldStatus: string): Promise<void> {
    const statusMessages = {
      'pending': 'Your order is being prepared for processing.',
      'processing': 'Your order is currently being processed.',
      'shipped': 'Great news! Your order has been shipped.',
      'delivered': 'Your order has been delivered.',
      'cancelled': 'Your order has been cancelled.',
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Status Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            Order Status Update
          </h1>
          
          <p>Dear ${customer.firstName} ${customer.lastName},</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order #${order.id}</h3>
            <p><strong>Status changed from:</strong> ${oldStatus} → <strong style="color: #059669;">${order.status}</strong></p>
            <p>${statusMessages[order.status as keyof typeof statusMessages] || 'Your order status has been updated.'}</p>
          </div>
          
          <p>You can track your order status anytime by visiting our website or contacting us directly.</p>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; color: #64748b;">
            <p><strong>Geelong Garage Doors</strong></p>
            <p>Phone: (03) 5221 8999 | Email: info@geelonggaragedoors.com.au</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: customer.email,
      subject: `Order Update - Order #${order.id}`,
      html,
    });
  }

  async sendAdminOrderNotification(order: Order, customer: Customer, type: 'new' | 'updated'): Promise<void> {
    const subject = type === 'new' ? 'New Order Received' : 'Order Updated';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
            ${subject}
          </h1>
          
          <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Customer:</strong> ${customer.firstName} ${customer.lastName}</p>
            <p><strong>Email:</strong> ${customer.email}</p>
            <p><strong>Phone:</strong> ${customer.phone || 'Not provided'}</p>
            <p><strong>Total Amount:</strong> $${parseFloat(order.total).toFixed(2)}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt || new Date()).toLocaleDateString()}</p>
          </div>
          
          <p><strong>Action Required:</strong> Please review this order in the admin panel and take appropriate action.</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="https://geelonggaragedoors.com.au/admin/orders" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Order in Admin Panel
            </a>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: this.adminEmail,
      subject: `${subject} - Order #${order.id}`,
      html,
    });
  }
}

export const emailService = new EmailService();