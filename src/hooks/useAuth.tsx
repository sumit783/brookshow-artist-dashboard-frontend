import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthUser } from "../types";
import { apiClient } from "../services/apiClient";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { email: string; phone: string; displayName: string; countryCode: string; role: "artist" }) => Promise<{ user: AuthUser }>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  setSession: (user: AuthUser, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { user, token } = await apiClient.auth.login({ email, password });
    
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));
    setUser(user);
  };

  const signup = async (payload: { email: string; phone: string; displayName: string; countryCode: string; role: "artist" }) => {
    const { user } = await apiClient.auth.register(payload);
    // Don't set token here - token comes after OTP verification
    // Store user temporarily for OTP verification
    localStorage.setItem("pending_user", JSON.stringify(user));
    return { user };
  };

  const verifyOTP = async (email: string, otp: string) => {
    const { user, token } = await apiClient.auth.verifyOTP({ email, otp });
    localStorage.removeItem("pending_user");
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));
    setUser(user);
  };

  const setSession = (authUser: AuthUser, token: string) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = async () => {
    await apiClient.auth.logout();
    // Ensure no stray login state remains
    localStorage.removeItem("pending_email");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        verifyOTP,
        logout,
        isAuthenticated: !!user,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
