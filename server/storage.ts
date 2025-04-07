import { 
  users, type User, type InsertUser,
  socialAccounts, type SocialAccount, type InsertSocialAccount,
  servicePackages, type ServicePackage, type InsertServicePackage,
  orders, type Order, type InsertOrder,
  subscriptionPlans, type SubscriptionPlan, type InsertSubscriptionPlan,
  subscriptions, type Subscription, type InsertSubscription
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseId(firebaseUid: string): Promise<User | undefined>;
  createUser(user: Partial<InsertUser> & { firebaseUid?: string, avatarUrl?: string, displayName?: string }): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;

  // Social Account methods
  getSocialAccount(id: number): Promise<SocialAccount | undefined>;
  getSocialAccountsByUserId(userId: number): Promise<SocialAccount[]>;
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  updateSocialAccount(id: number, accountData: Partial<SocialAccount>): Promise<SocialAccount | undefined>;
  deleteSocialAccount(id: number): Promise<void>;

  // Service Package methods
  getPackageById(id: number): Promise<ServicePackage | undefined>;
  getAllPackages(): Promise<ServicePackage[]>;
  getPackagesByPlatform(platform: string): Promise<ServicePackage[]>;
  getPackagesByPlatformAndType(platform: string, type: string): Promise<ServicePackage[]>;

  // Order methods
  getOrderById(id: number): Promise<Order | undefined>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, orderData: Partial<Order>): Promise<Order | undefined>;
  deleteOrdersByUserId(userId: number): Promise<void>;

  // Subscription Plan methods
  getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined>;
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;

  // Subscription methods
  getSubscriptionById(id: number): Promise<Subscription | undefined>;
  getSubscriptionByUserId(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: Partial<InsertSubscription>): Promise<Subscription>;
  updateSubscription(id: number, subscriptionData: Partial<Subscription>): Promise<Subscription | undefined>;
  cancelSubscription(id: number): Promise<Subscription | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private socialAccounts: Map<number, SocialAccount>;
  private servicePackages: Map<number, ServicePackage>;
  private orders: Map<number, Order>;
  private subscriptionPlans: Map<number, SubscriptionPlan>;
  private subscriptions: Map<number, Subscription>;
  
  private currentUserId: number;
  private currentSocialAccountId: number;
  private currentOrderId: number;
  private currentSubscriptionId: number;

  constructor() {
    this.users = new Map();
    this.socialAccounts = new Map();
    this.servicePackages = new Map();
    this.orders = new Map();
    this.subscriptionPlans = new Map();
    this.subscriptions = new Map();
    
    this.currentUserId = 1;
    this.currentSocialAccountId = 1;
    this.currentOrderId = 1;
    this.currentSubscriptionId = 1;

    // Initialize with some sample data for development
    this.initializeServicePackages();
    this.initializeSubscriptionPlans();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getUserByFirebaseId(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid
    );
  }

  async createUser(userData: Partial<InsertUser> & { firebaseUid?: string, avatarUrl?: string, displayName?: string }): Promise<User> {
    // Validate required fields
    if (!userData.username && !userData.email) {
      throw new Error("Username or email is required");
    }

    // Generate a username if not provided
    if (!userData.username && userData.email) {
      userData.username = userData.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    // Check if username already exists
    const existingUserByUsername = await this.getUserByUsername(userData.username!);
    if (existingUserByUsername) {
      throw new Error("Username already exists");
    }

    // Check if email already exists if provided
    if (userData.email) {
      const existingUserByEmail = await this.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        throw new Error("Email already exists");
      }
    }

    const id = this.currentUserId++;
    const now = new Date().toISOString();
    
    const user: User = {
      id,
      username: userData.username!,
      email: userData.email || `${userData.username}@example.com`,
      password: userData.password || "",
      firebaseUid: userData.firebaseUid || "",
      displayName: userData.displayName || "",
      avatarUrl: userData.avatarUrl || "",
      createdAt: now,
      isPremium: false,
    };

    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) {
      return undefined;
    }

    // Check if username is being updated and already exists
    if (userData.username && userData.username !== user.username) {
      const existingUser = await this.getUserByUsername(userData.username);
      if (existingUser && existingUser.id !== id) {
        throw new Error("Username already exists");
      }
    }

    // Check if email is being updated and already exists
    if (userData.email && userData.email !== user.email) {
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error("Email already exists");
      }
    }

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    // Delete user's social accounts
    const userAccounts = await this.getSocialAccountsByUserId(id);
    for (const account of userAccounts) {
      await this.deleteSocialAccount(account.id);
    }

    // Delete user's orders
    await this.deleteOrdersByUserId(id);

    // Delete user's subscriptions
    const subscription = await this.getSubscriptionByUserId(id);
    if (subscription) {
      await this.cancelSubscription(subscription.id);
    }

    // Delete the user
    this.users.delete(id);
  }

  // Social Account methods
  async getSocialAccount(id: number): Promise<SocialAccount | undefined> {
    return this.socialAccounts.get(id);
  }

  async getSocialAccountsByUserId(userId: number): Promise<SocialAccount[]> {
    return Array.from(this.socialAccounts.values()).filter(
      (account) => account.userId === userId
    );
  }

  async createSocialAccount(accountData: InsertSocialAccount): Promise<SocialAccount> {
    const id = this.currentSocialAccountId++;
    const now = new Date().toISOString();
    
    const account: SocialAccount = {
      id,
      userId: accountData.userId,
      platform: accountData.platform,
      username: accountData.username,
      followerCount: 0,
      viewCount: 0,
      likeCount: 0,
      lastUpdated: now,
    };

    this.socialAccounts.set(id, account);
    return account;
  }

  async updateSocialAccount(id: number, accountData: Partial<SocialAccount>): Promise<SocialAccount | undefined> {
    const account = await this.getSocialAccount(id);
    if (!account) {
      return undefined;
    }

    const updatedAccount = { ...account, ...accountData, lastUpdated: new Date().toISOString() };
    this.socialAccounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteSocialAccount(id: number): Promise<void> {
    this.socialAccounts.delete(id);
  }

  // Service Package methods
  async getPackageById(id: number): Promise<ServicePackage | undefined> {
    return this.servicePackages.get(id);
  }

  async getAllPackages(): Promise<ServicePackage[]> {
    return Array.from(this.servicePackages.values());
  }

  async getPackagesByPlatform(platform: string): Promise<ServicePackage[]> {
    return Array.from(this.servicePackages.values()).filter(
      (pkg) => pkg.platform.toLowerCase() === platform.toLowerCase()
    );
  }

  async getPackagesByPlatformAndType(platform: string, type: string): Promise<ServicePackage[]> {
    return Array.from(this.servicePackages.values()).filter(
      (pkg) => 
        pkg.platform.toLowerCase() === platform.toLowerCase() &&
        pkg.type.toLowerCase() === type.toLowerCase()
    );
  }

  // Order methods
  async getOrderById(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId
    );
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const now = new Date().toISOString();
    
    const order: Order = {
      id,
      userId: orderData.userId,
      packageId: orderData.packageId,
      targetUsername: orderData.targetUsername,
      platform: orderData.platform,
      quantity: orderData.quantity,
      price: orderData.price,
      status: "pending",
      deliverySpeed: orderData.deliverySpeed || "gradual",
      dripFeed: orderData.dripFeed || false,
      stripePaymentId: orderData.stripePaymentId || "",
      createdAt: now,
      updatedAt: now,
    };

    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: number, orderData: Partial<Order>): Promise<Order | undefined> {
    const order = await this.getOrderById(id);
    if (!order) {
      return undefined;
    }

    const updatedOrder = { 
      ...order, 
      ...orderData, 
      updatedAt: new Date().toISOString() 
    };
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrdersByUserId(userId: number): Promise<void> {
    const userOrders = await this.getOrdersByUserId(userId);
    for (const order of userOrders) {
      this.orders.delete(order.id);
    }
  }

  // Subscription Plan methods
  async getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined> {
    return this.subscriptionPlans.get(id);
  }

  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values());
  }

  // Subscription methods
  async getSubscriptionById(id: number): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }

  async getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      (subscription) => subscription.userId === userId && subscription.status === "active"
    );
  }

  async createSubscription(subscriptionData: Partial<InsertSubscription>): Promise<Subscription> {
    const id = this.currentSubscriptionId++;
    const now = new Date().toISOString();
    
    const subscription: Subscription = {
      id,
      userId: subscriptionData.userId!,
      planId: subscriptionData.planId!,
      stripeSubscriptionId: subscriptionData.stripeSubscriptionId || "",
      status: "active",
      currentPeriodStart: subscriptionData.currentPeriodStart || now,
      currentPeriodEnd: subscriptionData.currentPeriodEnd || now,
      createdAt: now,
      updatedAt: now,
    };

    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async updateSubscription(id: number, subscriptionData: Partial<Subscription>): Promise<Subscription | undefined> {
    const subscription = await this.getSubscriptionById(id);
    if (!subscription) {
      return undefined;
    }

    const updatedSubscription = { 
      ...subscription, 
      ...subscriptionData, 
      updatedAt: new Date().toISOString() 
    };
    
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }

  async cancelSubscription(id: number): Promise<Subscription | undefined> {
    const subscription = await this.getSubscriptionById(id);
    if (!subscription) {
      return undefined;
    }

    const cancelledSubscription = { 
      ...subscription, 
      status: "canceled", 
      updatedAt: new Date().toISOString() 
    };
    
    this.subscriptions.set(id, cancelledSubscription);
    return cancelledSubscription;
  }

  // Initialize some sample data for development
  private initializeServicePackages(): void {
    const packages: ServicePackage[] = [
      {
        id: 1,
        name: "1,000 Followers",
        description: "Boost your TikTok followers count with high-quality followers",
        platform: "tiktok",
        type: "followers",
        quantity: 1000,
        price: 999, // $9.99
        deliveryTime: "1-2 days",
        bestValue: false,
        refillGuarantee: "30 days",
        features: ["High-quality followers", "Gradual delivery (1-2 days)", "30-day refill guarantee"],
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: "5,000 Followers",
        description: "Increase your TikTok popularity with premium followers",
        platform: "tiktok",
        type: "followers",
        quantity: 5000,
        price: 3999, // $39.99
        deliveryTime: "2-3 days",
        bestValue: false,
        refillGuarantee: "30 days",
        features: ["High-quality followers", "Gradual delivery (2-3 days)", "30-day refill guarantee", "Save 20% vs. smaller package"],
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        name: "10,000 Followers",
        description: "Achieve TikTok growth with our most popular package",
        platform: "tiktok",
        type: "followers",
        quantity: 10000,
        price: 6999, // $69.99
        deliveryTime: "3-5 days",
        bestValue: true,
        refillGuarantee: "60 days",
        features: ["Premium-quality followers", "Gradual delivery (3-5 days)", "60-day refill guarantee", "Save 30% vs. smaller packages"],
        createdAt: new Date().toISOString(),
      },
      {
        id: 4,
        name: "50,000 Followers",
        description: "Become a TikTok influencer with our VIP followers package",
        platform: "tiktok",
        type: "followers",
        quantity: 50000,
        price: 24999, // $249.99
        deliveryTime: "7-10 days",
        bestValue: false,
        refillGuarantee: "90 days",
        features: ["VIP-quality followers", "Steady delivery (7-10 days)", "90-day refill guarantee", "Save 50% vs. smaller packages", "Free profile consultation"],
        createdAt: new Date().toISOString(),
      },
      {
        id: 5,
        name: "10,000 Video Views",
        description: "Boost your TikTok video engagement",
        platform: "tiktok",
        type: "views",
        quantity: 10000,
        price: 1999, // $19.99
        deliveryTime: "1-2 days",
        bestValue: false,
        refillGuarantee: "None",
        features: ["Real high-retention views", "Fast delivery", "Algorithm boost"],
        createdAt: new Date().toISOString(),
      },
      {
        id: 6,
        name: "1,000 Instagram Followers",
        description: "Grow your Instagram presence with real-looking followers",
        platform: "instagram",
        type: "followers",
        quantity: 1000,
        price: 1499, // $14.99
        deliveryTime: "1-2 days",
        bestValue: false,
        refillGuarantee: "30 days",
        features: ["High-quality followers", "Gradual delivery", "30-day refill guarantee"],
        createdAt: new Date().toISOString(),
      },
      {
        id: 7,
        name: "500 Facebook Page Likes",
        description: "Increase your Facebook page credibility",
        platform: "facebook",
        type: "likes",
        quantity: 500,
        price: 1999, // $19.99
        deliveryTime: "2-4 days",
        bestValue: false,
        refillGuarantee: "30 days",
        features: ["High-quality page likes", "Gradual delivery", "30-day refill guarantee"],
        createdAt: new Date().toISOString(),
      },
    ];

    packages.forEach(pkg => {
      this.servicePackages.set(pkg.id, pkg);
    });
  }

  private initializeSubscriptionPlans(): void {
    const plans: SubscriptionPlan[] = [
      {
        id: 1,
        name: "Auto-Growth Pro Plan",
        description: "Steady daily growth, no effort required",
        price: 4999, // $49.99
        dailyFollowers: 100,
        dailyViews: 500,
        autoReplenish: true,
        stripePriceId: "price_1234567890",
        features: [
          "+100 followers daily",
          "+500 video views daily",
          "Auto-replenish if numbers drop",
          "Cancel anytime"
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Auto-Growth Plus Plan",
        description: "Accelerated growth for serious creators",
        price: 9999, // $99.99
        dailyFollowers: 250,
        dailyViews: 1000,
        autoReplenish: true,
        stripePriceId: "price_0987654321",
        features: [
          "+250 followers daily",
          "+1,000 video views daily",
          "+50 likes daily",
          "Priority support",
          "Auto-replenish if numbers drop",
          "Cancel anytime"
        ],
        createdAt: new Date().toISOString(),
      }
    ];

    plans.forEach(plan => {
      this.subscriptionPlans.set(plan.id, plan);
    });
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async getUserByFirebaseId(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid));
    return user;
  }

  async createUser(userData: Partial<InsertUser> & { firebaseUid?: string, avatarUrl?: string, displayName?: string }): Promise<User> {
    // Validate required fields
    if (!userData.username && !userData.email) {
      throw new Error("Username or email is required");
    }

    // Generate a username if not provided
    if (!userData.username && userData.email) {
      userData.username = userData.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    // Check if username already exists
    const existingUserByUsername = await this.getUserByUsername(userData.username!);
    if (existingUserByUsername) {
      throw new Error("Username already exists");
    }

    // Check if email already exists if provided
    if (userData.email) {
      const existingUserByEmail = await this.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        throw new Error("Email already exists");
      }
    }

    const [user] = await db
      .insert(users)
      .values({
        username: userData.username!,
        email: userData.email || `${userData.username}@example.com`,
        password: userData.password || "",
        firebaseUid: userData.firebaseUid || null,
        displayName: userData.displayName || null,
        avatarUrl: userData.avatarUrl || null,
        isPremium: false,
      })
      .returning();

    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) {
      return undefined;
    }

    // Check if username is being updated and already exists
    if (userData.username && userData.username !== user.username) {
      const existingUser = await this.getUserByUsername(userData.username);
      if (existingUser && existingUser.id !== id) {
        throw new Error("Username already exists");
      }
    }

    // Check if email is being updated and already exists
    if (userData.email && userData.email !== user.email) {
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error("Email already exists");
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    // Delete user's social accounts
    await db.delete(socialAccounts).where(eq(socialAccounts.userId, id));

    // Delete user's orders
    await db.delete(orders).where(eq(orders.userId, id));

    // Delete user's subscriptions
    await db.delete(subscriptions).where(eq(subscriptions.userId, id));

    // Delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  // Social Account methods
  async getSocialAccount(id: number): Promise<SocialAccount | undefined> {
    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.id, id));
    return account;
  }

  async getSocialAccountsByUserId(userId: number): Promise<SocialAccount[]> {
    return db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.userId, userId));
  }

  async createSocialAccount(accountData: InsertSocialAccount): Promise<SocialAccount> {
    const [account] = await db
      .insert(socialAccounts)
      .values(accountData)
      .returning();
    return account;
  }

  async updateSocialAccount(id: number, accountData: Partial<SocialAccount>): Promise<SocialAccount | undefined> {
    const account = await this.getSocialAccount(id);
    if (!account) {
      return undefined;
    }

    const [updatedAccount] = await db
      .update(socialAccounts)
      .set({ ...accountData, lastUpdated: new Date() })
      .where(eq(socialAccounts.id, id))
      .returning();

    return updatedAccount;
  }

  async deleteSocialAccount(id: number): Promise<void> {
    await db.delete(socialAccounts).where(eq(socialAccounts.id, id));
  }

  // Service Package methods
  async getPackageById(id: number): Promise<ServicePackage | undefined> {
    const [pkg] = await db
      .select()
      .from(servicePackages)
      .where(eq(servicePackages.id, id));
    return pkg;
  }

  async getAllPackages(): Promise<ServicePackage[]> {
    return db.select().from(servicePackages);
  }

  async getPackagesByPlatform(platform: string): Promise<ServicePackage[]> {
    return db
      .select()
      .from(servicePackages)
      .where(eq(servicePackages.platform, platform));
  }

  async getPackagesByPlatformAndType(platform: string, type: string): Promise<ServicePackage[]> {
    return db
      .select()
      .from(servicePackages)
      .where(
        and(
          eq(servicePackages.platform, platform),
          eq(servicePackages.type, type)
        )
      );
  }

  // Order methods
  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order;
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values({
        ...orderData,
        status: "pending",
        deliverySpeed: orderData.deliverySpeed || "gradual",
        dripFeed: orderData.dripFeed || false,
      })
      .returning();
    return order;
  }

  async updateOrder(id: number, orderData: Partial<Order>): Promise<Order | undefined> {
    const order = await this.getOrderById(id);
    if (!order) {
      return undefined;
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({ ...orderData, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    return updatedOrder;
  }

  async deleteOrdersByUserId(userId: number): Promise<void> {
    await db.delete(orders).where(eq(orders.userId, userId));
  }

  // Subscription Plan methods
  async getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return db.select().from(subscriptionPlans);
  }

  // Subscription methods
  async getSubscriptionById(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));
    return subscription;
  }

  async getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        )
      );
    return subscription;
  }

  async createSubscription(subscriptionData: Partial<InsertSubscription>): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        userId: subscriptionData.userId!,
        planId: subscriptionData.planId!,
        stripeSubscriptionId: subscriptionData.stripeSubscriptionId || null,
        status: "active",
        currentPeriodStart: subscriptionData.currentPeriodStart || new Date(),
        currentPeriodEnd: subscriptionData.currentPeriodEnd || new Date(),
      })
      .returning();
    return subscription;
  }

  async updateSubscription(id: number, subscriptionData: Partial<Subscription>): Promise<Subscription | undefined> {
    const subscription = await this.getSubscriptionById(id);
    if (!subscription) {
      return undefined;
    }

    const [updatedSubscription] = await db
      .update(subscriptions)
      .set({ ...subscriptionData, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();

    return updatedSubscription;
  }

  async cancelSubscription(id: number): Promise<Subscription | undefined> {
    const subscription = await this.getSubscriptionById(id);
    if (!subscription) {
      return undefined;
    }

    const [cancelledSubscription] = await db
      .update(subscriptions)
      .set({ status: "canceled", updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();

    return cancelledSubscription;
  }
}

// Initialize the database with sample data if needed
async function initializeDatabase() {
  // Check if we have any service packages already
  const existingPackages = await db.select().from(servicePackages);
  if (existingPackages.length === 0) {
    // Insert sample service packages
    await db.insert(servicePackages).values([
      {
        name: "1,000 Followers",
        description: "Boost your TikTok followers count with high-quality followers",
        platform: "tiktok",
        type: "followers",
        quantity: 1000,
        price: 999, // $9.99
        deliveryTime: "1-2 days",
        bestValue: false,
        refillGuarantee: "30 days",
        features: ["High-quality followers", "Gradual delivery (1-2 days)", "30-day refill guarantee"],
      },
      {
        name: "5,000 Followers",
        description: "Increase your TikTok popularity with premium followers",
        platform: "tiktok",
        type: "followers",
        quantity: 5000,
        price: 3999, // $39.99
        deliveryTime: "2-3 days",
        bestValue: false,
        refillGuarantee: "30 days",
        features: ["High-quality followers", "Gradual delivery (2-3 days)", "30-day refill guarantee", "Save 20% vs. smaller package"],
      },
      {
        name: "10,000 Followers",
        description: "Achieve TikTok growth with our most popular package",
        platform: "tiktok",
        type: "followers",
        quantity: 10000,
        price: 6999, // $69.99
        deliveryTime: "3-5 days",
        bestValue: true,
        refillGuarantee: "60 days",
        features: ["Premium-quality followers", "Gradual delivery (3-5 days)", "60-day refill guarantee", "Save 30% vs. smaller packages"],
      }
    ]);
  }

  // Check if we have any subscription plans already
  const existingPlans = await db.select().from(subscriptionPlans);
  if (existingPlans.length === 0) {
    // Insert sample subscription plans
    await db.insert(subscriptionPlans).values([
      {
        name: "Starter",
        description: "Perfect for beginners looking to grow their social media presence",
        price: 1999, // $19.99
        dailyFollowers: 50,
        dailyViews: 500,
        autoReplenish: true,
        features: ["50 followers daily", "500 views daily", "Basic analytics", "Email support"],
      },
      {
        name: "Professional",
        description: "Ideal for influencers wanting to grow their audience consistently",
        price: 4999, // $49.99
        dailyFollowers: 150,
        dailyViews: 1500,
        autoReplenish: true,
        features: ["150 followers daily", "1,500 views daily", "Detailed analytics", "Priority support", "Content suggestions"],
      }
    ]);
  }
}

// Initialize the database (can be commented out if not needed)
initializeDatabase().catch(console.error);

// Use the DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
