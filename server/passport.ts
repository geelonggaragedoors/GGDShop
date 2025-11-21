import passport from 'passport';
import { db } from './db';
import { users, customers } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Serialize user for session storage
passport.serializeUser((user: any, done) => {
  console.log('Serializing user:', { id: user.id, email: user.email, role: user.role });
  
  // Create a minimal user object for session storage
  const sessionUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role || 'customer',
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    table: user.role ? 'users' : 'customers' // Track which table the user came from
  };
  
  done(null, sessionUser);
});

// Deserialize user from session
passport.deserializeUser(async (sessionUser: any, done) => {
  try {
    console.log('Deserializing user:', sessionUser);
    
    let user;
    
    // Check which table to query based on the stored table info
    if (sessionUser.table === 'users' || sessionUser.role !== 'customer') {
      // Query users table for staff/admin
      const [staffUser] = await db.select().from(users).where(eq(users.id, sessionUser.id));
      user = staffUser;
    } else {
      // Query customers table
      const [customerUser] = await db.select().from(customers).where(eq(customers.id, sessionUser.id));
      if (customerUser) {
        // Add role for consistency
        user = { ...customerUser, role: 'customer' };
      }
    }
    
    if (!user) {
      console.log('User not found during deserialization:', sessionUser.id);
      return done(null, false);
    }
    
    // Remove sensitive fields (handle both user types)
    const { passwordHash, ...userWithoutPassword } = user;
    const { resetPasswordToken, emailVerificationToken, ...safeUser } = userWithoutPassword as any;
    
    console.log('Successfully deserialized user:', { id: safeUser.id, email: safeUser.email });
    done(null, safeUser);
    
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});

export default passport;
