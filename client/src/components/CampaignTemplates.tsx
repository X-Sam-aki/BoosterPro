import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Rocket, TrendingUp, Users, Eye, Heart } from 'lucide-react';

interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  platform: string;
  targetMetric: 'followers' | 'views' | 'likes';
  targetValue: number;
  dailyLimit: number;
  duration: number;
  tags: string[];
}

const templates: CampaignTemplate[] = [
  {
    id: 'quick-growth',
    name: 'Quick Growth',
    description: 'Rapid follower growth for new accounts',
    platform: 'instagram',
    targetMetric: 'followers',
    targetValue: 1000,
    dailyLimit: 100,
    duration: 10,
    tags: ['New Account', 'Quick Start'],
  },
  {
    id: 'engagement-boost',
    name: 'Engagement Boost',
    description: 'Increase post engagement and visibility',
    platform: 'instagram',
    targetMetric: 'likes',
    targetValue: 500,
    dailyLimit: 50,
    duration: 14,
    tags: ['Engagement', 'Visibility'],
  },
  {
    id: 'video-views',
    name: 'Video Views',
    description: 'Boost video content visibility',
    platform: 'tiktok',
    targetMetric: 'views',
    targetValue: 5000,
    dailyLimit: 500,
    duration: 7,
    tags: ['Video', 'Content'],
  },
  {
    id: 'youtube-growth',
    name: 'YouTube Growth',
    description: 'Increase channel subscribers and views',
    platform: 'youtube',
    targetMetric: 'followers',
    targetValue: 2000,
    dailyLimit: 200,
    duration: 14,
    tags: ['Channel', 'Subscribers'],
  },
];

export function CampaignTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const createCampaignMutation = useMutation({
    mutationFn: async (template: CampaignTemplate) => {
      const response = await fetch('/api/growth-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          platform: template.platform,
          targetMetric: template.targetMetric,
          targetValue: template.targetValue,
          dailyLimit: template.dailyLimit,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + template.duration * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to create campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growthCampaigns'] });
      setSelectedTemplate(null);
    },
  });

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'followers':
        return <Users className="h-4 w-4" />;
      case 'views':
        return <Eye className="h-4 w-4" />;
      case 'likes':
        return <Heart className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Campaign Templates</h2>
        <p className="text-gray-500">Quick-start your growth with pre-configured campaigns</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all ${
              selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                {getMetricIcon(template.targetMetric)}
              </div>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Target</p>
                    <p className="font-medium">{template.targetValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Daily Limit</p>
                    <p className="font-medium">{template.dailyLimit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Duration</p>
                    <p className="font-medium">{template.duration} days</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Platform</p>
                    <p className="font-medium capitalize">{template.platform}</p>
                  </div>
                </div>
                <Button
                  className="w-full"
                  variant={selectedTemplate === template.id ? 'default' : 'outline'}
                  onClick={(e) => {
                    e.stopPropagation();
                    createCampaignMutation.mutate(template);
                  }}
                  disabled={createCampaignMutation.isPending}
                >
                  {createCampaignMutation.isPending ? (
                    'Creating...'
                  ) : (
                    <>
                      <Rocket className="mr-2 h-4 w-4" />
                      Use Template
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 