import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, BarChart, TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  platform: string;
  objective: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  metrics: {
    reach: number;
    engagement: number;
    conversions: number;
    spend: number;
  };
  variants: {
    id: string;
    content: string;
    performance: {
      reach: number;
      engagement: number;
      conversions: number;
    };
  }[];
}

export function CampaignManagement() {
  const [selectedTab, setSelectedTab] = useState('active');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    platform: '',
    objective: '',
    budget: 0,
    startDate: '',
    endDate: '',
  });

  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns', selectedTab],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns?status=${selectedTab}`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      return response.json();
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: typeof newCampaign) => {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setIsCreateDialogOpen(false);
      setNewCampaign({
        name: '',
        platform: '',
        objective: '',
        budget: 0,
        startDate: '',
        endDate: '',
      });
    },
  });

  const updateCampaignStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/campaigns/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update campaign status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const handleCreateCampaign = () => {
    createCampaignMutation.mutate(newCampaign);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return <div>Loading campaigns...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Campaign Management</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new social media campaign with A/B testing capabilities.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={newCampaign.name}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={newCampaign.platform}
                  onValueChange={(value) =>
                    setNewCampaign({ ...newCampaign, platform: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="objective">Objective</Label>
                <Select
                  value={newCampaign.objective}
                  onValueChange={(value) =>
                    setNewCampaign({ ...newCampaign, objective: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select objective" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="awareness">Brand Awareness</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="conversions">Conversions</SelectItem>
                    <SelectItem value="traffic">Traffic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={newCampaign.budget}
                  onChange={(e) =>
                    setNewCampaign({
                      ...newCampaign,
                      budget: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newCampaign.startDate}
                    onChange={(e) =>
                      setNewCampaign({ ...newCampaign, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newCampaign.endDate}
                    onChange={(e) =>
                      setNewCampaign({ ...newCampaign, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCampaign}>Create Campaign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value={selectedTab}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaigns?.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{campaign.name}</CardTitle>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <CardDescription>{campaign.platform}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Budget: ${campaign.budget}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(campaign.startDate).toLocaleDateString()} -{' '}
                          {new Date(campaign.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <BarChart className="h-4 w-4" />
                          <span>Reach</span>
                        </div>
                        <p className="text-2xl font-bold">
                          {campaign.metrics.reach.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4" />
                          <span>Engagement</span>
                        </div>
                        <p className="text-2xl font-bold">
                          {campaign.metrics.engagement.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Spend</span>
                        </div>
                        <p className="text-2xl font-bold">
                          ${campaign.metrics.spend.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {campaign.variants && campaign.variants.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">A/B Test Results</h4>
                        <div className="space-y-2">
                          {campaign.variants.map((variant) => (
                            <div
                              key={variant.id}
                              className="rounded-lg border p-2 space-y-1"
                            >
                              <p className="text-sm line-clamp-2">
                                {variant.content}
                              </p>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <span className="font-medium">Reach:</span>{' '}
                                  {variant.performance.reach.toLocaleString()}
                                </div>
                                <div>
                                  <span className="font-medium">Engagement:</span>{' '}
                                  {variant.performance.engagement.toLocaleString()}
                                </div>
                                <div>
                                  <span className="font-medium">Conversions:</span>{' '}
                                  {variant.performance.conversions.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end space-x-2">
                      {campaign.status === 'active' && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            updateCampaignStatusMutation.mutate({
                              id: campaign.id,
                              status: 'paused',
                            })
                          }
                        >
                          Pause
                        </Button>
                      )}
                      {campaign.status === 'paused' && (
                        <Button
                          onClick={() =>
                            updateCampaignStatusMutation.mutate({
                              id: campaign.id,
                              status: 'active',
                            })
                          }
                        >
                          Resume
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 