import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uuid,
  decimal,
  integer,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("staff"), // admin, manager, staff
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Staff invitations table
export const staffInvitations = pgTable("staff_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email").notNull(),
  role: varchar("role").notNull(), // admin, manager, staff
  token: varchar("token").notNull().unique(),
  invitedBy: varchar("invited_by").notNull(),
  status: varchar("status").default("pending"), // pending, accepted, expired
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
});

// Roles table for permission management
export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name").notNull().unique(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  permissions: jsonb("permissions").notNull().default('[]'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  image: varchar("image"),
  parentId: uuid("parent_id"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Brands table
export const brands = pgTable("brands", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  logo: varchar("logo"),
  website: varchar("website"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  shortDescription: text("short_description"),
  description: text("description"),
  specifications: jsonb("specifications"), // JSON object for product specs
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  weight: decimal("weight", { precision: 8, scale: 2 }), // in grams for shipping
  length: decimal("length", { precision: 8, scale: 2 }), // in cm
  width: decimal("width", { precision: 8, scale: 2 }), // in cm
  height: decimal("height", { precision: 8, scale: 2 }), // in cm
  boxSize: varchar("box_size", { length: 10 }), // Australia Post box size (e.g., Bx1, Bx2)
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }), // calculated from Australia Post API
  status: varchar("status", { length: 20 }).default("draft"), // draft or published
  images: jsonb("images"), // Array of image URLs
  categoryId: uuid("category_id").notNull(),
  brandId: uuid("brand_id"),
  stockQuantity: integer("stock_quantity").default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  trackInventory: boolean("track_inventory").default(true),
  allowBackorder: boolean("allow_backorder").default(false),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  seoTitle: varchar("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email").notNull().unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  company: varchar("company"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer addresses table
export const customerAddresses = pgTable("customer_addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").notNull(),
  type: varchar("type").notNull(), // billing, shipping
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  company: varchar("company"),
  address1: varchar("address1").notNull(),
  address2: varchar("address2"),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  postcode: varchar("postcode").notNull(),
  country: varchar("country").default("AU"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shipping zones table
export const shippingZones = pgTable("shipping_zones", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name").notNull(),
  postcodes: jsonb("postcodes"), // Array of postcode ranges
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shipping rates table
export const shippingRates = pgTable("shipping_rates", {
  id: uuid("id").defaultRandom().primaryKey(),
  zoneId: uuid("zone_id").notNull(),
  name: varchar("name").notNull(),
  minWeight: decimal("min_weight", { precision: 8, scale: 2 }),
  maxWeight: decimal("max_weight", { precision: 8, scale: 2 }),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  freeShippingThreshold: decimal("free_shipping_threshold", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: varchar("order_number").notNull().unique(),
  customerId: uuid("customer_id"),
  customerEmail: varchar("customer_email").notNull(),
  status: varchar("status").default("pending"), // pending, processing, shipped, delivered, cancelled
  paymentStatus: varchar("payment_status").default("pending"), // pending, paid, failed, refunded
  shippingStatus: varchar("shipping_status").default("not_shipped"), // not_shipped, preparing, shipped, in_transit, delivered
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("AUD"),
  shippingAddress: jsonb("shipping_address"),
  billingAddress: jsonb("billing_address"),
  notes: text("notes"),
  staffNotes: text("staff_notes"), // Internal staff notes
  paypalOrderId: varchar("paypal_order_id"), // PayPal order ID
  paypalPaymentId: varchar("paypal_payment_id"), // PayPal payment ID
  paypalTransactionId: varchar("paypal_transaction_id"), // PayPal transaction ID
  paypalPayerInfo: jsonb("paypal_payer_info"), // PayPal payer details
  auspostService: varchar("auspost_service"), // Australia Post service type
  auspostBoxSize: varchar("auspost_box_size"), // Box size used
  auspostBoxCost: decimal("auspost_box_cost", { precision: 10, scale: 2 }), // Box cost
  auspostPostageCost: decimal("auspost_postage_cost", { precision: 10, scale: 2 }), // Postage cost
  auspostTrackingNumber: varchar("auspost_tracking_number"), // Tracking number
  auspostLabelUrl: varchar("auspost_label_url"), // Shipping label URL
  printedAt: timestamp("printed_at"), // When order was printed
  printedBy: varchar("printed_by"), // Who printed the order
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull(),
  productId: uuid("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Media files table
export const mediaFiles = pgTable("media_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  size: integer("size").notNull(),
  url: varchar("url").notNull(),
  alt: varchar("alt"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table for real-time staff alerts
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(), // 'order_new', 'order_updated', 'low_stock', etc.
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Additional data like order ID, product ID, etc.
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email settings configuration
export const emailSettings = pgTable("email_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromEmail: varchar("from_email").notNull(),
  adminEmail: varchar("admin_email").notNull(),
  enableOrderConfirmations: boolean("enable_order_confirmations").default(true),
  enableStatusUpdates: boolean("enable_status_updates").default(true),
  enableAdminNotifications: boolean("enable_admin_notifications").default(true),
  enableLowStockAlerts: boolean("enable_low_stock_alerts").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analytics tracking tables
export const pageViews = pgTable("page_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id"), // null for anonymous users
  path: varchar("path").notNull(),
  title: varchar("title"),
  referrer: varchar("referrer"),
  userAgent: text("user_agent"),
  ip: varchar("ip"),
  country: varchar("country"),
  device: varchar("device"), // mobile, desktop, tablet
  browser: varchar("browser"),
  viewDuration: integer("view_duration"), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id"), // null for anonymous users
  eventName: varchar("event_name").notNull(), // click, scroll, form_submit, add_to_cart, etc.
  eventCategory: varchar("event_category"), // button, link, product, form
  eventLabel: varchar("event_label"), // specific element identifier
  eventValue: integer("event_value"), // numerical value if applicable
  path: varchar("path").notNull(),
  metadata: jsonb("metadata"), // additional event data
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id"), // null for anonymous sessions
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  pageViews: integer("page_views").default(0),
  events: integer("events").default(0),
  referrer: varchar("referrer"),
  landingPage: varchar("landing_page"),
  exitPage: varchar("exit_page"),
  device: varchar("device"),
  browser: varchar("browser"),
  country: varchar("country"),
  isConverted: boolean("is_converted").default(false), // did they make a purchase
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default('0'),
});

export const conversionFunnels = pgTable("conversion_funnels", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: varchar("session_id").notNull(),
  step: varchar("step").notNull(), // landing, product_view, add_to_cart, checkout, purchase
  stepOrder: integer("step_order").notNull(),
  path: varchar("path").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const seoMetrics = pgTable("seo_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  path: varchar("path").notNull().unique(),
  title: varchar("title"),
  description: text("description"),
  keywords: text("keywords"),
  ogTitle: varchar("og_title"),
  ogDescription: text("og_description"),
  canonicalUrl: varchar("canonical_url"),
  lastCrawled: timestamp("last_crawled"),
  pageSpeed: integer("page_speed"), // in milliseconds
  mobileUsability: boolean("mobile_usability").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer reviews table
export const customerReviews = pgTable("customer_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email"),
  rating: integer("rating").notNull(), // 1-5 stars
  title: varchar("title").notNull(),
  comment: text("comment").notNull(),
  productId: uuid("product_id"), // optional - review can be about service in general
  orderId: uuid("order_id"), // optional - link to specific order
  isVerified: boolean("is_verified").default(false), // verified purchase
  isVisible: boolean("is_visible").default(true),
  isMockData: boolean("is_mock_data").default(false), // to identify mock reviews
  adminResponse: text("admin_response"), // optional admin reply
  adminResponseBy: varchar("admin_response_by"), // admin who replied
  adminResponseAt: timestamp("admin_response_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  orderItems: many(orderItems),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  addresses: many(customerAddresses),
  orders: many(orders),
}));

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, {
    fields: [customerAddresses.customerId],
    references: [customers.id],
  }),
}));

export const shippingZonesRelations = relations(shippingZones, ({ many }) => ({
  rates: many(shippingRates),
}));

export const shippingRatesRelations = relations(shippingRates, ({ one }) => ({
  zone: one(shippingZones, {
    fields: [shippingRates.zoneId],
    references: [shippingZones.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const customerReviewsRelations = relations(customerReviews, ({ one }) => ({
  product: one(products, {
    fields: [customerReviews.productId],
    references: [products.id],
  }),
  order: one(orders, {
    fields: [customerReviews.orderId],
    references: [orders.id],
  }),
}));

// Enquiries table
export const enquiries = pgTable("enquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("new"), // new, contacted, quoted, closed
  priority: varchar("priority", { length: 20 }).notNull().default("medium"), // low, medium, high, urgent
  source: varchar("source", { length: 100 }).default("website"), // website, phone, email, referral
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  shippingCost: true, // calculated by API
}).extend({
  price: z.number().min(0, "Price must be a positive number"),
  weight: z.number().min(0, "Weight must be a positive number").optional(),
  length: z.number().min(0, "Length must be a positive number").optional(),
  width: z.number().min(0, "Width must be a positive number").optional(),
  height: z.number().min(0, "Height must be a positive number").optional(),
  boxSize: z.string().optional(),
  stockQuantity: z.number().int().min(0, "Stock quantity must be a non-negative integer"),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export const insertStaffInvitationSchema = createInsertSchema(staffInvitations).omit({
  id: true,
  createdAt: true,
  acceptedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerReviewSchema = createInsertSchema(customerReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  adminResponseAt: true,
}).extend({
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
});

export const insertEnquirySchema = createInsertSchema(enquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  phone: z.string().optional(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Brand = typeof brands.$inferSelect;
export type InsertBrand = z.infer<typeof insertBrandSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type MediaFile = typeof mediaFiles.$inferSelect;
export type ShippingZone = typeof shippingZones.$inferSelect;
export type ShippingRate = typeof shippingRates.$inferSelect;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertEmailSettings = typeof emailSettings.$inferInsert;

export type StaffInvitation = typeof staffInvitations.$inferSelect;
export type InsertStaffInvitation = z.infer<typeof insertStaffInvitationSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type CustomerReview = typeof customerReviews.$inferSelect;
export type InsertCustomerReview = z.infer<typeof insertCustomerReviewSchema>;

export type Enquiry = typeof enquiries.$inferSelect;
export type InsertEnquiry = z.infer<typeof insertEnquirySchema>;

// Analytics types
export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = typeof pageViews.$inferInsert;

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

export type ConversionFunnel = typeof conversionFunnels.$inferSelect;
export type InsertConversionFunnel = typeof conversionFunnels.$inferInsert;

export type SEOMetrics = typeof seoMetrics.$inferSelect;
export type InsertSEOMetrics = typeof seoMetrics.$inferInsert;
