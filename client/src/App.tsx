import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

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
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Render different routes based on authentication status
  return (
    <ErrorBoundary>
      <Switch>
        <Route 
          path="/" 
          component={
            isAuthenticated 
              ? () => (
                  <AuthenticatedLayout>
                    <DashboardPage />
                  </AuthenticatedLayout>
                )
              : AuthPage
          } 
        />
        
        {/* Authenticated Routes */}
        {isAuthenticated ? (
          <>
            <Route 
              path="/dashboard" 
              component={() => (
                <AuthenticatedLayout>
                  <DashboardPage />
                </AuthenticatedLayout>
              )} 
            />
            <Route 
              path="/marketplace" 
              component={() => (
                <AuthenticatedLayout>
                  <MarketplacePage />
                </AuthenticatedLayout>
              )} 
            />
            <Route 
              path="/order" 
              component={() => (
                <AuthenticatedLayout>
                  <OrderPage />
                </AuthenticatedLayout>
              )} 
            />
            <Route 
              path="/profile" 
              component={() => (
                <AuthenticatedLayout>
                  <ProfilePage />
                </AuthenticatedLayout>
              )} 
            />
            <Route 
              path="/checkout" 
              component={() => (
                <AuthenticatedLayout>
                  <CheckoutPage />
                </AuthenticatedLayout>
              )} 
            />
          </>
        ) : (
          // Redirect to auth page if not authenticated
          <Route 
            path="/:any*"
            component={() => {
              window.location.href = "/";
              return null;
            }}
          />
        )}
        
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="socialboost-theme">
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
