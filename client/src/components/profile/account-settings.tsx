import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

interface SettingItem {
  title: string;
  description: string;
  path: string;
}

interface AccountSettingsProps {
  settings: SettingItem[];
}

export function AccountSettings({ settings }: AccountSettingsProps) {
  const [_, navigate] = useLocation();

  const handleNavigate = (path: string) => {
    // For now, just show a message since these pages aren't implemented
    navigate(path);
  };

  return (
    <Card className="shadow-sm mb-6">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-base font-semibold">Account Settings</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {settings.map((setting, index) => (
            <div 
              key={index} 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
              onClick={() => handleNavigate(setting.path)}
            >
              <div>
                <p className="font-medium">{setting.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{setting.description}</p>
              </div>
              <button className="text-primary">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Default settings
export const defaultSettings: SettingItem[] = [
  {
    title: "Personal Information",
    description: "Update your name and contact details",
    path: "/profile/personal-info"
  },
  {
    title: "Password & Security",
    description: "Update your password and security settings",
    path: "/profile/security"
  },
  {
    title: "Notifications",
    description: "Manage email and push notifications",
    path: "/profile/notifications"
  },
  {
    title: "Payment Methods",
    description: "Add or remove payment methods",
    path: "/profile/payment-methods"
  }
];
