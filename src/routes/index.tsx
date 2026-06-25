import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight, Sparkles, Brain, Network, MessageSquare, Bot, Workflow,
  Command as CmdIcon, ShieldCheck, Zap, CheckCircle2, Calendar, FileText,
  Search, FolderKanban, Lightbulb, Cpu, Layers, Mic,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import heroAurora from "@/assets/hero-aurora.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeuraOS — Your Personal AI Operating System" },
      { name: "description", content: "One intelligent workspace that remembers everything, understands your knowledge, manages your projects, automates your workflows, and grows with you over time." },
      { property: "og:title", content: "NeuraOS — Your Personal AI Operating System" },
      { property: "og:description", content: "A lifelong AI companion. Memory, knowledge, agents, automation — unified." },
    ],
  }),
  component: Landing,
});

/* ---------------- Animated bits ---------------- */

function AuroraField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -top-40 -left-40 h-[55rem] w-[55rem] rounded-full opacity-50 blur-3xl animate-aurora"
        style={{ background: "radial-gradient(circle, #7A5AF8 0%, transparent 60%)" }} />
      <div className="absolute -top-20 right-[-10rem] h-[45rem] w-[45rem] rounded-full opacity-40 blur-3xl animate-aurora"
        style={{ background: "radial-gradient(circle, #F04D9E 0%, transparent 60%)", animationDelay: "-6s" }} />
      <div className="absolute bottom-[-20rem] left-1/3 h-[55rem] w-[55rem] rounded-full opacity-40 blur-3xl animate-aurora"
        style={{ background: "radial-gradient(circle, #2F80ED 0%, transparent 60%)", animationDelay: "-12s" }} />
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(oklch(1 0 0 / 0.6) 1px, transparent 1px)", backgroundSize: "3px 3px" }} />
    </div>
  );
}

function TypingLine({ phrases, className = "" }: { phrases: string[]; className?: string }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"type" | "hold" | "erase">("type");
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) { setText(phrases[0]); return; }
    const current = phrases[idx % phrases.length];
    let t: ReturnType<typeof setTimeout>;
    if (phase === "type") {
      if (text.length < current.length) t = setTimeout(() => setText(current.slice(0, text.length + 1)), 32);
      else t = setTimeout(() => setPhase("hold"), 1400);
    } else if (phase === "hold") {
      t = setTimeout(() => setPhase("erase"), 900);
    } else {
      if (text.length > 0) t = setTimeout(() => setText(text.slice(0, -1)), 18);
      else { setIdx(i => i + 1); setPhase("type"); }
    }
    return () => clearTimeout(t);
  }, [text, phase, idx, phrases, reduce]);

  return (
    <span className={className}>
      <span className="gradient-text-stream font-medium">{text}</span>
      <span className="ml-0.5 inline-block h-[1em] w-[2px] -mb-1 bg-ai-cyan animate-caret" />
    </span>
  );
}

function MemoryGraph() {
  const nodes = [
    { x: 50, y: 50, r: 6, c: "#7A5AF8", d: 0 },
    { x: 18, y: 28, r: 3, c: "#F04D9E", d: 0.3 },
    { x: 82, y: 24, r: 4, c: "#2F80ED", d: 0.6 },
    { x: 12, y: 72, r: 3, c: "#FF8A24", d: 0.9 },
    { x: 86, y: 76, r: 4, c: "#42C8F5", d: 1.2 },
    { x: 38, y: 14, r: 2, c: "#42C8F5", d: 0.4 },
    { x: 62, y: 86, r: 3, c: "#F04D9E", d: 0.8 },
    { x: 30, y: 60, r: 2, c: "#7A5AF8", d: 1.4 },
    { x: 70, y: 42, r: 2, c: "#FF8A24", d: 1.0 },
  ];
  const edges = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[1,5],[2,8],[3,7],[4,6]];
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <defs>
        <linearGradient id="edge" x1="0" x2="1">
          <stop offset="0" stopColor="#7A5AF8" stopOpacity="0.6" />
          <stop offset="1" stopColor="#42C8F5" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
          stroke="url(#edge)" strokeWidth="0.3" />
      ))}
      {nodes.map((n, i) => (
        <g key={i} style={{ transformOrigin: `${n.x}px ${n.y}px`, animationDelay: `${n.d}s` }} className="animate-node-pulse">
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.c} opacity="0.9" />
          <circle cx={n.x} cy={n.y} r={n.r * 2.4} fill={n.c} opacity="0.15" />
        </g>
      ))}
    </svg>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="h-1 w-1 rounded-full bg-ai-purple"
          style={{ animation: `ai-pulse 1.2s ease-in-out ${i * 0.15}s infinite` }} />
      ))}
    </span>
  );
}

/* ---------------- Modules with mini-previews ---------------- */

type ModuleCard = {
  icon: typeof MessageSquare;
  tag: string;
  headline: string;
  desc: string;
  hue: string;
  preview: React.ReactNode;
};

const modules: ModuleCard[] = [
  {
    icon: MessageSquare, tag: "Chat", hue: "ai-purple",
    headline: "Talk once. NeuraOS remembers forever.",
    desc: "Streaming, multi-model conversations with your full context.",
    preview: (
      <div className="space-y-1.5 text-[10.5px]">
        <div className="rounded-lg bg-surface/80 px-2.5 py-1.5 text-foreground/90">What did Maya decide about pricing?</div>
        <div className="rounded-lg gradient-ai/20 px-2.5 py-1.5 text-foreground/90 border border-ai-purple/30">
          <span className="text-ai-cyan">●</span> Pulling from 6 memories<ThinkingDots />
        </div>
      </div>
    ),
  },
  {
    icon: Brain, tag: "Memory", hue: "ai-orange",
    headline: "Your second brain that never forgets.",
    desc: "Every conversation, doc, and decision — embedded and recallable.",
    preview: (
      <div className="space-y-1 text-[10.5px] font-mono">
        <div className="text-ai-orange">+ 12 memories captured today</div>
        <div className="text-muted-foreground">  meeting · pricing v3 · 0.94</div>
        <div className="text-muted-foreground">  doc · OKRs Q4 · 0.91</div>
        <div className="text-muted-foreground">  slack · roadmap · 0.88</div>
      </div>
    ),
  },
  {
    icon: Network, tag: "Knowledge", hue: "ai-cyan",
    headline: "Every thought becomes connected.",
    desc: "A living knowledge graph of people, projects, and ideas.",
    preview: <div className="h-full w-full"><MemoryGraph /></div>,
  },
  {
    icon: Bot, tag: "Agents", hue: "ai-green",
    headline: "A team of agents on call.",
    desc: "Planner, Research, Writer, and Code agents coordinating for you.",
    preview: (
      <div className="space-y-1.5 text-[10.5px]">
        {[
          { n: "Planner", s: "drafting Q4 plan", c: "ai-purple" },
          { n: "Research", s: "scanning 14 sources", c: "ai-cyan" },
          { n: "Writer", s: "queued", c: "ai-pink" },
        ].map(a => (
          <div key={a.n} className="flex items-center justify-between rounded-md bg-surface/70 px-2 py-1">
            <span className="font-medium">{a.n}</span>
            <span className="text-muted-foreground" style={{ color: `var(--color-${a.c})` }}>{a.s}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Workflow, tag: "Automation", hue: "ai-pink",
    headline: "Stop repeating yourself. Let NeuraOS work.",
    desc: "Trigger flows from memory, events, or natural language.",
    preview: (
      <div className="text-[10.5px] font-mono space-y-1">
        <div><span className="text-ai-pink">when</span> meeting.ends</div>
        <div className="pl-3"><span className="text-ai-cyan">→</span> summarize · extract tasks</div>
        <div className="pl-3"><span className="text-ai-cyan">→</span> send to #team</div>
        <div className="pl-3"><span className="text-ai-cyan">→</span> schedule follow-up</div>
      </div>
    ),
  },
  {
    icon: CmdIcon, tag: "Command", hue: "ai-blue",
    headline: "⌘K does anything.",
    desc: "Keyboard-native. Every action one shortcut away.",
    preview: (
      <div className="rounded-lg border border-border bg-background/60 p-2">
        <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground">
          <Search className="h-3 w-3" /> summarize yesterday's meetings
        </div>
        <div className="mt-1.5 space-y-0.5 text-[10px]">
          <div className="rounded bg-ai-purple/20 px-1.5 py-0.5 text-foreground">↵ Summarize → Memory</div>
          <div className="px-1.5 py-0.5 text-muted-foreground">→ Open calendar</div>
        </div>
      </div>
    ),
  },
];

/* ---------------- Page ---------------- */

function Landing() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/60 backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-7 text-[13px] text-muted-foreground">
            <a href="#story" className="hover:text-foreground transition">The OS</a>
            <a href="#modules" className="hover:text-foreground transition">Modules</a>
            <a href="#moments" className="hover:text-foreground transition">Moments</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="text-[13px] text-muted-foreground hover:text-foreground px-3 py-1.5">Sign in</Link>
            <Link to="/auth"
              className="inline-flex items-center gap-1.5 rounded-lg gradient-signature animate-gradient px-3.5 py-1.5 text-[13px] font-medium text-white shadow-[0_0_20px_-4px_rgba(122,90,248,0.6)]">
              Boot NeuraOS <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <AuroraField />
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{ backgroundImage: `url(${heroAurora})`, backgroundSize: "cover", backgroundPosition: "center" }}
          aria-hidden
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/30 via-background/80 to-background" aria-hidden />

        <div className="mx-auto max-w-5xl px-6 pt-24 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11.5px] text-muted-foreground"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-ai-green opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ai-green" />
            </span>
            NeuraOS · v1 · now booting
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}
            className="text-display mt-6 text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl"
          >
            Your Personal<br />
            <span className="gradient-text">AI Operating System</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-muted-foreground"
          >
            One intelligent workspace that remembers everything, understands your knowledge,
            manages your projects, automates your workflows, and grows with you over time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.18 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/auth"
              className="inline-flex items-center gap-2 rounded-xl gradient-signature animate-gradient px-5 py-2.5 text-[14px] font-medium text-white shadow-[0_0_36px_-8px_rgba(240,77,158,0.6)]">
              Get started — it's free <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#story" className="rounded-xl border border-border bg-surface/60 px-5 py-2.5 text-[14px] font-medium backdrop-blur hover:bg-surface">
              See how it thinks
            </a>
          </motion.div>

          {/* OS preview window */}
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3 }}
            className="relative mx-auto mt-16 max-w-4xl"
          >
            <div className="absolute -inset-6 rounded-3xl gradient-signature opacity-30 blur-2xl animate-gradient" />
            <div className="relative glass-strong rounded-2xl p-2 shadow-elevated">
              <div className="rounded-xl overflow-hidden border border-border/60">
                {/* OS title bar */}
                <div className="flex items-center gap-1.5 bg-elevated/80 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                  <span className="ml-3 text-[11px] text-muted-foreground font-mono">neuraos · ~/your-mind</span>
                  <span className="ml-auto text-[10px] text-ai-green flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-ai-green animate-ai-pulse" /> online
                  </span>
                </div>
                <div className="grid grid-cols-[170px_1fr] min-h-[320px] bg-background text-left">
                  <div className="border-r border-border/60 p-2.5 space-y-0.5">
                    {[
                      { n: "Dashboard", i: Layers },
                      { n: "AI Chat", i: MessageSquare, active: true },
                      { n: "Memory", i: Brain },
                      { n: "Knowledge", i: Network },
                      { n: "Projects", i: FolderKanban },
                      { n: "Agents", i: Bot },
                      { n: "Automation", i: Workflow },
                    ].map(({ n, i: Icn, active }) => (
                      <div key={n} className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11.5px] ${active ? "gradient-ai text-white shadow-[0_0_18px_-4px_rgba(122,90,248,0.7)]" : "text-muted-foreground"}`}>
                        <Icn className="h-3 w-3" /> {n}
                      </div>
                    ))}
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="text-[11px] text-muted-foreground">Tuesday · 9:42 AM</div>
                    <div className="text-[20px] font-semibold text-display">
                      Good morning, Alex. <span className="text-muted-foreground font-normal text-[15px]">Here's what I prepared.</span>
                    </div>
                    <div className="glass rounded-xl p-3">
                      <div className="text-[10.5px] uppercase tracking-wider text-ai-purple font-semibold">NeuraOS</div>
                      <div className="mt-1 text-[12.5px]">
                        <TypingLine phrases={[
                          "Planning today's work…",
                          "Searching long-term memory…",
                          "Finding related documents…",
                          "Updating project roadmap…",
                          "Preparing meeting summary…",
                        ]} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="glass rounded-xl p-2.5 text-[11px]">
                        <div className="text-ai-cyan">3 tasks</div>
                        <div className="text-muted-foreground">due today</div>
                      </div>
                      <div className="glass rounded-xl p-2.5 text-[11px]">
                        <div className="text-ai-orange">12 memories</div>
                        <div className="text-muted-foreground">captured since 5pm</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STORY: six acts */}
      <section id="story" className="relative mx-auto max-w-5xl px-6 py-28">
        <div className="text-center mb-16">
          <div className="text-[11px] uppercase tracking-[0.2em] text-ai-purple font-semibold">The story</div>
          <h2 className="text-display mt-3 text-4xl font-bold md:text-5xl">A companion for the rest of your life.</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            NeuraOS doesn't replace your work. It learns it, organizes it, and makes you faster every day.
          </p>
        </div>

        <div className="relative">
          {/* vertical thread */}
          <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-ai-purple/40 to-transparent md:-translate-x-px" />
          {[
            { tag: "01", title: "Remember Everything", body: "Meetings, decisions, ideas — captured, embedded, and indexed the moment they happen. Nothing is ever lost again.", icon: Brain, hue: "ai-orange" },
            { tag: "02", title: "Understand Everything", body: "Documents, threads, code, transcripts — NeuraOS reads it, links it, and builds a knowledge graph that's actually yours.", icon: Network, hue: "ai-cyan" },
            { tag: "03", title: "Think Smarter", body: "Ask anything. NeuraOS pulls from your memory, your knowledge, and the world — then reasons before it answers.", icon: Lightbulb, hue: "ai-purple" },
            { tag: "04", title: "Work Faster", body: "Projects, tasks, notes, calendar — every surface is AI-native. Plan, prioritize, draft, schedule with one prompt.", icon: Zap, hue: "ai-pink" },
            { tag: "05", title: "Automate Everything", body: "Workflows triggered by memory, events, or plain language. Your repetitive work disappears into the background.", icon: Workflow, hue: "ai-blue" },
            { tag: "06", title: "Grow With You", body: "Every interaction trains your personal model of work, taste, and context. NeuraOS becomes more you, every day.", icon: Cpu, hue: "ai-green" },
          ].map((s, i) => (
            <motion.div
              key={s.tag}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className={`relative grid md:grid-cols-2 gap-6 items-center mb-12 md:mb-16 ${i % 2 ? "md:[&>div:first-child]:order-2" : ""}`}
            >
              <div className={`pl-14 md:pl-0 ${i % 2 ? "md:text-right md:pr-12" : "md:pl-12"}`}>
                <div className="text-[11px] font-mono text-muted-foreground">{s.tag}</div>
                <h3 className="text-display mt-1 text-2xl md:text-3xl font-bold">{s.title}</h3>
                <p className="mt-3 text-[14px] text-muted-foreground leading-relaxed max-w-md md:inline-block">{s.body}</p>
              </div>
              <div className="relative">
                {/* node */}
                <div className="absolute left-0 md:left-1/2 top-2 md:-translate-x-1/2 grid h-12 w-12 place-items-center rounded-2xl glass-strong"
                  style={{ boxShadow: `0 0 30px -8px var(--color-${s.hue})` }}>
                  <s.icon className="h-5 w-5" style={{ color: `var(--color-${s.hue})` }} />
                  <span className="absolute inset-0 rounded-2xl border animate-ai-pulse" style={{ borderColor: `var(--color-${s.hue})`, opacity: 0.3 }} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* INTERACTIVE MODULE CARDS */}
      <section id="modules" className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-14">
          <div className="text-[11px] uppercase tracking-[0.2em] text-ai-pink font-semibold">The modules</div>
          <h2 className="text-display mt-3 text-4xl font-bold md:text-5xl">Every tool, intelligently connected.</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Hover any module. Watch it come alive. They share memory, context, and a single command surface.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m, i) => (
            <motion.div
              key={m.tag}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-2xl glass p-5 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_-12px_rgba(122,90,248,0.5)]"
            >
              <div
                className="absolute -top-12 -right-12 h-40 w-40 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-700 blur-3xl"
                style={{ background: `var(--color-${m.hue})` }}
              />
              <div className="relative flex items-center justify-between">
                <div
                  className="grid h-9 w-9 place-items-center rounded-lg"
                  style={{ background: `color-mix(in oklab, var(--color-${m.hue}) 22%, transparent)` }}
                >
                  <m.icon className="h-4 w-4" style={{ color: `var(--color-${m.hue})` }} />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{m.tag}</span>
              </div>
              <div className="relative mt-4 text-[15px] font-semibold leading-snug">{m.headline}</div>
              <div className="relative mt-1.5 text-[12.5px] text-muted-foreground">{m.desc}</div>

              {/* Preview: expands on hover */}
              <div className="relative mt-3 overflow-hidden rounded-xl border border-border/50 bg-background/40 transition-all duration-500 max-h-0 opacity-0 group-hover:max-h-44 group-hover:opacity-100 group-hover:mt-4">
                <div className="p-3 h-32">{m.preview}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI MOMENTS */}
      <section id="moments" className="relative mx-auto max-w-5xl px-6 py-24">
        <div className="text-center mb-14">
          <div className="text-[11px] uppercase tracking-[0.2em] text-ai-orange font-semibold">AI Moments</div>
          <h2 className="text-display mt-3 text-4xl font-bold md:text-5xl">It feels alive because it is.</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Evening briefing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden glass-strong rounded-2xl p-6"
          >
            <div className="absolute inset-0 -z-10 opacity-30 gradient-signature blur-3xl" />
            <div className="text-[10.5px] uppercase tracking-wider text-ai-pink font-semibold">Tonight · 9:14 PM</div>
            <div className="mt-2 text-display text-2xl font-semibold">Good evening, Alex.</div>
            <div className="mt-4 text-[13px] text-muted-foreground">Today you completed:</div>
            <div className="mt-2 space-y-1.5 text-[13px]">
              {[
                ["12", "Tasks", CheckCircle2, "ai-green"],
                ["4", "Meetings", Calendar, "ai-blue"],
                ["23", "Memories captured", Brain, "ai-orange"],
              ].map(([n, l, Icn, c]) => (
                <div key={l as string} className="flex items-center gap-2.5">
                  {(() => { const I = Icn as typeof CheckCircle2; return <I className="h-3.5 w-3.5" style={{ color: `var(--color-${c})` }} />; })()}
                  <span className="font-semibold text-foreground tabular-nums">{n}</span>
                  <span className="text-muted-foreground">{l as string}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 text-[13px] text-muted-foreground">Tomorrow I recommend:</div>
            <div className="mt-2 space-y-1.5 text-[13px]">
              <div className="rounded-lg bg-surface/70 px-3 py-2">Finish the Memory Engine — 2h block at 9 AM.</div>
              <div className="rounded-lg bg-surface/70 px-3 py-2">Prep notes for your client meeting at 2 PM.</div>
              <div className="rounded-lg bg-surface/70 px-3 py-2">Review yesterday's research on pricing.</div>
            </div>
          </motion.div>

          {/* Live stream */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative overflow-hidden glass-strong rounded-2xl p-6"
          >
            <div className="text-[10.5px] uppercase tracking-wider text-ai-cyan font-semibold flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-ai-cyan animate-ai-pulse" /> Live · NeuraOS is thinking
            </div>
            <div className="mt-3 font-mono text-[12.5px] space-y-1.5">
              <div className="text-muted-foreground">→ <span className="text-foreground">memory.retrieve</span>(&quot;Q4 OKRs&quot;)</div>
              <div className="text-muted-foreground pl-3">found 8 chunks · 3 entities</div>
              <div className="text-muted-foreground">→ <span className="text-foreground">graph.expand</span>(entity: Project Atlas)</div>
              <div className="text-muted-foreground pl-3">linked: 4 docs, 2 people, 6 tasks</div>
              <div className="text-muted-foreground">→ <span className="text-foreground">planner.draft</span>()</div>
              <div className="pl-3">
                <TypingLine className="" phrases={[
                  "outlining roadmap for next sprint",
                  "ranking tasks by impact × urgency",
                  "scheduling deep work blocks",
                ]} />
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-ai-purple/30 bg-ai-purple/5 p-3 text-[12.5px]">
              <Sparkles className="inline h-3.5 w-3.5 text-ai-purple mr-1.5" />
              I noticed you haven't reviewed Maya's pricing thread. Summarize into memory?
              <div className="mt-2 flex gap-2">
                <button className="rounded-md gradient-ai px-2.5 py-1 text-[11px] text-white">Yes</button>
                <button className="rounded-md bg-surface px-2.5 py-1 text-[11px] text-muted-foreground">Later</button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Per-module AI strip */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            { i: FolderKanban, t: "Projects", s: "AI planning", c: "ai-purple" },
            { i: CheckCircle2, t: "Tasks", s: "AI prioritization", c: "ai-green" },
            { i: FileText, t: "Notes", s: "AI summaries", c: "ai-orange" },
            { i: Calendar, t: "Calendar", s: "Smart scheduling", c: "ai-blue" },
            { i: Search, t: "Search", s: "Semantic answers", c: "ai-cyan" },
            { i: Mic, t: "Voice", s: "Always listening", c: "ai-pink" },
          ].map(({ i: I, t, s, c }) => (
            <div key={t} className="glass rounded-xl p-3">
              <I className="h-3.5 w-3.5" style={{ color: `var(--color-${c})` }} />
              <div className="mt-2 text-[12px] font-medium">{t}</div>
              <div className="text-[10.5px] text-muted-foreground">{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto max-w-6xl px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: ShieldCheck, t: "Yours alone", d: "Workspace isolation, audit logs, encrypted at rest." },
          { icon: Zap, t: "Instant by default", d: "Edge runtime, streaming responses, vector recall in milliseconds." },
          { icon: CmdIcon, t: "Keyboard native", d: "Every action one shortcut away. ⌘K to do anything." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="glass rounded-2xl p-5">
            <Icon className="h-4 w-4 text-ai-purple" />
            <div className="mt-3 text-[14px] font-semibold">{t}</div>
            <div className="mt-1 text-[12.5px] text-muted-foreground">{d}</div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section id="pricing" className="mx-auto max-w-3xl px-6 py-24 text-center">
        <div className="relative overflow-hidden rounded-3xl glass-strong p-10">
          <div className="absolute inset-0 -z-10 aurora-bg opacity-50 animate-aurora" />
          <h2 className="text-display text-4xl font-bold md:text-5xl">Boot your AI OS.</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Free to start. Bring your work, your notes, your thinking — NeuraOS handles the rest, for life.
          </p>
          <Link to="/auth"
            className="mt-8 inline-flex items-center gap-2 rounded-xl gradient-signature animate-gradient px-6 py-3 text-[14px] font-semibold text-white shadow-[0_0_36px_-8px_rgba(240,77,158,0.6)]">
            Create your workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 border-t border-border/40">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-muted-foreground">
          <Logo />
          <div>© {new Date().getFullYear()} NeuraOS · The AI Operating System for your life.</div>
        </div>
      </footer>
    </div>
  );
}
