import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { OrderTimeline, defaultOrderSteps } from "@/components/orders/order-timeline";
import { OrderForm } from "@/components/orders/order-form";
import { OrderSummary } from "@/components/orders/order-summary";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { apiRequest } from "@/lib/queryClient";
import { ServicePackage } from "@/lib/types";
import { defaultPackages } from "@/components/marketplace/service-package";

export default function OrderPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<"select" | "details" | "payment" | "confirm">("details");
  
  // Extract packageId from URL query parameters
  const packageId = new URLSearchParams(location.split("?")[1]).get("packageId");
  
  // Form state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    deliverySpeed: "gradual" as "gradual" | "express",
    dripFeed: false
  });

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/");
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  // Fetch package data
  const { data: packageData, isLoading: isLoadingPackage } = useQuery({
    queryKey: ['/api/packages', packageId],
    enabled: !!packageId,
    // Mock data for now
    queryFn: async () => {
      // In a real app, we would fetch from the API
      return defaultPackages.find(pkg => pkg.id === Number(packageId)) || defaultPackages[0];
    }
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: () => {
      toast({
        title: "Order Created",
        description: "Your order has been placed successfully."
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create order."
      });
    }
  });

  const handleFormSubmit = (data: any) => {
    setFormData(data);
    // Move to payment step
    setCurrentStep("payment");
    // Navigate to checkout page with package and form data
    navigate(`/checkout?packageId=${packageId}&username=${data.username}&deliverySpeed=${data.deliverySpeed}&dripFeed=${data.dripFeed}`);
  };

  const handleBack = () => {
    if (currentStep === "details") {
      navigate("/marketplace");
    } else if (currentStep === "payment") {
      setCurrentStep("details");
    }
  };

  const handleContinue = () => {
    if (currentStep === "details") {
      // This would be handled by the form submission
    } else if (currentStep === "payment") {
      if (!packageData) return;
      
      // Create the order object
      const orderData = {
        packageId: packageData.id,
        platform: packageData.platform,
        targetUsername: formData.username,
        quantity: packageData.quantity,
        price: packageData.price + (formData.deliverySpeed === "express" ? 999 : 0) + (formData.dripFeed ? 499 : 0),
        deliverySpeed: formData.deliverySpeed,
        dripFeed: formData.dripFeed
      };
      
      createOrderMutation.mutate(orderData);
    }
  };

  if (isLoadingPackage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Package Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The package you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/marketplace")}>Back to Marketplace</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <ThemeToggle />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="p-4">
          <h1 className="text-xl font-bold">Complete Your Order</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {packageData.platform.charAt(0).toUpperCase() + packageData.platform.slice(1)} {packageData.type.charAt(0).toUpperCase() + packageData.type.slice(1)} Package
          </p>
        </div>
      </header>

      {/* Order Process Timeline */}
      <div className="container mx-auto px-4 py-6 max-w-3xl relative">
        <OrderTimeline 
          currentStep={currentStep}
          steps={defaultOrderSteps}
        />

        {/* Order Form */}
        <OrderForm 
          selectedPackage={packageData}
          onFormSubmit={handleFormSubmit}
        />

        {/* Package Summary */}
        <OrderSummary 
          packageData={packageData}
          formData={formData}
        />

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            className="flex-1"
            onClick={handleContinue}
            disabled={currentStep === "details"}
          >
            Continue to Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
