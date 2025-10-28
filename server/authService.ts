import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from './db';
import { users, customers } from '@shared/schema';
import { eq, and, lt, gte } from 'drizzle-orm';
import { emailService } from './email';

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export class AuthService {
  
  // Hash password with bcrypt
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  // Verify password against hash
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate secure random token
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Register new user
  async registerUser(userData: RegisterData): Promise<{ user: any; emailVerificationToken: string }> {
    const { email, password, firstName, lastName, role = 'staff' } = userData;

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password and generate verification token
    const passwordHash = await this.hashPassword(password);
    const emailVerificationToken = this.generateToken();

    // Create user
    const [newUser] = await db.insert(users).values({
      id: crypto.randomUUID(),
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      emailVerificationToken,
      emailVerified: false,
    }).returning();

    // Send verification email
    await this.sendVerificationEmail(email, emailVerificationToken, firstName);

    return { user: newUser, emailVerificationToken };
  }

  // Login user with email/password - supports both staff/admin and customers
  async loginUser(credentials: LoginCredentials): Promise<any> {
    const { email, password } = credentials;

    // First check staff/admin users table
    const [staffUser] = await db.select().from(users).where(eq(users.email, email));
    
    if (staffUser) {
      // Handle staff/admin login
      // Check if account is locked
      if (staffUser.lockedUntil && new Date() < staffUser.lockedUntil) {
        throw new Error('Account is temporarily locked due to too many failed login attempts');
      }

      // Check if account is active
      if (!staffUser.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, staffUser.passwordHash || '');
      if (!isValidPassword) {
        await this.handleFailedLogin(staffUser.id);
        throw new Error('Invalid email or password');
      }

      // Reset failed login attempts and update last login
      await db.update(users)
        .set({
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, staffUser.id));

      return staffUser;
    }

    // Check customers table
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    
    if (customer) {
      // Handle customer login
      // Check if account is active
      if (!customer.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, customer.passwordHash || '');
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Add role for consistent handling
      return {
        ...customer,
        role: 'customer'
      };
    }

    // No user found
    throw new Error('Invalid email or password');
  }

  // Handle failed login attempt
  private async handleFailedLogin(userId: string): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return;

    const attempts = (user.failedLoginAttempts || 0) + 1;
    const updateData: any = {
      failedLoginAttempts: attempts,
      updatedAt: new Date(),
    };

    // Lock account if max attempts reached
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOCK_TIME);
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));
  }

  // Verify email with token
  async verifyEmail(token: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));
    if (!user) {
      throw new Error('Invalid verification token');
    }

    await db.update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return true;
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string): Promise<void> {
    console.log('Password reset requested for:', email);
    
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      console.log('No user found for email:', email);
      // Don't reveal if email exists for security
      return;
    }

    console.log('Found user:', user.firstName, user.lastName);

    const resetToken = this.generateToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.update(users)
      .set({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log('Reset token saved to database');

    // Send reset email - use deployed domain if available
    const isProduction = process.env.NODE_ENV === 'production' || 
      process.env.REPLIT_DEPLOYMENT === 'true' || 
      process.env.RAILWAY_ENVIRONMENT === 'production';
    
    const baseUrl = process.env.BASE_URL || 
      (isProduction ? 'https://geelonggaragedoors.com' : 'http://localhost:5000');
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    console.log('Sending password reset email to:', email);
    console.log('Reset URL:', resetUrl);
    
    try {
      const result = await emailService.sendEmail({
        to: email,
        subject: 'Password Reset Request - Geelong Garage Doors',
        html: `
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
              <h1 style="margin: 0; font-size: 32px;">Password Reset Request</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Secure password reset link</p>
            </div>
            
            <div style="padding: 20px; background-color: #f9fafb;">
              <h2 style="color: #1e40af; margin-top: 0;">Hello ${user.firstName || 'Valued Customer'},</h2>
              <p>We received a request to reset your password for your Geelong Garage Doors account.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Your Password</a>
              </div>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
              </div>
              
              <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              
              <p>For security reasons, if you continue to receive these emails without requesting them, please contact us immediately.</p>
            </div>

            <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
              <p>Thank you for choosing Geelong Garage Doors!</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        `,
      });
      
      console.log('Email send result:', result);
      
      if (!result.success) {
        console.error('Failed to send password reset email:', result.error);
        throw new Error('Failed to send password reset email');
      }
      
      console.log('Password reset email sent successfully');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const [user] = await db.select().from(users).where(
      and(
        eq(users.resetPasswordToken, token),
        gte(users.resetPasswordExpires, new Date())
      )
    );

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const passwordHash = await this.hashPassword(newPassword);

    await db.update(users)
      .set({
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  }

  // Send email verification
  private async sendVerificationEmail(email: string, token: string, firstName: string): Promise<void> {
    const verifyUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
    
    await emailService.sendEmail({
      to: email,
      subject: 'Verify Your Email - Geelong Garage Doors',
      html: `
        <h2>Welcome to Geelong Garage Doors!</h2>
        <p>Hello ${firstName},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verifyUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify Email</a></p>
        <p>If you didn't create this account, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Geelong Garage Doors Team</p>
      `,
    });
  }

  // Change password for authenticated user
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await this.verifyPassword(currentPassword, user.passwordHash || '');
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    await db.update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Admin reset staff password - sends reset email
  async adminResetStaffPassword(staffId: string, adminId: string): Promise<void> {
    // Verify admin permissions
    const [admin] = await db.select().from(users).where(eq(users.id, adminId));
    if (!admin || !this.hasPermission(admin.role || '', 'admin')) {
      throw new Error('Insufficient permissions');
    }

    // Get staff member
    const [staff] = await db.select().from(users).where(eq(users.id, staffId));
    if (!staff) {
      throw new Error('Staff member not found');
    }

    // Generate reset token
    const resetToken = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    // Update user with reset token
    await db.update(users)
      .set({
        resetPasswordToken: resetToken,
        resetPasswordExpires: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, staffId));

    // Send reset email - use deployed domain if available
    const isProduction = process.env.NODE_ENV === 'production' || 
      process.env.REPLIT_DEPLOYMENT === 'true' || 
      process.env.RAILWAY_ENVIRONMENT === 'production';
    
    const baseUrl = process.env.BASE_URL || 
      (isProduction ? 'https://geelonggaragedoors.com' : 'http://localhost:5000');
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    await emailService.sendEmail({
      to: staff.email!,
      subject: 'Password Reset - Geelong Garage Doors',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${staff.firstName},</p>
        <p>Your password has been reset by an administrator. Please click the link below to set a new password:</p>
        <p><a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Set New Password</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this reset, please contact your administrator immediately.</p>
        <br>
        <p>Best regards,<br>Geelong Garage Doors Team</p>
      `,
    });
  }

  // Admin direct password reset - generates temporary password
  async adminDirectPasswordReset(staffId: string, adminId: string): Promise<string> {
    // Verify admin permissions
    const [admin] = await db.select().from(users).where(eq(users.id, adminId));
    if (!admin || !this.hasPermission(admin.role || '', 'admin')) {
      throw new Error('Insufficient permissions');
    }

    // Get staff member
    const [staff] = await db.select().from(users).where(eq(users.id, staffId));
    if (!staff) {
      throw new Error('Staff member not found');
    }

    // Generate temporary password (8 characters: uppercase, lowercase, numbers)
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let tempPassword = '';
    for (let i = 0; i < 8; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Hash and update password
    const passwordHash = await this.hashPassword(tempPassword);
    await db.update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, staffId));

    return tempPassword;
  }

  // Check if user has permission for specific action
  hasPermission(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = {
      'admin': 3,
      'manager': 2,
      'staff': 1,
    };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  }
}

export const authService = new AuthService();