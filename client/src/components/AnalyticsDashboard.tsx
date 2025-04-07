import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { formatNumber, formatDate } from '../lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useState } from 'react';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon } from 'lucide-react';

interface AnalyticsData {
  totalFollowers: number;
  totalViews: number;
  totalLikes: number;
  averageEngagementRate: number;
  growthRate: number;
  engagementHistory: {
    date: string;
    followers: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }[];
  engagementDistribution: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  const { data: analytics, isLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ['analytics', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      });
      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const engagementData = [
    { name: 'Views', value: analytics.engagementDistribution.views },
    { name: 'Likes', value: analytics.engagementDistribution.likes },
    { name: 'Comments', value: analytics.engagementDistribution.comments },
    { name: 'Shares', value: analytics.engagementDistribution.shares },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-500">Track your social media growth and performance</p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {formatDate(dateRange.from.toISOString())} -{' '}
                      {formatDate(dateRange.to.toISOString())}
                    </>
                  ) : (
                    formatDate(dateRange.from.toISOString())
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={() => refetch()}>Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Followers</CardTitle>
            <CardDescription>Across all platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatNumber(analytics.totalFollowers)}</p>
            <p className="text-sm text-green-500">
              +{analytics.growthRate.toFixed(1)}% growth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Views</CardTitle>
            <CardDescription>Selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatNumber(analytics.totalViews)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Likes</CardTitle>
            <CardDescription>Selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatNumber(analytics.totalLikes)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Rate</CardTitle>
            <CardDescription>Average across platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.averageEngagementRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Follower Growth</CardTitle>
            <CardDescription>Selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.engagementHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => formatDate(date)}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => formatDate(date)}
                    formatter={(value) => formatNumber(value as number)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="followers"
                    stroke="#8884d8"
                    name="Followers"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Distribution</CardTitle>
            <CardDescription>Selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engagementData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {engagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatNumber(value as number)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
            <CardDescription>Selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.engagementHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => formatDate(date)}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => formatDate(date)}
                    formatter={(value) => formatNumber(value as number)}
                  />
                  <Legend />
                  <Bar dataKey="views" fill="#82ca9d" name="Views" />
                  <Bar dataKey="likes" fill="#8884d8" name="Likes" />
                  <Bar dataKey="comments" fill="#ffc658" name="Comments" />
                  <Bar dataKey="shares" fill="#ff8042" name="Shares" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement History</CardTitle>
            <CardDescription>Selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-right py-2">Followers</th>
                    <th className="text-right py-2">Views</th>
                    <th className="text-right py-2">Likes</th>
                    <th className="text-right py-2">Comments</th>
                    <th className="text-right py-2">Shares</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.engagementHistory.map((day) => (
                    <tr key={day.date} className="border-b">
                      <td className="py-2">{formatDate(day.date)}</td>
                      <td className="text-right py-2">{formatNumber(day.followers)}</td>
                      <td className="text-right py-2">{formatNumber(day.views)}</td>
                      <td className="text-right py-2">{formatNumber(day.likes)}</td>
                      <td className="text-right py-2">{formatNumber(day.comments)}</td>
                      <td className="text-right py-2">{formatNumber(day.shares)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 