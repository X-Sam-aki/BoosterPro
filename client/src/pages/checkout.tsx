import { useEffect, useState } from 'react';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useLocation } from 'wouter';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ServicePackage } from '@/lib/types';
import { defaultPackages } from '@/components/marketplace/service-package';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_placeholder");

const CheckoutForm = ({ amount, orderDetails }: { amount: number, orderDetails: any }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [_, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/dashboard",
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Thank you for your purchase!",
      });
      
      // We don't need to navigate here as the return_url will handle that
    }
    
    setIsProcessing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Order Summary</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
              {orderDetails.packageName && (
                <div className="flex justify-between py-1">
                  <span>{orderDetails.packageName}</span>
                  <span>${(orderDetails.packagePrice / 100).toFixed(2)}</span>
                </div>
              )}
              
              {orderDetails.deliverySpeed === "express" && (
                <div className="flex justify-between py-1 text-sm text-gray-600 dark:text-gray-400">
                  <span>Express Delivery</span>
                  <span>+$9.99</span>
                </div>
              )}
              
              {orderDetails.dripFeed && (
                <div className="flex justify-between py-1 text-sm text-gray-600 dark:text-gray-400">
                  <span>Drip Feed Option</span>
                  <span>+$4.99</span>
                </div>
              )}
              
              <div className="flex justify-between py-1 border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 font-bold">
                <span>Total</span>
                <span>${(amount / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Payment Information</h3>
            <PaymentElement />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => navigate("/order")}>
            Back
          </Button>
          <Button type="submit" disabled={!stripe || isProcessing}>
            {isProcessing ? "Processing..." : `Pay $${(amount / 100).toFixed(2)}`}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default function Checkout() {
  const [location, navigate] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(0);
  const [orderDetails, setOrderDetails] = useState<any>({});
  const { toast } = useToast();
  
  // Parse query parameters
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const packageId = searchParams.get('packageId');
  const planId = searchParams.get('planId');
  const username = searchParams.get('username');
  const deliverySpeed = searchParams.get('deliverySpeed');
  const dripFeed = searchParams.get('dripFeed') === 'true';
  
  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/");
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!packageId && !planId) {
      toast({
        variant: "destructive",
        title: "Invalid Order",
        description: "No package or plan selected"
      });
      navigate("/marketplace");
      return;
    }
    
    // For one-time payments (packages)
    if (packageId) {
      // Find the package (in a real app, we would fetch this from an API)
      const selectedPackage = defaultPackages.find(p => p.id === Number(packageId));
      
      if (!selectedPackage) {
        toast({
          variant: "destructive",
          title: "Invalid Package",
          description: "The selected package does not exist"
        });
        navigate("/marketplace");
        return;
      }
      
      // Calculate total amount
      let totalAmount = selectedPackage.price;
      if (deliverySpeed === "express") totalAmount += 999; // $9.99
      if (dripFeed) totalAmount += 499; // $4.99
      
      setAmount(totalAmount);
      setOrderDetails({
        packageName: selectedPackage.name,
        packagePrice: selectedPackage.price,
        deliverySpeed,
        dripFeed,
        username
      });
      
      // Create PaymentIntent
      apiRequest("POST", "/api/create-payment-intent", { amount: totalAmount })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch(err => {
          toast({
            variant: "destructive",
            title: "Payment Error",
            description: err.message || "Could not initialize payment"
          });
        });
    }
    
    // For subscriptions (we would handle this differently in a real app)
    if (planId) {
      // Mock subscription flow for now
      setAmount(4999); // $49.99 for the default plan
      setOrderDetails({
        packageName: "Auto-Growth Pro Plan (Monthly)",
        packagePrice: 4999
      });
      
      // We would use /api/get-or-create-subscription in a real app
      apiRequest("POST", "/api/create-payment-intent", { amount: 4999 })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch(err => {
          toast({
            variant: "destructive",
            title: "Subscription Error",
            description: err.message || "Could not initialize subscription"
          });
        });
    }
  }, [packageId, planId, deliverySpeed, dripFeed, username, navigate, toast]);

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <ThemeToggle />
      <div className="max-w-md mx-auto mt-12">
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm amount={amount} orderDetails={orderDetails} />
        </Elements>
      </div>
    </div>
  );
}
