import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { formatDate } from '../lib/utils';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Clock, Image, Link, Trash2 } from 'lucide-react';

interface ScheduledPost {
  id: number;
  platform: string;
  content: string;
  scheduledDate: string;
  status: 'scheduled' | 'published' | 'failed';
  mediaUrls?: string[];
  linkUrl?: string;
}

export function ContentScheduler() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    platform: '',
    content: '',
    mediaUrls: [] as string[],
    linkUrl: '',
  });

  const queryClient = useQueryClient();

  const { data: scheduledPosts, isLoading } = useQuery<ScheduledPost[]>({
    queryKey: ['scheduledPosts'],
    queryFn: async () => {
      const response = await fetch('/api/scheduled-posts');
      if (!response.ok) throw new Error('Failed to fetch scheduled posts');
      return response.json();
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (post: Omit<ScheduledPost, 'id' | 'status'>) => {
      const response = await fetch('/api/scheduled-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });
      if (!response.ok) throw new Error('Failed to create scheduled post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledPosts'] });
      setFormData({
        platform: '',
        content: '',
        mediaUrls: [],
        linkUrl: '',
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await fetch(`/api/scheduled-posts/${postId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete scheduled post');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledPosts'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    createPostMutation.mutate({
      ...formData,
      scheduledDate: selectedDate.toISOString(),
    });
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
      <div>
        <h2 className="text-2xl font-bold">Content Scheduler</h2>
        <p className="text-gray-500">Plan and schedule your social media posts</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schedule New Post</CardTitle>
            <CardDescription>Create a new scheduled post</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData({ ...formData, platform: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your post content here..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Schedule Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? formatDate(selectedDate.toISOString()) : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkUrl">Link URL (optional)</Label>
                <Input
                  id="linkUrl"
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <Button type="submit" className="w-full">
                Schedule Post
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scheduled Posts</CardTitle>
            <CardDescription>View and manage your scheduled posts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduledPosts?.map((post) => (
                <div
                  key={post.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{post.platform}</h3>
                      <p className="text-sm text-gray-500">
                        Scheduled for {formatDate(post.scheduledDate)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePostMutation.mutate(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm">{post.content}</p>
                  {post.linkUrl && (
                    <div className="flex items-center text-sm text-blue-500">
                      <Link className="h-4 w-4 mr-1" />
                      <a href={post.linkUrl} target="_blank" rel="noopener noreferrer">
                        {post.linkUrl}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {post.status}
                  </div>
                </div>
              ))}
              {!scheduledPosts?.length && (
                <p className="text-center text-gray-500">No scheduled posts</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 