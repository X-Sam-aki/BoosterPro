import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar as CalendarIcon, List, CalendarDays, GanttChart, CheckSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ScheduledContent {
  id: string;
  title: string;
  content: string;
  platform: string;
  scheduledDate: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  mediaUrls?: string[];
}

export function ContentCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [viewMode, setViewMode] = useState<"calendar" | "list" | "timeline">("calendar");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newContent, setNewContent] = useState({
    title: "",
    content: "",
    platform: "",
    scheduledDate: "",
    mediaUrls: [] as string[],
  });

  const queryClient = useQueryClient();

  const { data: scheduledContent, isLoading } = useQuery<ScheduledContent[]>({
    queryKey: ['scheduled-content', selectedPlatform, format(selectedDate || new Date(), 'yyyy-MM')],
    queryFn: async () => {
      const response = await fetch(
        `/api/scheduled-content?platform=${selectedPlatform}&month=${format(selectedDate || new Date(), 'yyyy-MM')}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled content');
      }
      return response.json();
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, newDate }: { id: string; newDate: string }) => {
      const response = await fetch(`/api/scheduled-content/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledDate: newDate }),
      });
      if (!response.ok) {
        throw new Error("Failed to reschedule content");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-content"] });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const response = await fetch("/api/scheduled-content/bulk-update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update content");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-content"] });
      setSelectedItems([]);
    },
  });

  const createContentMutation = useMutation({
    mutationFn: async (data: Omit<ScheduledContent, "id" | "status">) => {
      const response = await fetch("/api/scheduled-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create content");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-content"] });
      setIsScheduling(false);
      setIsCreateDialogOpen(false);
      setNewContent({
        title: "",
        content: "",
        platform: "",
        scheduledDate: "",
        mediaUrls: [],
      });
    },
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const content = scheduledContent?.find(item => item.id === result.draggableId);
    if (!content) return;

    const newDate = format(new Date(selectedDate || new Date()), "yyyy-MM-dd");
    rescheduleMutation.mutate({
      id: content.id,
      newDate: `${newDate}T${format(new Date(content.scheduledDate), "HH:mm")}`,
    });
  };

  const handleBulkAction = (action: string) => {
    if (selectedItems.length === 0) return;

    switch (action) {
      case "delete":
        // Implement delete functionality
        break;
      case "draft":
        bulkUpdateMutation.mutate({ ids: selectedItems, status: "draft" });
        break;
      case "schedule":
        bulkUpdateMutation.mutate({ ids: selectedItems, status: "scheduled" });
        break;
    }
  };

  const handleCreateContent = () => {
    createContentMutation.mutate({
      ...newContent,
      scheduledDate: selectedDate?.toISOString() || new Date().toISOString(),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'published':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'bg-pink-500';
      case 'tiktok':
        return 'bg-black';
      case 'facebook':
        return 'bg-blue-600';
      case 'twitter':
        return 'bg-blue-400';
      default:
        return 'bg-gray-500';
    }
  };

  const getContentForDate = (date: Date) => {
    return scheduledContent?.filter(
      (content) => new Date(content.scheduledDate).toDateString() === date.toDateString()
    ) || [];
  };

  const renderDayContent = (date: Date) => {
    const content = getContentForDate(date);
    return (
      <div className="relative h-full">
        <span className="text-sm">{format(date, 'd')}</span>
        {content.length > 0 && (
          <div className="absolute bottom-1 left-0 right-0 flex flex-wrap gap-1">
            {content.map((item) => (
              <div
                key={item.id}
                className={`w-2 h-2 rounded-full ${getPlatformColor(item.platform)}`}
                title={`${item.platform}: ${item.content.substring(0, 30)}...`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div>Loading calendar...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Calendar</h2>
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Content
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Content</DialogTitle>
                <DialogDescription>
                  Create and schedule content for your social media platforms.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newContent.title}
                    onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                    placeholder="Content title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newContent.content}
                    onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
                    placeholder="Content text"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select
                    value={newContent.platform}
                    onValueChange={(value) => setNewContent({ ...newContent, platform: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Schedule Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateContent} disabled={createContentMutation.isPending}>
                  {createContentMutation.isPending ? "Scheduling..." : "Schedule"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsList>
            <TabsTrigger value="calendar">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="mr-2 h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <GanttChart className="mr-2 h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {selectedItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <CheckSquare className="mr-2 h-4 w-4" />
                Bulk Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleBulkAction("draft")}>
                Mark as Draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction("schedule")}>
                Mark as Scheduled
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction("delete")}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <TabsContent value="calendar">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>Select a date to view scheduled content</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scheduled Content</CardTitle>
              <CardDescription>
                {selectedDate
                  ? `Content scheduled for ${format(selectedDate, "MMMM d, yyyy")}`
                  : "Select a date to view scheduled content"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="space-y-4">
                  {getContentForDate(selectedDate).map((content) => (
                    <div
                      key={content.id}
                      className="rounded-lg border p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{content.title}</h3>
                        <Badge variant={content.status === "published" ? "default" : "secondary"}>
                          {content.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{content.content}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{content.platform}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(content.scheduledDate), "h:mm a")}
                        </span>
                      </div>
                    </div>
                  ))}
                  {getContentForDate(selectedDate).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      No content scheduled for this date
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Select a date to view scheduled content
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="list">
        <Card>
          <CardHeader>
            <CardTitle>List View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduledContent?.map((content) => (
                <div
                  key={content.id}
                  className={`rounded-lg border p-4 space-y-2 ${
                    selectedItems.includes(content.id) ? "bg-gray-100" : ""
                  }`}
                  onClick={() => {
                    setSelectedItems((prev) =>
                      prev.includes(content.id)
                        ? prev.filter((id) => id !== content.id)
                        : [...prev, content.id]
                    );
                  }}
                >
                  <div className="flex items-center justify-between">
                    <Badge className={getPlatformColor(content.platform)}>
                      {content.platform}
                    </Badge>
                    <Badge className={getStatusColor(content.status)}>
                      {content.status}
                    </Badge>
                  </div>
                  <p className="text-sm line-clamp-2">{content.content}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(new Date(content.scheduledDate), 'MMMM d, yyyy h:mm a')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="timeline">
        <Card>
          <CardHeader>
            <CardTitle>Timeline View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduledContent?.map((content) => (
                <div
                  key={content.id}
                  className="relative pl-8 border-l-2 border-gray-200"
                >
                  <div className="absolute left-0 w-2 h-2 rounded-full bg-gray-400 -ml-1" />
                  <div
                    className={`rounded-lg border p-4 space-y-2 ${
                      selectedItems.includes(content.id) ? "bg-gray-100" : ""
                    }`}
                    onClick={() => {
                      setSelectedItems((prev) =>
                        prev.includes(content.id)
                          ? prev.filter((id) => id !== content.id)
                          : [...prev, content.id]
                      );
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <Badge className={getPlatformColor(content.platform)}>
                        {content.platform}
                      </Badge>
                      <Badge className={getStatusColor(content.status)}>
                        {content.status}
                      </Badge>
                    </div>
                    <p className="text-sm line-clamp-2">{content.content}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(new Date(content.scheduledDate), 'MMMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </div>
  );
} 