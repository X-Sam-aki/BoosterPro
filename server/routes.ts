import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { z } from "zod";
import { insertUserSchema, insertOrderSchema, insertSocialAccountSchema } from "@shared/schema";
import { zValidate } from "./middleware/zod-validator";

// Initialize Stripe with API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // USERS ROUTES
  // Create a new user
  app.post("/api/users", zValidate(insertUserSchema), async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create user" });
    }
  });

  // Get current user
  app.get("/api/users/current", async (req, res) => {
    try {
      // In a real app, this would use req.user from auth middleware
      // For now, we'll return a mock user or error
      const user = await storage.getUserByFirebaseId(req.headers.authorization || "");
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
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
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to process Google auth" });
    }
  });

  // Update user
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(parseInt(req.params.id), req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update user" });
    }
  });

  // Delete current user
  app.delete("/api/users/current", async (req, res) => {
    try {
      // In a real app, we would get the user ID from authentication
      // For now, we'll use the auth header as the Firebase UID
      const user = await storage.getUserByFirebaseId(req.headers.authorization || "");
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      await storage.deleteUser(user.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // SOCIAL ACCOUNTS ROUTES
  // Get social accounts for current user
  app.get("/api/social-accounts", async (req, res) => {
    try {
      // In a real app, this would use req.user from auth middleware
      const user = await storage.getUserByFirebaseId(req.headers.authorization || "");
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const accounts = await storage.getSocialAccountsByUserId(user.id);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Create social account
  app.post("/api/social-accounts", zValidate(insertSocialAccountSchema), async (req, res) => {
    try {
      const account = await storage.createSocialAccount(req.body);
      res.status(201).json(account);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create social account" });
    }
  });

  // Update social account
  app.patch("/api/social-accounts/:id", async (req, res) => {
    try {
      const account = await storage.updateSocialAccount(parseInt(req.params.id), req.body);
      if (!account) {
        return res.status(404).json({ message: "Social account not found" });
      }
      res.json(account);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update social account" });
    }
  });

  // Delete social account
  app.delete("/api/social-accounts/:id", async (req, res) => {
    try {
      await storage.deleteSocialAccount(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
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
      // In a real app, we would get the user ID from authentication
      const user = await storage.getUserByFirebaseId(req.headers.authorization || "");
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const order = await storage.createOrder({
        ...req.body,
        userId: user.id
      });
      
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create order" });
    }
  });

  // Get orders for current user
  app.get("/api/orders", async (req, res) => {
    try {
      // In a real app, this would use req.user from auth middleware
      const user = await storage.getUserByFirebaseId(req.headers.authorization || "");
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const orders = await storage.getOrdersByUserId(user.id);
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
      
      // Check if order belongs to current user
      const user = await storage.getUserByFirebaseId(req.headers.authorization || "");
      if (!user || order.userId !== user.id) {
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
      // In a real app, this would use req.user from auth middleware
      const user = await storage.getUserByFirebaseId(req.headers.authorization || "");
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      await storage.deleteOrdersByUserId(user.id);
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
      // In a real app, this would use req.user from auth middleware
      const user = await storage.getUserByFirebaseId(req.headers.authorization || "");
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user already has a subscription
      const existingSubscription = await storage.getSubscriptionByUserId(user.id);
      
      if (existingSubscription && existingSubscription.stripeSubscriptionId) {
        // Get subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(existingSubscription.stripeSubscriptionId);
        
        res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
        
        return;
      }
      
      // Create new customer in Stripe
      let stripeCustomerId = user.stripeCustomerId;
      
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.displayName || user.username,
        });
        
        stripeCustomerId = customer.id;
        await storage.updateUser(user.id, { stripeCustomerId });
      }
      
      // Get subscription plan price ID
      const planId = req.body.planId || 1; // Default to first plan if not specified
      const plan = await storage.getSubscriptionPlanById(planId);
      
      if (!plan || !plan.stripePriceId) {
        return res.status(400).json({ message: "Invalid subscription plan" });
      }
      
      // Create subscription in Stripe
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{
          price: plan.stripePriceId,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Store subscription in our database
      await storage.createSubscription({
        userId: user.id,
        planId,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      });
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error handling subscription" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
