import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { z } from "zod";
import { insertUserSchema, insertOrderSchema, insertSocialAccountSchema } from "@shared/schema";
import { zValidate } from "./middleware/zod-validator";
import { authMiddleware } from "./middleware/auth";
import { AIService } from './services/ai';
import express from 'express';
import { auth as firebaseAuth } from './firebase';
import { SocialService } from './services/social';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil' as const,
});

const router = express.Router();
const socialService = new SocialService(storage);

// Add Stripe subscription type
interface StripeSubscription {
  id: string;
  current_period_start: number;
  current_period_end: number;
  status: string;
  customer: string;
  items: {
    data: Array<{
      price: {
        id: string;
        product: string;
      };
    }>;
  };
  latest_invoice?: {
    payment_intent?: {
      client_secret: string;
    };
  };
}

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  followerCount: number;
  viewCount: number;
  likeCount: number;
  stats?: {
    followers: number;
    following: number;
    posts: number;
    engagement?: {
      likes: number;
      comments: number;
      shares: number;
    };
  };
}

interface GrowthCampaign {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'paused' | 'completed';
  targetAudience: {
    demographics: {
      ageRange: string;
      gender: string;
      location: string;
    };
    interests: string[];
  };
  metrics: {
    targetFollowers: number;
    targetEngagement: number;
    currentFollowers: number;
    currentEngagement: number;
  };
}

interface DatabaseStorage {
  getScheduledPost(userId: string, platform: string, month: string): Promise<any>;
  createScheduledPost(data: {
    userId: string;
    platform: string;
    content: string;
    scheduledDate: string;
    mediaUrls?: string[];
  }): Promise<any>;
  updateScheduledPost(id: number, data: {
    title?: string;
    content?: string;
    scheduledDate?: string;
    status?: string;
    mediaUrls?: string[];
  }): Promise<any>;
  deleteScheduledPost(id: number): Promise<void>;
  getPosts(accountId: string): Promise<Array<{
    id: string;
    content: string;
    createdAt: string;
    likes: number;
    comments: number;
    reach: number;
    impressions: number;
    engagement?: {
      likes: number;
      comments: number;
      shares: number;
    };
  }>>;
  getEngagementData(accountId: string): Promise<{
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    impressions: number;
  }>;
  getContentTemplates(userId: string, platform: string): Promise<any[]>;
  createContentTemplate(data: any): Promise<any>;
  getContentTemplate(id: string): Promise<any>;
  updateContentTemplate(id: string, data: any): Promise<any>;
  deleteContentTemplate(id: string): Promise<void>;
  getSocialAccounts(userId: string): Promise<SocialAccount[]>;
  getMessages(accountId: string): Promise<any[]>;
  getComments(accountId: string): Promise<any[]>;
  getMentions(accountId: string): Promise<any[]>;
  saveMonitoringSettings(userId: string, settings: any): Promise<void>;
  getEnhancedAnalytics(userId: string, platform: string, timeRange: string): Promise<any>;
  getTeamMembers(userId: string): Promise<any[]>;
  inviteTeamMember(userId: string, email: string, role: string): Promise<any>;
  getReviewTasks(userId: string): Promise<any[]>;
  updateReviewTaskStatus(userId: string, taskId: string, status: string): Promise<any>;
  getCampaigns(userId: string, status: string): Promise<any[]>;
  createCampaign(data: any): Promise<any>;
  getCampaign(id: string): Promise<any>;
  updateCampaignStatus(id: string, status: string): Promise<any>;
  createCampaignVariant(id: string, data: any): Promise<any>;
  updateCampaignMetrics(id: string, metrics: any): Promise<any>;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply auth middleware to all API routes
  app.use("/api", authMiddleware);

  // USERS ROUTES
  // Create a new user
  app.post("/api/users", zValidate(insertUserSchema), async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error:', error.message);
        res.status(400).json({ message: error.message || "Failed to create user" });
      } else {
        console.error('Unknown error:', error);
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  // Get current user
  app.get("/api/users/current", async (req, res) => {
    try {
      res.json(req.user);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error:', error.message);
        res.status(500).json({ message: error.message || "Server error" });
      } else {
        console.error('Unknown error:', error);
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  // Handle Google Auth
  app.post("/api/users/google-auth", async (req, res) => {
    try {
      const { email, displayName, firebaseUid, avatarUrl } = req.body;
      
      // Check if user exists
      let user = await storage.getUserByFirebaseId(firebaseUid);
      
      if (user) {
        // Update existing user
        user = await storage.updateUser(user.id, { 
          displayName: displayName || user.displayName,
          avatarUrl: avatarUrl || user.avatarUrl
        });
      } else {
        // Create new user
        const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
        user = await storage.createUser({
          username,
          email,
          displayName,
          firebaseUid,
          avatarUrl
        });
      }
      
      res.status(200).json(user);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error:', error.message);
        res.status(400).json({ message: error.message || "Failed to process Google auth" });
      } else {
        console.error('Unknown error:', error);
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  // Update current user
  app.patch("/api/users/current", async (req, res) => {
    try {
      const user = await storage.updateUser(req.user.id, req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error:', error.message);
        res.status(400).json({ message: error.message || "Failed to update user" });
      } else {
        console.error('Unknown error:', error);
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  // Delete current user
  app.delete("/api/users/current", async (req, res) => {
    try {
      await storage.deleteUser(req.user.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // SOCIAL ACCOUNTS ROUTES
  // Get social accounts for current user
  router.get('/api/social-accounts', authMiddleware, async (req, res) => {
    try {
      const accounts = await socialService.getAccounts(req.user.uid);
      res.json(accounts);
    } catch (error) {
      console.error('Error fetching social accounts:', error);
      res.status(500).json({ error: 'Failed to fetch social accounts' });
    }
  });

  // Create social account
  router.post('/api/social-accounts', authMiddleware, async (req, res) => {
    try {
      const { platform, username } = req.body;
      if (!platform || !username) {
        return res.status(400).json({ error: 'Platform and username are required' });
      }

      const account = await socialService.connectAccount(req.user.uid, platform, username);
      res.status(201).json(account);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === 'Invalid platform') {
          res.status(400).json({ error: 'Invalid platform' });
        } else if (error.message === 'Account already connected') {
          res.status(409).json({ error: 'Account already connected' });
        } else {
          res.status(500).json({ error: 'Failed to connect social account' });
        }
      } else {
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  });

  // Update social account
  router.post('/api/social-accounts/:id/update', authMiddleware, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) {
        return res.status(400).json({ error: 'Invalid account ID' });
      }

      const account = await socialService.updateAccountStats(req.user.uid, accountId);
      res.json(account);
    } catch (error) {
      console.error('Error updating social account stats:', error);
      if (error instanceof Error && error.message === 'Account not found') {
        res.status(404).json({ error: 'Account not found' });
      } else {
        res.status(500).json({ error: 'Failed to update social account stats' });
      }
    }
  });

  // Delete social account
  router.delete('/api/social-accounts/:id', authMiddleware, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) {
        return res.status(400).json({ error: 'Invalid account ID' });
      }

      await socialService.deleteAccount(req.user.uid, accountId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting social account:', error);
      if (error instanceof Error && error.message === 'Account not found') {
        res.status(404).json({ error: 'Account not found' });
      } else {
        res.status(500).json({ error: 'Failed to delete social account' });
      }
    }
  });

  // PACKAGES ROUTES
  // Get all packages or by platform and type
  app.get("/api/packages", async (req, res) => {
    try {
      const { platform, type } = req.query;
      let packages;
      
      if (platform && type) {
        packages = await storage.getPackagesByPlatformAndType(platform as string, type as string);
      } else if (platform) {
        packages = await storage.getPackagesByPlatform(platform as string);
      } else {
        packages = await storage.getAllPackages();
      }
      
      res.json(packages);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Get package by ID
  app.get("/api/packages/:id", async (req, res) => {
    try {
      const pkg = await storage.getPackageById(parseInt(req.params.id));
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      res.json(pkg);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // SUBSCRIPTION PLANS ROUTES
  // Get all subscription plans
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // ORDERS ROUTES
  // Create a new order
  app.post("/api/orders", zValidate(insertOrderSchema), async (req, res) => {
    try {
      const order = await storage.createOrder({
        ...req.body,
        userId: req.user.id
      });
      
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create order" });
    }
  });

  // Get orders for current user
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrdersByUserId(req.user.id);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Get order by ID
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrderById(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      if (order.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Delete all orders for current user
  app.delete("/api/orders/user", async (req, res) => {
    try {
      await storage.deleteOrdersByUserId(req.user.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // STRIPE PAYMENT ROUTES
  // Create payment intent for one-time payment
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error creating payment intent" });
    }
  });

  // Create or get subscription
  app.post("/api/get-or-create-subscription", async (req, res) => {
    try {
      // Check if user already has a subscription
      const existingSubscription = await storage.getSubscriptionByUserId(req.user.id);
      
      if (existingSubscription && existingSubscription.stripeSubscriptionId) {
        // Get subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(existingSubscription.stripeSubscriptionId) as unknown as StripeSubscription;
        
        const currentPeriodStart = new Date(subscription.current_period_start * 1000);
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        
        res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
        
        return;
      }
      
      // Create new customer in Stripe
      let stripeCustomerId = req.user.stripeCustomerId;
      
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: req.user.email,
          name: req.user.displayName || req.user.username,
        });
        
        stripeCustomerId = customer.id;
        await storage.updateUser(req.user.id, { stripeCustomerId });
      }
      
      // Get subscription plan price ID
      const planId = req.body.planId || 1; // Default to first plan if not specified
      const plan = await storage.getSubscriptionPlanById(planId);
      
      if (!plan || !plan.stripePriceId) {
        return res.status(400).json({ message: "Invalid subscription plan" });
      }
      
      // Create subscription in Stripe
      const newSubscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: plan.stripePriceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      }) as unknown as StripeSubscription;
      
      // Store subscription in our database
      await storage.createSubscription({
        userId: req.user.id,
        planId,
        stripeSubscriptionId: newSubscription.id,
        currentPeriodStart: new Date(newSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(newSubscription.current_period_end * 1000),
      });
      
      res.json({
        subscriptionId: newSubscription.id,
        clientSecret: (newSubscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error handling subscription" });
    }
  });

  // Create checkout session
  app.post('/api/create-checkout-session', async (req, res): Promise<void> => {
    try {
      const { type, itemId } = req.body;

      // Fetch item details from your database
      let item;
      if (type === 'package') {
        item = await storage.getPackageById(parseInt(itemId));
      } else {
        item = await storage.getSubscriptionPlanById(parseInt(itemId));
      }

      if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      // Create Stripe checkout session
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: item.name || '',
                description: item.description || '',
              },
              unit_amount: item.price,
              recurring: type === 'plan' ? { interval: 'month' } : undefined,
            },
            quantity: 1,
          },
        ],
        mode: type === 'plan' ? 'subscription' : 'payment',
        success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
        cancel_url: `${process.env.FRONTEND_URL}/marketplace`,
        metadata: {
          type,
          itemId,
        },
      };

      const session = await stripe.checkout.sessions.create(sessionParams);
      res.json({ sessionId: session.id });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // Get AI suggestions for user
  app.get('/api/ai/suggestions', authMiddleware, async (req, res) => {
    try {
      const suggestions = await AIService.analyzeUserProfile(req.user.id);
      res.json(suggestions);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      res.status(500).json({ error: 'Failed to get AI suggestions' });
    }
  });

  // Analytics routes
  router.get('/api/analytics', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      const { startDate, endDate } = req.query;
      
      // Parse date range or use default (last 30 days)
      const end = endDate ? new Date(endDate as string) : new Date();
      const start = startDate ? new Date(startDate as string) : new Date();
      start.setDate(start.getDate() - 30);

      const accounts = await socialService.getAccounts(userId);
      
      // Calculate total metrics
      const totalFollowers = accounts.reduce((sum, acc) => sum + (acc.followerCount || 0), 0);
      const totalViews = accounts.reduce((sum, acc) => sum + (acc.viewCount || 0), 0);
      const totalLikes = accounts.reduce((sum, acc) => sum + (acc.likeCount || 0), 0);
      
      // Calculate growth rate based on date range
      const growthRate = await socialService.calculateGrowthRate(userId, start, end);
      
      // Calculate average engagement rate
      const engagementRate = accounts.length > 0
        ? accounts.reduce((sum, acc) => {
            const rate = ((acc.likeCount || 0) / (acc.followerCount || 1)) * 100;
            return sum + rate;
          }, 0) / accounts.length
        : 0;
      
      // Generate engagement history for the selected date range
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const engagementHistory = Array.from({ length: days }, (_, i) => {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        return {
          date: date.toISOString(),
          followers: Math.floor(totalFollowers * (1 + (Math.random() * 0.1 - 0.05))),
          views: Math.floor(totalViews * (1 + (Math.random() * 0.2 - 0.1))),
          likes: Math.floor(totalLikes * (1 + (Math.random() * 0.2 - 0.1))),
          comments: Math.floor(totalLikes * 0.1 * (1 + (Math.random() * 0.2 - 0.1))),
          shares: Math.floor(totalLikes * 0.05 * (1 + (Math.random() * 0.2 - 0.1))),
        };
      });

      // Calculate engagement distribution for pie chart
      const engagementDistribution = {
        views: totalViews,
        likes: totalLikes,
        comments: Math.floor(totalLikes * 0.1),
        shares: Math.floor(totalLikes * 0.05),
      };
      
      res.json({
        totalFollowers,
        totalViews,
        totalLikes,
        averageEngagementRate: engagementRate,
        growthRate,
        engagementHistory,
        engagementDistribution,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Scheduled Posts routes
  router.get('/api/scheduled-posts', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      const posts = await storage.getScheduledPosts(userId);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      res.status(500).json({ error: 'Failed to fetch scheduled posts' });
    }
  });

  router.post('/api/scheduled-posts', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      const { platform, content, scheduledDate, mediaUrls, linkUrl } = req.body;

      if (!platform || !content || !scheduledDate) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const post = await storage.createScheduledPost({
        userId,
        platform,
        content,
        scheduledDate,
        mediaUrls,
        linkUrl,
        status: 'scheduled' as const,
      });

      res.status(201).json(post);
    } catch (error) {
      console.error('Error creating scheduled post:', error);
      res.status(500).json({ error: 'Failed to create scheduled post' });
    }
  });

  router.delete('/api/scheduled-posts/:id', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      const postId = parseInt(req.params.id);

      if (isNaN(postId)) {
        return res.status(400).json({ error: 'Invalid post ID' });
      }

      const post = await storage.getScheduledPost(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (post.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await storage.deleteScheduledPost(postId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting scheduled post:', error);
      res.status(500).json({ error: 'Failed to delete scheduled post' });
    }
  });

  // Growth Campaigns routes
  router.get('/api/growth-campaigns', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      const campaigns = await storage.getGrowthCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching growth campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch growth campaigns' });
    }
  });

  router.post('/api/growth-campaigns', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      const { name, platform, targetAudience, budget, duration, startDate } = req.body;

      if (!name || !platform || !targetAudience || !budget || !duration || !startDate) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);

      const campaign = await storage.createGrowthCampaign({
        userId,
        name,
        platform,
        targetAudience,
        budget,
        duration,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "active" as const,
        currentProgress: 0,
        metrics: {
          followersGained: 0,
          engagementRate: 0,
          reach: 0,
          impressions: 0,
        },
      });

      res.status(201).json(campaign);
    } catch (error) {
      console.error('Error creating growth campaign:', error);
      res.status(500).json({ error: 'Failed to create growth campaign' });
    }
  });

  router.patch('/api/growth-campaigns/:id/status', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.uid;
      const campaignId = parseInt(req.params.id);
      const { status } = req.body;

      if (isNaN(campaignId)) {
        return res.status(400).json({ error: 'Invalid campaign ID' });
      }

      const campaign = await storage.getGrowthCampaign(campaignId);
      if (!campaign || campaign.userId !== userId) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const updatedCampaign = await storage.updateGrowthCampaign(campaignId, { status });
      res.json(updatedCampaign);
    } catch (error) {
      console.error('Error updating campaign status:', error);
      res.status(500).json({ error: 'Failed to update campaign status' });
    }
  });

  // Get scheduled content
  app.get('/api/scheduled-content', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { platform, month } = req.query;
      const content = await storage.getScheduledPost(userId, platform as string, month as string);
      res.json(content);
    } catch (error) {
      console.error("Error fetching scheduled content:", error);
      res.status(500).json({ error: "Failed to fetch scheduled content" });
    }
  });

  app.post("/api/scheduled-content", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { title, content, platform, scheduledDate, mediaUrls } = req.body;
      if (!title || !content || !platform || !scheduledDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const scheduledContent = await storage.createScheduledPost({
        userId,
        platform,
        content,
        scheduledDate,
        mediaUrls,
        status: "scheduled" as const,
      });

      res.status(201).json(scheduledContent);
    } catch (error) {
      console.error("Error creating scheduled content:", error);
      res.status(500).json({ error: "Failed to create scheduled content" });
    }
  });

  app.patch("/api/scheduled-content/:id", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const { title, content, platform, scheduledDate, status, mediaUrls } = req.body;

      const posts = await storage.getPosts(platform);
      const engagementData = await storage.getEngagementData(platform);
      
      const filteredPosts = posts.filter((post) => {
        const postDate = new Date(post.createdAt);
        return postDate >= new Date(scheduledDate as string) && postDate <= new Date(scheduledDate as string);
      });

      const updatedContent = await storage.updateScheduledPost(parseInt(id), {
        title,
        content,
        scheduledDate,
        status,
        mediaUrls
      });

      await storage.deleteScheduledPost(parseInt(id));

      const filteredAccounts = await storage.getSocialAccounts(userId).then(accounts => 
        accounts.filter(account => account.platform === platform)
      );

      res.json(updatedContent);
    } catch (error) {
      console.error("Error updating scheduled content:", error);
      res.status(500).json({ error: "Failed to update scheduled content" });
    }
  });

  app.delete("/api/scheduled-content/:id", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      await storage.deleteScheduledPost(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting scheduled content:", error);
      res.status(500).json({ error: "Failed to delete scheduled content" });
    }
  });

  // Get content analytics
  app.get('/api/content-analytics', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { platform, timeRange, compare } = req.query;
      const endDate = new Date();
      const startDate = new Date();
      
      // Set start date based on time range
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get posts and engagement data
      const posts = await storage.getPosts(userId);
      const engagementData = await storage.getEngagementData(userId);

      // Filter posts by date range
      const filteredPosts = posts.filter((post: {
        id: string;
        content: string;
        createdAt: string;
        likes: number;
        comments: number;
        reach: number;
        impressions: number;
      }) => {
        const postDate = new Date(post.createdAt);
        return postDate >= startDate && postDate <= endDate;
      });

      // Calculate analytics
      const totalPosts = filteredPosts.length;
      const totalEngagement = filteredPosts.reduce((sum, post) => sum + (post.likes + post.comments), 0);
      const averageEngagement = totalPosts > 0 ? (totalEngagement / totalPosts) : 0;
      const totalReach = filteredPosts.reduce((sum, post) => sum + post.reach, 0);

      // Calculate best posting times
      const hourlyEngagement = Array(24).fill(0).map((_, hour) => ({
        hour,
        engagement: 0
      }));

      filteredPosts.forEach(post => {
        const postHour = new Date(post.createdAt).getHours();
        hourlyEngagement[postHour].engagement += post.likes + post.comments;
      });

      // Calculate content type performance
      const contentTypePerformance = [
        { type: 'Image', count: 0, engagement: 0 },
        { type: 'Video', count: 0, engagement: 0 },
        { type: 'Text', count: 0, engagement: 0 }
      ];

      filteredPosts.forEach(post => {
        const typeIndex = post.type === 'image' ? 0 : post.type === 'video' ? 1 : 2;
        contentTypePerformance[typeIndex].count++;
        contentTypePerformance[typeIndex].engagement += post.likes + post.comments;
      });

      // Calculate hashtag performance
      const hashtagMap = new Map<string, { usageCount: number; engagement: number }>();
      filteredPosts.forEach(post => {
        const hashtags = post.content.match(/#\w+/g) || [];
        hashtags.forEach(hashtag => {
          const existing = hashtagMap.get(hashtag) || { usageCount: 0, engagement: 0 };
          hashtagMap.set(hashtag, {
            usageCount: existing.usageCount + 1,
            engagement: existing.engagement + post.likes + post.comments
          });
        });
      });

      const hashtagPerformance = Array.from(hashtagMap.entries())
        .map(([hashtag, data]) => ({
          hashtag,
          usageCount: data.usageCount,
          engagement: data.engagement / data.usageCount
        }))
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 10);

      // Calculate content themes (using AI service to analyze post content)
      const contentThemes = await AIService.analyzeContentThemes(filteredPosts);
      
      // Sample audience demographics (in a real app, this would come from platform APIs)
      const audienceDemographics = [
        { age: '13-17', percentage: 15 },
        { age: '18-24', percentage: 35 },
        { age: '25-34', percentage: 30 },
        { age: '35-44', percentage: 15 },
        { age: '45+', percentage: 5 }
      ];

      // Get top performing posts
      const topPerformingPosts = filteredPosts
        .map(post => ({
          id: post.id,
          content: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
          platform: post.platform,
          engagement: ((post.likes + post.comments) / post.reach) * 100,
          reach: post.reach,
          date: post.createdAt
        }))
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 5);

      // Calculate comparison data if requested
      let comparisonData;
      if (compare === 'true') {
        const previousStartDate = new Date(startDate);
        const previousEndDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        const previousPosts = posts.filter(post => {
          const postDate = new Date(post.createdAt);
          return postDate >= previousStartDate && postDate <= previousEndDate;
        });

        const previousTotalEngagement = previousPosts.reduce((sum, post) => sum + (post.likes + post.comments), 0);
        const previousTotalReach = previousPosts.reduce((sum, post) => sum + post.reach, 0);

        comparisonData = {
          currentPeriod: {
            posts: totalPosts,
            engagement: averageEngagement,
            reach: totalReach
          },
          previousPeriod: {
            posts: previousPosts.length,
            engagement: previousPosts.length > 0 ? (previousTotalEngagement / previousPosts.length) : 0,
            reach: previousTotalReach
          }
        };
      }

      res.json({
        totalPosts,
        averageEngagement,
        totalReach,
        bestPostingTimes: hourlyEngagement,
        contentTypePerformance,
        audienceDemographics,
        topPerformingPosts,
        hashtagPerformance,
        contentThemes,
        ...(comparisonData && { comparisonData })
      });
    } catch (error) {
      console.error('Error fetching content analytics:', error);
      res.status(500).json({ error: 'Failed to fetch content analytics' });
    }
  });

  // Get content templates
  app.get("/api/content-templates", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { platform } = req.query;
      const templates = await storage.getContentTemplates(userId, platform as string);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching content templates:", error);
      res.status(500).json({ error: "Failed to fetch content templates" });
    }
  });

  // Create content template
  app.post("/api/content-templates", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { name, platform, content, category, tags } = req.body;
      const template = await storage.createContentTemplate({
        userId,
        name,
        platform,
        content,
        category,
        tags,
        usageCount: 0,
        averageEngagement: 0,
      });

      res.json(template);
    } catch (error) {
      console.error("Error creating content template:", error);
      res.status(500).json({ error: "Failed to create content template" });
    }
  });

  // Update content template
  app.put("/api/content-templates/:id", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const templateId = parseInt(req.params.id);
      const { name, description, platform, content, category, tags } = req.body;

      const template = await storage.getContentTemplate(templateId);
      if (!template || template.userId !== userId) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const updatedTemplate = await storage.updateContentTemplate(templateId, {
        name,
        description,
        platform,
        content,
        category,
        tags,
      });

      res.json(updatedTemplate);
    } catch (error) {
      console.error('Error updating content template:', error);
      res.status(500).json({ error: 'Failed to update content template' });
    }
  });

  // Delete content template
  app.delete('/api/content-templates/:id', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const templateId = parseInt(req.params.id);

      const template = await storage.getContentTemplate(templateId);
      if (!template || template.userId !== userId) {
        return res.status(404).json({ error: 'Template not found' });
      }

      await storage.deleteContentTemplate(templateId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting content template:', error);
      res.status(500).json({ error: 'Failed to delete content template' });
    }
  });

  // Get social media interactions
  app.get('/api/social-inbox', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { platform } = req.query;
      
      // Get social accounts for the user
      const accounts = await storage.getSocialAccounts(userId);
      
      // Filter accounts by platform if specified
      const filteredAccounts = platform && platform !== 'all'
        ? accounts.filter(account => account.platform === platform)
        : accounts;

      // Get interactions for each account
      const interactions = await Promise.all(
        filteredAccounts.map(async (account) => {
          // Get messages
          const messages = await storage.getMessages(account.id);
          // Get comments
          const comments = await storage.getComments(account.id);
          // Get mentions
          const mentions = await storage.getMentions(account.id);

          return [
            ...messages.map(message => ({
              id: message.id,
              type: 'message' as const,
              platform: account.platform,
              sender: {
                name: message.senderName,
                username: message.senderUsername,
                avatar: message.senderAvatar,
              },
              content: message.content,
              timestamp: message.timestamp,
              status: message.status,
            })),
            ...comments.map(comment => ({
              id: comment.id,
              type: 'comment' as const,
              platform: account.platform,
              sender: {
                name: comment.authorName,
                username: comment.authorUsername,
                avatar: comment.authorAvatar,
              },
              content: comment.content,
              timestamp: comment.timestamp,
              status: comment.status,
              engagement: {
                likes: comment.likes,
                replies: comment.replies,
                shares: comment.shares,
              },
            })),
            ...mentions.map(mention => ({
              id: mention.id,
              type: 'mention' as const,
              platform: account.platform,
              sender: {
                name: mention.authorName,
                username: mention.authorUsername,
                avatar: mention.authorAvatar,
              },
              content: mention.content,
              timestamp: mention.timestamp,
              status: mention.status,
              engagement: {
                likes: mention.likes,
                replies: mention.replies,
                shares: mention.shares,
              },
            })),
          ];
        })
      );

      // Flatten and sort interactions by timestamp
      const allInteractions = interactions.flat().sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      res.json(allInteractions);
    } catch (error) {
      console.error('Error fetching social interactions:', error);
      res.status(500).json({ error: 'Failed to fetch social interactions' });
    }
  });

  // Get social media mentions
  app.get('/api/social-monitoring/mentions', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { platform } = req.query;
      
      // Get social accounts for the user
      const accounts = await storage.getSocialAccounts(userId);
      
      // Filter accounts by platform if specified
      const filteredAccounts = platform && platform !== 'all'
        ? accounts.filter(account => account.platform === platform)
        : accounts;

      // Get mentions for each account
      const mentions = await Promise.all(
        filteredAccounts.map(async (account) => {
          // Get mentions from storage
          const accountMentions = await storage.getMentions(account.id);
          
          // Analyze sentiment for each mention
          const analyzedMentions = await Promise.all(
            accountMentions.map(async (mention) => {
              const sentiment = await AIService.analyzeSentiment(mention.content);
              const keywords = await AIService.extractKeywords(mention.content);
              const hashtags = mention.content.match(/#\w+/g) || [];

              return {
                id: mention.id,
                platform: account.platform,
                content: mention.content,
                author: {
                  name: mention.authorName,
                  username: mention.authorUsername,
                  avatar: mention.authorAvatar,
                },
                timestamp: mention.timestamp,
                sentiment,
                engagement: {
                  likes: mention.likes,
                  comments: mention.replies,
                  shares: mention.shares,
                },
                hashtags,
                keywords,
              };
            })
          );

          return analyzedMentions;
        })
      );

      // Flatten and sort mentions by timestamp
      const allMentions = mentions.flat().sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      res.json(allMentions);
    } catch (error) {
      console.error('Error fetching social mentions:', error);
      res.status(500).json({ error: 'Failed to fetch social mentions' });
    }
  });

  // Get social media trends
  app.get('/api/social-monitoring/trends', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get all mentions for the user
      const accounts = await storage.getSocialAccounts(userId);
      const mentions = await Promise.all(
        accounts.map(account => storage.getMentions(account.id))
      );
      const allMentions = mentions.flat();

      // Extract keywords and count occurrences
      const keywordMap = new Map<string, { count: number; sentiment: { positive: number; negative: number; neutral: number } }>();
      
      for (const mention of allMentions) {
        const keywords = await AIService.extractKeywords(mention.content);
        const sentiment = await AIService.analyzeSentiment(mention.content);

        keywords.forEach(keyword => {
          const existing = keywordMap.get(keyword) || {
            count: 0,
            sentiment: { positive: 0, negative: 0, neutral: 0 }
          };
          
          existing.count++;
          existing.sentiment[sentiment]++;
          
          keywordMap.set(keyword, existing);
        });
      }

      // Calculate trends
      const trends = Array.from(keywordMap.entries()).map(([keyword, data]) => {
        const previousCount = data.count * 0.8; // Simulated previous period data
        const change = ((data.count - previousCount) / previousCount) * 100;

        return {
          keyword,
          count: data.count,
          change: Math.round(change * 10) / 10,
          sentiment: {
            positive: Math.round((data.sentiment.positive / data.count) * 100),
            negative: Math.round((data.sentiment.negative / data.count) * 100),
            neutral: Math.round((data.sentiment.neutral / data.count) * 100),
          },
        };
      });

      // Sort by count and limit to top 10
      const topTrends = trends
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      res.json(topTrends);
    } catch (error) {
      console.error('Error fetching social trends:', error);
      res.status(500).json({ error: 'Failed to fetch social trends' });
    }
  });

  // Save monitoring settings
  app.post('/api/social-monitoring/settings', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { keywords, hashtags, alertFrequency } = req.body;
      
      if (!keywords || !hashtags || !alertFrequency) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await storage.saveMonitoringSettings(userId, {
        keywords: keywords.split(',').map(k => k.trim()),
        hashtags: hashtags.split(',').map(h => h.trim()),
        alertFrequency,
      });

      res.json({ message: 'Monitoring settings saved successfully' });
    } catch (error) {
      console.error('Error saving monitoring settings:', error);
      res.status(500).json({ error: 'Failed to save monitoring settings' });
    }
  });

  // Analytics endpoint
  app.get("/api/analytics", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { platform, timeRange } = req.query;
      const accounts = await storage.getSocialAccounts(userId);
      
      // Filter accounts by platform if specified
      const filteredAccounts = platform && platform !== "all"
        ? accounts.filter(account => account.platform === platform)
        : accounts;

      // Calculate time range
      const now = new Date();
      let startDate = new Date();
      switch (timeRange) {
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(now.getDate() - 90);
          break;
        default: // 7d
          startDate.setDate(now.getDate() - 7);
      }

      // Aggregate stats across all accounts
      const totalFollowers = filteredAccounts.reduce((sum, account) => 
        sum + (account.stats?.followers || 0), 0);
      const totalFollowing = filteredAccounts.reduce((sum, account) => 
        sum + (account.stats?.following || 0), 0);
      const totalPosts = filteredAccounts.reduce((sum, account) => 
        sum + (account.stats?.posts || 0), 0);

      // Calculate engagement rate
      const totalEngagement = filteredAccounts.reduce((sum, account) => {
        const engagement = account.stats?.engagement || { likes: 0, comments: 0, shares: 0 };
        return sum + engagement.likes + engagement.comments + engagement.shares;
      }, 0);
      const engagementRate = totalPosts > 0 ? (totalEngagement / totalPosts) * 100 : 0;

      // Get growth data
      const growth = await Promise.all(
        filteredAccounts.map(async (account) => {
          const posts = await storage.getPosts(account.id);
          return posts
            .filter(post => new Date(post.createdAt) >= startDate)
            .map(post => ({
              date: post.createdAt,
              followers: post.engagement?.followers || 0,
              following: post.engagement?.following || 0,
            }));
        })
      ).then(results => results.flat());

      // Get engagement data
      const engagement = await Promise.all(
        filteredAccounts.map(async (account) => {
          const posts = await storage.getPosts(account.id);
          return posts
            .filter(post => new Date(post.createdAt) >= startDate)
            .map(post => ({
              date: post.createdAt,
              likes: post.engagement?.likes || 0,
              comments: post.engagement?.comments || 0,
              shares: post.engagement?.shares || 0,
            }));
        })
      ).then(results => results.flat());

      // Get top posts
      const topPosts = await Promise.all(
        filteredAccounts.map(async (account) => {
          const posts = await storage.getPosts(account.id);
          return posts
            .filter(post => new Date(post.createdAt) >= startDate)
            .map(post => ({
              id: post.id,
              content: post.content,
              likes: post.engagement?.likes || 0,
              comments: post.engagement?.comments || 0,
              shares: post.engagement?.shares || 0,
              reach: post.engagement?.reach || 0,
            }));
        })
      ).then(results => 
        results
          .flat()
          .sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares))
          .slice(0, 10)
      );

      res.json({
        followers: totalFollowers,
        following: totalFollowing,
        posts: totalPosts,
        engagementRate,
        growth,
        engagement,
        topPosts,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Create scheduled content
  app.post("/api/scheduled-content", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { platform, content, scheduledDate, mediaUrls } = req.body;
      const account = await storage.getSocialAccounts(userId).then(accounts => 
        accounts.find(acc => acc.platform === platform)
      );

      if (!account) {
        return res.status(400).json({ error: "No account found for the specified platform" });
      }

      const post = await storage.createPost({
        accountId: account.id,
        content,
        scheduledDate,
        mediaUrls,
        status: "draft" as const,
      });

      res.json(post);
    } catch (error) {
      console.error("Error creating scheduled content:", error);
      res.status(500).json({ error: "Failed to create scheduled content" });
    }
  });

  // Update scheduled content
  app.patch("/api/scheduled-content/:id", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const { scheduledDate } = req.body;

      const post = await storage.getPost(parseInt(id));
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const account = await storage.getSocialAccount(post.accountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const updatedPost = await storage.updatePost(parseInt(id), {
        scheduledDate,
      });

      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating scheduled content:", error);
      res.status(500).json({ error: "Failed to update scheduled content" });
    }
  });

  // Bulk update scheduled content
  app.patch("/api/scheduled-content/bulk-update", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { ids, status } = req.body;

      // Verify ownership of all posts
      const posts = await Promise.all(
        ids.map(async (id: string) => {
          const post = await storage.getPost(parseInt(id));
          if (!post) return null;

          const account = await storage.getSocialAccount(post.accountId);
          if (!account || account.userId !== userId) return null;

          return post;
        })
      );

      if (posts.some(post => post === null)) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Update all posts
      const updatedPosts = await Promise.all(
        ids.map((id: string) =>
          storage.updatePost(parseInt(id), { status })
        )
      );

      res.json(updatedPosts);
    } catch (error) {
      console.error("Error bulk updating scheduled content:", error);
      res.status(500).json({ error: "Failed to bulk update scheduled content" });
    }
  });

  // Enhanced analytics endpoint
  app.get("/api/analytics/enhanced", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { platform, timeRange } = req.query;
      const accounts = await storage.getSocialAccounts(userId);
      
      // Filter accounts by platform if specified
      const filteredAccounts = platform && platform !== "all"
        ? accounts.filter(account => account.platform === platform)
        : accounts;

      // Calculate date ranges
      const endDate = new Date();
      let startDate = new Date();
      switch (timeRange) {
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

      // Get metrics for each account
      const metrics = await Promise.all(
        filteredAccounts.map(async (account) => {
          const posts = await storage.getPosts(account.id);
          const filteredPosts = posts.filter(
            post => new Date(post.createdAt) >= startDate && new Date(post.createdAt) <= endDate
          );

          // Calculate metrics
          const followers = account.followers || 0;
          const engagement = filteredPosts.reduce((sum, post) => sum + (post.likes + post.replies + post.shares), 0);
          const reach = filteredPosts.reduce((sum, post) => sum + (post.reach || 0), 0);
          const impressions = filteredPosts.reduce((sum, post) => sum + (post.impressions || 0), 0);

          // Get audience demographics
          const demographics = await AIService.analyzeAudience(account.id);
          
          // Get top performing posts
          const topPosts = filteredPosts
            .sort((a, b) => (b.likes + b.replies + b.shares) - (a.likes + a.replies + a.shares))
            .slice(0, 5)
            .map(post => ({
              id: post.id,
              platform: account.platform,
              content: post.content,
              engagement: post.likes + post.replies + post.shares,
              reach: post.reach || 0,
            }));

          // Get performance over time
          const performance = [];
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            const datePosts = filteredPosts.filter(
              post => new Date(post.createdAt).toDateString() === currentDate.toDateString()
            );
            performance.push({
              date: currentDate.toISOString().split("T")[0],
              engagement: datePosts.reduce((sum, post) => sum + (post.likes + post.replies + post.shares), 0),
              reach: datePosts.reduce((sum, post) => sum + (post.reach || 0), 0),
            });
            currentDate.setDate(currentDate.getDate() + 1);
          }

          return {
            metrics: {
              followers,
              engagement: engagement / (filteredPosts.length || 1),
              reach,
              impressions,
            },
            growth: {
              followers: account.followersGrowth || 0,
              engagement: account.engagementGrowth || 0,
              reach: account.reachGrowth || 0,
            },
            audience: demographics,
            content: {
              topPosts,
              performance,
            },
          };
        })
      );

      // Aggregate metrics across all accounts
      const aggregatedMetrics = metrics.reduce(
        (acc, curr) => ({
          metrics: {
            followers: acc.metrics.followers + curr.metrics.followers,
            engagement: acc.metrics.engagement + curr.metrics.engagement,
            reach: acc.metrics.reach + curr.metrics.reach,
            impressions: acc.metrics.impressions + curr.metrics.impressions,
          },
          growth: {
            followers: acc.growth.followers + curr.growth.followers,
            engagement: acc.growth.engagement + curr.growth.engagement,
            reach: acc.growth.reach + curr.growth.reach,
          },
          audience: {
            demographics: {
              age: { ...acc.audience.demographics.age, ...curr.audience.demographics.age },
              gender: { ...acc.audience.demographics.gender, ...curr.audience.demographics.gender },
              location: { ...acc.audience.demographics.location, ...curr.audience.demographics.location },
            },
            interests: { ...acc.audience.interests, ...curr.audience.interests },
            devices: { ...acc.audience.devices, ...curr.audience.devices },
          },
          content: {
            topPosts: [...acc.content.topPosts, ...curr.content.topPosts]
              .sort((a, b) => b.engagement - a.engagement)
              .slice(0, 5),
            performance: acc.content.performance.map((item, index) => ({
              date: item.date,
              engagement: item.engagement + (curr.content.performance[index]?.engagement || 0),
              reach: item.reach + (curr.content.performance[index]?.reach || 0),
            })),
          },
        }),
        {
          metrics: { followers: 0, engagement: 0, reach: 0, impressions: 0 },
          growth: { followers: 0, engagement: 0, reach: 0 },
          audience: {
            demographics: { age: {}, gender: {}, location: {} },
            interests: {},
            devices: {},
          },
          content: {
            topPosts: [],
            performance: Array.from(
              { length: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) },
              (_, i) => {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                return {
                  date: date.toISOString().split("T")[0],
                  engagement: 0,
                  reach: 0,
                };
              }
            ),
          },
        }
      );

      // Normalize metrics
      const accountCount = metrics.length || 1;
      aggregatedMetrics.metrics.engagement /= accountCount;

      res.json(aggregatedMetrics);
    } catch (error) {
      console.error("Error fetching enhanced analytics:", error);
      res.status(500).json({ error: "Failed to fetch enhanced analytics" });
    }
  });

  // Analytics export endpoint
  app.get("/api/analytics/export", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { format, platform, timeRange } = req.query;
      const analytics = await storage.getEnhancedAnalytics(userId, platform as string, timeRange as string);

      let content = "";
      let contentType = "";
      let filename = "";

      if (format === "csv") {
        // Convert analytics to CSV
        content = convertToCSV(analytics);
        contentType = "text/csv";
        filename = `analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
      } else if (format === "json") {
        // Convert analytics to JSON
        content = JSON.stringify(analytics, null, 2);
        contentType = "application/json";
        filename = `analytics-${format(new Date(), "yyyy-MM-dd")}.json`;
      } else {
        return res.status(400).json({ error: "Unsupported export format" });
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error) {
      console.error("Error exporting analytics:", error);
      res.status(500).json({ error: "Failed to export analytics" });
    }
  });

  // Helper function to convert analytics data to CSV
  function convertToCSV(data: any): string {
    const rows = [];
    
    // Add metrics
    rows.push(["Metrics", "Value"]);
    Object.entries(data.metrics).forEach(([key, value]) => {
      rows.push([key, value]);
    });
    
    // Add growth
    rows.push([""]);
    rows.push(["Growth", "Value"]);
    Object.entries(data.growth).forEach(([key, value]) => {
      rows.push([key, value]);
    });
    
    // Add audience demographics
    rows.push([""]);
    rows.push(["Audience Demographics"]);
    Object.entries(data.audience.demographics).forEach(([category, values]) => {
      rows.push([category]);
      Object.entries(values as object).forEach(([key, value]) => {
        rows.push([key, value]);
      });
    });
    
    // Add content performance
    rows.push([""]);
    rows.push(["Content Performance"]);
    data.content.performance.forEach((item: any) => {
      rows.push([item.date, item.engagement, item.reach]);
    });
    
    return rows.map(row => row.join(",")).join("\n");
  }

  // Team Collaboration Routes
  app.get("/api/team/members", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const members = await storage.getTeamMembers(userId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.post("/api/team/invite", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { email, role } = req.body;
      if (!email || !role) {
        return res.status(400).json({ error: "Email and role are required" });
      }

      const member = await storage.inviteTeamMember(userId, email, role);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error inviting team member:", error);
      res.status(500).json({ error: "Failed to invite team member" });
    }
  });

  app.get("/api/team/review-tasks", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const tasks = await storage.getReviewTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching review tasks:", error);
      res.status(500).json({ error: "Failed to fetch review tasks" });
    }
  });

  app.patch("/api/team/review-tasks/:id/status", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const taskId = req.params.id;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const task = await storage.updateReviewTaskStatus(userId, taskId, status);
      res.json(task);
    } catch (error) {
      console.error("Error updating review task status:", error);
      res.status(500).json({ error: "Failed to update review task status" });
    }
  });

  // Campaign Management Routes
  app.get('/api/campaigns', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { status } = req.query;
      const campaigns = await storage.getCampaigns(userId, status as string);
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  });

  app.post('/api/campaigns', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, platform, objective, budget, startDate, endDate } = req.body;
      if (!name || !platform || !objective || !budget || !startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const campaign = await storage.createCampaign({
        userId,
        name,
        platform,
        objective,
        budget,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "active" as const,
        metrics: {
          reach: 0,
          engagement: 0,
          conversions: 0,
          spend: 0,
        },
        variants: [],
      });

      res.status(201).json(campaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  });

  app.patch('/api/campaigns/:id/status', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Missing status' });
      }

      const campaign = await storage.getCampaign(id);
      if (!campaign || campaign.userId !== userId) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const updatedCampaign = await storage.updateCampaignStatus(id, status);
      res.json(updatedCampaign);
    } catch (error) {
      console.error('Error updating campaign status:', error);
      res.status(500).json({ error: 'Failed to update campaign status' });
    }
  });

  app.post('/api/campaigns/:id/variants', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'Missing content' });
      }

      const campaign = await storage.getCampaign(id);
      if (!campaign || campaign.userId !== userId) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const variant = await storage.createCampaignVariant(id, {
        content,
        performance: {
          reach: 0,
          engagement: 0,
          conversions: 0,
        },
      });

      res.status(201).json(variant);
    } catch (error) {
      console.error('Error creating campaign variant:', error);
      res.status(500).json({ error: 'Failed to create campaign variant' });
    }
  });

  app.patch('/api/campaigns/:id/metrics', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { metrics } = req.body;
      if (!metrics) {
        return res.status(400).json({ error: 'Missing metrics' });
      }

      const campaign = await storage.getCampaign(id);
      if (!campaign || campaign.userId !== userId) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const updatedCampaign = await storage.updateCampaignMetrics(id, metrics);
      res.json(updatedCampaign);
    } catch (error) {
      console.error('Error updating campaign metrics:', error);
      res.status(500).json({ error: 'Failed to update campaign metrics' });
    }
  });

  // Create a new server instance
  const server = createServer(app);
  return server;
}

export default router;
