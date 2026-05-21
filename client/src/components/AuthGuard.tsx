"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/PageLoader";

import { AuthGuardProps } from "@/types";

export function AuthGuard({ children, requirePremium = false }: AuthGuardProps) {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const checkoutAttemptedRef = useRef(false);

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const isSuccessRedirect = searchParams?.get("subscription") === "success";

  useEffect(() => {
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("accessToken");

    if (!isLoading && !user) {
      if (hasToken) return;
      router.replace("/login");
      return;
    }

    if (!isLoading && user && requirePremium && !user.isPremium) {
      if (isSuccessRedirect) {
        const timer = setTimeout(() => {
          refreshUser().catch(() => { });
        }, 1500);
        return () => clearTimeout(timer);
      }

      if (checkoutAttemptedRef.current) return;
      checkoutAttemptedRef.current = true;

      const initiateCheckout = async () => {
        try {
          const { createSubscription } = await import("@/lib/apis");
          const checkout = await createSubscription();
          if (checkout.checkoutUrl) {
            window.location.href = checkout.checkoutUrl;
          } else {
            router.replace("/login");
          }
        } catch {
          router.replace("/login");
        }
      };
      initiateCheckout();
    }
  }, [user, isLoading, router, requirePremium, isSuccessRedirect, refreshUser]);

  if (isLoading || (!user && typeof window !== "undefined" && localStorage.getItem("accessToken"))) {
    return <PageLoader message="Verifying session..." />;
  }

  if (isSuccessRedirect && user && !user.isPremium) {
    return <PageLoader message="Synchronizing Pro Access..." />;
  }

  if (!user || (requirePremium && !user.isPremium)) {
    return null;
  }

  return <>{children}</>;
}
