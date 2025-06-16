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
  updateProductStatusAndShipping(id: string, shippingCost: number): Promise<Product | undefined>;

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
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<boolean>;
  updateOrder(id: string, updates: Partial<Order>): Promise<boolean>;
  addOrderItem(item: InsertOrderItem): Promise<OrderItem>;

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

    // Get orders with customer information
    let query = db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt));
    
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

    return {
      ...order,
      items
    };
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

  async updateOrder(id: string, updates: Partial<Order>): Promise<boolean> {
    const result = await db
      .update(orders)
      .set({ ...updates, updatedAt: new Date() })
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
      .leftJoin(customers, eq(orders.customerId, customers.id))
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
      recentOrders,
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
    return result.rowCount > 0;
  }

  // Staff invitation operations
  async createStaffInvitation(invitation: InsertStaffInvitation): Promise<StaffInvitation> {
    const [staffInvitation] = await db
      .insert(staffInvitations)
      .values(invitation)
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
    return result.rowCount > 0;
  }

  async deleteStaffInvitation(id: string): Promise<boolean> {
    const result = await db.delete(staffInvitations).where(eq(staffInvitations.id, id));
    return result.rowCount > 0;
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
    return result.rowCount > 0;
  }

  // Customer review operations
  async getCustomerReviews(params?: {
    isVisible?: boolean;
    productId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ reviews: CustomerReview[]; total: number }> {
    const { isVisible, productId, limit = 10, offset = 0 } = params || {};

    let query = db.select().from(customerReviews);
    let countQuery = db.select({ count: count() }).from(customerReviews);

    const conditions = [];
    if (isVisible !== undefined) {
      conditions.push(eq(customerReviews.isVisible, isVisible));
    }
    if (productId) {
      conditions.push(eq(customerReviews.productId, productId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
      countQuery = countQuery.where(and(...conditions));
    }

    const [reviews, totalResult] = await Promise.all([
      query.orderBy(desc(customerReviews.createdAt)).limit(limit).offset(offset),
      countQuery
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

    let query = db.select().from(enquiries);
    let countQuery = db.select({ count: count() }).from(enquiries);

    const conditions = [];
    if (status) {
      conditions.push(eq(enquiries.status, status));
    }
    if (priority) {
      conditions.push(eq(enquiries.priority, priority));
    }

    if (conditions.length > 0) {
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereCondition);
      countQuery = countQuery.where(whereCondition);
    }

    const [enquiriesResult, totalResult] = await Promise.all([
      query.orderBy(desc(enquiries.createdAt)).limit(limit).offset(offset),
      countQuery
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
}

export const storage = new DatabaseStorage();
