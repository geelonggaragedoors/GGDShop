import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY environment variable is not set');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
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
  
  async sendTestEmail(to: string) {
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
}

export const emailService = new EmailService();