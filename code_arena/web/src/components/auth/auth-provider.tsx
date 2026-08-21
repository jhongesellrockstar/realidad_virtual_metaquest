"use client";

import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getFirebaseAuth,
  getFirebaseConfigurationError,
  getFirebaseDb,
} from "@/lib/firebase/client";

type AuthContextValue = {
  configurationError: string | null;
  loading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configurationError = getFirebaseConfigurationError();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!configurationError);

  useEffect(() => {
    if (configurationError) {
      return undefined;
    }

    const auth = getFirebaseAuth();
    void setPersistence(auth, browserLocalPersistence);

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, [configurationError]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configurationError,
      loading,
      user,
      async login(email, password) {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      },
      async register(displayName, email, password) {
        const credential = await createUserWithEmailAndPassword(
          getFirebaseAuth(),
          email,
          password,
        );

        await updateProfile(credential.user, { displayName });
        await setDoc(doc(getFirebaseDb(), "users", credential.user.uid), {
          displayName,
          email: credential.user.email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setUser(credential.user);
      },
      async logout() {
        await signOut(getFirebaseAuth());
      },
    }),
    [configurationError, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}
