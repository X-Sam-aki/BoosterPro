// User types
export interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  isPremium: boolean;
  createdAt: string;
  firebaseUid: string;
  stripeCustomerId?: string;
}

// Social Account types
export interface SocialAccount {
  id: number;
  userId: number;
  platform: string;
  username: string;
  followerCount: number;
  viewCount: number;
  likeCount: number;
  lastUpdated: string;
}

// Service Package types
export interface ServicePackage {
  id: number;
  name: string;
  price: number; // in cents
  bestValue?: boolean;
  rating?: number;
  orders?: number;
  platform: string;
  type: string;
  quantity: number;
  deliveryTime: string;
  features: string[];
  description?: string;
}

// Order types
export interface Order {
  id: number;
  userId: number;
  packageId: number;
  targetUsername: string;
  platform: string;
  quantity: number;
  price: number; // in cents
  status: string;
  deliverySpeed: string;
  dripFeed: boolean;
  stripePaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

// Subscription Plan types
export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number; // in cents
  dailyFollowers: number;
  dailyViews: number;
  autoReplenish: boolean;
  stripePriceId: string;
  features: string[];
}

// Subscription types
export interface Subscription {
  id: number;
  userId: number;
  planId: number;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

// Cart types
export interface CartItem {
  packageId: number;
  quantity: number;
  platform: string;
  type: string;
  price: number;
}

// Order Form types
export interface OrderFormData {
  username: string;
  email: string;
  deliverySpeed: "gradual" | "express";
  dripFeed: boolean;
}
