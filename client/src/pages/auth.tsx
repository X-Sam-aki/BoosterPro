import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AuthForm } from "@/components/auth/auth-form";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function AuthPage() {
  const [_, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        navigate("/dashboard");
      } else {
        // No user is signed in
        setIsLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pb-20 bg-gray-50 dark:bg-gray-900">
      <ThemeToggle />
      <AuthForm />
    </div>
  );
}
