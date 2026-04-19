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

      // Render the standard button into the container
      // This is much more reliable than id.prompt() for a button click action
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

      // We still try one-tap for convenience
      window.google.accounts.id.prompt();
    } catch (error) {
      console.error("Initialization error", error);
    }
  }, [router, addToast, sdkLoaded]);

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-50 to-[#E8F8ED]">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setSdkLoaded(true)}
      />
      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-gray-900 to-[#0A2F1A] flex-col justify-between p-12">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#00A63E]/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#00A63E]/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-20 w-24 h-24 border border-white/5 rounded-2xl rotate-12" />
        <div className="absolute bottom-32 left-16 w-16 h-16 border border-white/5 rounded-full" />

        {/* Logo */}
        <div className="relative">
          <Logo size="md" variant="light" />
        </div>

        {/* Hero text */}
        <div className="relative">
          <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tighter mb-4">
            Reach the right people<br />
            <span className="text-[#00A63E]">with smart outreach</span>
          </h2>
          <p className="text-base text-gray-300 max-w-sm leading-relaxed">
            Send personalized emails at scale with intelligent scheduling, reply detection, and real-time analytics.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 mt-8">
            {[
              { icon: Shield, text: "Encrypted credentials" },
              { icon: Zap, text: "2 min setup" },
              { icon: Send, text: "Smart sequencing" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5">
                <Icon className="h-3.5 w-3.5 text-[#00A63E]" />
                <span className="text-xs font-medium text-gray-200">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative">
          <div className="rounded-xl bg-white/5 border border-white/10 p-5">
            <p className="text-sm text-gray-300 leading-relaxed italic">
              &ldquo;SharaSpot helped me land 3 investor meetings in my first week. The reply detection is a game changer.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="h-8 w-8 rounded-full bg-[#00A63E] flex items-center justify-center">
                <span className="text-xs font-bold text-white">A</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Alex Chen</p>
                <p className="text-[10px] text-gray-500">Founder, NovaTech</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 relative">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-4 left-4 md:top-6 md:left-6 h-10 w-10 rounded-xl flex items-center justify-center
            text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-10">
            <Logo size="lg" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tighter">Welcome back</h1>
            <p className="text-sm text-gray-600 mt-2">Sign in to continue your outreach</p>
          </div>

          {/* Google login container */}
          <div className="relative w-full h-12 overflow-hidden rounded-xl">
            {/* The Google button is rendered here and made invisible to the eye but clickable over our custom design */}
            <div
              id="googleButtonContainer"
              className="absolute inset-0 z-20 opacity-[0.01]"
            />

            <button
              className={`w-full h-12 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 flex items-center justify-center gap-2.5 transition-all shadow-sm
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 hover:border-gray-300'}`}
            >
              <Image
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                width={18}
                height={18}
              />
              Continue with Google
            </button>
          </div>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[11px] font-medium text-gray-300 uppercase tracking-wider">secure</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <p className="text-center text-xs text-gray-500 leading-relaxed">
            We use Google OAuth for secure authentication.<br />
            No passwords stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
