import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "@/lib/types";

interface UserInfoProps {
  user: User;
}

export function UserInfo({ user }: UserInfoProps) {
  const { displayName, email, avatarUrl, isPremium } = user;
  
  // Get initials for avatar fallback
  const initials = displayName
    ?.split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <Card className="shadow-sm mb-6">
      <CardContent className="p-5 flex items-center">
        <Avatar className="h-16 w-16">
          <AvatarImage src={avatarUrl || ""} alt={displayName || "User"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="ml-4">
          <h3 className="font-semibold text-lg">{displayName}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{email}</p>
          {isPremium && (
            <div className="flex items-center mt-1">
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/20">
                Premium User
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
