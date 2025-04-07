import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Instagram, Youtube, Music, Search, TrendingUp, AlertCircle, Hash, MessageSquare, ThumbsUp, Share2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';

interface Mention {
  id: string;
  platform: string;
  content: string;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  hashtags: string[];
  keywords: string[];
}

interface Trend {
  keyword: string;
  count: number;
  change: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function SocialMonitoring() {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: mentions, isLoading: isLoadingMentions } = useQuery<Mention[]>({
    queryKey: ['mentions', selectedPlatform],
    queryFn: async () => {
      const response = await fetch(`/api/social-monitoring/mentions?platform=${selectedPlatform}`);
      if (!response.ok) throw new Error('Failed to fetch mentions');
      return response.json();
    },
  });

  const { data: trends, isLoading: isLoadingTrends } = useQuery<Trend[]>({
    queryKey: ['trends'],
    queryFn: async () => {
      const response = await fetch('/api/social-monitoring/trends');
      if (!response.ok) throw new Error('Failed to fetch trends');
      return response.json();
    },
  });

  const filteredMentions = mentions?.filter(mention => {
    const matchesPlatform = selectedPlatform === 'all' || mention.platform === selectedPlatform;
    const matchesSearch = searchQuery === '' || 
      mention.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mention.hashtags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      mention.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPlatform && matchesSearch;
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'youtube':
        return <Youtube className="h-4 w-4" />;
      case 'tiktok':
        return <Music className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500';
      case 'negative':
        return 'bg-red-500';
      case 'neutral':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoadingMentions || isLoadingTrends) {
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Social Media Monitoring</h2>
        <div className="flex gap-4">
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
          <Input
            placeholder="Search mentions, hashtags, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[300px]"
          />
        </div>
      </div>

      <Tabs defaultValue="mentions">
        <TabsList>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        <TabsContent value="mentions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Mentions</CardTitle>
              <CardDescription>Track mentions of your brand across social media</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Author</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMentions?.map((mention) => (
                    <TableRow key={mention.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img
                            src={mention.author.avatar}
                            alt={mention.author.name}
                            className="h-8 w-8 rounded-full"
                          />
                          <div>
                            <div className="font-medium">{mention.author.name}</div>
                            <div className="text-sm text-muted-foreground">
                              @{mention.author.username}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p>{mention.content}</p>
                          <div className="flex gap-1">
                            {mention.hashtags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPlatformColor(mention.platform)}>
                          {mention.platform}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSentimentColor(mention.sentiment)}>
                          {mention.sentiment}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <span>❤️ {mention.engagement.likes}</span>
                          <span>💬 {mention.engagement.comments}</span>
                          <span>🔄 {mention.engagement.shares}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(mention.timestamp), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Trending Topics</CardTitle>
              <CardDescription>Monitor trending keywords and hashtags</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Mentions</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Sentiment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trends?.map((trend) => (
                    <TableRow key={trend.keyword}>
                      <TableCell className="font-medium">{trend.keyword}</TableCell>
                      <TableCell>{trend.count}</TableCell>
                      <TableCell>
                        <Badge
                          variant={trend.change >= 0 ? "default" : "destructive"}
                        >
                          {trend.change >= 0 ? "+" : ""}
                          {trend.change}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <span className="text-green-500">
                            +{trend.sentiment.positive}%
                          </span>
                          <span className="text-red-500">
                            -{trend.sentiment.negative}%
                          </span>
                          <span className="text-gray-500">
                            {trend.sentiment.neutral}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getPlatformColor(platform: string) {
  switch (platform) {
    case "instagram":
      return "bg-pink-500";
    case "tiktok":
      return "bg-black";
    case "facebook":
      return "bg-blue-600";
    case "twitter":
      return "bg-blue-400";
    default:
      return "bg-gray-500";
  }
} 