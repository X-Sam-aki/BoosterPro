import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Instagram, Youtube, Music, TrendingUp, Users, Clock, ThumbsUp, MessageSquare, Share2, Download, Hash, Tag, Calendar, BarChart2 } from 'lucide-react';
import { exportToCSV } from '../lib/utils';

interface ContentAnalytics {
  totalPosts: number;
  averageEngagement: number;
  totalReach: number;
  bestPostingTimes: {
    hour: number;
    engagement: number;
  }[];
  contentTypePerformance: {
    type: string;
    count: number;
    engagement: number;
  }[];
  audienceDemographics: {
    age: string;
    percentage: number;
  }[];
  topPerformingPosts: {
    id: number;
    content: string;
    platform: string;
    engagement: number;
    reach: number;
    date: string;
  }[];
  hashtagPerformance: {
    hashtag: string;
    usageCount: number;
    engagement: number;
  }[];
  contentThemes: {
    theme: string;
    count: number;
    engagement: number;
  }[];
  comparisonData: {
    currentPeriod: {
      posts: number;
      engagement: number;
      reach: number;
    };
    previousPeriod: {
      posts: number;
      engagement: number;
      reach: number;
    };
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function ContentAnalytics() {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [timeRange, setTimeRange] = useState('30d');
  const [compareWithPrevious, setCompareWithPrevious] = useState(false);

  const { data: analytics, isLoading } = useQuery<ContentAnalytics>({
    queryKey: ['contentAnalytics', selectedPlatform, timeRange, compareWithPrevious],
    queryFn: async () => {
      const response = await fetch(
        `/api/content-analytics?platform=${selectedPlatform}&timeRange=${timeRange}&compare=${compareWithPrevious}`
      );
      if (!response.ok) throw new Error('Failed to fetch content analytics');
      return response.json();
    },
  });

  const handleExport = () => {
    if (!analytics) return;
    
    const data = [
      ['Metric', 'Value'],
      ['Total Posts', analytics.totalPosts],
      ['Average Engagement', `${analytics.averageEngagement}%`],
      ['Total Reach', analytics.totalReach],
      ['', ''],
      ['Top Performing Hashtags', ''],
      ...analytics.hashtagPerformance.map(h => [h.hashtag, h.engagement]),
      ['', ''],
      ['Content Themes', ''],
      ...analytics.contentThemes.map(t => [t.theme, t.engagement]),
    ];

    exportToCSV(data, `content-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Content Analytics</h2>
          <p className="text-gray-500">Track and analyze your content performance</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setCompareWithPrevious(!compareWithPrevious)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {compareWithPrevious ? 'Hide Comparison' : 'Compare with Previous'}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {compareWithPrevious && analytics?.comparisonData && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Comparison</CardTitle>
            <CardDescription>Compare current period with previous period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Posts</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold">{analytics.comparisonData.currentPeriod.posts}</span>
                  <span className={`text-sm ${analytics.comparisonData.currentPeriod.posts > analytics.comparisonData.previousPeriod.posts ? 'text-green-500' : 'text-red-500'}`}>
                    {((analytics.comparisonData.currentPeriod.posts - analytics.comparisonData.previousPeriod.posts) / analytics.comparisonData.previousPeriod.posts * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Engagement</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold">{analytics.comparisonData.currentPeriod.engagement}%</span>
                  <span className={`text-sm ${analytics.comparisonData.currentPeriod.engagement > analytics.comparisonData.previousPeriod.engagement ? 'text-green-500' : 'text-red-500'}`}>
                    {((analytics.comparisonData.currentPeriod.engagement - analytics.comparisonData.previousPeriod.engagement) / analytics.comparisonData.previousPeriod.engagement * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Reach</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold">{analytics.comparisonData.currentPeriod.reach.toLocaleString()}</span>
                  <span className={`text-sm ${analytics.comparisonData.currentPeriod.reach > analytics.comparisonData.previousPeriod.reach ? 'text-green-500' : 'text-red-500'}`}>
                    {((analytics.comparisonData.currentPeriod.reach - analytics.comparisonData.previousPeriod.reach) / analytics.comparisonData.previousPeriod.reach * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
          <TabsTrigger value="themes">Content Themes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span className="text-2xl font-bold">{analytics?.totalPosts}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Average Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <ThumbsUp className="h-4 w-4 text-gray-500" />
                  <span className="text-2xl font-bold">{analytics?.averageEngagement}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-2xl font-bold">{analytics?.totalReach.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Best Posting Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-2xl font-bold">
                    {analytics?.bestPostingTimes[0]?.hour || 0}:00
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement by Hour</CardTitle>
                <CardDescription>Best times to post for maximum engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.bestPostingTimes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="engagement" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audience Demographics</CardTitle>
                <CardDescription>Age distribution of your audience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.audienceDemographics}
                        dataKey="percentage"
                        nameKey="age"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {analytics?.audienceDemographics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hashtags">
          <Card>
            <CardHeader>
              <CardTitle>Hashtag Performance</CardTitle>
              <CardDescription>Top performing hashtags and their engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.hashtagPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hashtag" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="engagement" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="themes">
          <Card>
            <CardHeader>
              <CardTitle>Content Themes</CardTitle>
              <CardDescription>Performance of different content themes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.contentThemes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="theme" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="engagement" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
          <CardDescription>Your best performing content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.topPerformingPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  {post.platform === 'instagram' && <Instagram className="h-5 w-5" />}
                  {post.platform === 'youtube' && <Youtube className="h-5 w-5" />}
                  {post.platform === 'tiktok' && <Music className="h-5 w-5" />}
                  <div>
                    <p className="font-medium">{post.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{format(new Date(post.date), 'MMM d, yyyy')}</span>
                      <span className="flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {post.engagement}%
                      </span>
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {post.reach.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 