import { Resend } from 'resend';
import type { Order, Customer, Product, InsertCustomerTransaction } from '@shared/schema';
import { storage } from './storage';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export interface OrderEmailData {
  order: Order;
  customer: Customer;
  items: any[];
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
}

export class EmailService {
  private fromEmail = 'orders@geelonggaragedoors.com';
  private adminEmail = 'info@geelonggaragedoors.com';

  private async trackTransaction(transactionData: Omit<InsertCustomerTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      await storage.createCustomerTransaction(transactionData);
    } catch (error) {
      console.error('Failed to track transaction:', error);
    }
  }

  async sendEmail(data: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('Attempting to send email:', {
        from: data.from || 'noreply@geelonggaragedoors.com',
        to: data.to,
        subject: data.subject
      });

      const emailPayload: any = {
        from: data.from || 'noreply@geelonggaragedoors.com',
        to: [data.to],
        subject: data.subject,
        html: data.html,
      };

      if (data.attachments && data.attachments.length > 0) {
        emailPayload.attachments = data.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          type: att.contentType
        }));
      }

      const { data: result, error } = await resend.emails.send(emailPayload);

      console.log('Resend API response:', { result, error });

      if (error) {
        console.error('Resend API error:', error);
        return {
          success: false,
          error: error.message || 'Email sending failed',
        };
      }

      return {
        success: true,
        messageId: result?.id,
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
      };
    }
  }

  // Generate comprehensive invoice/receipt HTML
  private generateInvoiceHtml(emailData: OrderEmailData, documentType: 'invoice' | 'receipt'): string {
    const { order, customer, items, totals } = emailData;
    const isReceipt = documentType === 'receipt';
    
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.product?.name || 'Product'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${parseFloat(item.price).toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">$${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const currentDate = new Date().toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${isReceipt ? 'Receipt' : 'Invoice'} - ${order.id}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0;">
        <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px; background: white;">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #1e40af;">
            <h1 style="color: #1e40af; margin: 0; font-size: 2.5rem; font-weight: 700;">Geelong Garage Doors</h1>
            <p style="color: #6b7280; margin: 8px 0 0; font-size: 1.1rem;">Professional garage door solutions across Geelong and surrounding areas</p>
          </div>

          <!-- Document Header -->
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px;">
            <div>
              <h2 style="color: #1e40af; margin: 0; font-size: 2rem; font-weight: 600;">${isReceipt ? 'RECEIPT' : 'INVOICE'}</h2>
              <p style="color: #6b7280; margin: 8px 0 0; font-size: 1.1rem;">${isReceipt ? 'Payment Confirmation' : 'Order Confirmation'}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; color: #374151; font-size: 1rem;"><strong>Order #:</strong> ${order.id}</p>
              <p style="margin: 4px 0 0; color: #374151; font-size: 1rem;"><strong>Date:</strong> ${currentDate}</p>
              ${isReceipt ? `<p style="margin: 4px 0 0; color: #10b981; font-size: 1rem; font-weight: 600;">✓ PAID</p>` : ''}
            </div>
          </div>

          <!-- Customer & Business Info -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
            <div style="flex: 1; margin-right: 40px;">
              <h3 style="color: #1f2937; margin: 0 0 12px; font-size: 1.2rem; font-weight: 600;">Bill To:</h3>
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #1e40af;">
                <p style="margin: 0; font-weight: 600; color: #1f2937;">${customer.firstName} ${customer.lastName}</p>
                <p style="margin: 4px 0 0; color: #6b7280;">${customer.email}</p>
                <p style="margin: 4px 0 0; color: #6b7280;">${customer.phone || 'N/A'}</p>
                <p style="margin: 8px 0 0; color: #6b7280;">
                  ${order.shippingAddress}<br>
                  ${order.shippingCity}, ${order.shippingState} ${order.shippingPostcode}
                </p>
              </div>
            </div>
            
            <div style="flex: 1;">
              <h3 style="color: #1f2937; margin: 0 0 12px; font-size: 1.2rem; font-weight: 600;">From:</h3>
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #1e40af;">
                <p style="margin: 0; font-weight: 600; color: #1f2937;">Geelong Garage Doors</p>
                <p style="margin: 4px 0 0; color: #6b7280;">info@geelonggaragedoors.com</p>
                <p style="margin: 4px 0 0; color: #6b7280;">(03) 5221 8999</p>
                <p style="margin: 8px 0 0; color: #6b7280;">Geelong, VIC 3220</p>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <div style="margin-bottom: 40px;">
            <h3 style="color: #1f2937; margin: 0 0 16px; font-size: 1.2rem; font-weight: 600;">Order Items:</h3>
            <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: #1e40af; color: white;">
                  <th style="padding: 16px; text-align: left; font-weight: 600;">Product</th>
                  <th style="padding: 16px; text-align: center; font-weight: 600;">Qty</th>
                  <th style="padding: 16px; text-align: right; font-weight: 600;">Price</th>
                  <th style="padding: 16px; text-align: right; font-weight: 600;">Total</th>
                </tr>
              </thead>
              <tbody style="background: white;">
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Totals -->
          <div style="margin-bottom: 40px;">
            <div style="max-width: 400px; margin-left: auto; background: #f9fafb; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280;">Subtotal:</span>
                <span style="color: #1f2937; font-weight: 600;">$${totals.subtotal.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280;">Shipping:</span>
                <span style="color: #1f2937; font-weight: 600;">$${totals.shipping.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
                <span style="color: #6b7280;">GST (10%):</span>
                <span style="color: #1f2937; font-weight: 600;">$${totals.tax.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: 700;">
                <span style="color: #1f2937;">Total:</span>
                <span style="color: #1e40af;">$${totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Payment Info -->
          <div style="background: ${isReceipt ? '#d1fae5' : '#fef3c7'}; padding: 20px; border-radius: 8px; margin-bottom: 40px; border-left: 4px solid ${isReceipt ? '#10b981' : '#f59e0b'};">
            <h3 style="margin: 0 0 8px; color: ${isReceipt ? '#065f46' : '#92400e'}; font-size: 1.1rem; font-weight: 600;">
              ${isReceipt ? '✓ Payment Confirmed' : 'Payment Information'}
            </h3>
            <p style="margin: 0; color: ${isReceipt ? '#047857' : '#a16207'}; font-size: 1rem;">
              ${isReceipt 
                ? `Payment received via ${order.paymentMethod.toUpperCase()} on ${currentDate}` 
                : `Payment method: ${order.paymentMethod.toUpperCase()}`
              }
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 40px; border-top: 1px solid #e2e8f0;">
            <p style="color: #6b7280; margin: 0; font-size: 0.9rem;">
              Thank you for choosing Geelong Garage Doors for your garage door needs.
            </p>
            <p style="color: #6b7280; margin: 8px 0 0; font-size: 0.9rem;">
              For support, contact us at <a href="mailto:info@geelonggaragedoors.com" style="color: #1e40af; text-decoration: none;">info@geelonggaragedoors.com</a> or call (03) 5221 8999
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send order confirmation email (invoice)
  async sendOrderConfirmation(emailData: OrderEmailData): Promise<void> {
    const { order, customer, totals } = emailData;
    const html = this.generateInvoiceHtml(emailData, 'invoice');

    const emailResult = await this.sendEmail({
      from: this.fromEmail,
      to: customer.email,
      subject: `Order Confirmation - Invoice #${order.id} - Geelong Garage Doors`,
      html
    });

    // Track the transaction
    if (emailResult.success) {
      await this.trackTransaction({
        customerId: customer.id,
        orderId: order.id,
        type: 'order_confirmation',
        amount: totals.total,
        description: `Order confirmation email sent for order #${order.id}`,
        paymentMethod: order.paymentMethod,
        transactionId: emailResult.messageId,
        status: 'completed',
        emailSentAt: new Date(),
      });
    }
  }

  // Send payment receipt
  async sendPaymentReceipt(emailData: OrderEmailData): Promise<void> {
    const { order, customer, totals } = emailData;
    const html = this.generateInvoiceHtml(emailData, 'receipt');

    const emailResult = await this.sendEmail({
      from: this.fromEmail,
      to: customer.email,
      subject: `Payment Receipt - Order #${order.id} - Geelong Garage Doors`,
      html
    });

    // Track the transaction
    if (emailResult.success) {
      await this.trackTransaction({
        customerId: customer.id,
        orderId: order.id,
        type: 'payment_receipt',
        amount: totals.total,
        description: `Payment receipt email sent for order #${order.id}`,
        paymentMethod: order.paymentMethod,
        transactionId: emailResult.messageId,
        status: 'completed',
        emailSentAt: new Date(),
      });
    }
  }

  // Send comprehensive order status update
  async sendOrderStatusUpdate(emailData: OrderEmailData, oldStatus: string, newStatus: string): Promise<void> {
    const { order, customer } = emailData;
    
    const statusInfo = {
      pending: { 
        title: 'Order Received', 
        message: 'Your order has been received and is being prepared for processing.',
        color: '#f59e0b',
        icon: '📋'
      },
      processing: { 
        title: 'Order Processing', 
        message: 'Your order is currently being processed and prepared for dispatch.',
        color: '#3b82f6',
        icon: '⚙️'
      },
      shipped: { 
        title: 'Order Shipped', 
        message: 'Great news! Your order has been shipped and is on its way to you.',
        color: '#10b981',
        icon: '🚚'
      },
      delivered: { 
        title: 'Order Delivered', 
        message: 'Your order has been successfully delivered. Thank you for your business!',
        color: '#059669',
        icon: '✅'
      },
      cancelled: { 
        title: 'Order Cancelled', 
        message: 'Your order has been cancelled. If you have any questions, please contact us.',
        color: '#ef4444',
        icon: '❌'
      }
    };

    const currentStatus = statusInfo[newStatus as keyof typeof statusInfo] || statusInfo.pending;
    const currentDate = new Date().toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Status Update - ${order.id}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background: white;">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #1e40af;">
            <h1 style="color: #1e40af; margin: 0; font-size: 2rem; font-weight: 700;">Geelong Garage Doors</h1>
            <p style="color: #6b7280; margin: 8px 0 0; font-size: 1rem;">Order Status Update</p>
          </div>

          <!-- Status Update -->
          <div style="background: ${currentStatus.color}15; padding: 30px; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid ${currentStatus.color}; text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 16px;">${currentStatus.icon}</div>
            <h2 style="color: ${currentStatus.color}; margin: 0 0 12px; font-size: 1.5rem; font-weight: 600;">${currentStatus.title}</h2>
            <p style="color: #374151; margin: 0; font-size: 1.1rem;">${currentStatus.message}</p>
          </div>

          <!-- Order Details -->
          <div style="background: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 16px; font-size: 1.2rem; font-weight: 600;">Order Details</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <p style="margin: 0; color: #6b7280; font-size: 0.9rem;">Order Number</p>
                <p style="margin: 4px 0 0; color: #1f2937; font-weight: 600;">${order.id}</p>
              </div>
              <div>
                <p style="margin: 0; color: #6b7280; font-size: 0.9rem;">Status Updated</p>
                <p style="margin: 4px 0 0; color: #1f2937; font-weight: 600;">${currentDate}</p>
              </div>
              <div>
                <p style="margin: 0; color: #6b7280; font-size: 0.9rem;">Order Total</p>
                <p style="margin: 4px 0 0; color: #1f2937; font-weight: 600;">$${parseFloat(order.total).toFixed(2)}</p>
              </div>
              <div>
                <p style="margin: 0; color: #6b7280; font-size: 0.9rem;">Payment Method</p>
                <p style="margin: 4px 0 0; color: #1f2937; font-weight: 600;">${order.paymentMethod.toUpperCase()}</p>
              </div>
            </div>
          </div>

          <!-- Next Steps -->
          ${newStatus === 'shipped' ? `
            <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #10b981;">
              <h3 style="margin: 0 0 8px; color: #065f46; font-size: 1.1rem; font-weight: 600;">📦 Tracking Information</h3>
              <p style="margin: 0; color: #047857; font-size: 1rem;">Your order is on its way! You can track its progress using the tracking number provided separately.</p>
            </div>
          ` : ''}

          <!-- Support -->
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 8px; color: #1f2937; font-size: 1.1rem; font-weight: 600;">Need Help?</h3>
            <p style="margin: 0; color: #6b7280; font-size: 1rem;">
              If you have any questions about your order, please don't hesitate to contact us at 
              <a href="mailto:info@geelonggaragedoors.com" style="color: #1e40af; text-decoration: none;">info@geelonggaragedoors.com</a> 
              or call (03) 5221 8999
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 30px; border-top: 1px solid #e2e8f0;">
            <p style="color: #6b7280; margin: 0; font-size: 0.9rem;">
              Thank you for choosing Geelong Garage Doors for your garage door needs.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResult = await this.sendEmail({
      from: this.fromEmail,
      to: customer.email,
      subject: `Order Status Update: ${currentStatus.title} - Order #${order.id}`,
      html
    });

    // Track the transaction
    if (emailResult.success) {
      await this.trackTransaction({
        customerId: customer.id,
        orderId: order.id,
        type: 'status_update',
        amount: parseFloat(order.total),
        description: `Order status updated from ${oldStatus} to ${newStatus}`,
        paymentMethod: order.paymentMethod,
        transactionId: emailResult.messageId,
        status: 'completed',
        emailSentAt: new Date(),
      });
    }
  }

  // Send admin notification
  async sendAdminOrderNotification(order: Order, customer: Customer, type: 'new' | 'updated'): Promise<void> {
    const isNew = type === 'new';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${isNew ? 'New Order' : 'Order Updated'} - ${order.id}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            ${isNew ? '🛒 New Order Received' : '📝 Order Updated'}
          </h1>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Order Number:</strong> ${order.id}</p>
            <p><strong>Customer:</strong> ${customer.firstName} ${customer.lastName}</p>
            <p><strong>Email:</strong> ${customer.email}</p>
            <p><strong>Phone:</strong> ${customer.phone || 'N/A'}</p>
            <p><strong>Total:</strong> $${parseFloat(order.total).toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>
          
          <div style="background: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0369a1;">Shipping Address</h3>
            <p style="margin: 0;">
              ${order.shippingAddress}<br>
              ${order.shippingCity}, ${order.shippingState} ${order.shippingPostcode}
            </p>
          </div>
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="https://geelonggaragedoors.com/admin/orders" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View in Admin Dashboard
            </a>
          </p>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      from: this.fromEmail,
      to: this.adminEmail,
      subject: `${isNew ? 'New Order' : 'Order Updated'} #${order.id} - $${parseFloat(order.total).toFixed(2)}`,
      html
    });
  }

  // Send enquiry notification
  async sendEnquiryNotification(enquiry: any): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Enquiry - ${enquiry.subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            💬 New Customer Enquiry
          </h1>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Contact Details</h3>
            <p><strong>Name:</strong> ${enquiry.name}</p>
            <p><strong>Email:</strong> ${enquiry.email}</p>
            <p><strong>Phone:</strong> ${enquiry.phone || 'N/A'}</p>
            <p><strong>Subject:</strong> ${enquiry.subject}</p>
          </div>
          
          <div style="background: #fffbeb; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #92400e;">Message</h3>
            <p style="margin: 0; white-space: pre-wrap;">${enquiry.message}</p>
          </div>
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="mailto:${enquiry.email}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reply to Customer
            </a>
          </p>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      from: this.fromEmail,
      to: this.adminEmail,
      subject: `New Enquiry: ${enquiry.subject} - ${enquiry.name}`,
      html
    });
  }
}

export const emailService = new EmailService();