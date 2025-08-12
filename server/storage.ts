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
  staffInvitations,
  roles,
  customerReviews,
  enquiries,
  siteSettings,
  emailTemplates,
  emailSettingsConfig,
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
  type StaffInvitation,
  type InsertStaffInvitation,
  type Role,
  type InsertRole,
  type CustomerReview,
  type InsertCustomerReview,
  type Enquiry,
  type InsertEnquiry,
  type SiteSetting,
  type InsertSiteSetting,
  type EmailTemplate,
  type InsertEmailTemplate,
  type EmailSettingConfig,
  type InsertEmailSettingConfig,
  customerTransactions,
  type CustomerTransaction,
  type InsertCustomerTransaction,
  emailLogs,
  type EmailLog,
  type InsertEmailLog,
  customerNotes,
  type CustomerNote,
  type InsertCustomerNote,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, like, and, or, count, sql, isNull, not } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, updates: { firstName?: string; lastName?: string; phone?: string; address?: string }): Promise<User>;
  getOrdersByUserId(userId: string): Promise<Order[]>;
  getAdminUsers(): Promise<User[]>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoriesWithProductCount(): Promise<Array<Category & { productCount: number }>>;
  getCategoryById(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
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
    noWeight?: boolean; // filter products with no weight
    hasWeight?: boolean; // filter products with weight data
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }>;
  searchProducts(search: string, limit?: number): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  updateProductStock(id: string, quantity: number): Promise<boolean>;
  updateProductStatusAndShipping(id: string, shippingCost: number): Promise<Product | undefined>;

  // Customer operations
  getCustomers(): Promise<Array<Customer & { orderCount: number; totalSpent: string }>>;
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
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<boolean>;
  updateOrder(id: string, updates: Partial<Order>): Promise<boolean>;
  addTrackingNumberAndShip(id: string, trackingNumber: string): Promise<Order | undefined>;
  addOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  deleteOrder(id: string): Promise<boolean>;

  // Media operations
  getMediaFiles(): Promise<MediaFile[]>;
  createMediaFile(file: Omit<MediaFile, 'id' | 'createdAt'>): Promise<MediaFile>;
  deleteMediaFile(id: string): Promise<boolean>;

  // Shipping operations
  getShippingZones(): Promise<ShippingZone[]>;
  getShippingRates(zoneId: string): Promise<ShippingRate[]>;
  calculateShipping(postcode: string, weight: number): Promise<number>;

  // Staff operations
  getStaffMembers(): Promise<User[]>;
  getStaffMemberById(id: string): Promise<User | undefined>;
  updateStaffMember(id: string, updates: Partial<User>): Promise<User | undefined>;
  deactivateStaffMember(id: string): Promise<boolean>;

  // Staff invitation operations
  createStaffInvitation(invitation: InsertStaffInvitation): Promise<StaffInvitation>;
  getStaffInvitations(): Promise<StaffInvitation[]>;
  getStaffInvitationByToken(token: string): Promise<StaffInvitation | undefined>;
  acceptStaffInvitation(token: string, userId: string): Promise<boolean>;
  deleteStaffInvitation(id: string): Promise<boolean>;

  // Role operations
  getRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: string): Promise<boolean>;

  // Customer review operations
  getCustomerReviews(params?: {
    isVisible?: boolean;
    productId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ reviews: CustomerReview[]; total: number }>;
  getCustomerReviewById(id: string): Promise<CustomerReview | undefined>;
  createCustomerReview(review: InsertCustomerReview): Promise<CustomerReview>;
  updateCustomerReview(id: string, review: Partial<InsertCustomerReview>): Promise<CustomerReview | undefined>;
  deleteCustomerReview(id: string): Promise<boolean>;
  addAdminResponse(reviewId: string, response: string, adminId: string): Promise<boolean>;
  removeMockReviews(): Promise<boolean>;

  // Enquiry operations
  getEnquiries(params?: {
    status?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ enquiries: Enquiry[]; total: number }>;
  getEnquiryById(id: string): Promise<Enquiry | undefined>;
  createEnquiry(enquiry: InsertEnquiry): Promise<Enquiry>;
  updateEnquiryStatus(id: string, status: string): Promise<boolean>;
  deleteEnquiry(id: string): Promise<boolean>;

  // Site Settings operations
  getSiteSettings(): Promise<SiteSetting[]>;
  getSiteSettingByKey(key: string): Promise<SiteSetting | undefined>;
  updateSiteSetting(key: string, value: string): Promise<boolean>;
  createSiteSetting(setting: InsertSiteSetting): Promise<SiteSetting>;

  // Customer transaction operations
  createCustomerTransaction(transaction: InsertCustomerTransaction): Promise<CustomerTransaction>;
  getCustomerTransactions(customerId: string): Promise<CustomerTransaction[]>;
  getCustomerTransactionById(id: string): Promise<CustomerTransaction | undefined>;
  updateCustomerTransaction(id: string, transaction: Partial<InsertCustomerTransaction>): Promise<CustomerTransaction | undefined>;

  // Email template operations
  getEmailTemplates(params?: {
    templateType?: string;
    category?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ templates: EmailTemplate[]; total: number }>;
  getEmailTemplateById(id: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: string): Promise<boolean>;
  getDefaultTemplates(): Promise<EmailTemplate[]>;
  seedDefaultTemplates(): Promise<void>;

  // Email log operations
  createEmailLog(log: InsertEmailLog): Promise<EmailLog>;
  getEmailLogs(params?: { 
    limit?: number; 
    offset?: number; 
    status?: string; 
    templateId?: string;
    recipientEmail?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ logs: EmailLog[]; total: number }>;
  updateEmailLogStatus(id: string, status: string, metadata?: any): Promise<boolean>;
  getEmailLogById(id: string): Promise<EmailLog | undefined>;
  getEmailAnalytics(templateId?: string, startDate?: Date, endDate?: Date): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalFailed: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  }>;

  // Customer notes operations
  getCustomerNotes(customerId: string): Promise<Array<CustomerNote & { createdByName: string }>>;
  createCustomerNote(note: InsertCustomerNote): Promise<CustomerNote>;
  updateCustomerNote(id: string, note: Partial<InsertCustomerNote>): Promise<CustomerNote | undefined>;
  deleteCustomerNote(id: string): Promise<boolean>;

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

  async updateUserProfile(id: string, updates: { firstName?: string; lastName?: string; phone?: string; address?: string }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.customerId, userId)).orderBy(desc(orders.createdAt));
  }

  async getAdminUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, 'admin'));
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder));
  }

  // Admin category operations with product counts
  async getCategoriesWithProductCount(): Promise<Array<Category & { productCount: number }>> {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        image: categories.image,
        parentId: categories.parentId,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
        showOnHomepage: categories.showOnHomepage,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        productCount: count(products.id),
      })
      .from(categories)
      .leftJoin(products, eq(categories.id, products.categoryId))
      .groupBy(categories.id)
      .orderBy(asc(categories.sortOrder));
    
    return result;
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
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
    // Check if category has products
    const productCount = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.categoryId, id));
    
    if (productCount[0]?.count > 0) {
      throw new Error(`Cannot delete category. It contains ${productCount[0].count} product(s). Please move or delete all products first.`);
    }
    
    // Check if category has subcategories
    const subcategoryCount = await db
      .select({ count: count() })
      .from(categories)
      .where(eq(categories.parentId, id));
    
    if (subcategoryCount[0]?.count > 0) {
      throw new Error(`Cannot delete category. It has ${subcategoryCount[0].count} subcategory(ies). Please move or delete all subcategories first.`);
    }
    
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
    noWeight?: boolean; // filter products with no weight
    hasWeight?: boolean; // filter products with weight data
    includeUnpublished?: boolean; // for admin panel
    limit?: number;
    offset?: number;
  } = {}): Promise<{ products: Product[]; total: number }> {
    const conditions = [];
    
    if (params.active !== false) {
      conditions.push(eq(products.isActive, true));
    }
    
    // Only show published products on frontend, all products in admin
    if (!params.includeUnpublished) {
      conditions.push(eq(products.status, 'published'));
    }
    
    if (params.categoryId) {
      // Get all subcategories of the selected category
      const subcategories = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.parentId, params.categoryId));
      
      const subcategoryIds = subcategories.map(sub => sub.id);
      
      // Include products from the category itself OR from its subcategories
      if (subcategoryIds.length > 0) {
        conditions.push(
          or(
            eq(products.categoryId, params.categoryId),
            ...subcategoryIds.map(id => eq(products.categoryId, id))
          )
        );
      } else {
        conditions.push(eq(products.categoryId, params.categoryId));
      }
    }
    
    if (params.brandId) {
      conditions.push(eq(products.brandId, params.brandId));
    }
    
    if (params.featured) {
      conditions.push(eq(products.isFeatured, true));
    }
    
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      conditions.push(
        or(
          like(sql`LOWER(${products.name})`, `%${searchTerm}%`),
          like(sql`LOWER(${products.description})`, `%${searchTerm}%`),
          like(sql`LOWER(${products.sku})`, `%${searchTerm}%`),
          like(sql`LOWER(${products.shortDescription})`, `%${searchTerm}%`)
        )
      );
    }

    if (params.noWeight) {
      conditions.push(
        or(
          isNull(products.weight),
          eq(products.weight, '0')
        )
      );
    }

    if (params.hasWeight) {
      conditions.push(
        and(
          not(isNull(products.weight)),
          not(eq(products.weight, '0'))
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
    const productsList = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(params.limit || 50)
      .offset(params.offset || 0);

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
    // Convert numeric fields to strings for database storage
    const productData = {
      ...product,
      price: product.price?.toString(),
      weight: product.weight?.toString(),
      length: product.length?.toString(),
      width: product.width?.toString(),
      height: product.height?.toString(),
      customShippingPrice: product.customShippingPrice?.toString(),
    };
    const [newProduct] = await db.insert(products).values(productData).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    // Convert numeric fields to strings for database storage
    const productData = {
      ...product,
      price: product.price?.toString(),
      weight: product.weight?.toString(),
      length: product.length?.toString(),
      width: product.width?.toString(),
      height: product.height?.toString(),
      customShippingPrice: product.customShippingPrice?.toString(),
      updatedAt: new Date()
    };
    const [updatedProduct] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount! > 0;
  }

  async searchProducts(search: string, limit: number = 20): Promise<Product[]> {
    const searchTerm = search.toLowerCase();
    
    let query = db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          eq(products.status, 'published'),
          or(
            like(sql`LOWER(${products.name})`, `%${searchTerm}%`),
            like(sql`LOWER(${products.description})`, `%${searchTerm}%`),
            like(sql`LOWER(${products.sku})`, `%${searchTerm}%`),
            like(sql`LOWER(${products.shortDescription})`, `%${searchTerm}%`)
          )
        )
      )
      .orderBy(desc(products.createdAt))
      .limit(limit);

    return await query;
  }

  async updateProductStock(id: string, quantity: number): Promise<boolean> {
    const result = await db
      .update(products)
      .set({ stockQuantity: quantity, updatedAt: new Date() })
      .where(eq(products.id, id));
    return result.rowCount! > 0;
  }

  async updateProductStatusAndShipping(id: string, shippingCost: number): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ 
        shippingCost: shippingCost.toString(),
        status: 'published',
        updatedAt: new Date() 
      })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  // Customer operations
  async getCustomers(): Promise<Array<Customer & { orderCount: number; totalSpent: string }>> {
    const result = await db
      .select({
        id: customers.id,
        email: customers.email,
        passwordHash: customers.passwordHash,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone,
        company: customers.company,
        isActive: customers.isActive,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
        orderCount: sql<number>`CAST(COUNT(${orders.id}) AS INTEGER)`,
        totalSpent: sql<string>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`
      })
      .from(customers)
      .leftJoin(orders, eq(orders.customerEmail, customers.email))
      .where(eq(customers.isActive, true))
      .groupBy(customers.id, customers.email, customers.passwordHash, customers.firstName, customers.lastName, customers.phone, customers.company, customers.isActive, customers.createdAt, customers.updatedAt)
      .orderBy(desc(customers.createdAt));
    
    return result;
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

    // Get orders with customer information
    const ordersList = await db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(params.limit || 50)
      .offset(params.offset || 0);

    return { orders: ordersList, total };
  }

  async getRecentUnpaidOrders(): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.paymentStatus, 'pending'),
          sql`${orders.createdAt} > NOW() - INTERVAL '24 hours'`
        )
      )
      .orderBy(desc(orders.createdAt))
      .limit(10);
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    // Get order items with product details
    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        total: orderItems.total,
        createdAt: orderItems.createdAt,
        product: {
          id: products.id,
          name: products.name,
          sku: products.sku,
          price: products.price,
          images: products.images,
          description: products.description,
        }
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));

    return order as Order & { items: any[] };
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<boolean> {
    const now = new Date();
    const updateData: any = { status, updatedAt: now };
    
    // Set specific timestamps based on status
    if (status === 'cancelled') {
      updateData.cancelledAt = now;
    } else if (status === 'delivered') {
      updateData.deliveredAt = now;
    }
    
    const result = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id));
    return result.rowCount! > 0;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<boolean> {
    const result = await db
      .update(orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orders.id, id));
    return result.rowCount! > 0;
  }

  async addTrackingNumberAndShip(id: string, trackingNumber: string): Promise<Order | undefined> {
    const now = new Date();
    const [updatedOrder] = await db
      .update(orders)
      .set({
        auspostTrackingNumber: trackingNumber,
        status: 'shipped',
        shippingStatus: 'shipped',
        shippedAt: now,
        updatedAt: now
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async updateOrderTimestamp(id: string, field: string, timestamp: Date): Promise<boolean> {
    try {
      const updateData: any = { updatedAt: timestamp };
      updateData[field] = timestamp;
      
      const result = await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, id));
      return result.rowCount! > 0;
    } catch (error) {
      console.error('Error updating order timestamp:', error);
      return false;
    }
  }

  async updateOrderPaymentStatus(id: string, paymentStatus: string): Promise<boolean> {
    const now = new Date();
    const updateData: any = { paymentStatus, updatedAt: now };
    
    // Set specific timestamps based on payment status
    if (paymentStatus === 'paid') {
      updateData.paidAt = now;
    } else if (paymentStatus === 'refunded') {
      updateData.refundedAt = now;
    }
    
    const result = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id));
    return result.rowCount! > 0;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.getOrderById(id);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.getCustomerById(id);
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async addOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db.insert(orderItems).values(item).returning();
    return newItem;
  }

  async deleteOrder(id: string): Promise<boolean> {
    try {
      // Delete order items first (due to foreign key constraint)
      await db.delete(orderItems).where(eq(orderItems.orderId, id));
      
      // Delete the order
      const result = await db.delete(orders).where(eq(orders.id, id));
      return result.rowCount! > 0;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
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

    // Get recent orders with customer information
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        total: orders.total,
        status: orders.status,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        customerId: orders.customerId,
        customerEmail: orders.customerEmail,
        paymentStatus: orders.paymentStatus,
        subtotal: orders.subtotal,
        shippingCost: orders.shippingCost,
        taxAmount: orders.taxAmount,
        currency: orders.currency,
        shippingAddress: orders.shippingAddress,
        billingAddress: orders.billingAddress,
        notes: orders.notes,
        customerName: sql<string>`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`,
      })
      .from(orders)
      .leftJoin(customers, sql`${orders.customerId}::uuid = ${customers.id}`)
      .orderBy(desc(orders.createdAt))
      .limit(5);

    // Get top products based on stock quantity and featured status
    const topProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.stockQuantity))
      .limit(5);

    // Add sales and revenue data (0 for now since we have no order items yet)
    const topProductsWithSales = topProducts.map(product => ({
      ...product,
      sales: 0,
      revenue: 0,
    }));

    return {
      totalRevenue: totalRevenue || 0,
      totalOrders,
      activeProducts,
      totalCustomers,
      recentOrders: recentOrders as any,
      topProducts: topProductsWithSales,
    };
  }

  // Staff operations
  async getStaffMembers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true)).orderBy(asc(users.firstName));
  }

  async getStaffMemberById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateStaffMember(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deactivateStaffMember(id: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Email management operations
  async getEmailSettings(): Promise<any> {
    const [settings] = await db.select().from(emailSettingsConfig).where(eq(emailSettingsConfig.id, "default"));
    const templates = await this.getEmailTemplates();
    
    // CRITICAL: Use verified domain for now - geelonggaragedoors.com domain is not verified in Resend
    // The user will need to verify their domain or use a verified sending domain
    const baseSettings = settings || {
      fromEmail: "onboarding@resend.dev",
      fromName: "Geelong Garage Doors",
      replyToEmail: "onboarding@resend.dev", 
      adminEmail: "onboarding@resend.dev",
      testEmail: ""
    };
    
    // Force use of verified domain even if settings exist
    return {
      ...baseSettings,
      fromEmail: "onboarding@resend.dev",
      replyToEmail: "onboarding@resend.dev",
      templates: templates
    };
  }

  async updateEmailSettings(settings: any): Promise<any> {
    const [updated] = await db
      .insert(emailSettingsConfig)
      .values({ id: "default", ...settings, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: emailSettingsConfig.id,
        set: { ...settings, updatedAt: new Date() }
      })
      .returning();
    return updated;
  }

  async getEmailTemplates(): Promise<any> {
    // Return predefined templates since we don't have emailTemplates table yet
    return [
      {
        id: 'order_confirmation',
        name: 'Order Confirmation',
        subject: 'Order Confirmation - {{orderNumber}}',
        htmlContent: `
          <h2>Order Confirmation</h2>
          <p>Hi {{customerName}},</p>
          <p>Thank you for your order! We've received your order {{orderNumber}} and it's being processed.</p>
          <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> {{orderNumber}}</p>
            <p><strong>Total:</strong> {{orderTotal}}</p>
            <p><strong>Status:</strong> Processing</p>
          </div>
          <p>We'll send you updates as your order progresses.</p>
          <p>Best regards,<br>Geelong Garage Doors Team</p>
        `,
        isActive: true
      },
      {
        id: 'order_status_update',
        name: 'Order Status Update',
        subject: 'Order Update - {{orderNumber}}',
        htmlContent: `
          <h2>Order Status Update</h2>
          <p>Hi {{customerName}},</p>
          <p>Your order {{orderNumber}} status has been updated to: <strong>{{orderStatus}}</strong></p>
          <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> {{orderNumber}}</p>
            <p><strong>Status:</strong> {{orderStatus}}</p>
            <p><strong>Total:</strong> {{orderTotal}}</p>
          </div>
          <p>Track your order at: {{trackingUrl}}</p>
          <p>Best regards,<br>Geelong Garage Doors Team</p>
        `,
        isActive: true
      },
      {
        id: 'low_stock_alert',
        name: 'Low Stock Alert',
        subject: 'Low Stock Alert - {{productName}}',
        htmlContent: `
          <h2>Low Stock Alert</h2>
          <p>The following product is running low on stock:</p>
          <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
            <h3>Product Details</h3>
            <p><strong>Product:</strong> {{productName}}</p>
            <p><strong>Current Stock:</strong> {{currentStock}}</p>
            <p><strong>Threshold:</strong> {{lowStockThreshold}}</p>
          </div>
          <p>Please restock this item soon to avoid stockouts.</p>
          <p>View product: {{productUrl}}</p>
        `,
        isActive: true
      },
      {
        id: 'password_reset',
        name: 'Password Reset',
        subject: 'Password Reset Request',
        htmlContent: `
          <h2>Password Reset Request</h2>
          <p>A password reset has been requested for your account.</p>
          <p>Click the link below to reset your password:</p>
          <div style="margin: 20px 0;">
            <a href="{{resetLink}}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          </div>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>Geelong Garage Doors Team</p>
        `,
        isActive: true
      }
    ];
  }

  async getEmailTemplate(id: string): Promise<any | undefined> {
    const templates = await this.getEmailTemplates();
    return templates.find((template: any) => template.id === id);
  }



  // Staff invitation operations
  async createStaffInvitation(invitation: InsertStaffInvitation): Promise<StaffInvitation> {
    const [staffInvitation] = await db
      .insert(staffInvitations)
      .values(invitation as any)
      .returning();
    return staffInvitation;
  }

  async getStaffInvitations(): Promise<StaffInvitation[]> {
    return await db.select().from(staffInvitations).orderBy(desc(staffInvitations.createdAt));
  }

  async getStaffInvitationByToken(token: string): Promise<StaffInvitation | undefined> {
    const [invitation] = await db.select().from(staffInvitations).where(eq(staffInvitations.token, token));
    return invitation;
  }

  async acceptStaffInvitation(token: string, userId: string): Promise<boolean> {
    const result = await db
      .update(staffInvitations)
      .set({ status: 'accepted', acceptedAt: new Date() })
      .where(and(eq(staffInvitations.token, token), eq(staffInvitations.status, 'pending')));
    return (result.rowCount || 0) > 0;
  }

  async deleteStaffInvitation(id: string): Promise<boolean> {
    const result = await db.delete(staffInvitations).where(eq(staffInvitations.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Role operations
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles).where(eq(roles.isActive, true)).orderBy(asc(roles.name));
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db
      .insert(roles)
      .values(role)
      .returning();
    return newRole;
  }

  async updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined> {
    const [updatedRole] = await db
      .update(roles)
      .set({ ...role, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return updatedRole;
  }

  async deleteRole(id: string): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Customer review operations
  async getCustomerReviews(params?: {
    isVisible?: boolean;
    productId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ reviews: CustomerReview[]; total: number }> {
    const { isVisible, productId, limit = 10, offset = 0 } = params || {};

    const conditions = [];
    if (isVisible !== undefined) {
      conditions.push(eq(customerReviews.isVisible, isVisible));
    }
    if (productId) {
      conditions.push(eq(customerReviews.productId, productId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [reviews, totalResult] = await Promise.all([
      db
        .select()
        .from(customerReviews)
        .where(whereClause)
        .orderBy(desc(customerReviews.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(customerReviews)
        .where(whereClause)
    ]);

    return {
      reviews,
      total: totalResult[0]?.count || 0
    };
  }

  async getCustomerReviewById(id: string): Promise<CustomerReview | undefined> {
    const [review] = await db.select().from(customerReviews).where(eq(customerReviews.id, id));
    return review;
  }

  async createCustomerReview(review: InsertCustomerReview): Promise<CustomerReview> {
    const [newReview] = await db.insert(customerReviews).values(review).returning();
    return newReview;
  }

  async updateCustomerReview(id: string, review: Partial<InsertCustomerReview>): Promise<CustomerReview | undefined> {
    const [updatedReview] = await db
      .update(customerReviews)
      .set({ ...review, updatedAt: new Date() })
      .where(eq(customerReviews.id, id))
      .returning();
    return updatedReview;
  }

  async deleteCustomerReview(id: string): Promise<boolean> {
    const result = await db.delete(customerReviews).where(eq(customerReviews.id, id));
    return result.rowCount! > 0;
  }

  async addAdminResponse(reviewId: string, response: string, adminId: string): Promise<boolean> {
    const result = await db
      .update(customerReviews)
      .set({
        adminResponse: response,
        adminResponseBy: adminId,
        adminResponseAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(customerReviews.id, reviewId));
    return result.rowCount! > 0;
  }

  async removeMockReviews(): Promise<boolean> {
    const result = await db.delete(customerReviews).where(eq(customerReviews.isMockData, true));
    return result.rowCount! > 0;
  }

  // Enquiry operations
  async getEnquiries(params?: {
    status?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ enquiries: Enquiry[]; total: number }> {
    const { status, priority, limit = 50, offset = 0 } = params || {};

    const conditions = [];
    if (status) {
      conditions.push(eq(enquiries.status, status));
    }
    if (priority) {
      conditions.push(eq(enquiries.priority, priority));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [enquiriesResult, totalResult] = await Promise.all([
      db
        .select()
        .from(enquiries)
        .where(whereClause)
        .orderBy(desc(enquiries.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(enquiries)
        .where(whereClause)
    ]);

    return {
      enquiries: enquiriesResult,
      total: totalResult[0].count
    };
  }

  async getEnquiryById(id: string): Promise<Enquiry | undefined> {
    const [enquiry] = await db.select().from(enquiries).where(eq(enquiries.id, id));
    return enquiry;
  }

  async createEnquiry(enquiry: InsertEnquiry): Promise<Enquiry> {
    const [newEnquiry] = await db.insert(enquiries).values(enquiry).returning();
    return newEnquiry;
  }

  async updateEnquiryStatus(id: string, status: string): Promise<boolean> {
    const result = await db
      .update(enquiries)
      .set({ status, updatedAt: new Date() })
      .where(eq(enquiries.id, id));
    return result.rowCount! > 0;
  }

  async deleteEnquiry(id: string): Promise<boolean> {
    const result = await db.delete(enquiries).where(eq(enquiries.id, id));
    return result.rowCount! > 0;
  }

  // Site Settings operations
  async getSiteSettings(): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings);
  }

  async getSiteSettingByKey(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting;
  }

  async updateSiteSetting(key: string, value: string): Promise<boolean> {
    const result = await db
      .update(siteSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(siteSettings.key, key));
    return result.rowCount! > 0;
  }

  async createSiteSetting(setting: InsertSiteSetting): Promise<SiteSetting> {
    const [newSetting] = await db.insert(siteSettings).values(setting).returning();
    return newSetting;
  }

  // Customer transaction operations
  async createCustomerTransaction(transaction: InsertCustomerTransaction): Promise<CustomerTransaction> {
    const [newTransaction] = await db.insert(customerTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getCustomerTransactions(customerId: string): Promise<CustomerTransaction[]> {
    return await db
      .select()
      .from(customerTransactions)
      .where(eq(customerTransactions.customerId, customerId))
      .orderBy(desc(customerTransactions.createdAt));
  }

  async getCustomerPendingOrders(customerEmail: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.customerEmail, customerEmail),
          eq(orders.paymentStatus, "pending")
        )
      )
      .orderBy(desc(orders.createdAt));
  }

  async getCustomerTransactionById(id: string): Promise<CustomerTransaction | undefined> {
    const [transaction] = await db.select().from(customerTransactions).where(eq(customerTransactions.id, id));
    return transaction;
  }

  async updateCustomerTransaction(id: string, transaction: Partial<InsertCustomerTransaction>): Promise<CustomerTransaction | undefined> {
    const [updatedTransaction] = await db
      .update(customerTransactions)
      .set({ ...transaction, updatedAt: new Date() })
      .where(eq(customerTransactions.id, id))
      .returning();
    return updatedTransaction;
  }

  // Email log operations
  async createEmailLog(log: InsertEmailLog): Promise<EmailLog> {
    const [newLog] = await db.insert(emailLogs).values(log).returning();
    return newLog;
  }

  async getEmailLogs(params?: { 
    limit?: number; 
    offset?: number; 
    status?: string; 
    templateId?: string;
    recipientEmail?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ logs: EmailLog[]; total: number }> {
    const { limit = 50, offset = 0, status, templateId, recipientEmail, startDate, endDate } = params || {};

    const conditions = [];
    if (status) {
      conditions.push(eq(emailLogs.status, status));
    }
    if (templateId) {
      conditions.push(eq(emailLogs.templateId, templateId));
    }
    if (recipientEmail) {
      conditions.push(like(emailLogs.recipientEmail, `%${recipientEmail}%`));
    }
    if (startDate) {
      conditions.push(sql`${emailLogs.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${emailLogs.createdAt} <= ${endDate}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [logsResult, totalResult] = await Promise.all([
      db
        .select()
        .from(emailLogs)
        .where(whereClause)
        .orderBy(desc(emailLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(emailLogs)
        .where(whereClause)
    ]);

    return {
      logs: logsResult,
      total: totalResult[0].count
    };
  }

  async updateEmailLogStatus(id: string, status: string, metadata?: any): Promise<boolean> {
    const updateData: any = { status, updatedAt: new Date() };
    
    if (status === 'sent' && !metadata?.sentAt) {
      updateData.sentAt = new Date();
    }
    if (status === 'delivered' && !metadata?.deliveredAt) {
      updateData.deliveredAt = new Date();
    }
    if (status === 'failed' && metadata?.errorMessage) {
      updateData.errorMessage = metadata.errorMessage;
    }
    if (metadata?.resendId) {
      updateData.resendId = metadata.resendId;
    }

    const result = await db
      .update(emailLogs)
      .set(updateData)
      .where(eq(emailLogs.id, id));
    return result.rowCount! > 0;
  }

  async getEmailLogById(id: string): Promise<EmailLog | undefined> {
    const [log] = await db.select().from(emailLogs).where(eq(emailLogs.id, id));
    return log;
  }

  async getEmailAnalytics(templateId?: string, startDate?: Date, endDate?: Date): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalFailed: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  }> {
    const conditions = [];
    if (templateId) {
      conditions.push(eq(emailLogs.templateId, templateId));
    }
    if (startDate) {
      conditions.push(sql`${emailLogs.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${emailLogs.createdAt} <= ${endDate}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const logs = await db
      .select()
      .from(emailLogs)
      .where(whereClause);
    
    const totalSent = logs.filter(log => log.status === 'sent' || log.status === 'delivered').length;
    const totalDelivered = logs.filter(log => log.status === 'delivered').length;
    const totalOpened = logs.filter(log => log.openedAt !== null).length;
    const totalClicked = logs.filter(log => log.clickedAt !== null).length;
    const totalFailed = logs.filter(log => log.status === 'failed').length;

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

    return {
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalFailed,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
    };
  }

  // Email template operations (advanced version with database support)
  async getEmailTemplatesAdvanced(params?: {
    templateType?: string;
    category?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ templates: any[]; total: number }> {
    // For now, fall back to the basic version until emailTemplates table is created
    const templates = await this.getEmailTemplates();
    return {
      templates,
      total: templates.length
    };
  }

  async getEmailTemplateById(id: string): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id));
    return template;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db
      .insert(emailTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(emailTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteEmailTemplate(id: string): Promise<boolean> {
    const result = await db
      .delete(emailTemplates)
      .where(eq(emailTemplates.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getDefaultTemplates(): Promise<EmailTemplate[]> {
    return db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.isActive, true))
      .orderBy(asc(emailTemplates.templateType), asc(emailTemplates.category));
  }

  async seedDefaultTemplates(): Promise<void> {
    const { defaultTemplates } = await import("@shared/email-templates");
    
    // Check if templates already exist
    const existingTemplates = await db.select().from(emailTemplates).limit(1);
    if (existingTemplates.length > 0) {
      return; // Templates already seeded
    }

    // Insert default templates
    for (const template of defaultTemplates) {
      await db.insert(emailTemplates).values(template).onConflictDoNothing();
    }
  }

  // Customer notes operations
  async getCustomerNotes(customerId: string): Promise<Array<CustomerNote & { createdByName: string }>> {
    const result = await db
      .select({
        id: customerNotes.id,
        customerId: customerNotes.customerId,
        createdBy: customerNotes.createdBy,
        subject: customerNotes.subject,
        message: customerNotes.message,
        attachmentUrl: customerNotes.attachmentUrl,
        attachmentName: customerNotes.attachmentName,
        noteType: customerNotes.noteType,
        isPrivate: customerNotes.isPrivate,
        createdAt: customerNotes.createdAt,
        updatedAt: customerNotes.updatedAt,
        createdByName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(customerNotes)
      .leftJoin(users, eq(customerNotes.createdBy, users.id))
      .where(eq(customerNotes.customerId, customerId))
      .orderBy(desc(customerNotes.createdAt));
    
    return result;
  }

  async createCustomerNote(note: InsertCustomerNote): Promise<CustomerNote> {
    const [createdNote] = await db
      .insert(customerNotes)
      .values(note)
      .returning();
    return createdNote;
  }

  async updateCustomerNote(id: string, note: Partial<InsertCustomerNote>): Promise<CustomerNote | undefined> {
    const [updatedNote] = await db
      .update(customerNotes)
      .set({ ...note, updatedAt: new Date() })
      .where(eq(customerNotes.id, id))
      .returning();
    return updatedNote;
  }

  async deleteCustomerNote(id: string): Promise<boolean> {
    const result = await db
      .delete(customerNotes)
      .where(eq(customerNotes.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
