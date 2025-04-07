import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { format, subDays, subMonths } from "date-fns";
import { Download, RefreshCw, Filter } from "lucide-react";

interface AnalyticsData {
  metrics: {
    followers: number;
    engagement: number;
    reach: number;
    impressions: number;
  };
  growth: {
    followers: number;
    engagement: number;
    reach: number;
  };
  audience: {
    demographics: {
      age: { [key: string]: number };
      gender: { [key: string]: number };
      location: { [key: string]: number };
    };
    interests: { [key: string]: number };
    devices: { [key: string]: number };
  };
  content: {
    topPosts: Array<{
      id: string;
      platform: string;
      content: string;
      engagement: number;
      reach: number;
    }>;
    performance: Array<{
      date: string;
      engagement: number;
      reach: number;
    }>;
  };
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export function EnhancedAnalytics() {
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [timeRange, setTimeRange] = useState("7d");
  const [exportFormat, setExportFormat] = useState("csv");

  const { data: analytics, isLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ["enhanced-analytics", selectedPlatform, timeRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/analytics/enhanced?platform=${selectedPlatform}&timeRange=${timeRange}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      return response.json();
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const handleExport = async () => {
    const response = await fetch(
      `/api/analytics/export?format=${exportFormat}&platform=${selectedPlatform}&timeRange=${timeRange}`
    );
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${format(new Date(), "yyyy-MM-dd")}.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Enhanced Analytics</h2>
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
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
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="comparative">Comparative</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Followers</CardTitle>
                <CardDescription>Total audience size</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.metrics.followers.toLocaleString()}</div>
                <div className="text-sm text-green-500">
                  +{analytics?.growth.followers.toLocaleString()} this period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Engagement</CardTitle>
                <CardDescription>Average engagement rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.metrics.engagement.toFixed(2)}%</div>
                <div className="text-sm text-green-500">
                  +{analytics?.growth.engagement.toFixed(2)}% vs last period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Reach</CardTitle>
                <CardDescription>Total unique accounts reached</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.metrics.reach.toLocaleString()}</div>
                <div className="text-sm text-green-500">
                  +{analytics?.growth.reach.toLocaleString()} vs last period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Impressions</CardTitle>
                <CardDescription>Total content views</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.metrics.impressions.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">This period</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audience">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Demographics</CardTitle>
                <CardDescription>Audience age and gender distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(analytics?.audience.demographics.age || {}).map(([age, count]) => ({
                          name: age,
                          value: count,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Interests</CardTitle>
                <CardDescription>Top audience interests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(analytics?.audience.interests || {})
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([interest, count]) => ({
                          name: interest,
                          value: count,
                        }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
                <CardDescription>Engagement and reach over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={analytics?.content.performance}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="engagement"
                        stroke="#8884d8"
                        name="Engagement"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="reach"
                        stroke="#82ca9d"
                        name="Reach"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Content</CardTitle>
                <CardDescription>Most engaging posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.content.topPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{post.content}</p>
                        <p className="text-sm text-muted-foreground">{post.platform}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{post.engagement.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Engagement</div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-medium">{post.reach.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Reach</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparative">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparative Analysis</CardTitle>
                <CardDescription>Performance comparison with previous periods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "Current",
                          followers: analytics?.metrics.followers || 0,
                          engagement: analytics?.metrics.engagement || 0,
                          reach: analytics?.metrics.reach || 0,
                        },
                        {
                          name: "Previous",
                          followers: (analytics?.metrics.followers || 0) - (analytics?.growth.followers || 0),
                          engagement: (analytics?.metrics.engagement || 0) - (analytics?.growth.engagement || 0),
                          reach: (analytics?.metrics.reach || 0) - (analytics?.growth.reach || 0),
                        },
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="followers" fill="#8884d8" name="Followers" />
                      <Bar dataKey="engagement" fill="#82ca9d" name="Engagement" />
                      <Bar dataKey="reach" fill="#ffc658" name="Reach" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 