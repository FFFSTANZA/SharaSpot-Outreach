"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import { loginWithGoogle } from "../../lib/apis";
import { useRouter } from "next/navigation";
import { Shield, Zap, Send, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useToast } from "@/context/ToastContext";

declare global {
  interface Window {
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

const LoginPage = () => {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) router.replace("/dashboard");
  }, [router]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          setIsLoading(true);
          try {
            const data = await loginWithGoogle(response.credential);
            localStorage.setItem("accessToken", data.accessToken);
            addToast("success", "Welcome back!");
            router.push("/dashboard");
          } catch (err) {
            console.error("Google login failed", err);
            addToast("error", "Login failed. Please try again.");
          } finally {
            setIsLoading(false);
          }
        },
        use_fedcm_for_prompt: false,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("googleButtonContainer"),
        {
          theme: "outline",
          size: "large",
          width: "384",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center"
        }
      );

      window.google.accounts.id.prompt();
    } catch (error) {
      console.error("Initialization error", error);
    }
  }, [router, addToast, sdkLoaded]);

  return (
    <div className="flex min-h-screen bg-white">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setSdkLoaded(true)}
      />
      
      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[50%] bg-gray-900 flex-col justify-between p-16">
        {/* Logo */}
        <div className="relative">
          <Logo size="md" variant="light" />
        </div>

        {/* Hero text */}
        <div className="relative">
          <h2 className="text-5xl font-bold text-white leading-tight tracking-tight mb-6">
            Professional outreach<br />
            <span className="text-brand">standardized.</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-sm leading-relaxed">
            The professional choice for multi-sender cold outreach and response management.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-4 mt-12">
            {[
              { icon: Shield, text: "AES-256 Security" },
              { icon: Zap, text: "Instant Scalability" },
              { icon: Send, text: "Human Protocol" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 px-4 py-2">
                <Icon className="h-4 w-4 text-brand" />
                <span className="text-xs font-semibold text-gray-200">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status indicator */}
        <div className="relative">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 w-fit">
            <div className="h-2 w-2 rounded-full bg-brand animate-pulse" />
            <span className="text-xs font-medium text-gray-400">System operational</span>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative bg-background">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-8 left-8 h-10 w-10 rounded-xl flex items-center justify-center
            text-gray-400 hover:text-gray-900 bg-white border border-gray-100 shadow-sm transition-all"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-16">
            <Logo size="lg" />
          </div>

          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-none">Authentication</h1>
            <p className="text-sm text-text-secondary mt-3">Secure access to your outreach dashboard</p>
          </div>

          {/* Google login container */}
          <div className="relative w-full h-12 overflow-hidden rounded-xl">
            <div
              id="googleButtonContainer"
              className="absolute inset-0 z-20 opacity-[0.01]"
            />

            <button
              className={`w-full h-full rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 flex items-center justify-center gap-3 transition-all
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              <Image
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                width={20}
                height={20}
              />
              Continue with Google
            </button>
          </div>

          <div className="my-10 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium text-gray-300 uppercase tracking-widest">Encrypted</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <p className="text-center text-xs text-gray-400 font-medium leading-relaxed">
            Standard Google OAuth Protocol.<br />
            Zero credential storage on platform.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
