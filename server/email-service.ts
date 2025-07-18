import { Resend } from 'resend';
import { storage } from './storage';
import { InsertEmailLog } from '@shared/schema';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  templateName?: string;
  recipientName?: string;
  metadata?: any;
}

export class EmailService {
  private static instance: EmailService;
  
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; emailLogId?: string; error?: string }> {
    const { to, subject, html, text, templateId, templateName, recipientName, metadata } = options;
    
    // Create email log entry
    const emailLog = await storage.createEmailLog({
      templateId: templateId || null,
      templateName: templateName || null,
      recipientEmail: to,
      recipientName: recipientName || null,
      subject,
      status: 'pending',
      metadata: metadata || null,
    });

    try {
      // Get email settings
      const emailSettings = await this.getEmailSettings();
      
      // Send email via Resend
      const result = await resend.emails.send({
        from: `${emailSettings.fromName} <${emailSettings.fromEmail}>`,
        to: [to],
        subject,
        html,
        text: text || this.htmlToText(html),
        reply_to: emailSettings.replyToEmail || emailSettings.fromEmail,
        tags: [
          { name: 'source', value: 'geelong-garage-doors' },
          { name: 'template', value: templateName || 'custom' },
          ...(metadata?.orderId ? [{ name: 'order_id', value: metadata.orderId }] : []),
        ],
      });

      if (result.error) {
        // Update log with error
        await storage.updateEmailLogStatus(emailLog.id, 'failed', {
          errorMessage: result.error.message,
        });
        
        return { success: false, error: result.error.message };
      }

      // Update log with success
      await storage.updateEmailLogStatus(emailLog.id, 'sent', {
        resendId: result.data?.id,
        sentAt: new Date().toISOString(),
      });

      return { success: true, emailLogId: emailLog.id };
    } catch (error) {
      console.error('Email service error:', error);
      
      // Update log with error
      await storage.updateEmailLogStatus(emailLog.id, 'failed', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendOrderConfirmation(order: any, customerEmail: string): Promise<{ success: boolean; emailLogId?: string; error?: string }> {
    const template = await this.getTemplate('order_confirmation');
    
    if (!template) {
      return { success: false, error: 'Order confirmation template not found' };
    }

    const html = this.renderTemplate(template.htmlContent, {
      orderNumber: order.orderNumber,
      customerName: order.customerName || 'Customer',
      orderTotal: order.total,
      orderItems: order.items,
      shippingAddress: order.shippingAddress,
      trackingUrl: `${process.env.FRONTEND_URL}/track-order/${order.orderNumber}`,
    });

    return this.sendEmail({
      to: customerEmail,
      subject: this.renderTemplate(template.subject, { orderNumber: order.orderNumber }),
      html,
      templateId: template.id,
      templateName: template.name,
      recipientName: order.customerName,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        type: 'order_confirmation',
      },
    });
  }

  async sendOrderStatusUpdate(order: any, customerEmail: string, status: string): Promise<{ success: boolean; emailLogId?: string; error?: string }> {
    const template = await this.getTemplate('order_status_update');
    
    if (!template) {
      return { success: false, error: 'Order status update template not found' };
    }

    const html = this.renderTemplate(template.htmlContent, {
      orderNumber: order.orderNumber,
      customerName: order.customerName || 'Customer',
      orderStatus: status,
      orderTotal: order.total,
      trackingUrl: `${process.env.FRONTEND_URL}/track-order/${order.orderNumber}`,
    });

    return this.sendEmail({
      to: customerEmail,
      subject: this.renderTemplate(template.subject, { orderNumber: order.orderNumber, status }),
      html,
      templateId: template.id,
      templateName: template.name,
      recipientName: order.customerName,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        type: 'order_status_update',
        status,
      },
    });
  }

  async sendLowStockAlert(product: any, adminEmail: string): Promise<{ success: boolean; emailLogId?: string; error?: string }> {
    const template = await this.getTemplate('low_stock_alert');
    
    if (!template) {
      return { success: false, error: 'Low stock alert template not found' };
    }

    const html = this.renderTemplate(template.htmlContent, {
      productName: product.name,
      currentStock: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold || 5,
      productUrl: `${process.env.FRONTEND_URL}/admin/products/${product.id}`,
    });

    return this.sendEmail({
      to: adminEmail,
      subject: this.renderTemplate(template.subject, { productName: product.name }),
      html,
      templateId: template.id,
      templateName: template.name,
      metadata: {
        productId: product.id,
        type: 'low_stock_alert',
        currentStock: product.stockQuantity,
      },
    });
  }

  async sendTestEmail(templateId: string, email: string): Promise<{ success: boolean; emailLogId?: string; error?: string }> {
    const template = await this.getTemplate(templateId);
    
    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Use sample data for testing
    const sampleData = {
      orderNumber: 'TEST-12345',
      customerName: 'John Doe',
      orderTotal: '$299.99',
      orderStatus: 'Processing',
      productName: 'Test Product',
      currentStock: 2,
      lowStockThreshold: 5,
      trackingUrl: `${process.env.FRONTEND_URL}/track-order/TEST-12345`,
      productUrl: `${process.env.FRONTEND_URL}/products/test-product`,
    };

    const html = this.renderTemplate(template.htmlContent, sampleData);

    return this.sendEmail({
      to: email,
      subject: `[TEST] ${this.renderTemplate(template.subject, sampleData)}`,
      html,
      templateId: template.id,
      templateName: template.name,
      recipientName: 'Test User',
      metadata: {
        type: 'test_email',
        originalTemplateId: templateId,
      },
    });
  }

  private async getEmailSettings(): Promise<any> {
    try {
      const settings = await storage.getEmailSettings();
      return settings || {
        fromEmail: 'orders@geelonggaragedoors.com',
        fromName: 'Geelong Garage Doors',
        replyToEmail: 'info@geelonggaragedoors.com',
        adminEmail: 'admin@geelonggaragedoors.com',
      };
    } catch (error) {
      console.error('Failed to get email settings:', error);
      return {
        fromEmail: 'orders@geelonggaragedoors.com',
        fromName: 'Geelong Garage Doors',
        replyToEmail: 'info@geelonggaragedoors.com',
        adminEmail: 'admin@geelonggaragedoors.com',
      };
    }
  }

  private async getTemplate(templateId: string): Promise<any> {
    try {
      return await storage.getEmailTemplate(templateId);
    } catch (error) {
      console.error(`Failed to get template ${templateId}:`, error);
      return null;
    }
  }

  private renderTemplate(content: string, data: any): string {
    let rendered = content;
    
    // Replace all variables in the format {{variable}}
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }
    
    return rendered;
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }
}

export const emailService = EmailService.getInstance();