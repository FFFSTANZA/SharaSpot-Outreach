"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getUser } from "../lib/apis";
import type { User } from "@/types";

/**
 * useAuth — fetches the authenticated user on mount.
 *
 * Returns { user, isLoading, refreshUser } where user is typed as User | null.
 */
export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const searchParams = useSearchParams();

  const fetchUser = useCallback(async () => {
    try {
      const userData = await getUser();
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Sync: Re-fetch user if subscription=success is detected in URL
  useEffect(() => {
    if (searchParams.get("subscription") === "success") {
      fetchUser();
    }
  }, [searchParams, fetchUser]);

  return {
    user,
    isLoading,
    refreshUser: fetchUser
  };
};
