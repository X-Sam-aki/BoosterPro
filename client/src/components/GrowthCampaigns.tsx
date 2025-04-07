import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { formatDate } from '../lib/utils';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Play, Pause, Settings, Target, TrendingUp, AlertCircle, BarChart2, LayoutTemplate, Plus, Edit2, Trash2 } from 'lucide-react';
import { CampaignAnalytics } from './CampaignAnalytics';
import { CampaignTemplates } from './CampaignTemplates';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface GrowthCampaign {
  id: string;
  name: string;
  platform: string;
  targetAudience: string;
  budget: number;
  duration: number;
  status: "draft" | "active" | "paused" | "completed";
  startDate: string;
  endDate: string;
  currentProgress: number;
  metrics: {
    followersGained: number;
    engagementRate: number;
    reach: number;
    impressions: number;
  };
}

export function GrowthCampaigns() {
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<GrowthCampaign | null>(null);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    platform: "",
    targetAudience: "",
    budget: 0,
    duration: 30,
    startDate: new Date().toISOString().split("T")[0],
  });

  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery<GrowthCampaign[]>({
    queryKey: ["growth-campaigns", selectedPlatform],
    queryFn: async () => {
      const response = await fetch(
        `/api/growth-campaigns?platform=${selectedPlatform}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch growth campaigns");
      }
      return response.json();
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: Omit<GrowthCampaign, "id" | "status" | "currentProgress" | "metrics">) => {
      const response = await fetch("/api/growth-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaign),
      });
      if (!response.ok) {
        throw new Error("Failed to create campaign");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["growth-campaigns"] });
      setIsCreating(false);
      setNewCampaign({
        name: "",
        platform: "",
        targetAudience: "",
        budget: 0,
        duration: 30,
        startDate: new Date().toISOString().split("T")[0],
      });
    },
  });

  const updateCampaignStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/growth-campaigns/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update campaign status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["growth-campaigns"] });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/growth-campaigns/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete campaign");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["growth-campaigns"] });
    },
  });

  const handleCreateCampaign = () => {
    createCampaignMutation.mutate(newCampaign);
  };

  const handleUpdateStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    updateCampaignStatusMutation.mutate({ id, status: newStatus });
  };

  const handleDeleteCampaign = (id: string) => {
    if (window.confirm("Are you sure you want to delete this campaign?")) {
      deleteCampaignMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      case "completed":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Growth Campaigns</h2>
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
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Campaign Name</Label>
                  <Input
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    placeholder="Enter campaign name"
                  />
                </div>
                <div>
                  <Label>Platform</Label>
                  <Select
                    value={newCampaign.platform}
                    onValueChange={(value) => setNewCampaign({ ...newCampaign, platform: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Audience</Label>
                  <Input
                    value={newCampaign.targetAudience}
                    onChange={(e) => setNewCampaign({ ...newCampaign, targetAudience: e.target.value })}
                    placeholder="Describe your target audience"
                  />
                </div>
                <div>
                  <Label>Budget ($)</Label>
                  <Input
                    type="number"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign({ ...newCampaign, budget: Number(e.target.value) })}
                    placeholder="Enter campaign budget"
                  />
                </div>
                <div>
                  <Label>Duration (days)</Label>
                  <Input
                    type="number"
                    value={newCampaign.duration}
                    onChange={(e) => setNewCampaign({ ...newCampaign, duration: Number(e.target.value) })}
                    placeholder="Enter campaign duration"
                  />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={newCampaign.startDate}
                    onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateCampaign}>Create Campaign</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Target Audience</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns?.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge className={getPlatformColor(campaign.platform)}>
                      {campaign.platform}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.targetAudience}</TableCell>
                  <TableCell>${campaign.budget}</TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Progress value={campaign.currentProgress} />
                      <div className="text-sm text-muted-foreground">
                        {campaign.currentProgress}% complete
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUpdateStatus(campaign.id, campaign.status)}
                      >
                        {campaign.status === "active" ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setIsEditing(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCampaign(campaign.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {campaigns?.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{campaign.name}</span>
                <Badge className={getStatusColor(campaign.status)}>
                  {campaign.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium">
                    {campaign.currentProgress}%
                  </span>
                </div>
                <Progress value={campaign.currentProgress} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Followers Gained
                    </div>
                    <div className="text-lg font-semibold">
                      {campaign.metrics.followersGained}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Engagement Rate
                    </div>
                    <div className="text-lg font-semibold">
                      {campaign.metrics.engagementRate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Reach</div>
                    <div className="text-lg font-semibold">
                      {campaign.metrics.reach}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Impressions
                    </div>
                    <div className="text-lg font-semibold">
                      {campaign.metrics.impressions}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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