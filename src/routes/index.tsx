import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, Brain, Network, MessageSquare, Bot, Workflow,
  Command as CmdIcon, ShieldCheck, Zap,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import heroAurora from "@/assets/hero-aurora.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeuraOS — The AI Operating System for your second brain" },
      { name: "description", content: "Chat, memory, knowledge graph, agents, projects, and automation in one premium AI-native workspace. Built for developers, creators, and teams." },
      { property: "og:title", content: "NeuraOS — The AI Operating System" },
      { property: "og:description", content: "Your AI-native second brain. Chat, memory, agents, automation — unified." },
    ],
  }),
  component: Landing,
});

const modules = [
  { icon: MessageSquare, label: "AI Chat", desc: "Streaming multi-model conversations with full context.", hue: "ai-purple" },
  { icon: Brain, label: "Memory OS", desc: "Long-term semantic memory that grows with every interaction.", hue: "ai-orange" },
  { icon: Network, label: "Knowledge Graph", desc: "Entities, relationships, and ideas — visually traversable.", hue: "ai-cyan" },
  { icon: Bot, label: "Multi-Agent", desc: "Planner, Research, Code, Writer agents coordinating on your goals.", hue: "ai-green" },
  { icon: Workflow, label: "Automation", desc: "Trigger workflows on memory, events, or natural language.", hue: "ai-pink" },
  { icon: CmdIcon, label: "Command-first", desc: "⌘K to do anything. Keyboard-native everything.", hue: "ai-blue" },
];

function Landing() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/60 backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-7 text-[13px] text-muted-foreground">
            <a href="#modules" className="hover:text-foreground transition">Modules</a>
            <a href="#memory" className="hover:text-foreground transition">Memory</a>
            <a href="#agents" className="hover:text-foreground transition">Agents</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="text-[13px] text-muted-foreground hover:text-foreground px-3 py-1.5">
              Sign in
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-lg gradient-signature animate-gradient px-3.5 py-1.5 text-[13px] font-medium text-white shadow-[0_0_20px_-4px_rgba(122,90,248,0.6)]"
            >
              Launch NeuraOS <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div
          className="absolute inset-0 -z-10 opacity-50"
          style={{ backgroundImage: `url(${heroAurora})`, backgroundSize: "cover", backgroundPosition: "center" }}
          aria-hidden
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/80 to-background" aria-hidden />

        <div className="mx-auto max-w-5xl px-6 pt-24 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11.5px] text-muted-foreground"
          >
            <Sparkles className="h-3 w-3 text-ai-purple" /> Introducing the AI-native operating system
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}
            className="text-display mt-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl"
          >
            Your <span className="gradient-text">second brain</span>,<br />
            running on AI.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-muted-foreground"
          >
            NeuraOS unifies chat, memory, knowledge, projects, agents, and automation into one
            premium workspace. It remembers what matters. It thinks before it answers. It just works.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.18 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl gradient-signature animate-gradient px-5 py-2.5 text-[14px] font-medium text-white shadow-[0_0_36px_-8px_rgba(240,77,158,0.6)]"
            >
              Get started — it's free <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#modules" className="rounded-xl border border-border bg-surface/60 px-5 py-2.5 text-[14px] font-medium backdrop-blur hover:bg-surface">
              See how it thinks
            </a>
          </motion.div>

          {/* Product mock */}
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3 }}
            className="relative mx-auto mt-16 max-w-4xl"
          >
            <div className="absolute -inset-4 rounded-3xl gradient-signature opacity-30 blur-2xl animate-gradient" />
            <div className="relative glass-strong rounded-2xl p-2 shadow-elevated">
              <div className="rounded-xl overflow-hidden border border-border/60">
                <div className="flex items-center gap-1.5 bg-elevated/80 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                  <span className="ml-3 text-[11px] text-muted-foreground">neuraos · dashboard</span>
                </div>
                <div className="grid grid-cols-[180px_1fr] h-[300px] bg-background">
                  <div className="border-r border-border/60 p-3 space-y-1.5">
                    {["Dashboard","AI Chat","Memory","Knowledge","Projects","Agents","Automation"].map((n,i)=>(
                      <div key={n} className={`rounded-md px-2.5 py-1.5 text-[11.5px] ${i===1?"gradient-ai text-white":"text-muted-foreground"}`}>{n}</div>
                    ))}
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="text-[11px] text-muted-foreground">Good morning</div>
                    <div className="text-[20px] font-semibold text-display">What should we build today?</div>
                    <div className="glass rounded-xl p-3 text-[12px] text-muted-foreground">
                      <span className="text-ai-purple">●</span> NeuraOS planned 3 tasks from yesterday's meeting and drafted a follow-up email.
                    </div>
                    <div className="glass rounded-xl p-3 text-[12px] text-muted-foreground">
                      <span className="text-ai-cyan">●</span> 12 new memories captured. Knowledge graph updated.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-14">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ai-purple font-semibold">One OS</div>
          <h2 className="text-display mt-2 text-4xl font-bold md:text-5xl">Every tool, intelligently connected.</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Modules share memory, context, and a single command surface. Switching apps becomes obsolete.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-2xl glass p-5 hover:border-primary/40 transition-all"
            >
              <div
                className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-0 group-hover:opacity-40 transition-opacity blur-2xl"
                style={{ background: `var(--color-${m.hue})` }}
              />
              <div
                className="relative grid h-9 w-9 place-items-center rounded-lg"
                style={{ background: `color-mix(in oklab, var(--color-${m.hue}) 20%, transparent)` }}
              >
                <m.icon className="h-4 w-4" style={{ color: `var(--color-${m.hue})` }} />
              </div>
              <div className="relative mt-4 text-[15px] font-semibold">{m.label}</div>
              <div className="relative mt-1.5 text-[13px] text-muted-foreground">{m.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Memory section */}
      <section id="memory" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-ai-orange font-semibold">Memory OS</div>
            <h2 className="text-display mt-2 text-4xl font-bold md:text-5xl">
              It <span className="gradient-text">remembers</span> everything that matters.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Every conversation, document, and decision is chunked, embedded, scored for importance,
              and woven into a personal knowledge graph. NeuraOS gets smarter the longer you use it.
            </p>
            <ul className="mt-6 space-y-3 text-[14px]">
              {["Semantic + keyword hybrid retrieval","Importance scoring & deduplication","Project, workspace, and personal memory scopes","Editable, visualizable memory timeline"].map((f)=>(
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full gradient-signature" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl gradient-signature opacity-20 blur-3xl" />
            <div className="relative glass-strong rounded-2xl p-6 font-mono text-[12px]">
              <div className="text-ai-purple">memory.retrieve</div>
              <div className="text-muted-foreground">  → query: "Q4 planning notes"</div>
              <div className="text-muted-foreground">  → top_k: 8 · scope: workspace</div>
              <div className="mt-3 text-ai-cyan">found 12 memories · 4 entities</div>
              <div className="mt-3 space-y-1.5">
                {["Meeting notes · Oct 24","Decision log · roadmap","Slack thread · pricing","Doc · OKRs v3"].map(n=>(
                  <div key={n} className="rounded-md bg-surface/70 px-2 py-1.5 text-foreground/90">{n}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agents */}
      <section id="agents" className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="text-[11px] uppercase tracking-[0.18em] text-ai-green font-semibold">Multi-agent</div>
        <h2 className="text-display mt-2 text-4xl font-bold md:text-5xl">A team of agents on call.</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Planner, Research, Writer, Code, and Memory agents coordinate via the AI Orchestration Engine
          to deliver results, not just replies.
        </p>
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 md:grid-cols-5 gap-3">
          {["Planner","Research","Writer","Code","Memory"].map((n)=>(
            <div key={n} className="glass rounded-xl py-5 text-[13px] font-medium">{n}</div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto max-w-6xl px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: ShieldCheck, t: "Enterprise security", d: "JWT + OAuth 2.1, workspace isolation, audit logs." },
          { icon: Zap, t: "Fast by default", d: "Edge runtime, streaming, vector retrieval." },
          { icon: CmdIcon, t: "Keyboard native", d: "Every action has a shortcut. ⌘K to do anything." },
        ].map(({icon:Icon,t,d})=>(
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
          <div className="absolute inset-0 -z-10 aurora-bg opacity-40" />
          <h2 className="text-display text-4xl font-bold md:text-5xl">Launch your AI OS.</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Free to start. Bring your work, your notes, your thinking — NeuraOS handles the rest.
          </p>
          <Link
            to="/auth"
            className="mt-8 inline-flex items-center gap-2 rounded-xl gradient-signature animate-gradient px-6 py-3 text-[14px] font-semibold text-white shadow-[0_0_36px_-8px_rgba(240,77,158,0.6)]"
          >
            Create your workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 border-t border-border/40">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-muted-foreground">
          <Logo />
          <div>© {new Date().getFullYear()} NeuraOS. The AI Operating System.</div>
        </div>
      </footer>
    </div>
  );
}
