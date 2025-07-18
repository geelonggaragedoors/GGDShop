import { pgTable, varchar, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Email Templates Table
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  subject: varchar("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  templateType: varchar("template_type").notNull(), // 'customer', 'staff', 'admin'
  category: varchar("category").notNull(), // 'order_confirmation', 'welcome', 'notification', etc.
  variables: jsonb("variables").default([]), // Available template variables
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Template Schema
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

// Template Variables for different types
export const templateVariables = {
  customer: [
    { name: 'customer_name', description: 'Customer full name' },
    { name: 'customer_email', description: 'Customer email address' },
    { name: 'order_number', description: 'Order number' },
    { name: 'order_total', description: 'Order total amount' },
    { name: 'order_date', description: 'Order date' },
    { name: 'order_status', description: 'Current order status' },
    { name: 'tracking_number', description: 'Shipping tracking number' },
    { name: 'delivery_address', description: 'Delivery address' },
    { name: 'company_name', description: 'Geelong Garage Doors' },
    { name: 'company_phone', description: 'Company phone number' },
    { name: 'company_email', description: 'Company email address' },
    { name: 'company_website', description: 'Company website URL' },
  ],
  staff: [
    { name: 'staff_name', description: 'Staff member name' },
    { name: 'customer_name', description: 'Customer full name' },
    { name: 'customer_email', description: 'Customer email address' },
    { name: 'customer_phone', description: 'Customer phone number' },
    { name: 'order_number', description: 'Order number' },
    { name: 'order_total', description: 'Order total amount' },
    { name: 'order_date', description: 'Order date' },
    { name: 'order_items', description: 'List of ordered items' },
    { name: 'priority', description: 'Priority level (High, Medium, Low)' },
    { name: 'notification_type', description: 'Type of notification' },
    { name: 'invite_email', description: 'Email address being invited' },
    { name: 'invite_role', description: 'Role being invited for' },
    { name: 'invite_link', description: 'Link to accept invitation' },
    { name: 'expiry_days', description: 'Number of days until invitation expires' },
    { name: 'company_name', description: 'Company name' },
    { name: 'admin_email', description: 'Admin email address' },
  ],
  admin: [
    { name: 'admin_name', description: 'Admin name' },
    { name: 'system_alert', description: 'System alert message' },
    { name: 'user_count', description: 'Total user count' },
    { name: 'order_count', description: 'Total order count' },
    { name: 'revenue_today', description: 'Today revenue' },
    { name: 'revenue_month', description: 'Monthly revenue' },
    { name: 'low_stock_items', description: 'Items with low stock' },
    { name: 'pending_orders', description: 'Number of pending orders' },
    { name: 'error_message', description: 'System error message' },
    { name: 'timestamp', description: 'Current timestamp' },
  ],
};

// Default Templates
export const defaultTemplates = [
  // Customer Templates
  {
    name: 'Order Confirmation',
    subject: 'Order Confirmation - {{order_number}}',
    templateType: 'customer',
    category: 'order_confirmation',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">{{company_name}}</h1>
          <p style="color: #666; margin: 5px 0;">Professional Garage Door Solutions</p>
        </div>
        
        <h2 style="color: #333;">Order Confirmation</h2>
        <p>Dear {{customer_name}},</p>
        
        <p>Thank you for your order! We've received your order and are preparing it for delivery.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Order Details</h3>
          <p><strong>Order Number:</strong> {{order_number}}</p>
          <p><strong>Order Date:</strong> {{order_date}}</p>
          <p><strong>Total Amount:</strong> ${{order_total}}</p>
          <p><strong>Status:</strong> {{order_status}}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Delivery Information</h3>
          <p><strong>Delivery Address:</strong><br>{{delivery_address}}</p>
        </div>
        
        <p>We'll send you another email with tracking information once your order ships.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p><strong>Need Help?</strong></p>
          <p>Phone: {{company_phone}}<br>
          Email: {{company_email}}<br>
          Website: {{company_website}}</p>
        </div>
        
        <p>Best regards,<br>{{company_name}} Team</p>
      </div>
    `,
    textContent: `
      Order Confirmation - {{order_number}}
      
      Dear {{customer_name}},
      
      Thank you for your order! We've received your order and are preparing it for delivery.
      
      Order Details:
      - Order Number: {{order_number}}
      - Order Date: {{order_date}}
      - Total Amount: ${{order_total}}
      - Status: {{order_status}}
      
      Delivery Address:
      {{delivery_address}}
      
      We'll send you another email with tracking information once your order ships.
      
      Need Help?
      Phone: {{company_phone}}
      Email: {{company_email}}
      Website: {{company_website}}
      
      Best regards,
      {{company_name}} Team
    `,
    variables: templateVariables.customer,
    isActive: true,
  },
  
  // Staff Templates
  {
    name: 'New Order Notification',
    subject: 'New Order Received - {{order_number}}',
    templateType: 'staff',
    category: 'order_notification',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #dc2626; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0;">🚨 New Order Alert</h2>
          <p style="margin: 5px 0 0 0;">Priority: {{priority}}</p>
        </div>
        
        <p>Hi {{staff_name}},</p>
        
        <p>A new order has been received and requires your attention.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Order Information</h3>
          <p><strong>Order Number:</strong> {{order_number}}</p>
          <p><strong>Order Date:</strong> {{order_date}}</p>
          <p><strong>Total Amount:</strong> ${{order_total}}</p>
          <p><strong>Items:</strong> {{order_items}}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Customer Details</h3>
          <p><strong>Name:</strong> {{customer_name}}</p>
          <p><strong>Email:</strong> {{customer_email}}</p>
          <p><strong>Phone:</strong> {{customer_phone}}</p>
        </div>
        
        <p>Please process this order as soon as possible.</p>
        
        <p>Best regards,<br>System Notification</p>
      </div>
    `,
    textContent: `
      New Order Received - {{order_number}}
      Priority: {{priority}}
      
      Hi {{staff_name}},
      
      A new order has been received and requires your attention.
      
      Order Information:
      - Order Number: {{order_number}}
      - Order Date: {{order_date}}
      - Total Amount: ${{order_total}}
      - Items: {{order_items}}
      
      Customer Details:
      - Name: {{customer_name}}
      - Email: {{customer_email}}
      - Phone: {{customer_phone}}
      
      Please process this order as soon as possible.
      
      Best regards,
      System Notification
    `,
    variables: templateVariables.staff,
    isActive: true,
  },
  
  {
    name: 'Staff Invitation',
    subject: 'You\'re Invited to Join {{company_name}}',
    templateType: 'staff',
    category: 'invitation',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">{{company_name}}</h1>
          <p style="color: #666; margin: 5px 0;">Professional Garage Door Solutions</p>
        </div>
        
        <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
          <h2 style="margin: 0;">🎉 You're Invited!</h2>
          <p style="margin: 10px 0 0 0;">Join our team as a {{invite_role}}</p>
        </div>
        
        <p>Hello,</p>
        
        <p>You have been invited to join {{company_name}} as a <strong>{{invite_role}}</strong>. We're excited to have you on our team!</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Invitation Details</h3>
          <p><strong>Email:</strong> {{invite_email}}</p>
          <p><strong>Role:</strong> {{invite_role}}</p>
          <p><strong>Expires in:</strong> {{expiry_days}} days</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{invite_link}}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Accept Invitation
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          <strong>Note:</strong> This invitation will expire in {{expiry_days}} days. If you have any questions, please contact us at {{admin_email}}.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p><strong>About {{company_name}}:</strong></p>
          <p>We're a leading provider of professional garage door solutions, serving customers throughout the Geelong region with quality products and exceptional service.</p>
        </div>
        
        <p>We look forward to working with you!</p>
        
        <p>Best regards,<br>{{company_name}} Team</p>
      </div>
    `,
    textContent: `
      You're Invited to Join {{company_name}}
      
      Hello,
      
      You have been invited to join {{company_name}} as a {{invite_role}}. We're excited to have you on our team!
      
      Invitation Details:
      - Email: {{invite_email}}
      - Role: {{invite_role}}
      - Expires in: {{expiry_days}} days
      
      To accept this invitation, please visit:
      {{invite_link}}
      
      Note: This invitation will expire in {{expiry_days}} days. If you have any questions, please contact us at {{admin_email}}.
      
      About {{company_name}}:
      We're a leading provider of professional garage door solutions, serving customers throughout the Geelong region with quality products and exceptional service.
      
      We look forward to working with you!
      
      Best regards,
      {{company_name}} Team
    `,
    variables: templateVariables.staff,
    isActive: true,
  },
  
  // Admin Templates
  {
    name: 'Daily Summary Report',
    subject: 'Daily Summary - {{timestamp}}',
    templateType: 'admin',
    category: 'daily_report',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #2563eb; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0;">📊 Daily Summary Report</h2>
          <p style="margin: 5px 0 0 0;">{{timestamp}}</p>
        </div>
        
        <p>Hi {{admin_name}},</p>
        
        <p>Here's your daily summary for Geelong Garage Doors:</p>
        
        <div style="display: flex; gap: 15px; margin: 20px 0;">
          <div style="background: #dcfce7; padding: 15px; border-radius: 8px; flex: 1;">
            <h3 style="margin: 0 0 10px 0; color: #166534;">Orders Today</h3>
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #166534;">{{pending_orders}}</p>
          </div>
          
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; flex: 1;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">Revenue Today</h3>
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #1e40af;">${{revenue_today}}</p>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Monthly Overview</h3>
          <p><strong>Total Users:</strong> {{user_count}}</p>
          <p><strong>Total Orders:</strong> {{order_count}}</p>
          <p><strong>Monthly Revenue:</strong> ${{revenue_month}}</p>
        </div>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #92400e;">⚠️ Attention Required</h3>
          <p><strong>Low Stock Items:</strong> {{low_stock_items}}</p>
        </div>
        
        <p>Best regards,<br>System Report</p>
      </div>
    `,
    textContent: `
      Daily Summary Report - {{timestamp}}
      
      Hi {{admin_name}},
      
      Here's your daily summary for Geelong Garage Doors:
      
      Today's Stats:
      - Orders: {{pending_orders}}
      - Revenue: ${{revenue_today}}
      
      Monthly Overview:
      - Total Users: {{user_count}}
      - Total Orders: {{order_count}}
      - Monthly Revenue: ${{revenue_month}}
      
      Attention Required:
      - Low Stock Items: {{low_stock_items}}
      
      Best regards,
      System Report
    `,
    variables: templateVariables.admin,
    isActive: true,
  },
];