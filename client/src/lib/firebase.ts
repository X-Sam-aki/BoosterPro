import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithRedirect } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "test_key",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "test-project"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "test-project",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "test-project"}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "test-app-id",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Google Authentication
const googleProvider = new GoogleAuthProvider();

// Export the auth instance and provider
export { auth, googleProvider };

// Helper functions
export const signInWithGoogle = async () => {
  try {
    // Check if we're on mobile to use redirect instead of popup
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      return await signInWithRedirect(auth, googleProvider);
    } else {
      return await signInWithPopup(auth, googleProvider);
    }
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};
