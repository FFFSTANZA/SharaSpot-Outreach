"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/PageLoader";

import { AuthGuardProps } from "@/types";

export function AuthGuard({ children, requirePremium = false }: AuthGuardProps) {
  const { user, isLoading, refreshUser, logout } = useAuth();
  const router = useRouter();
  const checkoutAttemptedRef = useRef(false);
  const [isSuccessRedirect, setIsSuccessRedirect] = useState(false);
  const [isCancelledRedirect, setIsCancelledRedirect] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsSuccessRedirect(params.get("subscription") === "success");
    setIsCancelledRedirect(params.get("subscription") === "cancelled");
  }, []);

  useEffect(() => {
    if (isCancelledRedirect) {
      const performCancelLogout = async () => {
        try {
          await logout();
        } catch (e) {
          console.error("Cancel logout failed", e);
        } finally {
          router.replace("/login?cancelled=true");
        }
      };
      performCancelLogout();
    }
  }, [isCancelledRedirect, logout, router]);

  useEffect(() => {
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("accessToken");

    if (isCancelledRedirect) return;

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

      // Shared-workspace members should not start their own checkout flow.
      // If the owner's workspace is not premium, keep them out of premium pages.
      if (user.activeOrganizationId) {
        router.replace("/dashboard/team");
        return;
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

  const hasToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  if (isLoading || (!user && hasToken)) {
    return <PageLoader message="Verifying session..." />;
  }

  if (isSuccessRedirect && user && !user.isPremium) {
    return <PageLoader message="Synchronizing Pro Access..." />;
  }

  if (!user) return null;
  if (requirePremium && !user.isPremium) return null;

  return <>{children}</>;
}
