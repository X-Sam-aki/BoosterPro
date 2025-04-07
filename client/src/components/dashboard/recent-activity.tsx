import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Check, Clock, CreditCard } from "lucide-react";

interface ActivityItem {
  icon: "check" | "clock" | "credit-card" | string;
  iconColor: string;
  iconBgColor: string;
  title: string;
  subtitle: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getIcon = (icon: string) => {
    switch (icon) {
      case "check":
        return <Check className="h-4 w-4" />;
      case "clock":
        return <Clock className="h-4 w-4" />;
      case "credit-card":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  return (
    <Card className="shadow-sm mb-6">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 p-5">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {activities.map((activity, index) => (
            <div key={index} className="p-4 flex items-center">
              <div className={`${activity.iconBgColor} ${activity.iconColor} p-2 rounded-full mr-3`}>
                {getIcon(activity.icon)}
              </div>
              <div>
                <p className="font-medium">{activity.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{activity.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Default activities
export const defaultActivities: ActivityItem[] = [
  {
    icon: "check",
    iconColor: "text-success",
    iconBgColor: "bg-green-100 dark:bg-green-900/30",
    title: "1K Followers Delivered",
    subtitle: "TikTok • 2 hours ago"
  },
  {
    icon: "clock",
    iconColor: "text-primary",
    iconBgColor: "bg-blue-100 dark:bg-blue-900/30",
    title: "5K Views In Progress",
    subtitle: "Instagram • 1 day ago"
  },
  {
    icon: "credit-card",
    iconColor: "text-accent",
    iconBgColor: "bg-purple-100 dark:bg-purple-900/30",
    title: "Payment Successful",
    subtitle: "$9.99 • 2 days ago"
  }
];
