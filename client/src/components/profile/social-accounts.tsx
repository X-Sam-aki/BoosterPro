import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SocialAccount } from "@/lib/types";
import { SiTiktok, SiInstagram, SiFacebook } from "react-icons/si";
import { Pencil, Plus } from "lucide-react";

interface SocialAccountsProps {
  accounts: SocialAccount[];
  onEditAccount: (account: SocialAccount) => void;
  onAddAccount: (platform: string) => void;
}

export function SocialAccounts({ accounts, onEditAccount, onAddAccount }: SocialAccountsProps) {
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'tiktok':
        return <SiTiktok className="text-xl" />;
      case 'instagram':
        return <SiInstagram className="text-xl" />;
      case 'facebook':
        return <SiFacebook className="text-xl" />;
      default:
        return null;
    }
  };

  // Check if platform exists in accounts
  const hasPlatform = (platform: string) => {
    return accounts.some(account => account.platform.toLowerCase() === platform.toLowerCase());
  };
  
  const platforms = ['tiktok', 'instagram', 'facebook'];

  return (
    <Card className="shadow-sm mb-6">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-base font-semibold">Connected Accounts</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {platforms.map((platform) => {
            const account = accounts.find(a => a.platform.toLowerCase() === platform);
            
            return (
              <div key={platform} className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-xl mr-3">
                    {getPlatformIcon(platform)}
                  </div>
                  <div>
                    <p className="font-medium">{platform.charAt(0).toUpperCase() + platform.slice(1)}</p>
                    {account ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">@{account.username}</p>
                    ) : (
                      <p className="text-sm text-primary">+ Connect Account</p>
                    )}
                  </div>
                </div>
                <button 
                  className={`text-sm ${account ? 'text-gray-600 dark:text-gray-400 hover:text-primary' : 'text-primary'}`}
                  onClick={() => account ? onEditAccount(account) : onAddAccount(platform)}
                >
                  {account ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
