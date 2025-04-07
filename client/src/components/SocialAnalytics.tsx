import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { LineChart, BarChart, PieChart } from "@/components/ui/charts";
import { formatNumber, formatDate } from "@/lib/utils";

interface AnalyticsData {
  followers: number;
  following: number;
  posts: number;
  engagementRate: number;
  growth: {
    date: string;
    followers: number;
    following: number;
  }[];
  engagement: {
    date: string;
    likes: number;
    comments: number;
    shares: number;
  }[];
  topPosts: {
    id: string;
    content: string;
    likes: number;
    comments: number;
    shares: number;
    reach: number;
  }[];
}

export function SocialAnalytics() {
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [timeRange, setTimeRange] = useState("7d");

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["analytics", selectedPlatform, timeRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/analytics?platform=${selectedPlatform}&timeRange=${timeRange}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  if (!analytics) {
    return <div>No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Social Media Analytics</h2>
        <div className="flex gap-4">
          <Select
            value={selectedPlatform}
            onValueChange={setSelectedPlatform}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.followers)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.growth.length > 1
                ? `+${formatNumber(
                    analytics.growth[analytics.growth.length - 1].followers -
                      analytics.growth[0].followers
                  )} from last period`
                : "No growth data"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Following</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.following)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.growth.length > 1
                ? `+${formatNumber(
                    analytics.growth[analytics.growth.length - 1].following -
                      analytics.growth[0].following
                  )} from last period`
                : "No growth data"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.posts)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.engagement.length > 1
                ? `${formatNumber(
                    analytics.engagement.reduce((acc, curr) => acc + curr.likes, 0) /
                      analytics.engagement.length
                  )} avg likes per post`
                : "No engagement data"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.engagementRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.engagement.length > 1
                ? `${formatNumber(
                    analytics.engagement.reduce(
                      (acc, curr) => acc + curr.likes + curr.comments + curr.shares,
                      0
                    ) / analytics.engagement.length
                  )} avg engagement per post`
                : "No engagement data"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="top-posts">Top Posts</TabsTrigger>
        </TabsList>
        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Follower Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={analytics.growth.map((point) => ({
                  date: formatDate(point.date),
                  followers: point.followers,
                  following: point.following,
                }))}
                categories={["followers", "following"]}
                index="date"
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={analytics.engagement.map((point) => ({
                  date: formatDate(point.date),
                  likes: point.likes,
                  comments: point.comments,
                  shares: point.shares,
                }))}
                categories={["likes", "comments", "shares"]}
                index="date"
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="top-posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topPosts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-lg border p-4"
                  >
                    <p className="mb-2 line-clamp-2">{post.content}</p>
                    <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>Likes: {formatNumber(post.likes)}</div>
                      <div>Comments: {formatNumber(post.comments)}</div>
                      <div>Shares: {formatNumber(post.shares)}</div>
                      <div>Reach: {formatNumber(post.reach)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 