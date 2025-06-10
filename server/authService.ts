import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from './db';
import { users, customers } from '@shared/schema';
import { eq, and, lt, gte } from 'drizzle-orm';
import { emailService } from './emailService';

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
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      // Don't reveal if email exists for security
      return;
    }

    const resetToken = this.generateToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.update(users)
      .set({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Send reset email
    const resetUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
    
    await emailService.sendEmail({
      to: email,
      subject: 'Password Reset Request - Geelong Garage Doors',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.firstName},</p>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Geelong Garage Doors Team</p>
      `,
    });
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