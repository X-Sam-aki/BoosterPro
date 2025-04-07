import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DashboardStats, defaultStats } from "@/components/dashboard/dashboard-stats";
import { MonetizationProgress, defaultTikTokProgress } from "@/components/dashboard/monetization-progress";
import { AISuggestion, defaultSuggestion } from "@/components/dashboard/ai-suggestion";
import { RecentActivity, defaultActivities } from "@/components/dashboard/recent-activity";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { User } from "@/lib/types";

export default function DashboardPage() {
  const [_, navigate] = useLocation();
  const [user, setUser] = useState<User | null>(null);

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        navigate("/");
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  // Fetch user data
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/users/current'],
    enabled: !!auth.currentUser,
    queryFn: async ({ queryKey }) => {
      // This will use the default query function to fetch user data
      const response = await fetch(queryKey[0] as string, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json() as Promise<User>;
    },
  });

  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!user?.displayName) return "U";
    return user.displayName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <ThemeToggle />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <div className="text-primary-dark dark:text-primary mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">SocialBoost</h1>
          </div>
          <div className="cursor-pointer" onClick={() => navigate("/profile")}>
            <Avatar>
              <AvatarImage src={user?.avatarUrl || ""} alt={user?.displayName || "User"} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Hello, {user?.displayName?.split(' ')[0] || 'there'}! 👋</h2>
          <p className="text-gray-600 dark:text-gray-400">Let's boost your social presence today</p>
        </div>

        {/* Stats Overview */}
        <DashboardStats stats={defaultStats} />

        {/* Monetization Progress */}
        <MonetizationProgress 
          platformName="TikTok" 
          progressItems={defaultTikTokProgress} 
        />

        {/* AI Suggestion Card */}
        <AISuggestion
          title={defaultSuggestion.title}
          message={defaultSuggestion.message}
          actionText={defaultSuggestion.actionText}
          price={defaultSuggestion.price}
        />

        {/* Recent Activity */}
        <RecentActivity activities={defaultActivities} />
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
