import { ArrowDown, ArrowUp, Eye, Heart, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsItem {
  title: string;
  value: string;
  change: number; // positive for increase, negative for decrease
  icon: React.ReactNode;
  iconColor: string;
}

interface DashboardStatsProps {
  stats: StatsItem[];
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-sm">
          <CardContent className="p-4">
            <div className={`text-${stat.iconColor} dark:text-${stat.iconColor} mb-1`}>
              {stat.icon}
            </div>
            <h3 className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</h3>
            <p className="text-xl font-bold">{stat.value}</p>
            <div className={`text-xs flex items-center mt-1 ${
              stat.change > 0 ? 'text-success' : 'text-error'
            }`}>
              {stat.change > 0 ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              <span>{Math.abs(stat.change)}% this week</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Default stats for initial rendering
export const defaultStats: StatsItem[] = [
  {
    title: "Followers",
    value: "5,238",
    change: 12,
    icon: <Users className="h-5 w-5" />,
    iconColor: "primary"
  },
  {
    title: "Views",
    value: "98.7K",
    change: 28,
    icon: <Eye className="h-5 w-5" />,
    iconColor: "accent"
  },
  {
    title: "Engagement",
    value: "4.3%",
    change: -2,
    icon: <Heart className="h-5 w-5" />,
    iconColor: "secondary"
  }
];
