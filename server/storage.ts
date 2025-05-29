import {
  users,
  categories,
  brands,
  products,
  customers,
  orders,
  orderItems,
  mediaFiles,
  shippingZones,
  shippingRates,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Brand,
  type InsertBrand,
  type Product,
  type InsertProduct,
  type Customer,
  type InsertCustomer,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type MediaFile,
  type ShippingZone,
  type ShippingRate,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, like, and, or, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Brand operations
  getBrands(): Promise<Brand[]>;
  getBrandById(id: string): Promise<Brand | undefined>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  updateBrand(id: string, brand: Partial<InsertBrand>): Promise<Brand | undefined>;
  deleteBrand(id: string): Promise<boolean>;

  // Product operations
  getProducts(params?: {
    categoryId?: string;
    brandId?: string;
    search?: string;
    featured?: boolean;
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  updateProductStock(id: string, quantity: number): Promise<boolean>;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Order operations
  getOrders(params?: {
    customerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number }>;
  getOrderById(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<boolean>;
  addOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  // Media operations
  getMediaFiles(): Promise<MediaFile[]>;
  createMediaFile(file: Omit<MediaFile, 'id' | 'createdAt'>): Promise<MediaFile>;
  deleteMediaFile(id: string): Promise<boolean>;

  // Shipping operations
  getShippingZones(): Promise<ShippingZone[]>;
  getShippingRates(zoneId: string): Promise<ShippingRate[]>;
  calculateShipping(postcode: string, weight: number): Promise<number>;

  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    activeProducts: number;
    totalCustomers: number;
    recentOrders: Order[];
    topProducts: Array<Product & { sales: number; revenue: number }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder));
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount! > 0;
  }

  // Brand operations
  async getBrands(): Promise<Brand[]> {
    return db.select().from(brands).where(eq(brands.isActive, true)).orderBy(asc(brands.name));
  }

  async getBrandById(id: string): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.id, id));
    return brand;
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    const [newBrand] = await db.insert(brands).values(brand).returning();
    return newBrand;
  }

  async updateBrand(id: string, brand: Partial<InsertBrand>): Promise<Brand | undefined> {
    const [updatedBrand] = await db
      .update(brands)
      .set({ ...brand, updatedAt: new Date() })
      .where(eq(brands.id, id))
      .returning();
    return updatedBrand;
  }

  async deleteBrand(id: string): Promise<boolean> {
    const result = await db.delete(brands).where(eq(brands.id, id));
    return result.rowCount! > 0;
  }

  // Product operations
  async getProducts(params: {
    categoryId?: string;
    brandId?: string;
    search?: string;
    featured?: boolean;
    active?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ products: Product[]; total: number }> {
    const conditions = [];
    
    if (params.active !== false) {
      conditions.push(eq(products.isActive, true));
    }
    
    if (params.categoryId) {
      conditions.push(eq(products.categoryId, params.categoryId));
    }
    
    if (params.brandId) {
      conditions.push(eq(products.brandId, params.brandId));
    }
    
    if (params.featured) {
      conditions.push(eq(products.isFeatured, true));
    }
    
    if (params.search) {
      conditions.push(
        or(
          like(products.name, `%${params.search}%`),
          like(products.description, `%${params.search}%`),
          like(products.sku, `%${params.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(products)
      .where(whereClause);

    // Get products with pagination
    let query = db.select().from(products).where(whereClause).orderBy(desc(products.createdAt));
    
    if (params.limit) {
      query = query.limit(params.limit);
    }
    
    if (params.offset) {
      query = query.offset(params.offset);
    }

    const productsList = await query;

    return { products: productsList, total };
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount! > 0;
  }

  async updateProductStock(id: string, quantity: number): Promise<boolean> {
    const result = await db
      .update(products)
      .set({ stockQuantity: quantity, updatedAt: new Date() })
      .where(eq(products.id, id));
    return result.rowCount! > 0;
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers).where(eq(customers.isActive, true)).orderBy(desc(customers.createdAt));
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  // Order operations
  async getOrders(params: {
    customerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ orders: Order[]; total: number }> {
    const conditions = [];
    
    if (params.customerId) {
      conditions.push(eq(orders.customerId, params.customerId));
    }
    
    if (params.status) {
      conditions.push(eq(orders.status, params.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(orders)
      .where(whereClause);

    // Get orders with pagination
    let query = db.select().from(orders).where(whereClause).orderBy(desc(orders.createdAt));
    
    if (params.limit) {
      query = query.limit(params.limit);
    }
    
    if (params.offset) {
      query = query.offset(params.offset);
    }

    const ordersList = await query;

    return { orders: ordersList, total };
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<boolean> {
    const result = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id));
    return result.rowCount! > 0;
  }

  async addOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db.insert(orderItems).values(item).returning();
    return newItem;
  }

  // Media operations
  async getMediaFiles(): Promise<MediaFile[]> {
    return db.select().from(mediaFiles).orderBy(desc(mediaFiles.createdAt));
  }

  async createMediaFile(file: Omit<MediaFile, 'id' | 'createdAt'>): Promise<MediaFile> {
    const [newFile] = await db.insert(mediaFiles).values(file).returning();
    return newFile;
  }

  async deleteMediaFile(id: string): Promise<boolean> {
    const result = await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
    return result.rowCount! > 0;
  }

  // Shipping operations
  async getShippingZones(): Promise<ShippingZone[]> {
    return db.select().from(shippingZones).where(eq(shippingZones.isActive, true));
  }

  async getShippingRates(zoneId: string): Promise<ShippingRate[]> {
    return db.select().from(shippingRates).where(eq(shippingRates.zoneId, zoneId));
  }

  async calculateShipping(postcode: string, weight: number): Promise<number> {
    // Simplified shipping calculation - in production this would integrate with Australia Post API
    const baseRate = 15.00;
    const weightRate = Math.max(0, (weight - 1) * 2.50); // $2.50 per kg over 1kg
    return baseRate + weightRate;
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    activeProducts: number;
    totalCustomers: number;
    recentOrders: Order[];
    topProducts: Array<Product & { sales: number; revenue: number }>;
  }> {
    // Get revenue
    const [{ totalRevenue }] = await db
      .select({ 
        totalRevenue: sql<number>`COALESCE(SUM(${orders.total}), 0)::float`
      })
      .from(orders)
      .where(eq(orders.paymentStatus, 'paid'));

    // Get order count
    const [{ totalOrders }] = await db
      .select({ totalOrders: count() })
      .from(orders);

    // Get active products count
    const [{ activeProducts }] = await db
      .select({ activeProducts: count() })
      .from(products)
      .where(eq(products.isActive, true));

    // Get customers count
    const [{ totalCustomers }] = await db
      .select({ totalCustomers: count() })
      .from(customers)
      .where(eq(customers.isActive, true));

    // Get recent orders
    const recentOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5);

    // Get top products (simplified - in production would join with order items)
    const topProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .limit(5);

    // Add mock sales data for demonstration
    const topProductsWithSales = topProducts.map(product => ({
      ...product,
      sales: Math.floor(Math.random() * 50) + 10,
      revenue: parseFloat(product.price) * (Math.floor(Math.random() * 50) + 10),
    }));

    return {
      totalRevenue: totalRevenue || 0,
      totalOrders,
      activeProducts,
      totalCustomers,
      recentOrders,
      topProducts: topProductsWithSales,
    };
  }
}

export const storage = new DatabaseStorage();
