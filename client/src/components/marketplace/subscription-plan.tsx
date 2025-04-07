import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { SubscriptionPlan } from "@/lib/types";

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  onSubscribe: (plan: SubscriptionPlan) => void;
}

export function SubscriptionPlanCard({ plan, onSubscribe }: SubscriptionPlanCardProps) {
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const handleSubscribe = () => {
    onSubscribe(plan);
    navigate("/checkout?type=subscription");
    toast({
      title: "Subscription Selected",
      description: `You've selected the ${plan.name} subscription.`
    });
  };

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 shadow-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{plan.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4">{plan.description}</p>
            <div className="space-y-2 mb-4">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-success mr-2" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">${(plan.price / 100).toFixed(2)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">per month</div>
            <Button 
              onClick={handleSubscribe} 
              className="mt-4"
            >
              Subscribe
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Default subscription plan
export const defaultSubscriptionPlan: SubscriptionPlan = {
  id: 1,
  name: "Auto-Growth Pro Plan",
  description: "Steady daily growth, no effort required",
  price: 4999, // $49.99
  features: [
    "+100 followers daily",
    "+500 video views daily",
    "Auto-replenish if numbers drop",
    "Cancel anytime"
  ],
  dailyFollowers: 100,
  dailyViews: 500,
  autoReplenish: true,
  stripePriceId: "price_1234567890"
};
