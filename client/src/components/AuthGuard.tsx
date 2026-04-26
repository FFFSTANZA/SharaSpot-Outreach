"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { PageLoader } from "@/components/PageLoader";

import { AuthGuardProps } from "@/types";

/**
 * AuthGuard - Protects routes from unauthenticated access.
 *
 * WHY branded loader: Instead of a generic spinner, we show the SharaSpot logo
 * with a breathing animation. This reinforces the brand during the brief
 * auth check and prevents the flash of protected content.
 */
export function AuthGuard({ children, requirePremium = false }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("accessToken");

    if (!isLoading && !user) {
      if (hasToken) {
        // We have a token but no user yet. 
        // This is likely a race condition where the token was just set but the context hasn't refreshed.
        // We should wait for a bit or manually trigger a refresh if not already loading.
        console.log("AuthGuard: Token exists but no user. Waiting for state sync...");
        return;
      }

      console.log("AuthGuard: No token and no user, redirecting to login.");
      router.replace("/login");
      return;
    }

    if (!isLoading && user && requirePremium && !(user as any).isPremium) {
      addToast("info", "This feature requires a Pro subscription.");
      router.replace("/dashboard/settings/billing");
    }
  }, [user, isLoading, router, addToast, requirePremium]);

  if (isLoading || (!user && typeof window !== "undefined" && localStorage.getItem("accessToken"))) {
    return <PageLoader message="Verifying session..." />;
  }

  if (!user || (requirePremium && !(user as any).isPremium)) {
    return null;
  }

  return <>{children}</>;
}
