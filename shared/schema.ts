import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"),
  firebaseUid: text("firebase_uid").unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
  stripeCustomerId: text("stripe_customer_id"),
  isPremium: boolean("is_premium").default(false),
});

export const socialAccounts = pgTable("social_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  platform: text("platform").notNull(), // 'twitter', 'facebook', 'instagram', 'linkedin'
  username: text("username").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  stats: jsonb("stats").default({ followers: 0, following: 0, posts: 0, engagementRate: 0 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => socialAccounts.id),
  platform: text("platform").notNull(), // 'twitter', 'facebook', 'instagram', 'linkedin'
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array(),
  scheduledFor: timestamp("scheduled_for"),
  publishedAt: timestamp("published_at"),
  status: text("status").notNull().default("draft"), // 'draft', 'scheduled', 'published', 'failed'
  engagement: jsonb("engagement").default({ likes: 0, comments: 0, shares: 0, reach: 0 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => socialAccounts.id),
  platform: text("platform").notNull(), // 'twitter', 'facebook', 'instagram', 'linkedin'
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("unread"), // 'unread', 'read', 'replied'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => socialAccounts.id),
  platform: text("platform").notNull(), // 'twitter', 'facebook', 'instagram', 'linkedin'
  postId: text("post_id").notNull(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("unread"), // 'unread', 'read', 'replied'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mentions = pgTable("mentions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => socialAccounts.id),
  platform: text("platform").notNull(), // 'twitter', 'facebook', 'instagram', 'linkedin'
  postId: text("post_id").notNull(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  sentiment: text("sentiment").notNull().default("neutral"), // 'positive', 'neutral', 'negative'
  status: text("status").notNull().default("unread"), // 'unread', 'read', 'replied'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contentTemplates = pgTable("content_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  platform: text("platform").notNull(), // 'twitter', 'facebook', 'instagram', 'linkedin'
  content: text("content").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array(),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const servicePackages = pgTable("service_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  platform: text("platform").notNull(), // 'tiktok', 'instagram', 'facebook'
  type: text("type").notNull(), // 'followers', 'views', 'likes', 'comments'
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(), // in cents
  deliveryTime: text("delivery_time").notNull(),
  bestValue: boolean("best_value").default(false),
  refillGuarantee: text("refill_guarantee"),
  features: text("features").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  packageId: integer("package_id").notNull().references(() => servicePackages.id),
  targetUsername: text("target_username").notNull(),
  platform: text("platform").notNull(), // 'tiktok', 'instagram', 'facebook'
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(), // in cents
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'delivering', 'completed', 'failed'
  deliverySpeed: text("delivery_speed").notNull().default("gradual"), // 'gradual', 'express'
  dripFeed: boolean("drip_feed").default(false),
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in cents
  dailyFollowers: integer("daily_followers").default(0),
  dailyViews: integer("daily_views").default(0),
  autoReplenish: boolean("auto_replenish").default(false),
  features: text("features").array(),
  stripePriceId: text("stripe_price_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull().default("active"), // 'active', 'canceled', 'past_due'
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  stripeCustomerId: true,
  isPremium: true,
});

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({
  id: true,
  stats: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  engagement: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMentionSchema = createInsertSchema(mentions).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentTemplateSchema = createInsertSchema(contentTemplates).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServicePackageSchema = createInsertSchema(servicePackages).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  stripePaymentId: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Mention = typeof mentions.$inferSelect;
export type InsertMention = z.infer<typeof insertMentionSchema>;

export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type InsertContentTemplate = z.infer<typeof insertContentTemplateSchema>;

export type ServicePackage = typeof servicePackages.$inferSelect;
export type InsertServicePackage = z.infer<typeof insertServicePackageSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
