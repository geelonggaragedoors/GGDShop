import { Request, Response, Router } from 'express';
import { authService } from './authService';
import { z } from 'zod';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'manager', 'staff']).optional(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Enhanced middleware for authentication
export const requireAuth = async (req: Request, res: Response, next: any) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Middleware for role-based authorization
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: any) => {
    const user = req.user as any;
    if (!user || !authService.hasPermission(user.role || 'staff', role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Login with email/password
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const user = await authService.loginUser({ email, password });
    
    // Set user in session (compatible with existing Replit Auth)
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Session creation failed' });
      }
      
      const { passwordHash, resetPasswordToken, emailVerificationToken, ...userResponse } = user;
      res.json({ 
        user: userResponse,
        message: 'Login successful' 
      });
    });
    
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Register new user (admin only)
router.post('/register', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const userData = registerSchema.parse(req.body);
    
    const { user, emailVerificationToken } = await authService.registerUser(userData);
    
    const { passwordHash, resetPasswordToken, ...userResponse } = user;
    res.status(201).json({ 
      user: userResponse,
      message: 'User registered successfully. Verification email sent.' 
    });
    
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Verify email
router.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Verification token is required' });
    }
    
    await authService.verifyEmail(token);
    
    // Redirect to login page with success message
    res.redirect('/?verified=true');
    
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Request password reset
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    await authService.sendPasswordResetEmail(email);
    
    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});

// Reset password with token
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    
    await authService.resetPassword(token, password);
    
    res.json({ message: 'Password reset successfully' });
    
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Change password (authenticated users)
router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const user = req.user as any;
    
    await authService.changePassword(user.id, currentPassword, newPassword);
    
    res.json({ message: 'Password changed successfully' });
    
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get current user profile
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { passwordHash, resetPasswordToken, emailVerificationToken, ...userResponse } = user;
    
    res.json({ user: userResponse });
    
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

export { router as authRoutes };