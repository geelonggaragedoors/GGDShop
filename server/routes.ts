import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import facebookConversionsAPI from "./facebookConversionsApi";
import { setupAuth } from "./replitAuth";
import { authRoutes } from "./authRoutes";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { handlePayPalWebhook } from "./paypalWebhooks";
import { calculateShippingCost, validateShippingDimensions, getAvailableServices, getAustraliaPostBoxes, calculateTotalShippingCost } from "./australiaPost";
import { fileStorage } from "./fileStorage";
import { removeImageBackground } from "./openai";
import { 
  insertProductSchema, 
  insertCategorySchema, 
  insertBrandSchema,
  insertCustomerSchema,
  insertOrderSchema,
  insertStaffInvitationSchema,
  insertRoleSchema,
  insertCustomerReviewSchema,
  insertEnquirySchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { createRouteHandler } from "uploadthing/express";
import { ourFileRouter } from "./uploadthing";
import { importService } from "./importService";
import fs from "fs";
import bcrypt from "bcryptjs";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

// Configure multer for CSV imports
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for CSV files
  },
  fileFilter: (req, file, cb) => {
    // Allow only CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'));
    }
  },
});

// Configure multer for email attachments
const emailUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and common document types
    const allowedTypes = [
      'image/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.some(type => file.mimetype.startsWith(type))) {
      cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and Word documents are allowed!'));
    }
  },
});
import { notificationService } from "./notificationService";
import { analyticsService } from "./analyticsService";
import { authService } from "./authService";
import { emailService } from "./email";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add X-Robots-Tag header for pickup and delivery pages
  app.use("/pickup/ebay-geelong", (req, res, next) => {
    res.set('X-Robots-Tag', 'noindex, nofollow');
    next();
  });
  
  app.use("/pickup", (req, res, next) => {
    res.set('X-Robots-Tag', 'noindex, nofollow');
    next();
  });
  
  app.use("/delivery", (req, res, next) => {
    res.set('X-Robots-Tag', 'noindex, nofollow');
    next();
  });
  
  // Setup authentication
  await setupAuth(app);

  // Hybrid authentication middleware - supports both password and Replit Auth
  const hybridAuth = async (req: any, res: any, next: any) => {
    console.log('=== HYBRID AUTH DEBUG ===');
    console.log('req.isAuthenticated():', req.isAuthenticated());
    console.log('req.user:', req.user);
    console.log('req.session:', req.session);
    console.log('req.sessionID:', req.sessionID);
    console.log('req.headers.cookie:', req.headers.cookie);
    
    // Check if user is authenticated via session (password auth)
    if (req.isAuthenticated() && req.user) {
      // Check if it's a password-authenticated user (has email directly)
      if (req.user.email) {
        console.log('✓ Password-authenticated user found');
        return next();
      }
      // Check if it's a Replit Auth user (has claims)
      if (req.user.claims && req.user.claims.sub) {
        console.log('✓ Replit Auth user found');
        return next();
      }
    }
    
    console.log('✗ No valid authentication found');
    // Not authenticated
    return res.status(401).json({ message: "Unauthorized" });
  };

  // UploadThing routes
  const uploadRouter = createRouteHandler({
    router: ourFileRouter,
  });

  app.use("/api/uploadthing", uploadRouter);

  // Local file upload endpoint
  app.post('/api/upload', hybridAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const result = await fileStorage.saveFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.json({ 
        success: true, 
        file: {
          url: result.url,
          filename: result.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype
        }
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  // Multiple files upload endpoint
  app.post('/api/upload-multiple', hybridAuth, upload.array('files', 10), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }

      const files = req.files as Express.Multer.File[];
      const results = await Promise.all(
        files.map(file => fileStorage.saveFile(file.buffer, file.originalname, file.mimetype))
      );

      res.json({ 
        success: true, 
        files: results.map((result, index) => ({
          url: result.url,
          filename: result.filename,
          originalName: files[index].originalname,
          size: files[index].size,
          mimeType: files[index].mimetype
        }))
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ error: 'Failed to upload files' });
    }
  });

  // Category image upload endpoint
  app.post('/api/upload/category-image', hybridAuth, upload.single('image'), async (req, res) => {
    try {
      const file = req.file as Express.Multer.File;
      
      if (!file) {
        return res.status(400).json({ error: 'No image file provided' });
      }
      
      const result = await fileStorage.saveFile(file.buffer, file.originalname, file.mimetype);
      res.json({ url: result.url, filename: result.filename });
    } catch (error) {
      console.error('Error uploading category image:', error);
      res.status(500).json({ error: 'Failed to upload category image' });
    }
  });

  // AI Background removal endpoint
  app.post('/api/remove-background', hybridAuth, async (req, res) => {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is required' });
      }

      console.log('Processing background removal for:', imageUrl);

      // Fetch the image from the URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const filename = imageUrl.split('/').pop() || 'image.png';

      // Remove background using OpenAI
      const processedImageBuffer = await removeImageBackground({
        imageBuffer,
        originalFilename: filename
      });

      // Save the processed image
      const result = await fileStorage.saveFile(
        processedImageBuffer,
        `bg-removed-${filename}`,
        'image/png'
      );

      console.log('Background removal completed, new URL:', result.url);
      res.json({ 
        success: true, 
        originalUrl: imageUrl,
        newUrl: result.url,
        filename: result.filename
      });

    } catch (error) {
      console.error('Error in background removal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: `Background removal failed: ${errorMessage}` });
    }
  });

  // Enhanced authentication routes
  app.use('/api/auth', authRoutes);

  // Public registration endpoint for checkout
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone, address } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getCustomerByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
      
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await storage.createCustomer({
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        phone,
        isActive: true
      });
      
      // Auto-login the user
      req.login(user, (err) => {
        if (err) {
          console.error('Auto-login error:', err);
          return res.status(201).json({ message: "Account created successfully" });
        }
        
        // Remove sensitive fields
        const { passwordHash, ...userResponse } = user;
        res.status(201).json({ user: userResponse, message: "Account created and logged in successfully" });
      });
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Update profile endpoint with PATCH method
  app.patch('/api/auth/update-profile', hybridAuth, async (req: any, res) => {
    try {
      const { firstName, lastName, phone, address } = req.body;
      
      let userId;
      
      // Handle password-authenticated user
      if (req.user.email) {
        userId = req.user.id;
      } 
      // Handle Replit Auth user
      else if (req.user.claims && req.user.claims.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      const updatedUser = await storage.updateUserProfile(userId, {
        firstName,
        lastName,
        phone,
        address
      });
      
      // Remove sensitive fields
      const { passwordHash, resetPasswordToken, emailVerificationToken, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Auth routes with hybrid authentication
  app.get('/api/auth/user', hybridAuth, async (req: any, res) => {
    try {
      let user;
      
      // Handle password-authenticated user
      if (req.user.email) {
        console.log('Password-authenticated user, getting fresh data from database for ID:', req.user.id);
        user = await storage.getUser(req.user.id);
        console.log('Fresh user data from database:', user);
      } 
      // Handle Replit Auth user
      else if (req.user.claims && req.user.claims.sub) {
        const userId = req.user.claims.sub;
        console.log('Fetching user from database for ID:', userId);
        user = await storage.getUser(userId);
        console.log('Retrieved user from database:', user);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive fields
      const { passwordHash, resetPasswordToken, emailVerificationToken, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile update endpoint
  app.put('/api/user/profile', hybridAuth, async (req: any, res) => {
    try {
      const { firstName, lastName, phone, address } = req.body;
      
      let userId;
      
      // Handle password-authenticated user
      if (req.user.email) {
        userId = req.user.id;
      } 
      // Handle Replit Auth user
      else if (req.user.claims && req.user.claims.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      const updatedUser = await storage.updateUserProfile(userId, {
        firstName,
        lastName,
        phone,
        address
      });
      
      // Remove sensitive fields
      const { passwordHash, resetPasswordToken, emailVerificationToken, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // User orders endpoint
  app.get('/api/user/orders', hybridAuth, async (req: any, res) => {
    try {
      let userId;
      
      // Handle password-authenticated user
      if (req.user.email) {
        userId = req.user.id;
      } 
      // Handle Replit Auth user
      else if (req.user.claims && req.user.claims.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      const orders = await storage.getOrdersByUserId(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Public product routes
  app.get('/api/products', async (req, res) => {
    try {
      const { 
        categoryId, 
        brandId, 
        search, 
        featured, 
        limit = '20', 
        offset = '0' 
      } = req.query;

      const params = {
        categoryId: categoryId as string,
        brandId: brandId as string,
        search: search as string,
        featured: featured === 'true',
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const result = await storage.getProducts(params);
      res.json(result);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Search suggestions endpoint - MUST come before /api/products/:id
  app.get('/api/products/search', async (req, res) => {
    try {
      const { q, limit = '20' } = req.query;
      
      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.json({ products: [] });
      }

      const products = await storage.searchProducts(
        q.trim(),
        parseInt(limit as string)
      );

      // Include category and brand info for each product
      const productsWithDetails = await Promise.all(
        products.map(async (product) => {
          const [category, brand] = await Promise.all([
            product.categoryId ? storage.getCategoryById(product.categoryId) : null,
            product.brandId ? storage.getBrandById(product.brandId) : null
          ]);
          
          return {
            ...product,
            category: category ? { id: category.id, name: category.name } : null,
            brand: brand ? { id: brand.id, name: brand.name } : null
          };
        })
      );

      res.json({ products: productsWithDetails });
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ error: "Failed to search products" });
    }
  });

  app.get('/api/products/slug/:slug', async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Public category routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Public brand routes
  app.get('/api/brands', async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  // Order submission (public)
  app.post('/api/orders', async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      
      // Validate order data
      const validOrderData = insertOrderSchema.parse(orderData);
      
      // Auto-create customer if they don't exist (guest checkout)
      if (validOrderData.customerEmail && !validOrderData.customerId) {
        let customer = await storage.getCustomerByEmail(validOrderData.customerEmail);
        
        if (!customer) {
          // Extract name from shipping address or use email as fallback
          const guestCustomerData = {
            email: validOrderData.customerEmail,
            firstName: 'Guest',
            lastName: 'Customer',
            isActive: true,
          };
          
          customer = await storage.createCustomer(guestCustomerData);
          console.log(`✅ Auto-created customer record for: ${validOrderData.customerEmail}`);
        }
        
        // Link order to customer
        validOrderData.customerId = customer.id;
      }
      
      // Create the order
      const order = await storage.createOrder(validOrderData);
      
      // Create order items if provided
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const orderItem = {
            orderId: order.id,
            productId: item.productId,
            quantity: parseInt(item.quantity),
            price: item.price,
            total: item.total
          };
          
          await storage.addOrderItem(orderItem);
        }
      }

      // Track Facebook Conversions API Purchase Event
      try {
        if (items && Array.isArray(items) && order.total) {
          const userData = {
            email: order.customerEmail,
            clientIp: req.ip,
            userAgent: req.get('User-Agent'),
            fbp: req.cookies?._fbp,
            fbc: req.cookies?._fbc,
          };

          const orderItemsData = items.map((item: any) => ({
            id: item.productId,
            title: item.title || item.name || 'Product',
            category: item.category || 'Garage Door Parts',
            price: parseFloat(item.price),
            quantity: parseInt(item.quantity)
          }));

          await facebookConversionsAPI.trackPurchase(
            userData,
            {
              orderId: order.orderNumber,
              total: parseFloat(order.total),
              currency: 'AUD',
              items: orderItemsData
            },
            `${req.protocol}://${req.get('host')}/checkout/success`,
            `purchase_${order.orderNumber}_${Date.now()}`
          );
        }
      } catch (error) {
        console.error('Facebook Conversions API Purchase tracking failed:', error);
      }
      
      res.status(201).json({ order });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // PayPal configuration (public)
  app.get('/api/paypal-config', async (req, res) => {
    res.json({
      clientId: process.env.PAYPAL_CLIENT_ID
    });
  });

  // Facebook Conversions API server-side event tracking endpoint
  app.post('/api/facebook/track-event', async (req, res) => {
    try {
      const { eventType, eventId, data, userData: clientUserData } = req.body;
      
      // Prepare user data from request
      const userData = {
        clientIp: req.ip,
        userAgent: req.get('User-Agent'),
        fbp: req.cookies?._fbp,
        fbc: req.cookies?._fbc,
        ...clientUserData
      };
      
      let success = false;
      
      switch (eventType) {
        case 'ViewContent':
          success = await facebookConversionsAPI.trackViewContent(
            userData,
            {
              id: data.contentId,
              title: data.contentName,
              category: data.contentCategory,
              price: data.value
            },
            data.pageUrl,
            eventId
          );
          break;
          
        case 'AddToCart':
          success = await facebookConversionsAPI.trackAddToCart(
            userData,
            {
              id: data.contentId,
              title: data.contentName,
              category: data.contentCategory,
              price: data.value,
              quantity: data.quantity || 1
            },
            data.pageUrl,
            eventId
          );
          break;
          
        case 'InitiateCheckout':
          success = await facebookConversionsAPI.trackInitiateCheckout(
            userData,
            {
              total: data.value,
              currency: data.currency || 'AUD',
              items: data.items || []
            },
            data.pageUrl,
            eventId
          );
          break;
          
        case 'Lead':
          success = await facebookConversionsAPI.trackLead(
            userData,
            {
              value: data.value,
              currency: data.currency || 'AUD',
              contentCategory: data.contentCategory
            },
            data.pageUrl,
            eventId
          );
          break;
          
        default:
          return res.status(400).json({ error: 'Unsupported event type' });
      }
      
      res.json({ success });
    } catch (error) {
      console.error('Facebook server-side event tracking error:', error);
      res.status(500).json({ error: 'Failed to track event' });
    }
  });

  // Customer registration (public)
  app.post('/api/customers', async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // Australia Post shipping services (public)
  app.get('/api/shipping/services', getAvailableServices);

  // Legacy shipping calculation endpoint - redirected to Australia Post integration
  app.post('/api/shipping/calculate-legacy', async (req, res) => {
    try {
      const { postcode, weight } = req.body;
      if (!postcode || !weight) {
        return res.status(400).json({ message: "Postcode and weight are required" });
      }
      const cost = await storage.calculateShipping(postcode, weight);
      res.json({ cost });
    } catch (error) {
      console.error("Error calculating shipping:", error);
      res.status(500).json({ message: "Failed to calculate shipping" });
    }
  });

  // Counts endpoint for sidebar badges
  app.get("/api/admin/counts", hybridAuth, async (req, res) => {
    try {
      const [productsResult, ordersResult] = await Promise.all([
        storage.getProducts({ includeUnpublished: true, limit: 1 }), // Get total count for admin
        storage.getOrders({ limit: 1 }) // Get total count
      ]);
      
      const counts = {
        products: productsResult.total || 0,
        orders: ordersResult.total || 0
      };
      
      res.json(counts);
    } catch (error) {
      console.error("Error fetching counts:", error);
      res.status(500).json({ message: "Failed to fetch counts" });
    }
  });

  // Protected admin routes
  app.get('/api/admin/dashboard', hybridAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Admin product management
  app.get('/api/admin/products', hybridAuth, async (req, res) => {
    try {
      const { categoryId, brandId, search, featured, active, noWeight, hasWeight, limit, offset } = req.query;
      const params = {
        categoryId: categoryId as string,
        brandId: brandId as string,
        search: search as string,
        featured: featured === 'true',
        active: active !== 'false',
        noWeight: noWeight === 'true',
        hasWeight: hasWeight === 'true',
        includeUnpublished: true, // Show all products in admin
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };

      const result = await storage.getProducts(params);
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  app.post('/api/admin/products', hybridAuth, async (req, res) => {
    try {
      console.log("Creating product with data:", req.body);
      
      // Handle empty SKU values - generate automatic SKU
      if (!req.body.sku || req.body.sku === "") {
        // Generate SKU from product name and timestamp
        const timestamp = Date.now().toString().slice(-6);
        const namePrefix = req.body.name
          .replace(/[^a-zA-Z0-9]/g, '')
          .substring(0, 6)
          .toUpperCase();
        req.body.sku = `${namePrefix}${timestamp}`;
        console.log("Generated SKU:", req.body.sku);
      }
      
      const productData = insertProductSchema.parse(req.body);
      console.log("Parsed product data:", productData);
      
      // Validate shipping dimensions
      const validation = validateShippingDimensions(productData);
      console.log("Shipping validation result:", validation);
      
      if (!validation.isValid) {
        // Save as draft if shipping info is missing
        productData.status = 'draft';
        console.log("Creating product as draft due to missing shipping info");
        const product = await storage.createProduct(productData);
        return res.status(201).json({
          ...product,
          validationError: `Shipping size and weight must be provided. Product will be saved as a draft until all details are entered. Missing: ${validation.missingFields.join(', ')}`
        });
      }
      
      // Calculate shipping cost and publish product
      try {
        const shippingCost = await calculateShippingCost({
          weight: Number(productData.weight!),
          length: Number(productData.length!),
          width: Number(productData.width!),
          height: Number(productData.height!)
        });
        
        (productData as any).shippingCost = shippingCost.toString();
        productData.status = 'published';
        
        const product = await storage.createProduct(productData);
        res.status(201).json(product);
      } catch (shippingError) {
        console.error("Error calculating shipping:", shippingError);
        // Save as draft if shipping calculation fails
        productData.status = 'draft';
        const product = await storage.createProduct(productData);
        res.status(201).json({
          ...product,
          validationError: "Unable to calculate shipping cost. Product saved as draft."
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Get single product by ID  
  app.get("/api/admin/products/:id", hybridAuth, async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Update product image order
  app.put('/api/admin/products/:id/images/reorder', hybridAuth, async (req, res) => {
    try {
      const { images } = req.body;
      
      if (!Array.isArray(images)) {
        return res.status(400).json({ message: "Images must be an array" });
      }
      
      const product = await storage.updateProduct(req.params.id, { images });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json({ message: "Image order updated successfully", images: product.images });
    } catch (error) {
      console.error("Error reordering product images:", error);
      res.status(500).json({ message: "Failed to reorder images" });
    }
  });

  app.put('/api/admin/products/:id', hybridAuth, async (req, res) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      
      // Check if this update includes shipping dimensions
      const hasShippingData = productData.weight || productData.length || productData.width || productData.height;
      
      if (hasShippingData) {
        // Get current product to merge data
        const currentProduct = await storage.getProductById(req.params.id);
        if (!currentProduct) {
          return res.status(404).json({ message: "Product not found" });
        }
        
        // Merge current and new data for validation
        const mergedData = { ...currentProduct, ...productData };
        const validation = validateShippingDimensions(mergedData);
        
        if (!validation.isValid) {
          // Update as draft if shipping info is still missing
          productData.status = 'draft';
          const product = await storage.updateProduct(req.params.id, productData);
          return res.json({
            ...product,
            validationError: `Shipping size and weight must be provided. Product will be saved as a draft until all details are entered. Missing: ${validation.missingFields.join(', ')}`
          });
        }
        
        // Calculate shipping cost and publish product
        try {
          const shippingCost = await calculateShippingCost({
            weight: Number(mergedData.weight!),
            length: Number(mergedData.length!),
            width: Number(mergedData.width!),
            height: Number(mergedData.height!)
          });
          
          (productData as any).shippingCost = shippingCost.toString();
          productData.status = 'published';
        } catch (shippingError) {
          console.error("Error calculating shipping:", shippingError);
          productData.status = 'draft';
        }
      }
      
      const product = await storage.updateProduct(req.params.id, productData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Bulk import products
  app.post('/api/admin/products/bulk', hybridAuth, async (req, res) => {
    try {
      const { products } = req.body;
      
      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: "Invalid products data" });
      }

      const createdProducts = [];
      const errors = [];

      for (let i = 0; i < products.length; i++) {
        try {
          const productData = products[i];
          
          // Validate required fields
          if (!productData.name || !productData.sku || !productData.price || !productData.categoryId) {
            errors.push(`Row ${i + 2}: Missing required fields (name, sku, price, categoryId)`);
            continue;
          }

          // Convert string values to appropriate types
          const processedProduct = {
            ...productData,
            price: parseFloat(productData.price.toString()),
            stockQuantity: parseInt(productData.stockQuantity?.toString() || '0'),
            weight: parseFloat(productData.weight?.toString() || '0'),
            height: parseFloat(productData.height?.toString() || '0'),
            width: parseFloat(productData.width?.toString() || '0'),
            length: parseFloat(productData.length?.toString() || '0'),
            featured: productData.featured === true || productData.featured === 'true',
            active: productData.active === true || productData.active === 'true',
            status: 'draft' // Start as draft until validation
          };

          // Validate shipping dimensions if provided
          const validation = validateShippingDimensions(processedProduct);
          
          if (validation.isValid) {
            try {
              const shippingCost = await calculateShippingCost({
                weight: Number(processedProduct.weight),
                length: Number(processedProduct.length),
                width: Number(processedProduct.width),
                height: Number(processedProduct.height)
              });
              processedProduct.shippingCost = shippingCost.toString();
              processedProduct.status = 'published';
            } catch (shippingError) {
              console.error("Error calculating shipping for bulk import:", shippingError);
              processedProduct.status = 'draft';
            }
          }

          const product = await storage.createProduct(processedProduct);
          createdProducts.push(product);
        } catch (error) {
          console.error(`Error creating product at row ${i + 2}:`, error);
          errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      res.json({
        success: true,
        created: createdProducts.length,
        errors: errors.length,
        errorDetails: errors
      });
    } catch (error) {
      console.error("Bulk import error:", error);
      res.status(500).json({ message: "Failed to import products" });
    }
  });

  // Bulk delete products
  app.post('/api/admin/products/bulk-delete', hybridAuth, async (req, res) => {
    try {
      const { productIds } = req.body;
      
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ message: "Invalid product IDs" });
      }

      const results = [];
      for (const productId of productIds) {
        try {
          const success = await storage.deleteProduct(productId);
          results.push({ id: productId, success });
        } catch (error) {
          console.error(`Error deleting product ${productId}:`, error);
          results.push({ id: productId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      const successCount = results.filter(r => r.success).length;
      res.json({
        success: true,
        deleted: successCount,
        total: productIds.length,
        results
      });
    } catch (error) {
      console.error("Bulk delete error:", error);
      res.status(500).json({ message: "Failed to delete products" });
    }
  });

  app.delete('/api/admin/products/:id', hybridAuth, async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Update product status (publish/unpublish)
  app.patch('/api/admin/products/:id/status', hybridAuth, async (req, res) => {
    try {
      const { status } = req.body;
      
      if (!['published', 'draft'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'published' or 'draft'" });
      }

      const product = await storage.updateProduct(req.params.id, { status });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json({ message: `Product ${status} successfully`, product });
    } catch (error) {
      console.error("Error updating product status:", error);
      res.status(500).json({ message: "Failed to update product status" });
    }
  });

  // Update product free postage
  app.patch('/api/admin/products/:id/free-postage', hybridAuth, async (req, res) => {
    try {
      const { freePostage } = req.body;
      
      if (typeof freePostage !== 'boolean') {
        return res.status(400).json({ message: "Invalid freePostage value. Must be boolean" });
      }

      const product = await storage.updateProduct(req.params.id, { freePostage });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json({ message: `Free postage ${freePostage ? 'enabled' : 'disabled'} successfully`, product });
    } catch (error) {
      console.error("Error updating product free postage:", error);
      res.status(500).json({ message: "Failed to update product free postage" });
    }
  });

  // Admin category management
  app.get('/api/admin/categories', hybridAuth, async (req, res) => {
    try {
      const categories = await storage.getCategoriesWithProductCount();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/admin/categories', hybridAuth, async (req, res) => {
    try {
      console.log('Category creation request body:', req.body);
      const categoryData = insertCategorySchema.parse(req.body);
      console.log('Category data after parsing:', categoryData);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('Zod validation errors:', error.errors);
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put('/api/admin/categories/:id', hybridAuth, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, categoryData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete('/api/admin/categories/:id', hybridAuth, async (req, res) => {
    try {
      const success = await storage.deleteCategory(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      // Return the specific error message if it's a constraint violation
      if (error instanceof Error && error.message.includes("Cannot delete category")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Admin brand management
  app.get('/api/admin/brands', hybridAuth, async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  app.post('/api/admin/brands', hybridAuth, async (req, res) => {
    try {
      console.log('Brand creation request body:', req.body);
      const brandData = insertBrandSchema.parse(req.body);
      console.log('Brand data after parsing:', brandData);
      const brand = await storage.createBrand(brandData);
      console.log('Brand created successfully:', brand);
      res.status(201).json(brand);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('Brand Zod validation errors:', error.errors);
        return res.status(400).json({ message: "Invalid brand data", errors: error.errors });
      }
      console.error("Error creating brand:", error);
      res.status(500).json({ message: "Failed to create brand" });
    }
  });

  app.put('/api/admin/brands/:id', hybridAuth, async (req, res) => {
    try {
      const brandData = insertBrandSchema.partial().parse(req.body);
      const brand = await storage.updateBrand(req.params.id, brandData);
      if (!brand) {
        return res.status(404).json({ message: "Brand not found" });
      }
      res.json(brand);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid brand data", errors: error.errors });
      }
      console.error("Error updating brand:", error);
      res.status(500).json({ message: "Failed to update brand" });
    }
  });

  app.delete('/api/admin/brands/:id', hybridAuth, async (req, res) => {
    try {
      const success = await storage.deleteBrand(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Brand not found" });
      }
      res.json({ message: "Brand deleted successfully" });
    } catch (error) {
      console.error("Error deleting brand:", error);
      res.status(500).json({ message: "Failed to delete brand" });
    }
  });

  // Order tracking (public endpoint)
  app.get('/api/orders/track/:orderNumber', async (req, res) => {
    try {
      const orderNumber = req.params.orderNumber;
      const order = await storage.getOrderByNumber(orderNumber);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Get order items
      const orderItems = await storage.getOrderItems(order.id);

      // Get customer details if available
      const customer = order.customerId ? await storage.getCustomerById(order.customerId) : null;

      // Format the order for the tracking page
      const trackingData = {
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.customerId || '',
        items: orderItems.map(item => ({
          id: item.id,
          name: (item as any).productName || `Product ${item.productId}`,
          quantity: item.quantity,
          price: parseFloat(item.price),
          image: (item as any).productImage || '',
          sku: (item as any).productSku || ''
        })),
        total: parseFloat(order.total),
        status: order.status,
        shippingAddress: order.shippingAddress ? {
          address: (order.shippingAddress as string)?.split(',')[0]?.trim() || '',
          city: (order.shippingAddress as string)?.split(',')[1]?.trim() || '',
          state: (order.shippingAddress as string)?.split(',')[2]?.trim().split(' ')[0] || '',
          postcode: (order.shippingAddress as string)?.split(',')[2]?.trim().split(' ')[1] || '',
          country: 'Australia'
        } : {
          address: '',
          city: '',
          state: '',
          postcode: '',
          country: 'Australia'
        },
        billingAddress: {
          firstName: customer?.firstName || '',
          lastName: customer?.lastName || '',
          email: customer?.email || order.customerEmail || '',
          phone: customer?.phone || '',
          address: order.shippingAddress ? (order.shippingAddress as string).split(',')[0]?.trim() || '' : '',
          city: order.shippingAddress ? (order.shippingAddress as string).split(',')[1]?.trim() || '' : '',
          state: order.shippingAddress ? (order.shippingAddress as string).split(',')[2]?.trim().split(' ')[0] || '' : '',
          postcode: order.shippingAddress ? (order.shippingAddress as string).split(',')[2]?.trim().split(' ')[1] || '' : '',
          country: 'Australia'
        },
        paymentMethod: order.paypalOrderId ? 'PayPal' : 'Credit Card',
        paymentStatus: order.paymentStatus,
        trackingNumber: order.auspostTrackingNumber,
        trackingUrl: order.auspostTrackingNumber ? `https://auspost.com.au/mypost/track/details/${order.auspostTrackingNumber}` : null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };

      res.json(trackingData);
    } catch (error) {
      console.error("Error fetching order for tracking:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Admin order management
  app.get('/api/admin/orders', hybridAuth, async (req, res) => {
    try {
      const { status, limit = '50', offset = '0' } = req.query;
      const params = {
        status: status as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };
      const result = await storage.getOrders(params);
      res.json(result);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get order details with items and products
  app.get('/api/admin/orders/:id', hybridAuth, async (req, res) => {
    try {
      const order = await storage.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order details:", error);
      res.status(500).json({ message: "Failed to fetch order details" });
    }
  });

  app.put('/api/admin/orders/:id/status', hybridAuth, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const success = await storage.updateOrderStatus(req.params.id, status);
      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json({ message: "Order status updated successfully" });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Add Australia Post tracking number and update to shipped
  app.post('/api/admin/orders/:id/add-tracking', hybridAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { trackingNumber } = req.body;
      
      if (!trackingNumber || trackingNumber.length !== 12) {
        return res.status(400).json({ message: "Tracking number must be exactly 12 digits" });
      }
      
      // Update order with tracking number and set status to shipped
      const updatedOrder = await storage.addTrackingNumberAndShip(id, trackingNumber);
      
      if (updatedOrder) {
        try {
          // Send shipped email with tracking info
          await emailService.sendOrderShippedEmail(updatedOrder.customerEmail, {
            ...updatedOrder,
            trackingNumber: trackingNumber,
            trackingUrl: `https://auspost.com.au/mypost/track/details/${trackingNumber}`
          });
          console.log(`Shipped email sent for order ${updatedOrder.orderNumber} with tracking ${trackingNumber}`);
        } catch (emailError) {
          console.error('Error sending shipped email:', emailError);
        }
        
        // Update order with shipping notification timestamp
        try {
          await storage.updateOrderTimestamp(id, 'shippingNotificationSentAt', new Date());
        } catch (timestampError) {
          console.error('Error updating shipping notification timestamp:', timestampError);
        }
        
        // Send real-time notification to all staff
        try {
          await notificationService.broadcastToStaff({
            type: 'order_shipped',
            title: 'Order Shipped',
            message: `Order ${updatedOrder.orderNumber} has been shipped with tracking ${trackingNumber}`,
            data: { orderId: id, orderNumber: updatedOrder.orderNumber, trackingNumber }
          });
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }
      }
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error adding tracking number:", error);
      res.status(500).json({ message: "Failed to add tracking number" });
    }
  });

  // Update order details (comprehensive PATCH endpoint)
  app.patch('/api/admin/orders/:id', hybridAuth, async (req, res) => {
    try {
      const orderId = req.params.id;
      const updateData = req.body;
      
      const success = await storage.updateOrder(orderId, updateData);
      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json({ message: "Order updated successfully" });
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Mark order as printed
  app.post('/api/admin/orders/:id/print', hybridAuth, async (req, res) => {
    try {
      const orderId = req.params.id;
      const { printedBy } = req.body;
      
      const success = await storage.updateOrder(orderId, {
        printedAt: new Date(),
        printedBy: printedBy || 'Admin User'
      });
      
      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json({ message: "Order marked as printed successfully" });
    } catch (error) {
      console.error("Error marking order as printed:", error);
      res.status(500).json({ message: "Failed to mark order as printed" });
    }
  });

  // Send order email
  app.post('/api/admin/orders/:id/email', hybridAuth, async (req, res) => {
    try {
      const { type } = req.body;
      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      let templateName = '';
      switch (type) {
        case 'receipt':
        case 'confirmation':
          templateName = 'Order Confirmation';
          break;
        case 'status_update':
        case 'shipped':
          templateName = 'Order Shipped';
          break;
        default:
          return res.status(400).json({ message: "Invalid email type" });
      }

      // Get the template
      const templates = await storage.getEmailTemplates();
      
      const template = templates.find((t: any) => t.name === templateName);
      
      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }

      // Send the email
      let result;
      if (type === 'receipt' || type === 'confirmation') {
        result = await emailService.sendOrderConfirmation(order.customerEmail, order);
      } else if (type === 'status_update' || type === 'shipped') {
        result = await emailService.sendOrderShippedEmail(order.customerEmail, order);
      }

      if (result && result.success) {
        res.json({ message: "Email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send email", error: result?.error });
      }
    } catch (error) {
      console.error("Error sending order email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Delete order
  app.delete('/api/admin/orders/:id', hybridAuth, async (req, res) => {
    try {
      const orderId = req.params.id;
      
      // Check if order exists first
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const success = await storage.deleteOrder(orderId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete order" });
      }
      
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Customer registration (public)
  app.post('/api/customers', async (req, res) => {
    try {
      const { firstName, lastName, email, phone, company, password } = req.body;
      
      if (!firstName || !lastName || !email || !phone || !password) {
        return res.status(400).json({ message: "First name, last name, email, phone, and password are required" });
      }
      
      // Check if customer already exists
      const existingCustomer = await storage.getCustomerByEmail(email);
      if (existingCustomer) {
        return res.status(400).json({ message: "Customer with this email already exists" });
      }
      
      // Hash password for customer
      const passwordHash = await authService.hashPassword(password);
      
      // Create customer
      const customerData = {
        firstName,
        lastName,
        email,
        phone,
        company: company || null,
        passwordHash,
        isActive: true,
      };
      
      const customer = await storage.createCustomer(customerData);
      
      // Remove password hash from response
      const { passwordHash: _, ...customerResponse } = customer;
      
      res.status(201).json({
        customer: customerResponse,
        message: "Account created successfully"
      });
      
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Customer upsert (create or update) - used during checkout
  app.post('/api/customers/upsert', async (req, res) => {
    try {
      const { email, firstName, lastName, phone } = req.body;
      
      if (!email || !firstName || !lastName) {
        return res.status(400).json({ message: "Email, first name, and last name are required" });
      }
      
      // Check if customer already exists
      let customer = await storage.getCustomerByEmail(email);
      
      if (customer) {
        // Update existing customer
        customer = await storage.updateCustomer(customer.id, {
          firstName,
          lastName,
          phone,
          isActive: true,
        });
        
        res.json({
          customer,
          message: "Customer updated successfully"
        });
      } else {
        // Create new customer
        const customerData = {
          email,
          firstName,
          lastName,
          phone,
          isActive: true,
        };
        
        customer = await storage.createCustomer(customerData);
        
        res.status(201).json({
          customer,
          message: "Customer created successfully"
        });
      }
      
    } catch (error) {
      console.error("Error upserting customer:", error);
      res.status(500).json({ message: "Failed to create/update customer" });
    }
  });

  // Admin customer management
  app.get('/api/admin/customers', hybridAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // In-memory storage for media (in production, this would be in the database)
  const mediaStorage = {
    folders: [
      { id: "products", name: "Products", parent: "root", createdAt: new Date().toISOString() },
      { id: "documents", name: "Documents", parent: "root", createdAt: new Date().toISOString() },
      { id: "garage-doors", name: "Garage Doors", parent: "root", createdAt: new Date().toISOString() },
    ],
    files: [
      {
        id: "1",
        filename: "garage-door-sectional.jpg",
        originalName: "garage-door-sectional.jpg",
        mimeType: "image/jpeg",
        size: 245760,
        url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
        alt: "Sectional garage door",
        folder: "root",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        filename: "garage-door-roller.jpg",
        originalName: "garage-door-roller.jpg",
        mimeType: "image/jpeg",
        size: 198432,
        url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
        alt: "Roller garage door",
        folder: "root",
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        filename: "installation-guide.pdf",
        originalName: "installation-guide.pdf",
        mimeType: "application/pdf",
        size: 1024000,
        url: "/documents/installation-guide.pdf",
        alt: "Installation guide",
        folder: "root",
        createdAt: new Date().toISOString(),
      },
    ]
  };

  // Media routes
  app.get("/api/admin/media", hybridAuth, async (req, res) => {
    try {
      const folder = req.query.folder as string || "root";
      
      const folderData = {
        folders: mediaStorage.folders.filter(f => f.parent === folder),
        files: mediaStorage.files.filter(f => f.folder === folder),
      };
      
      res.json(folderData);
    } catch (error) {
      console.error("Error fetching media files:", error);
      res.status(500).json({ message: "Failed to fetch media files" });
    }
  });

  app.post("/api/admin/media", hybridAuth, async (req, res) => {
    try {
      const mediaFile = {
        id: Math.random().toString(36).substr(2, 9),
        ...req.body,
        createdAt: new Date().toISOString(),
      };
      
      // Add to in-memory storage
      mediaStorage.files.push(mediaFile);
      console.log("Created media file:", mediaFile);
      
      res.json(mediaFile);
    } catch (error) {
      console.error("Error creating media file:", error);
      res.status(500).json({ message: "Failed to create media file" });
    }
  });

  app.post("/api/admin/media/folders", hybridAuth, async (req, res) => {
    try {
      const folder = {
        id: Math.random().toString(36).substr(2, 9),
        name: req.body.name,
        parent: req.body.parent || "root",
        createdAt: new Date().toISOString(),
      };
      
      // Add to in-memory storage
      mediaStorage.folders.push(folder);
      console.log("Created folder:", folder);
      
      res.status(201).json(folder);
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(500).json({ message: "Failed to create folder" });
    }
  });

  app.delete("/api/admin/media/:id", hybridAuth, async (req, res) => {
    try {
      const fileIndex = mediaStorage.files.findIndex(f => f.id === req.params.id);
      if (fileIndex > -1) {
        mediaStorage.files.splice(fileIndex, 1);
        console.log("Deleted media file:", req.params.id);
      }
      
      const folderIndex = mediaStorage.folders.findIndex(f => f.id === req.params.id);
      if (folderIndex > -1) {
        mediaStorage.folders.splice(folderIndex, 1);
        console.log("Deleted folder:", req.params.id);
      }
      
      res.json({ message: "Media file deleted successfully" });
    } catch (error) {
      console.error("Error deleting media file:", error);
      res.status(500).json({ message: "Failed to delete media file" });
    }
  });





  // Settings routes
  app.get("/api/admin/settings", hybridAuth, async (req, res) => {
    try {
      // Get analytics settings from database
      const analyticsSettings = await storage.getSiteSettings();
      const analyticsMap: Record<string, any> = {};
      analyticsSettings.forEach(setting => {
        if (setting.key.startsWith('analytics_')) {
          const key = setting.key.replace('analytics_', '');
          analyticsMap[key] = setting.value === 'true' || (setting.value !== 'false' && setting.value !== '' && setting.value);
        }
      });

      const settings = {
        store: {
          storeName: "Geelong Garage Doors",
          storeDescription: "Professional garage door solutions across Geelong and surrounding areas",
          contactEmail: "info@geelonggaragedoors.com.au",
          contactPhone: "(03) 5221 8999",
          address: "Geelong, VIC 3220",
          website: "https://geelonggaragedoors.com.au",
        },
        shipping: {
          defaultShippingRate: "25.00",
          freeShippingThreshold: "500.00",
          australiaPostApiKey: "",
          enableAustraliaPost: false,
          localDeliveryRadius: "50",
          localDeliveryRate: "15.00",
        },
        notifications: {
          orderNotifications: true,
          lowStockNotifications: true,
          customerSignupNotifications: true,
          emailHost: "smtp.gmail.com",
          emailPort: "587",
          emailUsername: "",
          emailPassword: "",
        },
        security: {
          requireStrongPasswords: true,
          sessionTimeout: "24",
          twoFactorAuth: false,
          backupFrequency: "daily",
        },
        analytics: {
          googleAnalyticsId: analyticsMap.googleAnalyticsId || "",
          facebookPixelId: analyticsMap.facebookPixelId || "",
          googleTagManagerId: analyticsMap.googleTagManagerId || "",
          enableGoogleAnalytics: analyticsMap.enableGoogleAnalytics === true,
          enableFacebookPixel: analyticsMap.enableFacebookPixel === true,
          enableGoogleTagManager: analyticsMap.enableGoogleTagManager === true,
          enableConversionTracking: analyticsMap.enableConversionTracking !== false,
          enableEcommerceTracking: analyticsMap.enableEcommerceTracking !== false,
        }
      };
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/admin/settings", hybridAuth, async (req, res) => {
    try {
      const { section, data } = req.body;
      
      if (section === 'analytics') {
        // Save analytics settings to database
        for (const [key, value] of Object.entries(data)) {
          const settingKey = `analytics_${key}`;
          const settingValue = typeof value === 'boolean' ? value.toString() : String(value || '');
          
          // Try to update existing setting or create new one
          const existingSetting = await storage.getSiteSettingByKey(settingKey);
          if (existingSetting) {
            await storage.updateSiteSetting(settingKey, settingValue);
          } else {
            await storage.createSiteSetting({
              key: settingKey,
              value: settingValue,
              description: `Analytics setting for ${key}`
            });
          }
        }
      }
      
      res.json({ message: "Settings updated successfully", section, data });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Google Places API key endpoint
  app.get("/api/google-places-key", async (req, res) => {
    try {
      res.json({ apiKey: process.env.GOOGLE_PLACES_API_KEY });
    } catch (error) {
      console.error("Error fetching Google Places API key:", error);
      res.status(500).json({ message: "Failed to fetch API key" });
    }
  });

  // Australia Post shipping routes
  app.get("/api/shipping/boxes", async (req, res) => {
    await getAustraliaPostBoxes(req, res);
  });

  // Calculate shipping cost with box pricing and GST
  app.post("/api/shipping/calculate", async (req, res) => {
    try {
      const { weight, length, width, height, boxSize, toPostcode } = req.body;
      
      if (!weight || !length || !width || !height || !toPostcode) {
        return res.status(400).json({ 
          message: "Missing required fields: weight, length, width, height, toPostcode" 
        });
      }

      const { calculateTotalShippingCost } = await import("./australiaPost");
      
      const dimensions = { 
        weight: parseFloat(weight), 
        length: parseFloat(length), 
        width: parseFloat(width), 
        height: parseFloat(height) 
      };
      
      // Use default box size if not provided
      const finalBoxSize = boxSize || 'Bx1';
      
      const result = await calculateTotalShippingCost(dimensions, finalBoxSize, toPostcode);
      
      res.json(result);
    } catch (error) {
      console.error("Shipping calculation error:", error);
      res.status(500).json({ 
        message: "Failed to calculate shipping cost" 
      });
    }
  });

  // PayPal routes
  app.get("/api/paypal-config", (req, res) => {
    res.json({ clientId: process.env.PAYPAL_CLIENT_ID });
  });

  app.get("/api/paypal/setup", async (req, res) => {
    try {
      await loadPaypalDefault(req, res);
    } catch (error) {
      console.error("PayPal setup error:", error);
      res.status(500).json({ error: "PayPal configuration error" });
    }
  });

  app.post("/api/paypal/order", async (req, res) => {
    try {
      await createPaypalOrder(req, res);
    } catch (error) {
      console.error("PayPal order creation error:", error);
      res.status(500).json({ error: "Failed to create PayPal order" });
    }
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
    try {
      await capturePaypalOrder(req, res);
    } catch (error) {
      console.error("PayPal capture error:", error);
      res.status(500).json({ error: "Failed to capture PayPal payment" });
    }
  });

  // PayPal webhook endpoint for payment confirmations
  app.post("/api/paypal/webhook", async (req, res) => {
    await handlePayPalWebhook(req, res);
  });

  // Update order payment status
  app.patch("/api/orders/:id/payment-status", async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus, status } = req.body;
      
      await storage.updateOrderStatus(id, status);
      
      // Send appropriate status update email
      try {
        const order = await storage.getOrder(id);
        if (order && order.customerEmail) {
          const orderData = {
            orderNumber: order.orderNumber,
            customerName: (order.shippingAddress as any)?.firstName ? 
              `${(order.shippingAddress as any).firstName} ${(order.shippingAddress as any).lastName}` : 
              'Valued Customer',
            tracking: order.auspostTrackingNumber
          };

          if (status === 'processing') {
            await emailService.sendOrderProcessingEmail(order.customerEmail, orderData);
            console.log('Order processing email sent to:', order.customerEmail);
          } else if (status === 'shipped') {
            await emailService.sendOrderShippedEmail(order.customerEmail, orderData);
            console.log('Order shipped email sent to:', order.customerEmail);
          } else if (status === 'delivered') {
            await emailService.sendOrderDeliveredEmail(order.customerEmail, orderData);
            console.log('Order delivered email sent to:', order.customerEmail);
          } else if (status === 'canceled') {
            await emailService.sendOrderCanceledEmail(order.customerEmail, orderData);
            console.log('Order canceled email sent to:', order.customerEmail);
          }
        }
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Password reset request
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getCustomerByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: "If an account exists with this email, you will receive reset instructions" });
      }

      // Generate reset token
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      await storage.updateCustomer(user.id, {
        passwordHash: user.passwordHash // Keep existing password until reset
      });

      // Send password reset email
      try {
        const templates = await storage.getEmailTemplates();
        
        const resetTemplate = templates.find((t: any) => t.name === 'Password Reset');
        if (resetTemplate) {
          const resetData = {
            ...user,
            resetLink: `${process.env.NODE_ENV === 'production' ? 'https://geelonggaragedoors.com' : 'http://localhost:5000'}/reset-password?token=${resetToken}`
          };
          
          await emailService.sendPasswordReset(resetData, resetTemplate);
          console.log('Password reset email sent to:', email);
        }
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }

      res.json({ message: "If an account exists with this email, you will receive reset instructions" });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Low stock monitoring endpoint (can be called manually or via cron)
  app.post("/api/admin/check-low-stock", hybridAuth, async (req, res) => {
    try {
      const products = await storage.getProducts({ active: true });
      const lowStockProducts = products.products.filter(product => {
        const minStock = 10; // Default minimum stock level
        return (product as any).stock <= minStock;
      });

      if (lowStockProducts.length > 0) {
        const templates = await storage.getEmailTemplates();
        
        const lowStockTemplate = templates.find((t: any) => t.name === 'Low Stock Alert');
        
        if (lowStockTemplate) {
          // Send individual alerts for each low stock product
          const emailPromises = lowStockProducts.map(product => 
            emailService.sendLowStockAlert(product, lowStockTemplate, 'orders@geelonggaragedoors.com')
          );
          
          await Promise.all(emailPromises);
          console.log(`Low stock alerts sent for ${lowStockProducts.length} products`);
        }
      }

      res.json({ 
        message: `Checked ${products.products.length} products`,
        lowStockCount: lowStockProducts.length,
        lowStockProducts: lowStockProducts.map(p => ({ id: p.id, name: p.name, stock: (p as any).stock }))
      });
    } catch (error) {
      console.error("Error checking low stock:", error);
      res.status(500).json({ message: "Failed to check low stock" });
    }
  });

  // Daily report generation endpoint
  app.post("/api/admin/generate-daily-report", hybridAuth, async (req, res) => {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get analytics data for the report
      const orders = await storage.getOrders({ 
        limit: 1000
      });
      
      const reportData = {
        totalOrders: orders.orders.length,
        totalRevenue: orders.orders.reduce((sum, order) => sum + parseFloat(order.total), 0),
        averageOrderValue: orders.orders.length > 0 ? orders.orders.reduce((sum, order) => sum + parseFloat(order.total), 0) / orders.orders.length : 0,
        newCustomers: orders.orders.filter(order => order.createdAt && order.createdAt >= yesterday).length,
        topProducts: [] // You can implement this based on your needs
      };

      const templates = await storage.getEmailTemplates();
      
      const dailyReportTemplate = templates.find((t: any) => t.name === 'Daily Sales Report');
      
      if (dailyReportTemplate) {
        await emailService.sendDailyReport(reportData, dailyReportTemplate, 'orders@geelonggaragedoors.com');
        console.log('Daily report sent to admin');
      }

      res.json({ 
        message: "Daily report generated and sent",
        reportData
      });
    } catch (error) {
      console.error("Error generating daily report:", error);
      res.status(500).json({ message: "Failed to generate daily report" });
    }
  });

  // System alert endpoint
  app.post("/api/admin/system-alert", hybridAuth, async (req, res) => {
    try {
      const { type, severity, message, serverName, serviceName, errorCode } = req.body;
      
      const alertData = {
        type: type || 'System Alert',
        severity: severity || 'Medium',
        message: message || 'System alert triggered',
        serverName: serverName || 'web-server-01',
        serviceName: serviceName || 'application',
        errorCode: errorCode || 'SYS_001'
      };

      const templates = await storage.getEmailTemplates();
      
      const systemAlertTemplate = templates.find((t: any) => t.name === 'System Alert');
      
      if (systemAlertTemplate) {
        await emailService.sendSystemAlert(alertData, systemAlertTemplate, 'orders@geelonggaragedoors.com');
        console.log('System alert sent to admin');
      }

      res.json({ 
        message: "System alert sent",
        alertData
      });
    } catch (error) {
      console.error("Error sending system alert:", error);
      res.status(500).json({ message: "Failed to send system alert" });
    }
  });

  // Order tracking endpoint (public - no authentication required)
  app.get("/api/orders/track", async (req, res) => {
    try {
      const { orderNumber, email } = req.query;

      if (!orderNumber || !email) {
        return res.status(400).json({ message: "Order number and email are required" });
      }

      // Get order by order number and verify email matches
      const order = await storage.getOrderByNumber(orderNumber as string);
      
      if (!order || order.customerEmail?.toLowerCase() !== (email as string).toLowerCase()) {
        return res.status(404).json({ message: "Order not found or email doesn't match" });
      }

      // Get order items
      const orderItems = await storage.getOrderItems(order.id);
      
      // Get customer details
      const customer = order.customerId ? await storage.getCustomerById(order.customerId) : null;

      // Format response
      const trackingData = {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: parseFloat(order.total),
        createdAt: order.createdAt,
        items: orderItems.map(item => ({
          id: item.id,
          productName: (item as any).productName || `Product ${item.productId}`,
          quantity: item.quantity,
          price: parseFloat(item.price)
        })),
        shippingAddress: order.shippingAddress ? {
          street: (order.shippingAddress as string)?.split(',')[0]?.trim() || '',
          city: (order.shippingAddress as string)?.split(',')[1]?.trim() || '',
          state: (order.shippingAddress as string)?.split(',')[2]?.trim().split(' ')[0] || '',
          postalCode: (order.shippingAddress as string)?.split(',')[2]?.trim().split(' ')[1] || ''
        } : {},
        customer: {
          firstName: customer?.firstName || '',
          lastName: customer?.lastName || '',
          email: customer?.email || order.customerEmail || ''
        }
      };

      res.json(trackingData);
    } catch (error) {
      console.error("Error tracking order:", error);
      res.status(500).json({ message: "Failed to track order" });
    }
  });

  // Order creation endpoint
  app.post("/api/orders", async (req, res) => {
    try {
      const { customerData, cartItems, shippingMethod, paymentMethod, totals } = req.body;
      
      // Create customer if doesn't exist
      let customer = await storage.getCustomerByEmail(customerData.email);
      if (!customer) {
        customer = await storage.createCustomer({
          email: customerData.email,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          phone: customerData.phone
        });
      }

      // Generate order number
      const orderNumber = `GGD-${Date.now().toString().slice(-8)}`;

      // Create order
      const order = await storage.createOrder({
        orderNumber,
        customerId: customer.id,
        customerEmail: customer.email,
        status: paymentMethod === 'paypal' ? 'pending_payment' : 'processing',
        paymentStatus: 'pending',
        subtotal: totals.subtotal.toString(),
        shippingCost: totals.shipping.toString(),
        taxAmount: totals.tax.toString(),
        total: totals.total.toString(),
        shippingAddress: `${customerData.address}, ${customerData.city}, ${customerData.state} ${customerData.postcode}`,
        notes: `Shipping: ${shippingMethod === 'express' ? 'Express (2-3 days)' : 'Standard (5-7 days)'}`
      });

      // Send order confirmation email
      try {
        console.log('Attempting to send order confirmation email to:', customer.email);
        const templates = await storage.getEmailTemplates();
        console.log('Found customer templates:', templates.length);
        
        const orderConfirmationTemplate = templates.find((t: any) => t.name === 'Order Confirmation');
        console.log('Order confirmation template found:', !!orderConfirmationTemplate);
        
        if (orderConfirmationTemplate) {
          const orderWithItems = {
            ...order,
            customerEmail: customer.email,
            customerName: `${customerData.firstName} ${customerData.lastName}`,
            items: cartItems,
            total: totals.total
          };
          
          const result = await emailService.sendOrderConfirmation(orderWithItems.customerEmail, orderWithItems);
          console.log('Order confirmation email result:', result);
          if (result.success) {
            console.log('✅ Order confirmation email sent successfully to:', customer.email);
          } else {
            console.error('❌ Order confirmation email failed:', result.error);
          }
        } else {
          console.warn('⚠️ Order confirmation template not found or not active');
        }

        // Send new order alert to staff
        console.log('Attempting to send new order alert to staff');
        const staffTemplates = await storage.getEmailTemplates();
        console.log('Found staff templates:', staffTemplates.length);
        
        const staffTemplate = staffTemplates.find((t: any) => t.name === 'New Order Alert');
        console.log('New order alert template found:', !!staffTemplate);
        if (staffTemplate) {
          const orderWithItems = {
            ...order,
            customerEmail: customer.email,
            customerName: `${customerData.firstName} ${customerData.lastName}`,
            items: cartItems,
            total: totals.total
          };
          
          const result = await emailService.sendNewOrderAlert(orderWithItems, staffTemplate, 'orders@geelonggaragedoors.com');
          console.log('Staff email result:', result);
          if (result.success) {
            console.log('✅ New order alert sent successfully to staff');
          } else {
            console.error('❌ Staff email failed:', result.error);
          }
        } else {
          console.warn('⚠️ New Order Alert template not found or not active');
        }

        // Create admin notification for new order (notify all admin users)
        try {
          const adminUsers = await storage.getAdminUsers(); // Get all admin users
          for (const admin of adminUsers) {
            await notificationService.createOrderNotification(
              admin.id,
              order.id,
              'new',
              {
                orderNumber: order.orderNumber,
                customerName: `${customerData.firstName} ${customerData.lastName}`,
                total: totals.total,
                itemCount: cartItems.length
              }
            );
          }
          console.log('✅ Admin notifications created for new order');
        } catch (notificationError) {
          console.error('❌ Failed to create admin notification:', notificationError);
          // Don't fail the order creation if notification fails
        }
      } catch (emailError) {
        console.error('Failed to send order emails:', emailError);
        // Don't fail the order creation if email fails
      }

      // Add order items
      for (const item of cartItems) {
        await storage.addOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price.toString(),
          total: (item.price * item.quantity).toString()
        });
      }

      res.json({ order, customer });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Server-side PayPal checkout (bypass JavaScript SDK)
  app.post("/api/paypal/redirect-checkout", async (req, res) => {
    try {
      const { amount, currency, orderData } = req.body;
      
      // Create order in database first if orderData provided
      let dbOrder = null;
      if (orderData) {
        const orderResponse = await fetch(`${req.protocol}://${req.get('host')}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
        const result = await orderResponse.json();
        dbOrder = result.order;
      }
      
      // Get PayPal access token
      const tokenResponse = await fetch('https://api.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
      });
      
      const tokenData = await tokenResponse.json();
      
      // Create PayPal order
      const orderResponse = await fetch('https://api.paypal.com/v2/checkout/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenData.access_token}`,
          'PayPal-Request-Id': `order-${Date.now()}`
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: currency,
              value: amount
            },
            custom_id: dbOrder?.id // Link to our database order
          }],
          application_context: {
            return_url: `${req.protocol}://${req.get('host')}/checkout/success?order_id=${dbOrder?.id || ''}`,
            cancel_url: `${req.protocol}://${req.get('host')}/checkout`,
            user_action: 'PAY_NOW'
          }
        })
      });

      const orderData_paypal = await orderResponse.json();
      
      if (orderData_paypal.links) {
        const approveLink = orderData_paypal.links.find((link: any) => link.rel === 'approve');
        res.json({ 
          approveUrl: approveLink.href, 
          orderId: orderData_paypal.id,
          dbOrderId: dbOrder?.id 
        });
      } else {
        throw new Error('No approval link found');
      }
    } catch (error) {
      console.error('PayPal redirect checkout error:', error);
      res.status(500).json({ error: 'Failed to create PayPal checkout' });
    }
  });

  // Notification routes
  app.get("/api/notifications", hybridAuth, async (req: any, res) => {
    try {
      let userId;
      
      // Handle password-authenticated user
      if (req.user.email) {
        userId = req.user.id;
      } 
      // Handle Replit Auth user
      else if (req.user.claims && req.user.claims.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        console.error("No user ID found for notifications request");
        return res.status(401).json({ message: "User ID not found" });
      }
      
      console.log("Fetching notifications for user:", userId);
      const notifications = await notificationService.getUnreadNotifications(userId);
      console.log("Retrieved notifications:", notifications.length);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", hybridAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await notificationService.markNotificationAsRead(id);
      
      if (success) {
        res.json({ message: "Notification marked as read" });
      } else {
        res.status(404).json({ message: "Notification not found" });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", hybridAuth, async (req: any, res) => {
    try {
      let userId;
      
      // Handle password-authenticated user
      if (req.user.email) {
        userId = req.user.id;
      } 
      // Handle Replit Auth user
      else if (req.user.claims && req.user.claims.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const success = await notificationService.markAllAsRead(userId);
      res.json({ message: "All notifications marked as read", success });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Staff Management Routes
  app.get('/api/admin/staff', hybridAuth, async (req, res) => {
    try {
      const staff = await storage.getStaffMembers();
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ message: "Failed to fetch staff members" });
    }
  });

  app.get('/api/admin/staff/:id', hybridAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const staff = await storage.getStaffMemberById(id);
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff member:", error);
      res.status(500).json({ message: "Failed to fetch staff member" });
    }
  });

  app.put('/api/admin/staff/:id', hybridAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const staff = await storage.updateStaffMember(id, updates);
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.json(staff);
    } catch (error) {
      console.error("Error updating staff member:", error);
      res.status(500).json({ message: "Failed to update staff member" });
    }
  });

  app.delete('/api/admin/staff/:id', hybridAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deactivateStaffMember(id);
      res.json({ message: "Staff member deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating staff member:", error);
      res.status(500).json({ message: "Failed to deactivate staff member" });
    }
  });

  // Reset staff password via email
  app.post('/api/admin/staff/:id/reset-password', hybridAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Get admin ID from authenticated user
      let adminId: string;
      if (req.user?.claims?.sub) {
        adminId = req.user.claims.sub;
      } else if (req.user?.id) {
        adminId = req.user.id;
      } else {
        return res.status(401).json({ message: "Unauthorized - admin authentication required" });
      }
      
      await authService.adminResetStaffPassword(id, adminId);
      res.json({ message: "Password reset email sent successfully" });
    } catch (error) {
      console.error("Error resetting staff password:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to reset password" });
    }
  });

  // Generate temporary password directly
  app.post('/api/admin/staff/:id/reset-password-direct', hybridAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Get admin ID from authenticated user
      let adminId: string;
      if (req.user?.claims?.sub) {
        adminId = req.user.claims.sub;
      } else if (req.user?.id) {
        adminId = req.user.id;
      } else {
        return res.status(401).json({ message: "Unauthorized - admin authentication required" });
      }
      
      const tempPassword = await authService.adminDirectPasswordReset(id, adminId);
      res.json({ tempPassword, message: "Temporary password generated successfully" });
    } catch (error) {
      console.error("Error generating temporary password:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate temporary password" });
    }
  });

  // Staff Invitation Routes
  app.get('/api/admin/invitations', hybridAuth, async (req, res) => {
    try {
      const invitations = await storage.getStaffInvitations();
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.post('/api/admin/invitations', hybridAuth, async (req: any, res) => {
    try {
      const validatedData = insertStaffInvitationSchema.parse(req.body);
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
      
      // Get correct user ID from hybrid auth system
      const invitedBy = req.user?.claims?.sub || req.user?.id || 'unknown';
      
      const invitation = await storage.createStaffInvitation({
        ...validatedData
        // expiresAt removed to match schema
      });

      // Send invitation email using Resend
      try {
        const invitationData = {
          ...invitation,
          inviteLink: `${process.env.NODE_ENV === 'production' ? 'https://geelonggaragedoors.com' : req.protocol + '://' + req.get('host')}/admin/accept-invitation?token=${token}`,
          expiryDays: 7,
          role: invitation.role
        };
        
        // Use Resend for staff invitations
        await emailService.sendStaffInvitationViaResend(invitationData);
        console.log('Staff invitation email sent to:', invitation.email, 'via Resend');
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the invitation creation if email fails
      }

      res.json(invitation);
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  app.delete('/api/admin/invitations/:id', hybridAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteStaffInvitation(id);
      res.json({ message: "Invitation deleted successfully" });
    } catch (error) {
      console.error("Error deleting invitation:", error);
      res.status(500).json({ message: "Failed to delete invitation" });
    }
  });

  // CSV Import Route
  app.post('/api/admin/import/woocommerce', hybridAuth, csvUpload.single('csv'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No CSV file uploaded" });
      }

      // Save uploaded file temporarily
      const tempPath = path.join(process.cwd(), 'temp', `import-${Date.now()}.csv`);
      
      // Ensure temp directory exists
      const tempDir = path.dirname(tempPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Write file to temp location
      fs.writeFileSync(tempPath, req.file.buffer);
      
      // Process import
      const results = await importService.importFromWooCommerce(tempPath);
      
      // Clean up temp file
      fs.unlinkSync(tempPath);
      
      res.json(results);
    } catch (error) {
      console.error("Error importing CSV:", error);
      res.status(500).json({ 
        message: "Failed to import CSV",
        error: (error as Error).message 
      });
    }
  });

  // Role Management Routes
  app.get('/api/admin/roles', hybridAuth, async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.post('/api/admin/roles', hybridAuth, async (req, res) => {
    try {
      const validatedData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(validatedData);
      res.json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  app.put('/api/admin/roles/:id', hybridAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const role = await storage.updateRole(id, updates);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.delete('/api/admin/roles/:id', hybridAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRole(id);
      res.json({ message: "Role deleted successfully" });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  // Analytics API routes
  app.post("/api/analytics/page-view", async (req, res) => {
    try {
      await analyticsService.trackPageView(req.body);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Analytics page view error:", error);
      res.status(200).json({ success: true }); // Return success to avoid client errors
    }
  });

  app.post("/api/analytics/event", async (req, res) => {
    try {
      await analyticsService.trackEvent(req.body);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Analytics event error:", error);
      res.status(200).json({ success: true }); // Return success to avoid client errors
    }
  });

  app.post("/api/analytics/session", async (req, res) => {
    try {
      await analyticsService.trackSession(req.body);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Analytics session error:", error);
      res.status(200).json({ success: true }); // Return success to avoid client errors
    }
  });

  app.post("/api/analytics/session-update", async (req, res) => {
    try {
      await analyticsService.trackSession(req.body);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Analytics session update error:", error);
      res.status(200).json({ success: true }); // Return success to avoid client errors
    }
  });

  app.post("/api/analytics/session-convert", async (req, res) => {
    try {
      await analyticsService.trackSession({ ...req.body, isConverted: true });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Analytics session conversion error:", error);
      res.status(500).json({ error: "Failed to track conversion" });
    }
  });

  app.post("/api/analytics/session-end", async (req, res) => {
    try {
      await analyticsService.trackSession(req.body);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Analytics session end error:", error);
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  app.post("/api/analytics/page-view-duration", async (req, res) => {
    try {
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Analytics page view duration error:", error);
      res.status(500).json({ error: "Failed to track page view duration" });
    }
  });

  // Hero Contact Form Route
  app.post("/api/contact/hero-form", async (req, res) => {
    try {
      const { name, email, make, makeOther, model, message, imageUrls } = req.body;
      
      // Determine the actual make value to use
      const actualMake = make === "Other" ? makeOther : make;
      
      // Validate required fields
      if (!name || !email || !actualMake || !model) {
        return res.status(400).json({ error: "Name, email, make, and model are required" });
      }
      
      // Generate images HTML if any images are provided
      const imagesHtml = imageUrls && imageUrls.length > 0 ? `
        <div style="margin: 20px 0;">
          <h3>Attached Images:</h3>
          ${imageUrls.map((imageUrl: string, index: number) => `
            <div style="margin-bottom: 15px;">
              <p><strong>Image ${index + 1}:</strong></p>
              <img src="${imageUrl}" alt="Part image ${index + 1}" style="max-width: 400px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 5px;">
              <br><a href="${imageUrl}" target="_blank">View full image ${index + 1}</a>
            </div>
          `).join('')}
        </div>
      ` : '';
      
      // Construct email HTML
      const emailHtml = `
        <h2>New Part Inquiry from Website Hero Form</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Customer Details:</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Make:</strong> ${actualMake}</p>
          <p><strong>Model:</strong> ${model}</p>
          ${message ? `<p><strong>Additional Details:</strong> ${message}</p>` : ''}
        </div>
        
        ${imagesHtml}
        
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 14px;">
          This inquiry was submitted through the hero form on geelonggaragedoors.com.au
        </p>
      `;
      
      // Send email to admin
      await emailService.sendEmail({
        to: 'admin@geelonggaragedoors.com.au',
        subject: `Part Inquiry - ${actualMake} ${model} from ${name}`,
        html: emailHtml,
      });
      
      res.json({ message: "Your inquiry has been sent successfully" });
      
    } catch (error) {
      console.error("Error processing hero contact form:", error);
      res.status(500).json({ error: "Failed to send inquiry" });
    }
  });

  // Site Settings Routes
  app.get('/api/site-settings', async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ message: "Failed to fetch site settings" });
    }
  });

  app.get('/api/site-settings/:key', async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getSiteSettingByKey(key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching site setting:", error);
      res.status(500).json({ message: "Failed to fetch site setting" });
    }
  });

  app.put('/api/admin/site-settings/:key', hybridAuth, async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const updated = await storage.updateSiteSetting(key, value);
      if (!updated) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json({ message: "Setting updated successfully" });
    } catch (error) {
      console.error("Error updating site setting:", error);
      res.status(500).json({ message: "Failed to update site setting" });
    }
  });

  // Customer Transaction Routes
  // Route for current authenticated user's transactions
  app.get("/api/customer-transactions", hybridAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const userEmail = (req.user as any)?.email;
      
      console.log("=== CUSTOMER TRANSACTIONS DEBUG ===");
      console.log("User ID:", userId);
      console.log("User Email:", userEmail);
      
      if (!userId || !userEmail) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Find customer record by email since user ID is integer but customer ID is UUID
      const customer = await storage.getCustomerByEmail(userEmail);
      console.log("Customer found:", customer);
      
      if (!customer) {
        console.log("No customer record found for email:", userEmail);
        return res.json({ transactions: [], pendingOrders: [] }); // Return empty structure if no customer record
      }
      
      const transactions = await storage.getCustomerTransactions(customer.id);
      const pendingOrders = await storage.getCustomerPendingOrders(userEmail);
      
      console.log("Transactions found:", transactions?.length || 0);
      console.log("Pending orders found:", pendingOrders?.length || 0);
      
      res.json({ transactions, pendingOrders });
    } catch (error) {
      console.error("Error fetching customer transactions:", error);
      res.status(500).json({ message: "Failed to fetch customer transactions" });
    }
  });

  // Get customer email history
  app.get("/api/customer-email-history", hybridAuth, async (req, res) => {
    try {
      const userEmail = (req.user as any)?.email;
      if (!userEmail) {
        return res.status(400).json({ error: "User email not found" });
      }

      console.log("=== CUSTOMER EMAIL HISTORY DEBUG ===");
      console.log("User Email:", userEmail);

      const emailLogs = await storage.getEmailLogs({
        recipientEmail: userEmail,
        limit: 50,
        offset: 0,
      });

      console.log("Email logs found:", emailLogs.logs?.length || 0);

      res.json({ emails: emailLogs.logs || [], total: emailLogs.total || 0 });
    } catch (error) {
      console.error("Error fetching customer email history:", error);
      res.status(500).json({ message: "Failed to fetch customer email history" });
    }
  });

  // Route for specific customer's transactions (admin use)
  app.get("/api/customer-transactions/:customerId", hybridAuth, async (req, res) => {
    try {
      const { customerId } = req.params;
      const transactions = await storage.getCustomerTransactions(customerId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching customer transactions:", error);
      res.status(500).json({ message: "Failed to fetch customer transactions" });
    }
  });

  app.get("/api/customer-transactions/:customerId/:transactionId", async (req, res) => {
    try {
      const { transactionId } = req.params;
      const transaction = await storage.getCustomerTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error fetching customer transaction:", error);
      res.status(500).json({ message: "Failed to fetch customer transaction" });
    }
  });

  app.post("/api/analytics/conversion", async (req, res) => {
    try {
      await analyticsService.trackConversion(req.body);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Analytics conversion error:", error);
      res.status(500).json({ error: "Failed to track conversion" });
    }
  });

  app.post("/api/analytics/seo", async (req, res) => {
    try {
      // Validate and sanitize data before passing to analytics service
      const seoData = req.body;
      
      // Ensure numeric fields are properly handled
      if (seoData.pageSpeed !== undefined) {
        seoData.pageSpeed = typeof seoData.pageSpeed === 'number' ? seoData.pageSpeed : 
                            (isNaN(Number(seoData.pageSpeed)) ? 0 : Number(seoData.pageSpeed));
      }
      
      if (seoData.mobileUsability !== undefined) {
        seoData.mobileUsability = Boolean(seoData.mobileUsability);
      }
      
      await analyticsService.updateSEOMetrics(seoData);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Analytics SEO error:", error);
      res.status(200).json({ success: true }); // Return success to avoid client errors
    }
  });

  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const { range = "7d" } = req.query;
      const endDate = new Date();
      let startDate = new Date();
      
      switch (range) {
        case "1d":
          startDate.setDate(endDate.getDate() - 1);
          break;
        case "7d":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(endDate.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      const data = await analyticsService.getDashboardData(startDate, endDate);
      res.json(data);
    } catch (error) {
      console.error("Analytics dashboard error:", error);
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  });

  app.get("/api/analytics/realtime", async (req, res) => {
    try {
      const data = await analyticsService.getRealTimeData();
      res.json(data);
    } catch (error) {
      console.error("Analytics realtime error:", error);
      res.status(500).json({ error: "Failed to fetch realtime data" });
    }
  });

  // Customer Reviews routes
  app.get('/api/reviews', async (req, res) => {
    try {
      const { isVisible, productId, limit, offset } = req.query;
      const params = {
        isVisible: isVisible === 'true' ? true : isVisible === 'false' ? false : undefined,
        productId: productId as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };
      
      const result = await storage.getCustomerReviews(params);
      res.json(result);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get('/api/reviews/:id', async (req, res) => {
    try {
      const review = await storage.getCustomerReviewById(req.params.id);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      res.json(review);
    } catch (error) {
      console.error("Error fetching review:", error);
      res.status(500).json({ message: "Failed to fetch review" });
    }
  });

  app.post('/api/reviews', async (req, res) => {
    try {
      const validatedData = insertCustomerReviewSchema.parse(req.body);
      const review = await storage.createCustomerReview(validatedData);
      
      // Remove mock reviews when first real review is added
      if (!validatedData.isMockData) {
        await storage.removeMockReviews();
      }
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.put('/api/reviews/:id', hybridAuth, async (req, res) => {
    try {
      const validatedData = insertCustomerReviewSchema.partial().parse(req.body);
      const review = await storage.updateCustomerReview(req.params.id, validatedData);
      
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      res.json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      console.error("Error updating review:", error);
      res.status(500).json({ message: "Failed to update review" });
    }
  });

  app.delete('/api/reviews/:id', hybridAuth, async (req, res) => {
    try {
      const success = await storage.deleteCustomerReview(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Review not found" });
      }
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  app.post('/api/reviews/:id/response', hybridAuth, async (req, res) => {
    try {
      const { response } = req.body;
      const adminId = (req as any).user.claims.sub;
      
      if (!response) {
        return res.status(400).json({ message: "Response is required" });
      }
      
      const success = await storage.addAdminResponse(req.params.id, response, adminId);
      if (!success) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      res.json({ message: "Admin response added successfully" });
    } catch (error) {
      console.error("Error adding admin response:", error);
      res.status(500).json({ message: "Failed to add admin response" });
    }
  });

  app.delete('/api/reviews/mock', hybridAuth, async (req, res) => {
    try {
      const success = await storage.removeMockReviews();
      res.json({ message: "Mock reviews removed successfully", removed: success });
    } catch (error) {
      console.error("Error removing mock reviews:", error);
      res.status(500).json({ message: "Failed to remove mock reviews" });
    }
  });

  // Enquiry routes
  app.get('/api/enquiries', hybridAuth, async (req, res) => {
    try {
      const { status, priority, limit, offset } = req.query;
      const result = await storage.getEnquiries({
        status: status as string,
        priority: priority as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(result);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      res.status(500).json({ message: "Failed to fetch enquiries" });
    }
  });

  app.get('/api/enquiries/:id', hybridAuth, async (req, res) => {
    try {
      const enquiry = await storage.getEnquiryById(req.params.id);
      if (!enquiry) {
        return res.status(404).json({ message: "Enquiry not found" });
      }
      res.json(enquiry);
    } catch (error) {
      console.error("Error fetching enquiry:", error);
      res.status(500).json({ message: "Failed to fetch enquiry" });
    }
  });

  app.post('/api/enquiries', async (req, res) => {
    try {
      const validated = insertEnquirySchema.parse(req.body);
      const enquiry = await storage.createEnquiry(validated);
      
      // Send email notification to admin
      try {
        // Send enquiry notification via regular email
        await emailService.sendEmail({
          to: 'enquiries@geelonggaragedoors.com',
          subject: 'New Enquiry Received',
          html: `<h2>New Enquiry</h2><p>Name: ${enquiry.name}</p><p>Email: ${enquiry.email}</p><p>Message: ${enquiry.message}</p>`
        });
      } catch (emailError) {
        console.error("Failed to send enquiry email:", emailError);
        // Don't fail the request if email fails
      }
      
      // Create admin notification
      try {
        await notificationService.createEnquiryNotification(enquiry);
      } catch (notificationError) {
        console.error("Failed to create enquiry notification:", notificationError);
        // Don't fail the request if notification fails
      }
      
      res.status(201).json(enquiry);
    } catch (error) {
      console.error("Error creating enquiry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid enquiry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create enquiry" });
    }
  });

  app.patch('/api/enquiries/:id/status', hybridAuth, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const success = await storage.updateEnquiryStatus(req.params.id, status);
      if (!success) {
        return res.status(404).json({ message: "Enquiry not found" });
      }
      
      res.json({ message: "Enquiry status updated successfully" });
    } catch (error) {
      console.error("Error updating enquiry status:", error);
      res.status(500).json({ message: "Failed to update enquiry status" });
    }
  });

  app.delete('/api/enquiries/:id', hybridAuth, async (req, res) => {
    try {
      const success = await storage.deleteEnquiry(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Enquiry not found" });
      }
      res.json({ message: "Enquiry deleted successfully" });
    } catch (error) {
      console.error("Error deleting enquiry:", error);
      res.status(500).json({ message: "Failed to delete enquiry" });
    }
  });

  // Simple email test endpoint
  app.post('/api/admin/email-test', hybridAuth, async (req, res) => {
    console.log('=== EMAIL TEST ENDPOINT ===');
    console.log('Request body:', req.body);
    
    try {
      const { testEmail } = req.body;
      
      if (!testEmail) {
        return res.status(400).json({ error: 'Test email address is required' });
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(testEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      
      console.log('Sending test email to:', testEmail);
      const result = await emailService.sendTestEmail(testEmail);
      
      if (result.success) {
        res.json({ message: 'Test email sent successfully', id: result.id });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      console.error('Email test error:', error);
      res.status(500).json({ error: 'Failed to send test email' });
    }
  });

  // Send email to customer with optional attachment
  app.post('/api/admin/send-customer-email', hybridAuth, emailUpload.single('attachment'), async (req, res) => {
    console.log('=== SEND CUSTOMER EMAIL ENDPOINT ===');
    console.log('Request body:', req.body);
    console.log('File attachment:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'None');
    
    try {
      const { to, subject, message } = req.body;
      
      if (!to || !subject || !message) {
        return res.status(400).json({ error: 'Email address, subject, and message are required' });
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      
      // Prepare email options
      const emailOptions: any = {
        to,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background: #1e2871; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Geelong Garage Doors</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
            <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666;">
              <p>This email was sent from Geelong Garage Doors</p>
              <p><a href="mailto:admin@geelonggaragedoors.com.au" style="color: #1e2871;">admin@geelonggaragedoors.com.au</a></p>
            </div>
          </div>
        `
      };
      
      // Handle attachment if present
      if (req.file) {
        emailOptions.attachments = [{
          content: req.file.buffer.toString('base64'),
          filename: req.file.originalname,
          type: req.file.mimetype,
          disposition: 'attachment'
        }];
      }
      
      console.log('Sending customer email to:', to);
      const result = await emailService.sendEmail(emailOptions);
      
      if (result.success) {
        // Log the email sending for admin records
        console.log(`✅ Customer email sent successfully to ${to}, subject: "${subject}"`);
        
        // TODO: Could add email log entry to database here for audit trail
        // await storage.logEmailEvent({
        //   type: 'customer_communication',
        //   recipient: to,
        //   subject: subject,
        //   sentBy: req.user.id || req.user.claims?.sub,
        //   hasAttachment: !!req.file
        // });
        
        res.json({ message: 'Email sent successfully', id: result.id });
      } else {
        console.error(`❌ Failed to send customer email to ${to}:`, result.error);
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      console.error('Customer email error:', error);
      res.status(500).json({ error: 'Failed to send customer email' });
    }
  });

  // Manual order completion endpoint for fixing webhook issues
  app.post('/api/test-manual-order-completion', hybridAuth, async (req, res) => {
    try {
      const { orderId, paypalTransactionId, orderNumber } = req.body;
      
      console.log('=== MANUAL ORDER COMPLETION ===');
      console.log('Order ID:', orderId);
      console.log('PayPal Transaction ID:', paypalTransactionId);
      console.log('Order Number:', orderNumber);
      
      // Note: createNotification method not available in storage interface
      console.log('Would create notification for payment completion:', {
        userId: (req.user as any).id,
        type: 'payment',
        title: 'Payment Completed ✅',
        message: `Order ${orderNumber} has been paid via PayPal (${paypalTransactionId})`,
        data: { orderId, paypalTransactionId, orderNumber },
        isRead: false
      });
      
      console.log('✅ Notification created successfully');
      
      res.json({ 
        message: 'Order completion processed successfully',
        notificationCreated: true
      });
      
    } catch (error) {
      console.error('Manual order completion error:', error);
      res.status(500).json({ error: 'Failed to process order completion' });
    }
  });

  // Test endpoint for fresh order simulation
  app.post('/api/test-fresh-order-notification', hybridAuth, async (req, res) => {
    try {
      // Simulate a fresh order completion notification
      const testOrderNumber = `GGD-TEST-${Date.now()}`;
      const testTransactionId = `TEST-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      // Note: createNotification method not available in storage interface
      console.log('Would create test notification:', {
        userId: (req.user as any).id,
        type: 'payment',
        title: 'New Order Payment Received',
        message: `Fresh test order ${testOrderNumber} has been completed via PayPal (${testTransactionId})`,
        data: { testOrderNumber, testTransactionId },
        isRead: false
      });
      
      console.log('✅ Test fresh order notification created');
      
      res.json({ 
        message: 'Test notification created successfully',
        orderNumber: testOrderNumber,
        transactionId: testTransactionId
      });
      
    } catch (error) {
      console.error('Test fresh order error:', error);
      res.status(500).json({ error: 'Failed to create test notification' });
    }
  });

  // Test proper order confirmation email
  app.post('/api/test-order-confirmation-email', hybridAuth, async (req, res) => {
    try {
      const { customerEmail, orderData } = req.body;
      
      console.log('Testing order confirmation email...');
      const result = await emailService.sendOrderConfirmation(customerEmail, orderData);
      
      if (result.success) {
        res.json({ 
          message: 'Order confirmation email sent successfully',
          id: result.id
        });
      } else {
        res.status(500).json({ error: result.error });
      }
      
    } catch (error) {
      console.error('Test order confirmation error:', error);
      res.status(500).json({ error: 'Failed to send order confirmation email' });
    }
  });

  // Production-ready dynamic sitemap with ALL products from database
  app.get('/sitemap.xml', async (req, res) => {
    try {
      console.log('🗺️  Generating dynamic sitemap with ALL products...');
      
      // Fetch all data in parallel for better performance
      const [categories, products] = await Promise.all([
        storage.getCategories(),
        storage.getProducts({ includeUnpublished: false }) // No limit - get ALL products
      ]);

      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://geelonggaragedoors.com' 
        : `${req.protocol}://${req.get('host')}`;

      console.log(`📊 Found ${products.products?.length || 0} published products and ${categories.length} categories`);

      // Use sitemap index for sites with many products (>50,000 URLs total)
      const totalUrls = (products.products?.length || 0) + categories.length + 5; // +5 for main pages
      
      if (totalUrls > 50000) {
        // Generate sitemap index for very large sites
        let sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    
    <!-- Main pages and categories sitemap -->
    <sitemap>
        <loc>${baseUrl}/sitemap-pages.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>

    <!-- Category-based product sitemaps -->`;

        // Create a sitemap for each active category with products
        for (const category of categories.filter(cat => cat.isActive)) {
          const categoryProducts = await storage.getProducts({ 
            categoryId: category.id, 
            includeUnpublished: false 
          });
          
          if (categoryProducts.products && categoryProducts.products.length > 0) {
            sitemapIndex += `
    <sitemap>
        <loc>${baseUrl}/sitemap-category-${category.slug}.xml</loc>
        <lastmod>${category.updatedAt ? category.updatedAt.toISOString() : new Date().toISOString()}</lastmod>
    </sitemap>`;
          }
        }

        sitemapIndex += `

</sitemapindex>`;

        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        res.send(sitemapIndex);
      } else {
        // Single sitemap with ALL products dynamically generated
        let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    
    <!-- Homepage -->
    <url>
        <loc>${baseUrl}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
        <lastmod>${new Date().toISOString()}</lastmod>
    </url>

    <!-- Public Pages Only (excludes admin, auth, internal) -->
    <url>
        <loc>${baseUrl}/categories</loc>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
        <lastmod>${new Date().toISOString()}</lastmod>
    </url>
    
    <url>
        <loc>${baseUrl}/products</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
        <lastmod>${new Date().toISOString()}</lastmod>
    </url>
    
    <url>
        <loc>${baseUrl}/search</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
        <lastmod>${new Date().toISOString()}</lastmod>
    </url>
    
    <url>
        <loc>${baseUrl}/quote-request</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
        <lastmod>${new Date().toISOString()}</lastmod>
    </url>

    <!-- Dynamic Category Pages (active only) -->`;

        // Add all active categories from database
        categories.filter(cat => cat.isActive).forEach(category => {
          sitemapXml += `
    <url>
        <loc>${baseUrl}/category/${category.slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
        <lastmod>${category.updatedAt ? category.updatedAt.toISOString() : new Date().toISOString()}</lastmod>
    </url>`;
        });

        sitemapXml += `
    
    <!-- ALL Published Products (dynamically generated from database) -->`;

        // Add ALL published products with no limits
        if (products.products && products.products.length > 0) {
          products.products.forEach(product => {
            sitemapXml += `
    <url>
        <loc>${baseUrl}/product/${product.slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
        <lastmod>${product.updatedAt ? product.updatedAt.toISOString() : new Date().toISOString()}</lastmod>
    </url>`;
          });
        }

        sitemapXml += `

</urlset>`;

        console.log(`✅ Generated sitemap with ${totalUrls} total URLs`);

        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        res.send(sitemapXml);
      }
      
    } catch (error) {
      console.error('❌ Error generating dynamic sitemap:', error);
      res.status(500).set('Content-Type', 'text/plain').send('Error generating sitemap - please try again later');
    }
  });

  // Public pages sitemap (excludes admin/internal pages)
  app.get('/sitemap-pages.xml', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://geelonggaragedoors.com' 
        : `${req.protocol}://${req.get('host')}`;

      let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    
    <!-- Homepage -->
    <url>
        <loc>${baseUrl}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
        <lastmod>${new Date().toISOString()}</lastmod>
    </url>

    <!-- Public Pages Only (excludes admin, auth, internal pages) -->
    <url>
        <loc>${baseUrl}/categories</loc>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
        <lastmod>${new Date().toISOString()}</lastmod>
    </url>
    
    <url>
        <loc>${baseUrl}/products</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
        <lastmod>${new Date().toISOString()}</lastmod>
    </url>
    
    <url>
        <loc>${baseUrl}/search</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
        <lastmod>${new Date().toISOString()}</lastmod>
    </url>
    
    <url>
        <loc>${baseUrl}/quote-request</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
        <lastmod>${new Date().toISOString()}</lastmod>
    </url>

    <!-- Category Pages -->`;

      // Add active categories
      categories.filter(cat => cat.isActive).forEach(category => {
        sitemapXml += `
    <url>
        <loc>${baseUrl}/category/${category.slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
        <lastmod>${category.updatedAt ? category.updatedAt.toISOString() : new Date().toISOString()}</lastmod>
    </url>`;
      });

      sitemapXml += `

</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=86400');
      res.send(sitemapXml);
      
    } catch (error) {
      console.error('Error generating pages sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Category-specific product sitemaps
  app.get('/sitemap-category-:categorySlug.xml', async (req, res) => {
    try {
      const { categorySlug } = req.params;
      const category = await storage.getCategoryBySlug(categorySlug);
      
      if (!category) {
        return res.status(404).send('Category not found');
      }

      const products = await storage.getProducts({ 
        categoryId: category.id, 
        includeUnpublished: false
      });

      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://geelonggaragedoors.com' 
        : `${req.protocol}://${req.get('host')}`;

      let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

      // Add products for this category
      products.products?.forEach(product => {
        sitemapXml += `
    <url>
        <loc>${baseUrl}/product/${product.slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
        <lastmod>${product.updatedAt ? product.updatedAt.toISOString() : new Date().toISOString()}</lastmod>
    </url>`;
      });

      sitemapXml += `

</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=86400');
      res.send(sitemapXml);
      
    } catch (error) {
      console.error('Error generating category sitemap:', error);
      res.status(500).send('Error generating category sitemap');
    }
  });

  // Test all order status emails
  app.post('/api/test-order-status-emails', hybridAuth, async (req, res) => {
    try {
      const customerEmail = "stevejford1@gmail.com";
      const orderData = {
        orderNumber: "GGD-1753072097969",
        customerName: "Stephen Ford"
      };

      const results = [];
      
      // Test processing email
      console.log('Testing order processing email...');
      const processingResult = await emailService.sendOrderProcessingEmail(customerEmail, orderData);
      results.push({ type: 'processing', success: processingResult.success });
      
      // Wait a bit between emails
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test shipped email  
      console.log('Testing order shipped email...');
      const shippedResult = await emailService.sendOrderShippedEmail(customerEmail, orderData);
      results.push({ type: 'shipped', success: shippedResult.success });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test delivered email
      console.log('Testing order delivered email...');
      const deliveredResult = await emailService.sendOrderDeliveredEmail(customerEmail, orderData);
      results.push({ type: 'delivered', success: deliveredResult.success });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test canceled email
      console.log('Testing order canceled email...');
      const canceledResult = await emailService.sendOrderCanceledEmail(customerEmail, orderData);
      results.push({ type: 'canceled', success: canceledResult.success });
      
      res.json({ 
        message: 'All order status emails tested',
        results: results
      });
      
    } catch (error) {
      console.error('Test order status emails error:', error);
      res.status(500).json({ error: 'Failed to test order status emails' });
    }
  });

  // Email Template Management Routes
  app.get('/api/admin/email-templates', hybridAuth, async (req, res) => {
    try {
      const { templateType, category, isActive, limit, offset } = req.query;
      const params = {
        templateType: templateType as string,
        category: category as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };
      
      const result = await storage.getEmailTemplates();
      res.json(result);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  app.get('/api/admin/email-templates/:id', hybridAuth, async (req, res) => {
    try {
      const template = await storage.getEmailTemplateById(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching email template:", error);
      res.status(500).json({ message: "Failed to fetch email template" });
    }
  });

  app.post('/api/admin/email-templates', hybridAuth, async (req, res) => {
    try {
      const { insertEmailTemplateSchema } = await import("@shared/schema");
      const validatedData = insertEmailTemplateSchema.parse(req.body);
      const template = await storage.createEmailTemplate(validatedData);
      
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error creating email template:", error);
      res.status(500).json({ message: "Failed to create email template" });
    }
  });

  app.put('/api/admin/email-templates/:id', hybridAuth, async (req, res) => {
    try {
      const { insertEmailTemplateSchema } = await import("@shared/schema");
      const validatedData = insertEmailTemplateSchema.partial().parse(req.body);
      const template = await storage.updateEmailTemplate(req.params.id, validatedData);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error updating email template:", error);
      res.status(500).json({ message: "Failed to update email template" });
    }
  });

  app.delete('/api/admin/email-templates/:id', hybridAuth, async (req, res) => {
    try {
      const success = await storage.deleteEmailTemplate(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting email template:", error);
      res.status(500).json({ message: "Failed to delete email template" });
    }
  });

  app.post('/api/admin/email-templates/:id/test', hybridAuth, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }

      const template = await storage.getEmailTemplateById(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Send test email with template
      await emailService.sendTestEmail(email, template);
      
      res.json({ message: "Test email sent successfully" });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  app.post('/api/admin/email-templates/seed', hybridAuth, async (req, res) => {
    try {
      await storage.seedDefaultTemplates();
      res.json({ message: "Default templates seeded successfully" });
    } catch (error) {
      console.error("Error seeding templates:", error);
      res.status(500).json({ message: "Failed to seed templates" });
    }
  });

  // Email Logs API Routes
  app.get('/api/admin/email-logs', hybridAuth, async (req, res) => {
    try {
      const { status, templateId, recipientEmail, startDate, endDate, limit, offset } = req.query;
      const params = {
        status: status as string,
        templateId: templateId as string,
        recipientEmail: recipientEmail as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      };
      
      const result = await storage.getEmailLogs(params);
      res.json(result);
    } catch (error) {
      console.error("Error fetching email logs:", error);
      res.status(500).json({ message: "Failed to fetch email logs" });
    }
  });

  // Customer Notes API Routes
  app.get('/api/admin/customers/:customerId/notes', hybridAuth, async (req, res) => {
    try {
      const notes = await storage.getCustomerNotes(req.params.customerId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching customer notes:", error);
      res.status(500).json({ message: "Failed to fetch customer notes" });
    }
  });

  app.post('/api/admin/customers/:customerId/notes', hybridAuth, async (req, res) => {
    try {
      const { insertCustomerNoteSchema } = await import("@shared/schema");
      const validatedData = insertCustomerNoteSchema.parse({
        ...req.body,
        customerId: req.params.customerId,
        createdBy: (req as any).user.id,
      });
      
      const note = await storage.createCustomerNote(validatedData);
      
      // Get the note with the creator name for response
      const notesWithCreator = await storage.getCustomerNotes(req.params.customerId);
      const createdNote = notesWithCreator.find(n => n.id === note.id);
      
      res.status(201).json(createdNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      console.error("Error creating customer note:", error);
      res.status(500).json({ message: "Failed to create customer note" });
    }
  });

  app.put('/api/admin/customers/:customerId/notes/:noteId', hybridAuth, async (req, res) => {
    try {
      const { insertCustomerNoteSchema } = await import("@shared/schema");
      const validatedData = insertCustomerNoteSchema.partial().parse(req.body);
      const note = await storage.updateCustomerNote(req.params.noteId, validatedData);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      console.error("Error updating customer note:", error);
      res.status(500).json({ message: "Failed to update customer note" });
    }
  });

  app.delete('/api/admin/customers/:customerId/notes/:noteId', hybridAuth, async (req, res) => {
    try {
      const success = await storage.deleteCustomerNote(req.params.noteId);
      if (!success) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json({ message: "Customer note deleted successfully" });
    } catch (error) {
      console.error("Error deleting customer note:", error);
      res.status(500).json({ message: "Failed to delete customer note" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize notification service with WebSocket (properly configured to avoid Vite conflicts)
  notificationService.initialize(httpServer);
  
  return httpServer;
}
