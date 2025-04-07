import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface AISuggestionProps {
  title: string;
  message: string;
  actionText: string;
  price: string;
}

export function AISuggestion({ title, message, actionText, price }: AISuggestionProps) {
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const handleSuggestionClick = () => {
    navigate("/marketplace");
    toast({
      title: "Adding package to cart",
      description: `${actionText} for ${price}`
    });
  };

  return (
    <Card className="bg-gradient-to-r from-primary/90 to-accent/90 text-white shadow-sm mb-6">
      <CardContent className="p-5">
        <div className="flex items-start">
          <div className="mr-4 text-xl">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <rect width="18" height="10" x="3" y="11" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" x2="8" y1="16" y2="16" />
              <line x1="16" x2="16" y1="16" y2="16" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm opacity-90 mb-3">{message}</p>
            <Button 
              onClick={handleSuggestionClick}
              className="bg-white text-primary hover:bg-gray-100"
            >
              {actionText} for {price}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Default suggestion
export const defaultSuggestion = {
  title: "AI Recommendation",
  message: "You're just 1.3K views away from reaching monetization eligibility! A small boost now could help you start earning this week.",
  actionText: "Get 2K Views",
  price: "$5.99"
};
