import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { calculateShippingCost, validateShippingDimensions, getAvailableServices, getAustraliaPostBoxes, calculateTotalShippingCost } from "./australiaPost";
import { fileStorage } from "./fileStorage";
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
import { emailService } from "./emailService";
import { notificationService } from "./notificationService";
import { analyticsService } from "./analyticsService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // UploadThing routes
  const uploadRouter = createRouteHandler({
    router: ourFileRouter,
  });

  app.use("/api/uploadthing", uploadRouter);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
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
  app.get("/api/admin/counts", isAuthenticated, async (req, res) => {
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
  app.get('/api/admin/dashboard', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Admin product management
  app.get('/api/admin/products', isAuthenticated, async (req, res) => {
    try {
      const { categoryId, brandId, search, featured, active, limit, offset } = req.query;
      const params = {
        categoryId: categoryId as string,
        brandId: brandId as string,
        search: search as string,
        featured: featured === 'true',
        active: active !== 'false',
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
  app.post('/api/admin/products', isAuthenticated, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      
      // Validate shipping dimensions
      const validation = validateShippingDimensions(productData);
      
      if (!validation.isValid) {
        // Save as draft if shipping info is missing
        productData.status = 'draft';
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
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/admin/products/:id', isAuthenticated, async (req, res) => {
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

  app.delete('/api/admin/products/:id', isAuthenticated, async (req, res) => {
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

  // Admin category management
  app.get('/api/admin/categories', isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/admin/categories', isAuthenticated, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put('/api/admin/categories/:id', isAuthenticated, async (req, res) => {
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

  app.delete('/api/admin/categories/:id', isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteCategory(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Admin brand management
  app.get('/api/admin/brands', isAuthenticated, async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  app.post('/api/admin/brands', isAuthenticated, async (req, res) => {
    try {
      const brandData = insertBrandSchema.parse(req.body);
      const brand = await storage.createBrand(brandData);
      res.status(201).json(brand);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid brand data", errors: error.errors });
      }
      console.error("Error creating brand:", error);
      res.status(500).json({ message: "Failed to create brand" });
    }
  });

  app.put('/api/admin/brands/:id', isAuthenticated, async (req, res) => {
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

  app.delete('/api/admin/brands/:id', isAuthenticated, async (req, res) => {
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

  // Admin order management
  app.get('/api/admin/orders', isAuthenticated, async (req, res) => {
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
  app.get('/api/admin/orders/:id', isAuthenticated, async (req, res) => {
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

  app.put('/api/admin/orders/:id/status', isAuthenticated, async (req, res) => {
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

  // Update order details (comprehensive PATCH endpoint)
  app.patch('/api/admin/orders/:id', isAuthenticated, async (req, res) => {
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
  app.post('/api/admin/orders/:id/print', isAuthenticated, async (req, res) => {
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
  app.post('/api/admin/orders/:id/email', isAuthenticated, async (req, res) => {
    try {
      const orderId = req.params.id;
      const { type } = req.body;
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const customer = await storage.getCustomer(order.customerId || '');
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const orderItems = await storage.getOrderItems(orderId);
      
      if (type === 'receipt') {
        await emailService.sendOrderConfirmation(order, customer, orderItems);
      } else if (type === 'status_update') {
        await emailService.sendOrderStatusUpdate(order, customer, 'previous_status');
      }
      
      res.json({ message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending order email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Admin customer management
  app.get('/api/admin/customers', isAuthenticated, async (req, res) => {
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
  app.get("/api/admin/media", isAuthenticated, async (req, res) => {
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

  app.post("/api/admin/media", isAuthenticated, async (req, res) => {
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

  app.post("/api/admin/media/folders", isAuthenticated, async (req, res) => {
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

  app.delete("/api/admin/media/:id", isAuthenticated, async (req, res) => {
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

  // Staff routes
  app.get("/api/admin/staff", isAuthenticated, async (req, res) => {
    try {
      const staff = [
        {
          id: "1",
          firstName: "Admin",
          lastName: "User",
          email: "admin@geelonggaragedoors.com.au",
          role: "admin",
          isActive: true,
          createdAt: new Date().toISOString(),
        }
      ];
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post("/api/admin/staff", isAuthenticated, async (req, res) => {
    try {
      res.json({ message: "Staff member added successfully", ...req.body, id: Math.random().toString() });
    } catch (error) {
      console.error("Error creating staff member:", error);
      res.status(500).json({ message: "Failed to create staff member" });
    }
  });

  app.put("/api/admin/staff/:id", isAuthenticated, async (req, res) => {
    try {
      res.json({ message: "Staff member updated successfully", ...req.body });
    } catch (error) {
      console.error("Error updating staff member:", error);
      res.status(500).json({ message: "Failed to update staff member" });
    }
  });

  app.delete("/api/admin/staff/:id", isAuthenticated, async (req, res) => {
    try {
      res.json({ message: "Staff member deleted successfully" });
    } catch (error) {
      console.error("Error deleting staff member:", error);
      res.status(500).json({ message: "Failed to delete staff member" });
    }
  });

  // Settings routes
  app.get("/api/admin/settings", isAuthenticated, async (req, res) => {
    try {
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
        }
      };
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/admin/settings", isAuthenticated, async (req, res) => {
    try {
      res.json({ message: "Settings updated successfully", ...req.body });
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

  app.get("/paypal/setup", async (req, res) => {
    try {
      await loadPaypalDefault(req, res);
    } catch (error) {
      console.error("PayPal setup error:", error);
      res.status(500).json({ error: "PayPal configuration error" });
    }
  });

  app.post("/paypal/order", async (req, res) => {
    try {
      await createPaypalOrder(req, res);
    } catch (error) {
      console.error("PayPal order creation error:", error);
      res.status(500).json({ error: "Failed to create PayPal order" });
    }
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    try {
      await capturePaypalOrder(req, res);
    } catch (error) {
      console.error("PayPal capture error:", error);
      res.status(500).json({ error: "Failed to capture PayPal payment" });
    }
  });

  // Update order payment status
  app.patch("/api/orders/:id/payment-status", async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus, status } = req.body;
      
      await storage.updateOrderStatus(id, status);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
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
      const customer = await storage.getCustomerById(order.customerId);

      // Format response
      const trackingData = {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: parseFloat(order.total),
        createdAt: order.createdAt,
        items: orderItems.map(item => ({
          id: item.id,
          productName: item.productName || `Product ${item.productId}`,
          quantity: item.quantity,
          price: parseFloat(item.price)
        })),
        shippingAddress: order.shippingAddress ? {
          street: order.shippingAddress.split(',')[0]?.trim() || '',
          city: order.shippingAddress.split(',')[1]?.trim() || '',
          state: order.shippingAddress.split(',')[2]?.trim().split(' ')[0] || '',
          postalCode: order.shippingAddress.split(',')[2]?.trim().split(' ')[1] || ''
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
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await notificationService.getUnreadNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
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

  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await notificationService.markAllAsRead(userId);
      res.json({ message: "All notifications marked as read", success });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Staff Management Routes
  app.get('/api/admin/staff', isAuthenticated, async (req, res) => {
    try {
      const staff = await storage.getStaffMembers();
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ message: "Failed to fetch staff members" });
    }
  });

  app.get('/api/admin/staff/:id', isAuthenticated, async (req, res) => {
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

  app.put('/api/admin/staff/:id', isAuthenticated, async (req, res) => {
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

  app.delete('/api/admin/staff/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deactivateStaffMember(id);
      res.json({ message: "Staff member deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating staff member:", error);
      res.status(500).json({ message: "Failed to deactivate staff member" });
    }
  });

  // Staff Invitation Routes
  app.get('/api/admin/invitations', isAuthenticated, async (req, res) => {
    try {
      const invitations = await storage.getStaffInvitations();
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.post('/api/admin/invitations', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertStaffInvitationSchema.parse(req.body);
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
      
      const invitation = await storage.createStaffInvitation({
        ...validatedData,
        token,
        invitedBy: req.user.claims.sub,
        expiresAt
      });

      // Send invitation email
      await emailService.sendEmail({
        to: invitation.email,
        subject: 'Staff Invitation - Geelong Garage Doors',
        html: `
          <h2>You've been invited to join Geelong Garage Doors</h2>
          <p>You have been invited to join our team as a ${invitation.role}.</p>
          <p>Please click the link below to accept the invitation:</p>
          <a href="${req.protocol}://${req.get('host')}/admin/accept-invitation?token=${token}">Accept Invitation</a>
          <p>This invitation will expire in 7 days.</p>
        `
      });

      res.json(invitation);
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  app.delete('/api/admin/invitations/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteStaffInvitation(id);
      res.json({ message: "Invitation deleted successfully" });
    } catch (error) {
      console.error("Error deleting invitation:", error);
      res.status(500).json({ message: "Failed to delete invitation" });
    }
  });

  // Role Management Routes
  app.get('/api/admin/roles', isAuthenticated, async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.post('/api/admin/roles', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(validatedData);
      res.json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  app.put('/api/admin/roles/:id', isAuthenticated, async (req, res) => {
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

  app.delete('/api/admin/roles/:id', isAuthenticated, async (req, res) => {
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
      await analyticsService.updateSEOMetrics(req.body);
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

  app.put('/api/reviews/:id', isAuthenticated, async (req, res) => {
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

  app.delete('/api/reviews/:id', isAuthenticated, async (req, res) => {
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

  app.post('/api/reviews/:id/response', isAuthenticated, async (req, res) => {
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

  app.delete('/api/reviews/mock', isAuthenticated, async (req, res) => {
    try {
      const success = await storage.removeMockReviews();
      res.json({ message: "Mock reviews removed successfully", removed: success });
    } catch (error) {
      console.error("Error removing mock reviews:", error);
      res.status(500).json({ message: "Failed to remove mock reviews" });
    }
  });

  // Enquiry routes
  app.get('/api/enquiries', isAuthenticated, async (req, res) => {
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

  app.get('/api/enquiries/:id', isAuthenticated, async (req, res) => {
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
        await emailService.sendEnquiryNotification(enquiry);
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

  app.patch('/api/enquiries/:id/status', isAuthenticated, async (req, res) => {
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

  app.delete('/api/enquiries/:id', isAuthenticated, async (req, res) => {
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

  const httpServer = createServer(app);
  
  // Initialize notification service with WebSocket (properly configured to avoid Vite conflicts)
  notificationService.initialize(httpServer);
  
  return httpServer;
}
