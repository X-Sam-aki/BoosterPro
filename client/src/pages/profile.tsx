import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { UserInfo } from "@/components/profile/user-info";
import { SocialAccounts } from "@/components/profile/social-accounts";
import { AccountSettings, defaultSettings } from "@/components/profile/account-settings";
import { OrderHistory } from "@/components/profile/order-history";
import { DangerZone } from "@/components/profile/danger-zone";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { User, SocialAccount, Order } from "@/lib/types";

export default function ProfilePage() {
  const [_, navigate] = useLocation();
  
  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/");
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  // Fetch user data
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/users/current'],
    enabled: !!auth.currentUser,
    // Mock data for now
    queryFn: async () => {
      return {
        id: 1,
        username: "alexjohnson",
        email: "alex@example.com",
        displayName: "Alex Johnson",
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=120&q=80",
        isPremium: true,
        createdAt: new Date().toISOString(),
        firebaseUid: "abc123"
      } as User;
    }
  });

  // Fetch social accounts
  const { data: socialAccounts = [] } = useQuery({
    queryKey: ['/api/social-accounts'],
    enabled: !!userData,
    // Mock data for now
    queryFn: async () => {
      return [
        {
          id: 1,
          userId: 1,
          platform: "tiktok",
          username: "alexcreates",
          followerCount: 5238,
          viewCount: 98700,
          likeCount: 12500,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 2,
          userId: 1,
          platform: "instagram",
          username: "alex.johnson",
          followerCount: 3254,
          viewCount: 45600,
          likeCount: 8900,
          lastUpdated: new Date().toISOString()
        }
      ] as SocialAccount[];
    }
  });

  // Fetch orders
  const { data: orders = [] } = useQuery({
    queryKey: ['/api/orders'],
    enabled: !!userData,
    // Mock data for now
    queryFn: async () => {
      return [
        {
          id: 38291,
          userId: 1,
          packageId: 2,
          targetUsername: "alexcreates",
          platform: "TikTok",
          quantity: 5000,
          price: 3999,
          status: "completed",
          deliverySpeed: "gradual",
          dripFeed: false,
          createdAt: "2023-05-15T12:00:00Z",
          updatedAt: "2023-05-17T12:00:00Z"
        },
        {
          id: 38214,
          userId: 1,
          packageId: 5,
          targetUsername: "alexcreates",
          platform: "TikTok",
          quantity: 10000,
          price: 1999,
          status: "processing",
          deliverySpeed: "express",
          dripFeed: true,
          createdAt: "2023-05-10T12:00:00Z",
          updatedAt: "2023-05-10T12:00:00Z"
        }
      ] as Order[];
    }
  });

  const handleEditAccount = (account: SocialAccount) => {
    // Would open a modal or navigate to edit page in a real app
    console.log("Edit account:", account);
  };

  const handleAddAccount = (platform: string) => {
    // Would open a modal or navigate to add page in a real app
    console.log("Add account for platform:", platform);
  };

  const handleViewAllOrders = () => {
    navigate("/orders");
  };

  if (isLoadingUser || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <ThemeToggle />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="p-4">
          <h1 className="text-xl font-bold">My Profile</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account</p>
        </div>
      </header>

      {/* Profile Content */}
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* User Info Card */}
        <UserInfo user={userData} />

        {/* Social Accounts */}
        <SocialAccounts 
          accounts={socialAccounts}
          onEditAccount={handleEditAccount}
          onAddAccount={handleAddAccount}
        />

        {/* Account Settings */}
        <AccountSettings settings={defaultSettings} />

        {/* Order History */}
        <OrderHistory 
          orders={orders}
          onViewAll={handleViewAllOrders}
        />

        {/* Danger Zone */}
        <DangerZone />
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
