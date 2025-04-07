import { 
  users, type User, type InsertUser,
  socialAccounts, type SocialAccount, type InsertSocialAccount,
  servicePackages, type ServicePackage, type InsertServicePackage,
  orders, type Order, type InsertOrder,
  subscriptionPlans, type SubscriptionPlan, type InsertSubscriptionPlan,
  subscriptions, type Subscription, type InsertSubscription
} from "@shared/schema";

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

export const storage = new MemStorage();
