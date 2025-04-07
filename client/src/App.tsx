import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import { Toaster } from "@/components/ui/toaster";
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

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="socialboost-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <DashboardPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<AuthPage />} />
              <Route
                path="/marketplace"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <MarketplacePage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <OrderPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <ProfilePage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <CheckoutPage />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
