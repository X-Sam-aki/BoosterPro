import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ServiceCategory, defaultCategories, ServiceCategoryType } from "@/components/marketplace/service-category";
import { ServicePackageCard, defaultPackages } from "@/components/marketplace/service-package";
import { SubscriptionPlanCard, defaultSubscriptionPlan } from "@/components/marketplace/subscription-plan";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ServicePackage, SubscriptionPlan } from "@/lib/types";

export default function MarketplacePage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [platform, setPlatform] = useState<string>("tiktok");
  const [category, setCategory] = useState<ServiceCategoryType>("followers");
  
  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/");
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  // Fetch packages (we'll use the mock data for now)
  const { data: packages = defaultPackages } = useQuery({
    queryKey: ['/api/packages', platform, category],
    enabled: false, // Disable for now as we're using mock data
  });

  // Fetch subscription plans (we'll use the mock data for now)
  const { data: subscriptionPlans = [defaultSubscriptionPlan] } = useQuery({
    queryKey: ['/api/subscription-plans', platform],
    enabled: false, // Disable for now as we're using mock data
  });

  const handleAddToCart = (pkg: ServicePackage) => {
    // In a real app, we would add this to a cart context or make an API call
    // For now, we'll just navigate to the order page
    navigate(`/order?packageId=${pkg.id}`);
  };

  const handleSubscribe = (plan: SubscriptionPlan) => {
    // In a real app, we would start the subscription process
    // For now, we'll just navigate to the checkout page
    navigate(`/checkout?planId=${plan.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <ThemeToggle />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="p-4">
          <h1 className="text-xl font-bold">Service Marketplace</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Boost your social media presence</p>
        </div>

        {/* Platform Tabs */}
        <Tabs defaultValue="tiktok" value={platform} onValueChange={setPlatform}>
          <TabsList className="flex overflow-x-auto pb-1 px-4 border-b border-gray-200 dark:border-gray-700 bg-transparent">
            <TabsTrigger 
              value="tiktok" 
              className="flex items-center px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary font-medium whitespace-nowrap"
            >
              <i className="fab fa-tiktok mr-2"></i>
              TikTok
            </TabsTrigger>
            <TabsTrigger 
              value="instagram" 
              className="flex items-center px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary font-medium whitespace-nowrap ml-4"
            >
              <i className="fab fa-instagram mr-2"></i>
              Instagram
            </TabsTrigger>
            <TabsTrigger 
              value="facebook" 
              className="flex items-center px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary font-medium whitespace-nowrap ml-4"
            >
              <i className="fab fa-facebook mr-2"></i>
              Facebook
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Marketplace Content */}
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Service Category Tabs */}
        <ServiceCategory 
          categories={defaultCategories}
          selectedCategory={category}
          onSelectCategory={setCategory}
        />

        {/* Service Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {packages
            .filter(pkg => pkg.platform === platform && pkg.type === category)
            .map((pkg) => (
              <ServicePackageCard 
                key={pkg.id}
                packageData={pkg}
                onAddToCart={handleAddToCart}
              />
            ))}
        </div>

        {/* Subscription Plans */}
        <h2 className="text-xl font-bold mb-4">Monthly Growth Plans</h2>
        <div className="grid grid-cols-1 gap-4 mb-6">
          {subscriptionPlans.map((plan) => (
            <SubscriptionPlanCard 
              key={plan.id}
              plan={plan}
              onSubscribe={handleSubscribe}
            />
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
