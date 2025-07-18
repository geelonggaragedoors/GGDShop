import sgMail from '@sendgrid/mail';

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
      return { success: false, error: error.message };
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
          tracking_number: "AUS123456789",
          estimated_delivery: "3-5 business days",
          shipping_method: "Standard Shipping",
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
}

export const emailService = new EmailService();