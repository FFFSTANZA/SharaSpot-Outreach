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
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const isSuccessRedirect = searchParams?.get("subscription") === "success";

  useEffect(() => {
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("accessToken");

    if (!isLoading && !user) {
      if (hasToken) return;
      router.replace("/login");
      return;
    }

    if (!isLoading && user && requirePremium && !(user as any).isPremium) {
      // If we just came back from a successful payment, try to proactively refresh
      if (isSuccessRedirect) {
        console.log("AuthGuard: Payment success detected. Proactively refreshing user state...");
        const timer = setTimeout(() => {
          refreshUser().catch(() => { });
        }, 1500); // 1.5s delay to allow webhook a head start
        return () => clearTimeout(timer);
      }

      console.log("AuthGuard: Premium required but user is not premium. Initiating checkout redirect...");
      const initiateCheckout = async () => {
        try {
          const { createSubscription } = await import("@/lib/apis");
          const checkout = await createSubscription();
          if (checkout.checkoutUrl) {
            window.location.href = checkout.checkoutUrl;
          } else {
            router.replace("/login");
          }
        } catch (err) {
          console.error("AuthGuard: Checkout initiation failed", err);
          router.replace("/login");
        }
      };
      initiateCheckout();
    }
  }, [user, isLoading, router, requirePremium, isSuccessRedirect, refreshUser]);

  if (isLoading || (!user && typeof window !== "undefined" && localStorage.getItem("accessToken"))) {
    return <PageLoader message="Verifying session..." />;
  }

  // Show a special loader if we are waiting for a success sync
  if (isSuccessRedirect && user && !(user as any).isPremium) {
    return <PageLoader message="Synchronizing Pro Access..." />;
  }

  if (!user || (requirePremium && !(user as any).isPremium)) {
    return null;
  }

  return <>{children}</>;
}
