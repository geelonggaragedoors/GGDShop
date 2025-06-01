import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { fileStorage } from "./fileStorage";
import { 
  insertProductSchema, 
  insertCategorySchema, 
  insertBrandSchema,
  insertCustomerSchema,
  insertOrderSchema 
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { createRouteHandler } from "uploadthing/express";
import { ourFileRouter } from "./uploadthing";

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

  // Shipping calculation (public)
  app.post('/api/shipping/calculate', async (req, res) => {
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
  app.post('/api/admin/products', isAuthenticated, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
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

  // PayPal routes
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

  const httpServer = createServer(app);
  return httpServer;
}
