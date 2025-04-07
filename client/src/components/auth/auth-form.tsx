import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';

export function AuthForm() {
  const [activeTab, setActiveTab] = useState<string>('login');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Login form state
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  // Signup form state
  const [fullName, setFullName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all fields'
      });
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast({
        title: 'Success',
        description: 'You have been logged in'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to login'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !signupEmail || !signupPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all fields'
      });
      return;
    }

    if (!agreeTerms) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must agree to the terms and privacy policy'
      });
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      
      // Create user in our backend
      await apiRequest('POST', '/api/users', {
        email: signupEmail,
        username: fullName.replace(/\s+/g, '').toLowerCase(),
        displayName: fullName,
        firebaseUid: userCredential.user.uid
      });
      
      toast({
        title: 'Success',
        description: 'Your account has been created'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create account'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Create or update user in our backend
      await apiRequest('POST', '/api/users/google-auth', {
        email: result.user.email,
        displayName: result.user.displayName,
        firebaseUid: result.user.uid,
        avatarUrl: result.user.photoURL
      });
      
      toast({
        title: 'Success',
        description: 'You have been logged in with Google'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to login with Google'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="text-primary-dark dark:text-primary inline-flex items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 p-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mt-4">SocialBoost</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Your shortcut to social media success</p>
      </div>

      {/* Auth Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login" className="py-3">Login</TabsTrigger>
            <TabsTrigger value="signup" className="py-3">Sign Up</TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login" className="p-6 animate-in slide-in-from-bottom-5">
            <form onSubmit={handleLogin} className="flex flex-col space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your@email.com" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="ml-2">Remember me</Label>
                </div>
                <a href="#" className="text-primary dark:text-primary-dark hover:underline">
                  Forgot password?
                </a>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Log In'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="flex items-center justify-center"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 mr-2" alt="Google logo" />
                  Google
                </Button>
                <Button 
                  variant="outline" 
                  disabled={isLoading}
                  className="flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.86-3.08.38-1.09-.51-2.08-.53-3.23 0-1.44.67-2.2.51-3.08-.38C3.18 15.9 3.85 9.07 8.4 8.86c1.35.07 2.28.88 3.15.88.93 0 2.02-.89 3.6-.84 3.49.15 4.86 3.67 4.86 3.67-3.53 1.82-2.99 5.52.04 7.71zM12.77 4.05c.99-1.18 1.65-2.88 1.51-4.55-1.55.12-3.34 1.05-4.39 2.28C9 2.89 8.19 4.62 8.36 6c1.72.12 3.44-.87 4.41-1.95z" />
                  </svg>
                  Apple
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Signup Form */}
          <TabsContent value="signup" className="p-6 animate-in slide-in-from-bottom-5">
            <form onSubmit={handleSignup} className="flex flex-col space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  type="text" 
                  placeholder="John Doe" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="signupEmail">Email</Label>
                <Input 
                  id="signupEmail" 
                  type="email" 
                  placeholder="your@email.com" 
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="signupPassword">Password</Label>
                <Input 
                  id="signupPassword" 
                  type="password" 
                  placeholder="••••••••" 
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required 
                />
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="terms" 
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="ml-2 text-sm">
                  I agree to the <a href="#" className="text-primary dark:text-primary-dark hover:underline">Terms</a> and{" "}
                  <a href="#" className="text-primary dark:text-primary-dark hover:underline">Privacy Policy</a>
                </Label>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="flex items-center justify-center"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 mr-2" alt="Google logo" />
                  Google
                </Button>
                <Button 
                  variant="outline" 
                  disabled={isLoading}
                  className="flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.86-3.08.38-1.09-.51-2.08-.53-3.23 0-1.44.67-2.2.51-3.08-.38C3.18 15.9 3.85 9.07 8.4 8.86c1.35.07 2.28.88 3.15.88.93 0 2.02-.89 3.6-.84 3.49.15 4.86 3.67 4.86 3.67-3.53 1.82-2.99 5.52.04 7.71zM12.77 4.05c.99-1.18 1.65-2.88 1.51-4.55-1.55.12-3.34 1.05-4.39 2.28C9 2.89 8.19 4.62 8.36 6c1.72.12 3.44-.87 4.41-1.95z" />
                  </svg>
                  Apple
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
