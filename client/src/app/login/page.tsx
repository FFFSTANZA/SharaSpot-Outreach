"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Script from "next/script";
import { acceptInvite, loginWithGoogle } from "../../lib/apis";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Zap, Send, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import { BRAND_CONFIG } from "@/lib/config";
import { detectRegion, getCachedRegionSync } from "@/lib/geo";

declare global {
  interface Window {
    googleSdkInitialized?: boolean;
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (element: HTMLElement | null, config: {
            theme: string;
            size: string;
            text: string;
            shape: string;
            width?: string;
            logo_alignment?: string;
          }) => void;
          prompt: () => void;
        }
      }
    };
  }
}

const LoginComponent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSubscriptionSuccess = searchParams?.get("subscription") === "success";
  const inviteToken = searchParams?.get("inviteToken") || undefined;

  const { addToast } = useToast();
  const { refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [region, setRegion] = useState<"india" | "global">(
    getCachedRegionSync() || "global"
  );

  useEffect(() => {
    detectRegion().then(setRegion);
  }, []);

  useEffect(() => {
    const isCancelled = searchParams?.get("cancelled") === "true";
    if (isCancelled) {
      addToast("info", "Checkout cancelled. You have been safely logged out.");
      router.replace("/login");
    }
  }, [searchParams, addToast, router]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    if (!inviteToken) {
      router.replace("/dashboard");
      return;
    }

    (async () => {
      try {
        const result = await acceptInvite(inviteToken);
        localStorage.setItem("accessToken", result.accessToken);
        await refreshUser();
        addToast("success", `Joined ${result.organizationName}`);
      } catch {
      } finally {
        router.replace("/dashboard");
      }
    })();
  }, [router, inviteToken, addToast, refreshUser]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !sdkLoaded || !window.google || window.googleSdkInitialized) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          setIsLoading(true);
          try {
            const data = await loginWithGoogle(response.credential, inviteToken);
            localStorage.setItem("accessToken", data.accessToken);

            const updatedUser = await refreshUser();

            if (updatedUser && !updatedUser.isPremium) {
              if (isSubscriptionSuccess) {
                // Subscription success flag detected — bypassing checkout redirect to allow sync
                router.push("/dashboard?subscription=success");
                return;
              }

              try {
                const { createSubscription } = await import("@/lib/apis");
                const checkout = await createSubscription();
                if (checkout.checkoutUrl) {
                  window.location.href = checkout.checkoutUrl;
                  return;
                }
              } catch (subErr: unknown) {
                console.error("[Login] Checkout redirect failed:", subErr);
              }
            }

            router.push("/dashboard");
          } catch (err) {
            console.error("Google login failed", err);
            addToast("error", "Login failed. Please try again.");
          } finally {
            setIsLoading(false);
          }
        },
      });

      window.google.accounts.id.renderButton(
        document.getElementById("googleButtonContainer"),
        {
          theme: "outline",
          size: "large",
          width: "384",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
        }
      );

      window.googleSdkInitialized = true;
    } catch (error) {
      console.error("Initialization error", error);
    }
  }, [router, addToast, sdkLoaded, inviteToken, isSubscriptionSuccess, refreshUser]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-light/40">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setSdkLoaded(true)}
      />

      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-slate-950 flex-col justify-between p-12">
        <Image
          src="/hero-clouds.jpg"
          alt="SharaSpot login background"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,14,26,0.72)_0%,rgba(9,14,26,0.82)_45%,rgba(9,14,26,0.92)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_32%)]" />

        {/* Logo */}
        <div className="relative z-10">
          <Logo size="md" variant="light" />
        </div>

        {/* Hero content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3.5 py-1.5 mb-6 backdrop-blur-sm">
            <span className="text-[11px] font-medium text-gray-400 tracking-wide">Secure Workspace Access</span>
          </div>

          <h2 className="text-[40px] font-extrabold text-white leading-[1.08] tracking-tighter mb-5">
            Pick up where<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-blue-400">your team left off</span>
          </h2>
          <p className="text-[15px] text-gray-400 max-w-sm leading-relaxed font-medium">
            Access your SharaSpot workspace, review activity, and keep your team moving from one secure place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2.5 mt-8">
            {[
              { icon: Shield, text: "Encrypted" },
              { icon: Zap, text: "2 min setup" },
              { icon: Send, text: "Team workspace" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3.5 py-1.5 transition-colors hover:bg-white/15 backdrop-blur-sm">
                <Icon className="h-3 w-3 text-brand" />
                <span className="text-xs font-medium text-gray-300">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10">
          <div className="rounded-2xl bg-white/8 border border-white/10 p-6 backdrop-blur-sm">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-3.5 w-3.5 text-amber-400/80" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              &ldquo;SharaSpot keeps our workspace organized and makes it simple to see what needs attention next.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/[0.06]">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand to-blue-500 flex items-center justify-center shadow-lg shadow-brand/20">
                <span className="text-xs font-bold text-white">A</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Alex Chen</p>
                <p className="text-[11px] text-gray-500">Founder, NovaTech</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center px-6 md:px-10 relative">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-6 left-6 h-11 w-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center
            text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 transition-all"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-12">
            <Logo size="lg" />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-[32px] font-extrabold text-gray-900 tracking-tight leading-tight">
              Welcome back
            </h1>
            <p className="text-sm text-gray-400 mt-2.5 font-medium">
              Sign in to continue to your workspace
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand/5 border border-brand/20 px-4 py-2.5">
              <Zap className="h-4 w-4 text-brand" />
              <span className="text-xs font-bold text-brand tracking-wide">7-Day Free Trial &middot; {BRAND_CONFIG.pricing[region].symbol}{BRAND_CONFIG.pricing[region].amount}/mo</span>
            </div>
          </div>

          {/* Google login */}
          <div className="relative">
            <div
              id="googleButtonContainer"
              className="absolute inset-0 z-10 opacity-[0.01]"
            />

            <button
              disabled={isLoading}
              className={`w-full h-13 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 flex items-center justify-center gap-3 transition-all shadow-sm relative z-0 pointer-events-none
                ${isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-brand/25 hover:bg-brand-light/50 hover:shadow-md hover:shadow-brand/5 active:scale-[0.98]'}`}
            >
              <Image
                src="/google-logo.svg"
                alt="Google"
                width={18}
                height={18}
                className="shrink-0"
              />
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-[0.2em]">secured</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          {/* Security note */}
          <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-7 w-7 rounded-lg bg-brand/10 flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-brand" />
              </div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">OAuth Protected</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              We use Google OAuth for secure authentication. No passwords stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-light/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <span className="text-sm font-semibold text-gray-400">Loading secure gateway...</span>
        </div>
      </div>
    }>
      <LoginComponent />
    </Suspense>
  );
}
