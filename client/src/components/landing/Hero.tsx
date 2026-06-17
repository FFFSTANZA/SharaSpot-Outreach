"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, CheckCircle2, Mail, Search,
  ShieldCheck, Clock, Send, Bell,
  Users, BarChart3, ChevronRight, TrendingUp,
  MousePointer2, Plus, X, Loader2,
  Eye, EyeOff, Star, Megaphone,
  Pause, Inbox, PhoneCall, FileText,
  UserPlus, ServerCog, LayoutDashboard,
} from "lucide-react";
import { motion, AnimatePresence, useSpring } from "framer-motion";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";

type Stage =
  | "idle"
  | "cursor-to-compose"
  | "compose-open"
  | "cursor-to-send"
  | "sending"
  | "done"
  | "cursor-to-inbox"
  | "inbox-focus";

const spring = { stiffness: 120, damping: 18, mass: 0.5 };

export default function Hero() {
  const router = useRouter();
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ sent: 340210, replies: 32, delivered: 326947 });
  const [displayStats, setDisplayStats] = useState({ sent: 340210, replies: 32, delivered: 326947 });

  const cursorX = useSpring(0, spring);
  const cursorY = useSpring(0, spring);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorClicking, setCursorClicking] = useState(false);
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number } | null>(null);
  const [contextBeat, setContextBeat] = useState(0);
  const [parallax, setParallax] = useState({ x: 0, y: 0, rotateX: 0, rotateY: 0 });
  const frameRef = useRef<HTMLDivElement>(null);

  const moveCursor = useCallback((x: number, y: number) => {
    setCursorVisible(true);
    cursorX.set(x);
    cursorY.set(y);
  }, [cursorX, cursorY]);

  const click = useCallback(() => {
    setCursorClicking(true);
    setClickRipple({ x: cursorX.get(), y: cursorY.get() });
    setTimeout(() => {
      setCursorClicking(false);
      setClickRipple(null);
    }, 400);
  }, [cursorX, cursorY]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await sleep(1400);
      if (cancelled) return;
      while (!cancelled) {
        setStage("idle");
        setProgress(0);
        await sleep(1000);
        if (cancelled) return;

        setStage("cursor-to-compose");
        moveCursor(88, 138);
        await sleep(520);
        if (cancelled) return;
        click();
        await sleep(260);
        if (cancelled) return;

        setStage("compose-open");
        await sleep(1800);
        if (cancelled) return;

        setStage("cursor-to-send");
        moveCursor(560, 540);
        await sleep(480);
        if (cancelled) return;
        click();
        await sleep(220);
        if (cancelled) return;

        setStage("sending");
        setProgress(0);
        for (let i = 0; i <= 100; i += 5) {
          if (cancelled) return;
          setProgress(i);
          await sleep(16);
        }
        setStats(prev => ({
          sent: prev.sent + 1,
          replies: prev.replies + (Math.random() > 0.6 ? 1 : 0),
          delivered: prev.delivered + 1,
        }));
        await sleep(320);
        if (cancelled) return;

        setStage("done");
        moveCursor(100, 300);
        await sleep(900);
        if (cancelled) return;

        // Move to inbox for monitoring context
        setStage("cursor-to-inbox");
        moveCursor(88, 292);
        await sleep(460);
        if (cancelled) return;
        click();
        await sleep(180);
        if (cancelled) return;

        setStage("inbox-focus");
        await sleep(1400);
        if (cancelled) return;
      }
    };
    run();
    return () => { cancelled = true; };
  }, [moveCursor, click]);

  useEffect(() => {
    const timer = setInterval(() => {
      setContextBeat((prev) => (prev + 1) % 3);
    }, 1600);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const from = { ...displayStats };
    const to = { ...stats };
    const start = performance.now();
    const duration = 560;

    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayStats({
        sent: Math.round(from.sent + (to.sent - from.sent) * eased),
        delivered: Math.round(from.delivered + (to.delivered - from.delivered) * eased),
        replies: Math.round(from.replies + (to.replies - from.replies) * eased),
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats]);

  const handleParallaxMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    setParallax({
      x: nx * 8,
      y: ny * 8,
      rotateX: -ny * 2.4,
      rotateY: nx * 2.8,
    });
  }, []);

  const handleParallaxLeave = useCallback(() => {
    setParallax({ x: 0, y: 0, rotateX: 0, rotateY: 0 });
  }, []);

  return (
    <section className="relative pt-16 pb-14 sm:pt-20 sm:pb-24 lg:pt-32 lg:pb-44 overflow-hidden bg-[#f4f7f9]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/hero-clouds.jpg')] bg-cover bg-center opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-100/35 via-white/15 to-blue-50/55" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand/10 blur-[150px] rounded-full opacity-60" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-brand/5 blur-[150px] rounded-full opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative text-center">

        {/* Headline */}
        <div className="max-w-4xl mx-auto mb-12 sm:mb-16 lg:mb-24">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-text-primary tracking-tighter leading-[1.06] mb-6 sm:mb-8"
          >
            Every email that hits spam <br />
            is a deal that never happens.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-base sm:text-lg lg:text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10 font-medium"
          >
            SharaSpot gives founders and outbound teams the controls they need to send more carefully: rotate senders, warm accounts gradually, monitor replies, and reduce the risky patterns that often hurt cold outreach.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          >
            <button
              onClick={() => router.push(user ? "/dashboard" : "/login")}
              className="w-full sm:w-auto sm:min-w-[290px] bg-white/14 backdrop-blur-xl border border-white/45 ring-1 ring-white/35 text-brand text-[11px] font-black px-8 py-3 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2.5 group uppercase tracking-[0.2em] hover:translate-y-[-1px] active:translate-y-0 shadow-[0_16px_34px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-8px_20px_rgba(255,255,255,0.12)] hover:bg-white/20 hover:border-white/60"
            >
              {user ? (
                <><LayoutDashboard className="w-4 h-4" /> Go to Dashboard</>
              ) : (
                <>Start Sending Smarter <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" /></>
              )}
            </button>
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-2 text-[11px] font-bold text-text-primary uppercase tracking-tight">
                <ShieldCheck size={16} className="text-brand" />
                Verified Outcomes
              </div>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none">Inbox-first delivery controls</p>
            </div>
          </motion.div>
        </div>

        {/* Dashboard Demo */}
        <div
          className="relative mx-auto max-w-6xl group/dashboard"
          ref={frameRef}
          onMouseMove={handleParallaxMove}
          onMouseLeave={handleParallaxLeave}
        >
          <div className="absolute -inset-16 bg-gradient-to-b from-brand/20 via-brand/10 to-transparent blur-[140px] opacity-50 -z-10 rounded-[80px]" />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{
              opacity: 1,
              y: parallax.y,
              x: parallax.x,
              scale: 1,
              rotateX: parallax.rotateX,
              rotateY: parallax.rotateY,
            }}
            transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.005 }}
            className="bg-slate-200/50 backdrop-blur-3xl border border-slate-300/60 rounded-[28px] sm:rounded-[48px] p-2 sm:p-4 shadow-[0_70px_150px_-55px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.08)] ring-2 ring-white/30 overflow-visible sm:overflow-hidden transition-all duration-700 group-hover/dashboard:shadow-[0_120px_260px_-60px_rgba(0,0,0,0.35)] [transform-style:preserve-3d]"
            style={{
              perspective: 1200,
              transformOrigin: "top center",
            }}
          >
            <div className="bg-white rounded-[20px] sm:rounded-[36px] border border-slate-200 flex flex-col h-auto sm:h-[560px] md:h-[700px] min-h-[400px] text-left relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden sm:overflow-hidden">
              <motion.div
                aria-hidden
                className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-brand/12 blur-3xl pointer-events-none"
                animate={{ x: [0, 14, 0], y: [0, 10, 0], opacity: [0.3, 0.55, 0.3] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden
                className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl pointer-events-none"
                animate={{ x: [0, -10, 0], y: [0, -8, 0], opacity: [0.25, 0.45, 0.25] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Animated Cursor */}
              {cursorVisible && (
                <>
                  <motion.div
                    className="absolute z-50 pointer-events-none"
                    style={{ x: cursorX, y: cursorY, position: "absolute", top: 0, left: 0 }}
                  >
                    <MousePointer2
                      size={20}
                      className={cn(
                        "text-slate-900 drop-shadow-lg transition-transform duration-100",
                        cursorClicking ? "scale-75" : "scale-100"
                      )}
                      strokeWidth={2}
                    />
                    {/* Cursor glow */}
                    <div className="absolute -inset-3 rounded-full bg-brand/15 blur-md -z-10" />
                  </motion.div>

                  {/* Click ripple */}
                  <AnimatePresence>
                    {clickRipple && (
                      <motion.div
                        key="ripple"
                        className="absolute z-40 pointer-events-none"
                        style={{ left: clickRipple.x - 12, top: clickRipple.y - 12 }}
                        initial={{ scale: 0.5, opacity: 0.8 }}
                        animate={{ scale: 3, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        <div className="w-6 h-6 rounded-full border-2 border-brand" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* macOS Traffic Lights */}
              <div className="absolute top-4 left-5 z-20 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500/30 shadow-sm hover:brightness-110 transition-all" />
                <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500/30 shadow-sm hover:brightness-110 transition-all" />
                <div className="w-3 h-3 rounded-full bg-green-400 border border-green-500/30 shadow-sm hover:brightness-110 transition-all" />
              </div>

              {/* macOS Window Title */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <span className="text-[9px] font-semibold text-slate-400 bg-slate-100/80 px-3 py-1 rounded-full backdrop-blur-sm">
                  sharaspot.app
                </span>
              </div>

              {/* ====== SIDEBAR ====== */}
              <div className="hidden sm:flex w-52 lg:w-56 bg-[#f8fafc] border-r border-slate-200/80 flex-col pt-14 pb-6 px-3 shrink-0">
                <div className="mb-6 px-2">
                  <Logo size="sm" />
                </div>

                {/* New Campaign button */}
                <div className="mb-6 px-1 relative" id="compose-btn">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full bg-brand text-white text-[11px] font-bold h-9 rounded-xl flex items-center justify-start gap-2.5 px-3.5 shadow-lg shadow-brand/20 transition-all"
                  >
                    <Plus size={15} />
                    <span>New Campaign</span>
                  </motion.button>
                </div>

                <nav className="flex-1 space-y-5 px-1 overflow-y-auto custom-scrollbar pr-1">
                  <SidebarGroup
                    title="Navigation"
                    items={[
                      { icon: Megaphone, label: "All Campaigns", active: stage !== "inbox-focus" },
                      { icon: Clock, label: "Scheduled" },
                      { icon: Send, label: "Sending" },
                      { icon: Pause, label: "Paused" },
                      { icon: CheckCircle2, label: "Completed" },
                    ]}
                  />

                  <SidebarGroup
                    title="Outreach"
                    items={[
                      { icon: Inbox, label: "Inbox", active: stage === "inbox-focus", count: 3 },
                      { icon: Users, label: "Contacts" },
                      { icon: PhoneCall, label: "Calls" },
                      { icon: Mail, label: "Accounts" },
                      { icon: FileText, label: "Templates" },
                    ]}
                  />

                  <SidebarGroup
                    title="Account"
                    items={[
                      { icon: UserPlus, label: "Team" },
                      { icon: ServerCog, label: "MCP" },
                      { icon: BarChart3, label: "Analytics" },
                      { icon: Star, label: "Settings" },
                    ]}
                  />
                </nav>

                <div className="pt-4 border-t border-slate-200 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase">System: Online</p>
                  </div>
                </div>
              </div>

              {/* ====== MAIN CONTENT ====== */}
              <div className="flex-1 bg-white flex flex-col min-w-0">

                {/* Top bar */}
                <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white/80">
                  <div className="relative w-full max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="text"
                      placeholder="Search campaigns..."
                      className="w-full text-[11px] bg-slate-50 border border-slate-200/60 py-1.5 pl-9 pr-8 rounded-lg focus:outline-none text-slate-500"
                      disabled
                    />
                    <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[7px] font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded border border-slate-200/80 leading-none">
                      ⌘K
                    </kbd>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.div whileHover={{ scale: 1.05 }} className="relative">
                      <Bell size={16} className="text-slate-400" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-400 border border-white" />
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-[9px] font-black shadow-sm">
                        SA
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
                    </motion.div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="px-6 border-b border-slate-200 flex items-center gap-6 bg-white">
                  {["Monitoring", "Inbox", "Settings"].map((tab, i) => (
                    <motion.div
                      key={tab}
                      whileHover={{ y: -0.5 }}
                      className={`py-3 text-[10px] font-bold uppercase tracking-[0.15em] cursor-pointer transition-all border-b-2 -mb-px ${
                        i === 0 ? "border-brand text-brand" : "border-transparent text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {tab}
                    </motion.div>
                  ))}
                </div>

                {/* Stats row */}
                <div className="px-3 sm:px-6 py-3 sm:py-4 grid grid-cols-3 gap-2 sm:gap-3 bg-[#fcfcfc] border-b border-slate-200">
                  <StatCard
                    icon={Mail}
                    label="Sent"
                    value={displayStats.sent.toLocaleString("en-US")}
                    trend="+1.2%"
                    chartColor="text-brand"
                    chartPath="M0,20 Q20,18 40,14 T80,12 T120,6 T160,4"
                  />
                  <StatCard
                    icon={CheckCircle2}
                    label="Delivered"
                    value={displayStats.delivered.toLocaleString("en-US")}
                    trend="Guarded"
                    highlight
                    chartColor="text-emerald-500"
                    chartPath="M0,18 Q20,16 40,10 T80,8 T120,4 T160,2"
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="Replies"
                    value={`${displayStats.replies}%`}
                    trend="+0.4%"
                    chartColor="text-violet-500"
                    chartPath="M0,22 Q20,20 40,18 T80,14 T120,10 T160,8"
                  />
                </div>

                {/* Activity feed */}
                <div className="flex-1 px-3 sm:px-6 py-3 sm:py-5 overflow-y-auto relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
                    <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Feed
                    </span>
                  </div>

                  <div className="relative space-y-2.5 pl-3">
                    <motion.div
                      className="absolute left-0 top-1 bottom-1 w-px bg-gradient-to-b from-brand/40 via-brand/10 to-transparent"
                      animate={{ opacity: [0.35, 0.9, 0.35] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {rows.map((row, i) => (
                      <motion.div
                        key={row.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.8 + i * 0.08, ease: "easeOut" }}
                      >
                        <ActivityRow
                          row={row}
                          isSending={stage === "sending" && i === 0}
                          progress={stage === "sending" ? progress : undefined}
                          isNew={stage === "done" && i === 0}
                          pulse={contextBeat === i % 3}
                        />
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">Demo Context</p>
                      <p className="text-[11px] font-semibold text-slate-800 mt-1 transition-all duration-400">
                        {stage === "compose-open" && "Composing personalized outreach with tracking enabled"}
                        {stage === "sending" && "Dispatching campaign across warm sender accounts"}
                        {stage === "done" && "Campaign delivered - monitoring engagement signals"}
                        {(stage === "cursor-to-inbox" || stage === "inbox-focus") && "Inbox triage: reviewing live replies and intent"}
                        {(stage === "idle" || stage === "cursor-to-compose" || stage === "cursor-to-send") && "Workflow: Compose -> Send -> Monitor -> Iterate"}
                      </p>
                    </div>
                    <span className="text-[9px] px-2 py-1 rounded-md bg-brand/10 text-brand font-bold uppercase tracking-wider shrink-0">
                      {contextBeat === 0 ? "Live Loop" : contextBeat === 1 ? "In Motion" : "Realtime"}
                    </span>
                  </div>

                  {/* Compose Modal */}
                  <AnimatePresence>
                    {(stage === "compose-open" || stage === "cursor-to-send" || stage === "sending") && (
                      <ComposeModal progress={progress} sending={stage === "sending"} />
                    )}
                  </AnimatePresence>

                  {/* Done state overlay */}
                  <AnimatePresence>
                    {stage === "done" && <DoneOverlay />}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

/* ─── Sub-components ─── */

function NavItem({ icon: Icon, label, active, count }: { icon: React.ElementType; label: string; active?: boolean; count?: number }) {
  return (
    <motion.div
      whileHover={{ x: 2 }}
      className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
        active ? "bg-brand/10 text-brand" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      <AnimatePresence>
        {active && (
          <motion.span
            initial={{ opacity: 0, scaleY: 0.2 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.2 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-brand"
          />
        )}
      </AnimatePresence>
      <Icon size={16} />
      <span className="text-[11px] flex-1">{label}</span>
      {count !== undefined && (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${active ? "bg-brand text-white" : "bg-slate-200 text-slate-500"}`}>
          {count}
        </span>
      )}
    </motion.div>
  );
}

function SidebarGroup({ title, items }: { title: string; items: Array<{ icon: React.ElementType; label: string; active?: boolean; count?: number }> }) {
  return (
    <div>
      <p className="px-3 mb-2 text-[9px] font-black tracking-[0.2em] uppercase text-slate-400">{title}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <NavItem key={item.label} icon={item.icon} label={item.label} active={item.active} count={item.count} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, highlight, chartColor, chartPath }: {
  icon: React.ElementType; label: string; value: string; trend: string;
  highlight?: boolean; chartColor?: string; chartPath?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -1, boxShadow: "0 8px 20px rgba(0,0,0,0.06)" }}
      className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3.5 shadow-sm transition-shadow"
    >
      <div className="flex items-center justify-between mb-1 sm:mb-1.5">
        <div className="p-1 sm:p-1.5 rounded-lg bg-slate-50">
          <Icon size={12} className={cn("sm:hidden", highlight ? "text-brand" : "text-slate-400")} />
          <Icon size={14} className={cn("hidden sm:block", highlight ? "text-brand" : "text-slate-400")} />
        </div>
        <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-widest">{trend}</span>
      </div>
      <div className={`text-base sm:text-lg font-black tracking-tight truncate ${highlight ? "text-brand" : "text-slate-900"}`}>
        {value}
      </div>
      <div className="text-[7px] sm:text-[8px] font-bold text-slate-400 mt-1 sm:mt-1.5 border-t border-slate-100 pt-1 sm:pt-1.5 uppercase tracking-widest">
        {label}
      </div>
      {chartPath && (
        <svg viewBox="0 0 160 24" className={`w-full h-3 sm:h-5 mt-1 ${chartColor}`} preserveAspectRatio="none">
          <path d={chartPath} stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
          <path d={`${chartPath} V24 H0 Z`} fill="currentColor" opacity={0.06} />
        </svg>
      )}
    </motion.div>
  );
}

interface RowData {
  id: string;
  initials: string;
  name: string;
  subject: string;
  color: string;
  status: string;
  time: string;
  badge: string;
}

const rows: RowData[] = [
  { id: "r1", initials: "SA", name: "Sam Altman", subject: "SharaSpot Delivery Engine Overview", color: "bg-orange-100 text-orange-700", status: "Delivered", time: "2m ago", badge: "REPLIED" },
  { id: "r2", initials: "NR", name: "Naval Ravikant", subject: "Precision Scaling Infrastructure", color: "bg-blue-100 text-blue-700", status: "Delivered", time: "6m ago", badge: "DELIVERED" },
  { id: "r3", initials: "MA", name: "Marc Andreessen", subject: "SharaSpot Protocol V2 Invitation", color: "bg-purple-100 text-purple-700", status: "Delivered", time: "15m ago", badge: "DELIVERED" },
  { id: "r4", initials: "JH", name: "Jensen Huang", subject: "NVIDIA Partnership Integration", color: "bg-green-100 text-green-700", status: "Delivered", time: "34m ago", badge: "DELIVERED" },
];

function ActivityRow({ row, isSending, progress, isNew, pulse }: { row: RowData; isSending?: boolean; progress?: number; isNew?: boolean; pulse?: boolean }) {
  return (
    <motion.div
      layout
      className={`p-3.5 rounded-xl border bg-white flex items-center justify-between transition-all ${
        isSending
          ? "border-brand shadow-[0_0_30px_rgba(59,130,246,0.1)] ring-1 ring-brand/20"
          : isNew
          ? "border-emerald-300 bg-emerald-50/30"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0 relative">
        {pulse && (
          <motion.span
            className="absolute -left-3 w-1.5 h-1.5 rounded-full bg-brand"
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`w-9 h-9 rounded-xl ${row.color} flex items-center justify-center text-[10px] font-black shrink-0`}
        >
          {row.initials}
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold text-slate-900">{row.name}</span>
            <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-bold tracking-widest ${
              row.badge === "REPLIED" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-brand/5 text-brand border border-brand/10"
            }`}>{row.badge}</span>
          </div>
          <p className="text-[10px] text-slate-500 truncate max-w-[280px]">{row.subject}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {isSending && progress !== undefined ? (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-brand rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <span className="text-[9px] font-bold text-brand tabular-nums">{progress}%</span>
          </div>
        ) : (
          <>
            <span className="hidden sm:block text-[9px] font-bold text-slate-500 uppercase tracking-wider">{row.status}</span>
            <span className="text-[8px] text-slate-400">{row.time}</span>
          </>
        )}
        <ChevronRight size={14} className="text-slate-300" />
      </div>
    </motion.div>
  );
}

function ComposeModal({ progress, sending }: { progress: number; sending: boolean }) {
  const [previewTick, setPreviewTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPreviewTick((prev) => (prev + 1) % 3);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  const contextualHint = [
    "AI personalization active",
    "Sender reputation optimized",
    "Follow-up sequence attached",
  ][previewTick];

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)", transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/10"
      style={{ WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20, transition: { duration: 0.15 } }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
         className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[420px] max-w-[calc(100vw-32px)] sm:max-w-[90vw] overflow-hidden"
      >
        {/* Compose header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="text-xs font-bold text-slate-900">New Campaign</h3>
          <X size={14} className="text-slate-400" />
        </div>

        {/* Compose body */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">To</label>
            <div className="flex flex-wrap gap-1.5">
              {["Sam Altman", "Naval Ravikant", "Marc Andreessen", "Jensen Huang"].map((name) => (
                <span key={name} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-700">
                  {name}
                  <X size={10} className="text-slate-400" />
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Subject</label>
            <div className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-3 flex items-center text-[11px] text-slate-600">
              Introduction: SharaSpot Delivery Engine
            </div>
          </div>
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Message</label>
            <div className="w-full h-20 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[10px] text-slate-500 leading-relaxed">
              Hi {`{{name}}`}, I noticed your work in {`{{industry}}`} and thought SharaSpot&apos;s delivery engine could be relevant...
            </div>
          </div>
          <motion.div
            key={contextualHint}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-brand/5 border border-brand/15 text-[9px] font-bold uppercase tracking-wider text-brand"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            {contextualHint}
          </motion.div>
        </div>

        {/* Compose footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Eye size={13} className="text-slate-400" />
            <EyeOff size={13} className="text-slate-300" />
            <span className="text-[9px] text-slate-400 font-medium">Track opens & clicks</span>
          </div>
          <div className="flex items-center gap-3">
            {sending && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                className="flex items-center gap-2 overflow-hidden"
              >
                <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
                  <motion.div
                    className="h-full bg-brand rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
                <span className="text-[9px] font-bold text-brand tabular-nums">{progress}%</span>
              </motion.div>
            )}
            <motion.button
              whileHover={sending ? {} : { scale: 1.02 }}
              whileTap={sending ? {} : { scale: 0.97 }}
              className={`text-[10px] font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                sending ? "bg-brand/50 text-white cursor-wait" : "bg-brand text-white hover:bg-brand/90 shadow-lg shadow-brand/20"
              }`}
            >
              {sending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Loader2 size={12} />
                </motion.div>
              ) : (
                <Send size={12} />
              )}
              {sending ? "Sending..." : "Send Campaign"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DoneOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="absolute bottom-4 left-6 right-6 p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-2xl"
    >
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
          className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center"
        >
          <CheckCircle2 size={20} className="text-white" />
        </motion.div>
        <div>
          <p className="text-xs font-bold text-emerald-400">Campaign Sent</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[11px] text-slate-400"
          >
            Queueing follow-up sequence...
          </motion.p>
        </div>
      </div>
      <div className="flex -space-x-2">
        {[{ i: "SA" }, { i: "NR" }, { i: "MA" }].map((s, idx) => (
          <motion.div
            key={s.i}
            initial={{ scale: 0, x: -10 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ delay: 0.3 + idx * 0.1, type: "spring", stiffness: 200, damping: 12 }}
            className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400"
          >
            {s.i}
          </motion.div>
        ))}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 12 }}
          className="w-7 h-7 rounded-full bg-brand border-2 border-slate-800 flex items-center justify-center text-[8px] font-bold text-white"
        >
          +7
        </motion.div>
      </div>
    </motion.div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
