import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, type User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add Workspace scopes for Chat and Meet
provider.addScope("https://www.googleapis.com/auth/chat");
provider.addScope("https://www.googleapis.com/auth/meetings.space.created");

// Fallback scopes list
const SCOPES = [
  "https://www.googleapis.com/auth/chat",
  "https://www.googleapis.com/auth/meetings.space.created"
];

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Load initial token from sessionStorage for robust preview UX across rapid developer edits
try {
  cachedAccessToken = sessionStorage.getItem("google_workspace_access_token");
} catch (e) {
  console.warn("Could not read sessionStorage for google_workspace_access_token", e);
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      try { sessionStorage.removeItem("google_workspace_access_token"); } catch (e) {}
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Google OAuth access token from Firebase Auth");
    }

    cachedAccessToken = credential.accessToken;
    try {
      sessionStorage.setItem("google_workspace_access_token", cachedAccessToken);
    } catch (e) {}
    
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken) {
    try {
      cachedAccessToken = sessionStorage.getItem("google_workspace_access_token");
    } catch (e) {}
  }
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  try {
    sessionStorage.removeItem("google_workspace_access_token");
  } catch (e) {}
};
