import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

export function DangerZone() {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteOrders = async () => {
    try {
      await apiRequest("DELETE", "/api/orders/user", {});
      toast({
        title: "Success",
        description: "All your orders have been deleted"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete orders"
      });
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Delete account from our backend
      await apiRequest("DELETE", "/api/users/current", {});
      
      // Delete account from Firebase
      const user = auth.currentUser;
      if (user) {
        await user.delete();
      }
      
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted."
      });
      
      // Sign out and redirect to home
      await auth.signOut();
      window.location.href = "/";
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete account. Please try again."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="shadow-sm mb-6">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-base font-semibold text-red-600 dark:text-red-500">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">These actions cannot be undone.</p>
        <div className="space-y-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full border-red-600 dark:border-red-500 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Delete All Orders
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your order history and records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteOrders}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full border-red-600 dark:border-red-500 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account, all your data, order history, and settings.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete My Account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
