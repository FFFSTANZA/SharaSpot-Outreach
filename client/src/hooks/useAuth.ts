"use client";

import { useAuthContext } from "@/context/AuthContext";

/**
 * useAuth hook (Legacy Wrapper)
 * 
 * Now uses AuthContext to prevent redundant API calls across components.
 */
export const useAuth = () => {
  const { user, isLoading, refreshUser, logout } = useAuthContext();

  return {
    user,
    isLoading,
    refreshUser,
    logout
  };
};
