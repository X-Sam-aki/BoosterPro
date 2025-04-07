import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Instagram, Youtube, Music, MessageSquare, ThumbsUp, Share2, Reply, Filter, Search, Clock, User } from 'lucide-react';
import { Badge } from './ui/badge';
import { format } from 'date-fns';

interface SocialInteraction {
  id: number;
  type: 'message' | 'comment' | 'mention';
  platform: string;
  sender: {
    name: string;
    username: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  status: 'unread' | 'read' | 'replied';
  engagement?: {
    likes: number;
    replies: number;
    shares: number;
  };
}

export function SocialInbox() {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInteraction, setSelectedInteraction] = useState<SocialInteraction | null>(null);

  const { data: interactions, isLoading } = useQuery<SocialInteraction[]>({
    queryKey: ['socialInteractions', selectedPlatform],
    queryFn: async () => {
      const response = await fetch(`/api/social-inbox?platform=${selectedPlatform}`);
      if (!response.ok) throw new Error('Failed to fetch interactions');
      return response.json();
    },
  });

  const filteredInteractions = interactions?.filter(interaction => {
    const matchesPlatform = selectedPlatform === 'all' || interaction.platform === selectedPlatform;
    const matchesSearch = searchQuery === '' || 
      interaction.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interaction.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interaction.sender.username.toLowerCase().includes(searchQuery.toLowerCase());
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

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'mention':
        return <Share2 className="h-4 w-4" />;
      default:
        return null;
    }
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
          <h2 className="text-2xl font-bold">Social Inbox</h2>
          <p className="text-gray-500">Manage your social media interactions</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search interactions..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Interactions</CardTitle>
              <CardDescription>Recent messages, comments, and mentions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInteractions?.map((interaction) => (
                  <div
                    key={interaction.id}
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      interaction.status === 'unread' ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedInteraction(interaction)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {getPlatformIcon(interaction.platform)}
                        {getInteractionIcon(interaction.type)}
                        <div>
                          <p className="font-medium">{interaction.sender.name}</p>
                          <p className="text-sm text-gray-500">@{interaction.sender.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(interaction.timestamp), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-gray-700">{interaction.content}</p>
                    {interaction.engagement && (
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {interaction.engagement.likes}
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {interaction.engagement.replies}
                        </span>
                        <span className="flex items-center">
                          <Share2 className="h-4 w-4 mr-1" />
                          {interaction.engagement.shares}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {selectedInteraction ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Reply</CardTitle>
                  <Badge variant={selectedInteraction.status === 'unread' ? 'default' : 'secondary'}>
                    {selectedInteraction.status}
                  </Badge>
                </div>
                <CardDescription>
                  Reply to {selectedInteraction.sender.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Original Message</p>
                  <p className="text-gray-700">{selectedInteraction.content}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Your Reply</p>
                  <Input placeholder="Type your reply..." />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>
                    <Reply className="h-4 w-4 mr-2" />
                    Send Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Select an Interaction</CardTitle>
                <CardDescription>Choose an interaction to view details and reply</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 