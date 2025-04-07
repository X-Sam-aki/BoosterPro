import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface ProgressItem {
  label: string;
  current: number;
  target: number;
  color: string;
}

interface MonetizationProgressProps {
  platformName: string;
  progressItems: ProgressItem[];
}

export function MonetizationProgress({ platformName, progressItems }: MonetizationProgressProps) {
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const handleBoostClick = () => {
    navigate("/marketplace");
    toast({
      title: "Taking you to our marketplace",
      description: "Find the perfect growth package for your needs"
    });
  };

  return (
    <Card className="shadow-sm mb-6">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{platformName} Monetization Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {progressItems.map((item, index) => {
          const percentage = Math.min(Math.round((item.current / item.target) * 100), 100);
          
          return (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.label}</span>
                <span className="font-medium">
                  {item.current.toLocaleString()} / {item.target.toLocaleString()}
                </span>
              </div>
              <Progress value={percentage} className={`h-2.5 ${item.color}`} />
            </div>
          );
        })}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleBoostClick} 
          className="w-full"
        >
          Boost to Reach Goals Faster
        </Button>
      </CardFooter>
    </Card>
  );
}

// Default progress items
export const defaultTikTokProgress: ProgressItem[] = [
  {
    label: "Followers",
    current: 5238,
    target: 10000,
    color: "bg-primary"
  },
  {
    label: "Video Views",
    current: 98700,
    target: 100000,
    color: "bg-accent"
  }
];
