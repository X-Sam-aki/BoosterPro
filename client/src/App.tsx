import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Pages
import AuthPage from "@/pages/auth";
import DashboardPage from "@/pages/dashboard";
import MarketplacePage from "@/pages/marketplace";
import OrderPage from "@/pages/order";
import ProfilePage from "@/pages/profile";
import CheckoutPage from "@/pages/checkout";
import NotFound from "@/pages/not-found";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? DashboardPage : AuthPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/marketplace" component={MarketplacePage} />
      <Route path="/order" component={OrderPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
