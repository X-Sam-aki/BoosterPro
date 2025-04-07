import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        // Get the ID token and store it in localStorage
        const token = await user.getIdToken();
        localStorage.setItem('token', token);

        // Update the token every hour
        setInterval(async () => {
          const newToken = await user.getIdToken(true);
          localStorage.setItem('token', newToken);
        }, 3600000);
      } else {
        localStorage.removeItem('token');
        queryClient.clear();
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Send the user data to our backend
      const response = await fetch('/api/users/google-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await result.user.getIdToken()}`
        },
        body: JSON.stringify({
          email: result.user.email,
          displayName: result.user.displayName,
          firebaseUid: result.user.uid,
          avatarUrl: result.user.photoURL
        })
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with backend');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('token');
      queryClient.clear();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 