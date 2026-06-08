"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

type UserType = {
  auth_method: string;
};

type AuthContextType = {
  requireAuth: (action: () => void) => void;
  isAuthenticated: boolean;
  user: UserType | null;
  login: (token: string, user: UserType) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const router = useRouter();

  // Load authentication status on initial mount
  useEffect(() => {
    const token = localStorage.getItem("lilla_token");
    const storedUser = localStorage.getItem("lilla_user");
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("lilla_token");
        localStorage.removeItem("lilla_user");
      }
    }
  }, []);

  const requireAuth = (action: () => void) => {
    if (isAuthenticated) {
      action(); // User is verified, execute immediately
    } else {
      router.push("/login");
    }
  };

  const login = (token: string, userData: UserType) => {
    localStorage.setItem("lilla_token", token);
    localStorage.setItem("lilla_user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("lilla_token");
    localStorage.removeItem("lilla_user");
    setUser(null);
    setIsAuthenticated(false);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ requireAuth, isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}