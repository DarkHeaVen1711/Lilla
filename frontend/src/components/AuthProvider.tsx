"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

type AuthContextType = {
  requireAuth: (action: () => void) => void;
  isAuthenticated: boolean;
  login: () => void;
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
  const router = useRouter();

  // State Controller Logic
  const requireAuth = (action: () => void) => {
    if (isAuthenticated) {
      action(); // User is verified, execute immediately
    } else {
      router.push("/login");
    }
  };

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  return (
    <AuthContext.Provider value={{ requireAuth, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}