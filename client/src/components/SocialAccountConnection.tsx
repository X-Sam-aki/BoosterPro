import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface SocialAccount {
  id: number;
  platform: string;
  username: string;
  followerCount: number | null;
  viewCount: number | null;
  likeCount: number | null;
  lastUpdated: Date | null;
}

export function SocialAccountConnection() {
  const [platform, setPlatform] = useState('');
  const [username, setUsername] = useState('');
  const queryClient = useQueryClient();

  // Fetch connected accounts
  const { data: accounts, isLoading } = useQuery<SocialAccount[]>({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/social-accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json();
    },
  });

  // Connect new account mutation
  const connectAccount = useMutation({
    mutationFn: async (data: { platform: string; username: string }) => {
      const response = await fetch('/api/social-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to connect account');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      setPlatform('');
      setUsername('');
    },
  });

  // Update stats mutation
  const updateStats = useMutation({
    mutationFn: async (accountId: number) => {
      const response = await fetch(`/api/social-accounts/${accountId}/update`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to update stats');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform || !username) return;
    connectAccount.mutate({ platform, username });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Social Media Accounts</CardTitle>
        <CardDescription>
          Connect your social media accounts to track growth and get personalized recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>
          <Button type="submit" className="w-full" disabled={connectAccount.isPending}>
            {connectAccount.isPending ? 'Connecting...' : 'Connect Account'}
          </Button>
        </form>

        {connectAccount.isError && (
          <div className="mt-4 text-sm text-red-500">
            {connectAccount.error.message}
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Connected Accounts</h3>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : accounts?.length === 0 ? (
            <p className="text-gray-500">No accounts connected yet.</p>
          ) : (
            <div className="space-y-4">
              {accounts?.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium capitalize">{account.platform}</h4>
                    <p className="text-sm text-gray-500">@{account.username}</p>
                    {account.followerCount && (
                      <p className="text-sm text-gray-500">
                        {account.followerCount.toLocaleString()} followers
                      </p>
                    )}
                    {account.lastUpdated && (
                      <p className="text-xs text-gray-400">
                        Last updated: {new Date(account.lastUpdated).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStats.mutate(account.id)}
                    disabled={updateStats.isPending}
                  >
                    {updateStats.isPending ? 'Updating...' : 'Update Stats'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 