import sgMail from '@sendgrid/mail';
import { db } from './db';
import { orders } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY environment variable is not set');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid API key configured successfully');
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  async sendEmail(options: EmailOptions) {
    console.log('=== SENDING EMAIL VIA SENDGRID ===');
    console.log('From: orders@geelonggaragedoors.com');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    
    try {
      const msg = {
        to: options.to,
        from: 'orders@geelonggaragedoors.com',
        subject: options.subject,
        html: options.html,
      };

      const result = await sgMail.send(msg);
      console.log('Email sent successfully via SendGrid:', result[0].statusCode);
      return { success: true, id: result[0].headers['x-message-id'] };
    } catch (error) {
      console.error('Failed to send email via SendGrid:', error);
      return { success: false, error: String(error) };
    }
  }
  
  async sendTestEmail(to: string, template?: any) {
    if (!template) {
      return this.sendEmail({
        to,
        subject: 'Test Email from Geelong Garage Doors',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Test Email</h2>
            <p>This is a test email from Geelong Garage Doors.</p>
            <p>If you received this email, the email system is working correctly.</p>
            <p>Best regards,<br>Geelong Garage Doors Team</p>
          </div>
        `
      });
    }

    // Generate sample data based on template type
    const sampleData = this.generateSampleData(template.templateType);
    
    // Replace variables in template
    const processedSubject = this.processTemplate(template.subject, sampleData);
    const processedHtml = this.processTemplate(template.htmlContent, sampleData);
    
    return this.sendEmail({
      to,
      subject: `[TEST] ${processedSubject}`,
      html: `
        <div style="border: 3px solid #f59e0b; padding: 10px; margin-bottom: 20px; background: #fef3c7;">
          <h3 style="color: #92400e; margin: 0;">🧪 TEST EMAIL - Template: ${template.name}</h3>
          <p style="margin: 5px 0 0 0; color: #92400e; font-size: 14px;">This is a test of your email template with sample data.</p>
        </div>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${processedHtml}
        </div>
      `
    });
  }

  private generateSampleData(templateType: string): Record<string, string> {
    const baseData = {
      customer_name: "John Smith",
      customer_email: "john.smith@example.com",
      order_number: "GGD-2025-001",
      order_date: new Date().toLocaleDateString(),
      total_amount: "1,250.00",
      admin_link: "https://geelonggaragedoors.com/admin/dashboard"
    };

    switch (templateType) {
      case 'customer':
        return {
          ...baseData,
          shipping_address: "123 Main Street\nGeelong VIC 3220\nAustralia",
          order_items: "• Garage Door Remote Control x2\n• Steel Garage Door (White) x1\n• Installation Service x1",
          estimated_delivery: "3-5 business days",
          shipping_method: "Standard Delivery",
          reset_link: "https://geelonggaragedoors.com/reset-password?token=sample123"
        };
      
      case 'staff':
        return {
          ...baseData,
          product_name: "Steel Garage Door - White",
          current_stock: "3",
          minimum_stock: "10",
          product_sku: "SGD-WHT-001"
        };
      
      case 'admin':
        return {
          ...baseData,
          report_date: new Date().toLocaleDateString(),
          total_orders: "12",
          total_revenue: "15,750.00",
          average_order_value: "1,312.50",
          new_customers: "4",
          top_products: "• Steel Garage Door (White) - 8 units\n• Garage Door Remote - 15 units\n• Installation Service - 6 units",
          alert_type: "Database Connection Warning",
          severity: "Medium",
          alert_time: new Date().toLocaleTimeString(),
          alert_message: "Database response time is above normal thresholds",
          server_name: "web-server-01",
          service_name: "postgresql",
          error_code: "DB_SLOW_001"
        };
      
      default:
        return baseData;
    }
  }

  private processTemplate(template: string, data: Record<string, string>): string {
    let processed = template;
    
    // Replace all variables in the format {{variable_name}}
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(regex, value);
    });
    
    return processed;
  }

  // Business email methods
  async sendOrderConfirmation(customerEmail: string, orderData: any) {
    console.log('=== SENDING ORDER CONFIRMATION EMAIL ===');
    console.log('Customer Email:', customerEmail);
    console.log('Order Data:', orderData);

    const orderItemsHtml = orderData.items?.map((item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product?.name || item.name || 'Product'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${parseFloat(item.price || 0).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${parseFloat(item.total || item.price * item.quantity || 0).toFixed(2)}</td>
      </tr>
    `).join('') || '<tr><td colspan="4" style="padding: 8px; text-align: center;">No items found</td></tr>';

    const emailHtml = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500&family=Raleway:wght@900&display=swap');
    </style>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1e40af; color: white; padding: 30px; text-align: center;">
        <div style="margin-bottom: 25px; padding: 20px; background-color: white; border-radius: 8px;">
          <div style="margin: 0; font-size: 28px; letter-spacing: 2px; line-height: 1.2;">
            <span style="color: #c53030; font-family: 'Quicksand', Arial, sans-serif; font-weight: 500;">Geelong</span>
            <br>
            <span style="color: #1a202c; font-family: 'Raleway', Arial, sans-serif; font-weight: 900; letter-spacing: 4px;">GARAGE DOORS</span>
          </div>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #4a5568; font-weight: normal;">Your Garage Door Parts Specialist</p>
        </div>
        <h1 style="margin: 0; font-size: 32px;">Order Confirmation</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Thank you for your purchase!</p>
      </div>
      
      <div style="padding: 20px; background-color: #f9fafb;">
        <h2 style="color: #1e40af; margin-top: 0;">Order Details</h2>
        <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
        <p><strong>Customer:</strong> ${orderData.customerName}</p>
        <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
        ${orderData.paypalTransactionId ? `<p><strong>PayPal Transaction ID:</strong> ${orderData.paypalTransactionId}</p>` : ''}
      </div>

      <div style="padding: 20px;">
        <h3 style="color: #1e40af;">Items Ordered</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #1e40af; color: white;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderItemsHtml}
          </tbody>
        </table>
        
        <div style="text-align: right; font-size: 18px; font-weight: bold; color: #1e40af; border-top: 2px solid #1e40af; padding-top: 10px;">
          Total: $${parseFloat(orderData.total).toFixed(2)}
        </div>
      </div>

      <div style="padding: 20px; background-color: #f0f9ff; border-left: 4px solid #1e40af;">
        <h3 style="margin-top: 0; color: #1e40af;">What's Next?</h3>
        <p>Your payment has been processed successfully. We'll prepare your order and send you shipping details shortly.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
      </div>

      <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
        <p>Thank you for choosing Geelong Garage Doors!</p>
        <p>This email was sent to ${customerEmail}</p>
      </div>
    </div>`;

    return this.sendEmail({
      to: customerEmail,
      subject: `Order Confirmation - ${orderData.orderNumber}`,
      html: emailHtml
    });
  }

  // Order Status Update Methods - Using proper email templates instead of generic test emails
  async sendOrderProcessingEmail(customerEmail: string, orderData: any) {
    console.log('=== SENDING ORDER PROCESSING EMAIL ===');
    console.log('Customer Email:', customerEmail);
    console.log('Order:', orderData.orderNumber);

    const emailHtml = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500&family=Raleway:wght@900&display=swap');
    </style>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1e40af; color: white; padding: 30px; text-align: center;">
        <div style="margin-bottom: 25px; padding: 20px; background-color: white; border-radius: 8px;">
          <div style="margin: 0; font-size: 28px; letter-spacing: 2px; line-height: 1.2;">
            <span style="color: #c53030; font-family: 'Quicksand', Arial, sans-serif; font-weight: 500;">Geelong</span>
            <br>
            <span style="color: #1a202c; font-family: 'Raleway', Arial, sans-serif; font-weight: 900; letter-spacing: 4px;">GARAGE DOORS</span>
          </div>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #4a5568; font-weight: normal;">Your Garage Door Parts Specialist</p>
        </div>
        <h1 style="margin: 0; font-size: 32px;">Order Being Processed</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">We're preparing your order</p>
      </div>
      
      <div style="padding: 20px; background-color: #f9fafb;">
        <h2 style="color: #1e40af; margin-top: 0;">Hi ${orderData.customerName || 'Valued Customer'},</h2>
        <p>Good news! Your order is now being processed and will be shipped soon.</p>
        
        <div style="background-color: #e0f2fe; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
          <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
          <p><strong>Status:</strong> Processing</p>
          <p><strong>Estimated Processing Time:</strong> 1-2 business days</p>
        </div>
        
        <p>We'll send you another email with tracking information once your order ships.</p>
      </div>

      <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
        <p>Thank you for choosing Geelong Garage Doors!</p>
      </div>
    </div>`;

    return this.sendEmail({
      to: customerEmail,
      subject: `Order Processing - ${orderData.orderNumber}`,
      html: emailHtml
    });
  }

  async sendOrderShippedEmail(customerEmail: string, orderData: any) {
    console.log('=== SENDING ORDER SHIPPED EMAIL ===');
    console.log('Customer Email:', customerEmail);
    console.log('Order:', orderData.orderNumber);

    const emailHtml = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500&family=Raleway:wght@900&display=swap');
    </style>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1e40af; color: white; padding: 30px; text-align: center;">
        <div style="margin-bottom: 25px; padding: 20px; background-color: white; border-radius: 8px;">
          <div style="margin: 0; font-size: 28px; letter-spacing: 2px; line-height: 1.2;">
            <span style="color: #c53030; font-family: 'Quicksand', Arial, sans-serif; font-weight: 500;">Geelong</span>
            <br>
            <span style="color: #1a202c; font-family: 'Raleway', Arial, sans-serif; font-weight: 900; letter-spacing: 4px;">GARAGE DOORS</span>
          </div>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #4a5568; font-weight: normal;">Your Garage Door Parts Specialist</p>
        </div>
        <h1 style="margin: 0; font-size: 32px;">Order Shipped! 📦</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Your order is on the way</p>
      </div>
      
      <div style="padding: 20px; background-color: #f9fafb;">
        <h2 style="color: #1e40af; margin-top: 0;">Hi ${orderData.customerName || 'Valued Customer'},</h2>
        <p>Great news! Your order has been shipped and is on its way to you.</p>
        
        <div style="background-color: #e0f2fe; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
          <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
          <p><strong>Status:</strong> Shipped</p>
          <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
          ${orderData.tracking ? `<p><strong>Tracking Number:</strong> ${orderData.tracking}</p>` : ''}
        </div>
        
        <p>You can expect delivery within 3-5 business days. We'll notify you once it's delivered.</p>
      </div>

      <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
        <p>Thank you for choosing Geelong Garage Doors!</p>
      </div>
    </div>`;

    return this.sendEmail({
      to: customerEmail,
      subject: `Order Shipped - ${orderData.orderNumber}`,
      html: emailHtml
    });
  }

  async sendOrderDeliveredEmail(customerEmail: string, orderData: any) {
    console.log('=== SENDING ORDER DELIVERED EMAIL ===');
    console.log('Customer Email:', customerEmail);
    console.log('Order:', orderData.orderNumber);

    const emailHtml = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500&family=Raleway:wght@900&display=swap');
    </style>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1e40af; color: white; padding: 30px; text-align: center;">
        <div style="margin-bottom: 25px; padding: 20px; background-color: white; border-radius: 8px;">
          <div style="margin: 0; font-size: 28px; letter-spacing: 2px; line-height: 1.2;">
            <span style="color: #c53030; font-family: 'Quicksand', Arial, sans-serif; font-weight: 500;">Geelong</span>
            <br>
            <span style="color: #1a202c; font-family: 'Raleway', Arial, sans-serif; font-weight: 900; letter-spacing: 4px;">GARAGE DOORS</span>
          </div>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #4a5568; font-weight: normal;">Your Garage Door Parts Specialist</p>
        </div>
        <h1 style="margin: 0; font-size: 32px;">Order Delivered! ✅</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Your order has arrived</p>
      </div>
      
      <div style="padding: 20px; background-color: #f9fafb;">
        <h2 style="color: #1e40af; margin-top: 0;">Hi ${orderData.customerName || 'Valued Customer'},</h2>
        <p>Excellent! Your order has been successfully delivered.</p>
        
        <div style="background-color: #e0f2fe; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
          <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
          <p><strong>Status:</strong> Delivered</p>
          <p><strong>Delivered On:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p>We hope you're satisfied with your purchase. If you have any questions or concerns, please don't hesitate to contact us.</p>
        <p>Thank you for choosing Geelong Garage Doors for your garage door parts!</p>
      </div>

      <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
        <p>Thank you for choosing Geelong Garage Doors!</p>
      </div>
    </div>`;

    return this.sendEmail({
      to: customerEmail,
      subject: `Order Delivered - ${orderData.orderNumber}`,
      html: emailHtml
    });
  }

  async sendOrderCanceledEmail(customerEmail: string, orderData: any) {
    console.log('=== SENDING ORDER CANCELED EMAIL ===');
    console.log('Customer Email:', customerEmail);
    console.log('Order:', orderData.orderNumber);

    const emailHtml = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500&family=Raleway:wght@900&display=swap');
    </style>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #dc2626; color: white; padding: 30px; text-align: center;">
        <div style="margin-bottom: 25px; padding: 20px; background-color: white; border-radius: 8px;">
          <div style="margin: 0; font-size: 28px; letter-spacing: 2px; line-height: 1.2;">
            <span style="color: #c53030; font-family: 'Quicksand', Arial, sans-serif; font-weight: 500;">Geelong</span>
            <br>
            <span style="color: #1a202c; font-family: 'Raleway', Arial, sans-serif; font-weight: 900; letter-spacing: 4px;">GARAGE DOORS</span>
          </div>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #4a5568; font-weight: normal;">Your Garage Door Parts Specialist</p>
        </div>
        <h1 style="margin: 0; font-size: 32px;">Order Canceled</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Your order has been canceled</p>
      </div>
      
      <div style="padding: 20px; background-color: #f9fafb;">
        <h2 style="color: #1e40af; margin-top: 0;">Hi ${orderData.customerName || 'Valued Customer'},</h2>
        <p>We're writing to inform you that your order has been canceled as requested.</p>
        
        <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
          <p><strong>Status:</strong> Canceled</p>
          <p><strong>Canceled On:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p>If you paid for this order, any applicable refunds will be processed within 3-5 business days.</p>
        <p>If you have any questions about this cancellation, please contact us.</p>
      </div>

      <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
        <p>Thank you for choosing Geelong Garage Doors!</p>
      </div>
    </div>`;

    return this.sendEmail({
      to: customerEmail,
      subject: `Order Canceled - ${orderData.orderNumber}`,
      html: emailHtml
    });
  }

  async sendPasswordReset(userData: any, template: any) {
    const emailData = {
      customer_name: userData.firstName || userData.email,
      reset_link: userData.resetLink
    };

    const processedSubject = this.processTemplate(template.subject, emailData);
    const processedHtml = this.processTemplate(template.htmlContent, emailData);

    return this.sendEmail({
      to: userData.email,
      subject: processedSubject,
      html: processedHtml
    });
  }

  async sendPaymentConfirmation(customerEmail: string, orderData: any): Promise<boolean> {
    try {
      console.log('📧 Sending payment confirmation email to:', customerEmail);
      
      // Simple payment confirmation email
      const subject = `Payment Confirmed - Order ${orderData.orderNumber}`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
            <h1>Payment Confirmed!</h1>
          </div>
          
          <div style="padding: 20px;">
            <h2>Hi ${orderData.customerName},</h2>
            
            <p>Great news! Your payment has been successfully processed by PayPal.</p>
            
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e3a8a;">Payment Details</h3>
              <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
              <p><strong>Amount Paid:</strong> $${orderData.total}</p>
              <p><strong>PayPal Transaction ID:</strong> ${orderData.paypalTransactionId}</p>
              <p><strong>Date:</strong> ${orderData.paidAt.toLocaleString()}</p>
            </div>
            
            <p>Your order is now being processed and you'll receive another email when it ships.</p>
            
            <p>Thanks for your business!<br>
            <strong>Geelong Garage Doors</strong></p>
          </div>
        </div>
      `;

      const result = await this.sendEmail({
        to: customerEmail,
        subject,
        html: htmlContent
      });
      return result.success;
      
    } catch (error) {
      console.error('❌ Failed to send payment confirmation email:', error);
      return false;
    }
  }

  async sendRefundConfirmation(customerEmail: string, orderData: any): Promise<boolean> {
    try {
      console.log('📧 Sending refund confirmation email to:', customerEmail);
      
      const subject = `Refund Processed - Order ${orderData.orderNumber}`;
      
      const htmlContent = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500&family=Raleway:wght@900&display=swap');
        </style>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #059669; color: white; padding: 30px; text-align: center;">
            <div style="margin-bottom: 25px; padding: 20px; background-color: white; border-radius: 8px;">
              <div style="margin: 0; font-size: 28px; letter-spacing: 2px; line-height: 1.2;">
                <span style="color: #c53030; font-family: 'Quicksand', Arial, sans-serif; font-weight: 500;">Geelong</span>
                <br>
                <span style="color: #1a202c; font-family: 'Raleway', Arial, sans-serif; font-weight: 900; letter-spacing: 4px;">GARAGE DOORS</span>
              </div>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #4a5568; font-weight: normal;">Your Garage Door Parts Specialist</p>
            </div>
            <h1 style="margin: 0; font-size: 32px;">Refund Processed</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Your refund has been completed</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb;">
            <h2 style="color: #1e40af; margin-top: 0;">Hi ${orderData.customerName || 'Valued Customer'},</h2>
            <p>Your refund has been successfully processed and will appear in your account within 3-5 business days.</p>
            
            <div style="background-color: #d1fae5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
              <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
              <p><strong>Refund Amount:</strong> $${orderData.refundAmount}</p>
              <p><strong>Refund Date:</strong> ${orderData.refundDate?.toLocaleDateString() || new Date().toLocaleDateString()}</p>
            </div>
            
            <p>The refund will be credited to the original payment method used for this order.</p>
            <p>If you have any questions about this refund, please contact us.</p>
          </div>

          <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
            <p>Thank you for choosing Geelong Garage Doors!</p>
          </div>
        </div>
      `;

      const result = await this.sendEmail({
        to: customerEmail,
        subject,
        html: htmlContent
      });
      return result.success;
    } catch (error) {
      console.error('❌ Failed to send refund confirmation email:', error);
      return false;
    }
  }

  async sendNewOrderAlert(orderData: any, template: any, staffEmail: string) {
    const emailData = {
      order_number: orderData.orderNumber,
      customer_name: orderData.customerName || 'Customer',
      customer_email: orderData.customerEmail,
      total_amount: orderData.total.toFixed(2),
      order_date: new Date(orderData.createdAt).toLocaleDateString(),
      admin_link: `https://geelonggaragedoors.com/admin/orders/${orderData.id}`
    };

    const processedSubject = this.processTemplate(template.subject, emailData);
    const processedHtml = this.processTemplate(template.htmlContent, emailData);

    return this.sendEmail({
      to: staffEmail,
      subject: processedSubject,
      html: processedHtml
    });
  }

  async sendLowStockAlert(productData: any, template: any, staffEmail: string) {
    const emailData = {
      product_name: productData.name,
      current_stock: productData.stock.toString(),
      minimum_stock: productData.minStock?.toString() || '10',
      product_sku: productData.sku || 'N/A',
      admin_link: `https://geelonggaragedoors.com/admin/products/${productData.id}`
    };

    const processedSubject = this.processTemplate(template.subject, emailData);
    const processedHtml = this.processTemplate(template.htmlContent, emailData);

    return this.sendEmail({
      to: staffEmail,
      subject: processedSubject,
      html: processedHtml
    });
  }

  async sendDailyReport(reportData: any, template: any, adminEmail: string) {
    const emailData = {
      report_date: new Date().toLocaleDateString(),
      total_orders: reportData.totalOrders?.toString() || '0',
      total_revenue: reportData.totalRevenue?.toFixed(2) || '0.00',
      average_order_value: reportData.averageOrderValue?.toFixed(2) || '0.00',
      new_customers: reportData.newCustomers?.toString() || '0',
      top_products: this.formatTopProducts(reportData.topProducts || []),
      admin_link: 'https://geelonggaragedoors.com/admin/dashboard'
    };

    const processedSubject = this.processTemplate(template.subject, emailData);
    const processedHtml = this.processTemplate(template.htmlContent, emailData);

    return this.sendEmail({
      to: adminEmail,
      subject: processedSubject,
      html: processedHtml
    });
  }

  async sendSystemAlert(alertData: any, template: any, adminEmail: string) {
    const emailData = {
      alert_type: alertData.type || 'System Alert',
      severity: alertData.severity || 'Medium',
      alert_time: new Date().toLocaleString(),
      alert_message: alertData.message,
      server_name: alertData.serverName || 'web-server-01',
      service_name: alertData.serviceName || 'application',
      error_code: alertData.errorCode || 'SYS_001'
    };

    const processedSubject = this.processTemplate(template.subject, emailData);
    const processedHtml = this.processTemplate(template.htmlContent, emailData);

    return this.sendEmail({
      to: adminEmail,
      subject: processedSubject,
      html: processedHtml
    });
  }

  async sendStaffInvitation(invitationData: any, template: any) {
    const emailData = {
      invite_email: invitationData.email,
      invite_role: invitationData.role,
      invite_link: invitationData.inviteLink,
      expiry_days: invitationData.expiryDays?.toString() || '7',
      company_name: 'Geelong Garage Doors',
      admin_email: 'orders@geelonggaragedoors.com'
    };

    const processedSubject = this.processTemplate(template.subject, emailData);
    const processedHtml = this.processTemplate(template.htmlContent, emailData);

    return this.sendEmail({
      to: invitationData.email,
      subject: processedSubject,
      html: processedHtml
    });
  }

  private formatOrderItems(items: any[]): string {
    return items.map(item => 
      `• ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');
  }

  private formatTopProducts(products: any[]): string {
    return products.map(product => 
      `• ${product.name} - ${product.sales} units`
    ).join('\n');
  }
}

export const emailService = new EmailService();