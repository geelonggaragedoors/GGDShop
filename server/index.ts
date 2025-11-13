import dotenv from "dotenv";
// Load environment variables
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import passport from "passport";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Verify SendGrid API key is loaded
if (!process.env.SENDGRID_API_KEY) {
  console.log('⚠️  SENDGRID_API_KEY not found in environment variables');
  console.log('   Please add it to your Replit Secrets for email functionality');
} else {
  console.log('✅ SendGrid API key loaded successfully');
}

// Set UploadThing environment variable
process.env.UPLOADTHING_TOKEN = 'eyJhcGlLZXkiOiJza19saXZlXzA2MTI4MjRkNDkwZGY1ZTVjY2RkMGNlMWJhYzY2ZWI3YzVkYzdiZmY1NWVhMWY3YmU5NzhhYzQ1M2E5NTRlZWUiLCJhcHBJZCI6ImUydWNibmYxbnQiLCJyZWdpb25zIjpbInNlYTEiXX0=';

const app = express();

// Add compression middleware for faster response times
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Add cache headers for static assets
app.use((req, res, next) => {
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.url.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve static files from public directory
app.use(express.static('public'));

// Serve uploaded files from uploads directory
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  app.use(session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    name: 'ggd.sid',
    cookie: {
      httpOnly: true,
      secure: false, // Allow in development
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  // Use Railway's PORT or default to 5000 for local development
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
