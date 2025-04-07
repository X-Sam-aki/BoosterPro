import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ServicePackage } from "@/lib/types";

interface ServicePackageCardProps {
  packageData: ServicePackage;
  onAddToCart: (pkg: ServicePackage) => void;
}

export function ServicePackageCard({ packageData, onAddToCart }: ServicePackageCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const { 
    id,
    name, 
    price, 
    bestValue, 
    rating, 
    orders, 
    features,
    deliveryTime
  } = packageData;

  const handleAddToCart = () => {
    setIsAdding(true);
    
    // Simulate API call
    setTimeout(() => {
      onAddToCart(packageData);
      
      toast({
        title: "Added to cart",
        description: `${name} has been added to your cart`
      });
      
      setIsAdding(false);
      navigate("/order");
    }, 500);
  };

  return (
    <Card className="shadow-sm overflow-hidden relative">
      {bestValue && (
        <Badge className="absolute top-0 right-0 bg-secondary text-white text-xs font-bold px-3 py-1 uppercase rounded-none">
          Best Value
        </Badge>
      )}
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">{name}</h3>
            <div className="flex items-center mt-1">
              <span className="text-yellow-500 mr-1">
                <Star className="h-4 w-4 fill-current" />
              </span>
              <span className="text-sm font-medium">{rating}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                ({orders} orders)
              </span>
            </div>
          </div>
          <div className="text-2xl font-bold text-primary">${(price / 100).toFixed(2)}</div>
        </div>
        
        <div className="space-y-2 mb-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center text-sm">
              <Check className="h-4 w-4 text-success mr-2" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
        
        <Button
          className="w-full"
          onClick={handleAddToCart}
          disabled={isAdding}
        >
          {isAdding ? "Adding..." : "Add to Cart"}
        </Button>
      </CardContent>
    </Card>
  );
}

// Default packages
export const defaultPackages: ServicePackage[] = [
  {
    id: 1,
    name: "1,000 Followers",
    price: 999, // $9.99
    bestValue: false,
    rating: 4.8,
    orders: 240,
    features: [
      "High-quality followers",
      "Gradual delivery (1-2 days)",
      "30-day refill guarantee"
    ],
    platform: "tiktok",
    type: "followers",
    quantity: 1000,
    deliveryTime: "1-2 days"
  },
  {
    id: 2,
    name: "5,000 Followers",
    price: 3999, // $39.99
    bestValue: false,
    rating: 4.9,
    orders: 412,
    features: [
      "High-quality followers",
      "Gradual delivery (2-3 days)",
      "30-day refill guarantee",
      "Save 20% vs. smaller package"
    ],
    platform: "tiktok",
    type: "followers",
    quantity: 5000,
    deliveryTime: "2-3 days"
  },
  {
    id: 3,
    name: "10,000 Followers",
    price: 6999, // $69.99
    bestValue: true,
    rating: 4.7,
    orders: 187,
    features: [
      "Premium-quality followers",
      "Gradual delivery (3-5 days)",
      "60-day refill guarantee",
      "Save 30% vs. smaller packages"
    ],
    platform: "tiktok",
    type: "followers",
    quantity: 10000,
    deliveryTime: "3-5 days"
  },
  {
    id: 4,
    name: "50,000 Followers",
    price: 24999, // $249.99
    bestValue: false,
    rating: 4.6,
    orders: 53,
    features: [
      "VIP-quality followers",
      "Steady delivery (7-10 days)",
      "90-day refill guarantee",
      "Save 50% vs. smaller packages",
      "Free profile consultation"
    ],
    platform: "tiktok",
    type: "followers",
    quantity: 50000,
    deliveryTime: "7-10 days"
  }
];
