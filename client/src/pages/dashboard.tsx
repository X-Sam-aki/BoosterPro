import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Sidebar } from '../components/layout/sidebar';
import { AISuggestions } from '../components/AISuggestions';
import { SocialAccountConnection } from '../components/SocialAccountConnection';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { ContentScheduler } from '../components/ContentScheduler';
import { GrowthCampaigns } from '../components/GrowthCampaigns';
import { ContentCalendar } from '../components/ContentCalendar';
import { ContentAnalytics } from '../components/ContentAnalytics';
import { ContentTemplates } from '../components/ContentTemplates';
import { SocialInbox } from '../components/SocialInbox';
import { SocialMonitoring } from '../components/SocialMonitoring';
import { SocialAnalytics } from '../components/SocialAnalytics';
import { EnhancedAnalytics } from "@/components/EnhancedAnalytics";
import { TeamCollaboration } from "@/components/TeamCollaboration";
import { CampaignManagement } from '@/components/CampaignManagement';
import { Notifications } from '../components/notifications';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold">Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Notifications />
                <Button onClick={handleLogout} variant="ghost" size="sm">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Welcome, {user?.displayName || 'User'}!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Get started by connecting your social media accounts and exploring our services.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    onClick={() => navigate('/marketplace')}
                    className="w-full"
                  >
                    Browse Services
                  </Button>
                  <Button
                    onClick={() => navigate('/profile')}
                    className="w-full"
                    variant="outline"
                  >
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm text-gray-600">Connected Instagram account</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-sm text-gray-600">Created new content template</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <p className="text-sm text-gray-600">Scheduled 3 posts for next week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <SocialAccountConnection />
              <AISuggestions />
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <ContentScheduler />
              <ContentCalendar />
              <ContentTemplates />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsDashboard />
              <ContentAnalytics />
              <SocialAnalytics />
              <EnhancedAnalytics />
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6">
              <GrowthCampaigns />
              <CampaignManagement />
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <TeamCollaboration />
              <SocialInbox />
              <SocialMonitoring />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
