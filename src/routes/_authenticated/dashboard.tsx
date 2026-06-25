import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles, ArrowUpRight, MessageSquare, CheckSquare, Calendar, Brain, FolderKanban, Network,
  TrendingUp, Clock,
} from "lucide-react";
import { ModulePage } from "@/components/os/ModulePage";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <ModulePage>
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="space-y-2"
      >
        <div className="text-[12px] text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
        <h1 className="text-display text-4xl font-semibold tracking-tight">
          {greet}. <span className="gradient-text">What should we build today?</span>
        </h1>
      </motion.div>

      {/* AI briefing */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
        className="relative overflow-hidden rounded-2xl glass-strong p-5"
      >
        <div className="absolute inset-0 -z-10 aurora-bg opacity-40" />
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-signature animate-gradient">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] uppercase tracking-wider text-ai-purple font-semibold">AI Briefing</div>
            <p className="mt-1 text-[14px] leading-relaxed">
              You have <span className="text-foreground font-medium">3 tasks</span> due today, <span className="text-foreground font-medium">2 meetings</span> on your calendar,
              and <span className="text-foreground font-medium">12 new memories</span> captured since yesterday. Focus area: <em>Q4 roadmap drafting</em>.
            </p>
            <button className="mt-3 inline-flex items-center gap-1 text-[12.5px] text-ai-cyan hover:text-ai-purple transition">
              Open full briefing <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: CheckSquare, label: "Tasks", value: "12", change: "+3 today", hue: "ai-blue" },
          { icon: FolderKanban, label: "Active projects", value: "4", change: "1 due Friday", hue: "ai-purple" },
          { icon: Brain, label: "Memories", value: "1,284", change: "+12 today", hue: "ai-orange" },
          { icon: Network, label: "Knowledge nodes", value: "326", change: "+8 today", hue: "ai-cyan" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 * i }}
            className="glass rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <s.icon className="h-4 w-4" style={{ color: `var(--color-${s.hue})` }} />
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="mt-3 text-display text-2xl font-semibold">{s.value}</div>
            <div className="text-[11.5px] text-muted-foreground">{s.label}</div>
            <div className="mt-2 text-[10.5px] text-ai-green">{s.change}</div>
          </motion.div>
        ))}
      </div>

      {/* Two column */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-display font-semibold text-[15px]">Recent activity</h3>
            <button className="text-[12px] text-muted-foreground hover:text-foreground">View all</button>
          </div>
          <div className="mt-4 space-y-2.5">
            {[
              { icon: MessageSquare, text: "New conversation with Research Agent about Q4 OKRs", time: "12m", hue: "ai-purple" },
              { icon: Brain, text: "8 memories indexed from today's meeting notes", time: "1h", hue: "ai-orange" },
              { icon: CheckSquare, text: "Completed: 'Draft pricing experiments doc'", time: "2h", hue: "ai-green" },
              { icon: Network, text: "Added entity 'Project Atlas' linked to 4 docs", time: "3h", hue: "ai-cyan" },
              { icon: FolderKanban, text: "Project 'Onboarding v2' moved to In Review", time: "Yesterday", hue: "ai-blue" },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-surface/60 transition">
                <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, var(--color-${a.hue}) 18%, transparent)` }}>
                  <a.icon className="h-3.5 w-3.5" style={{ color: `var(--color-${a.hue})` }} />
                </div>
                <div className="flex-1 text-[13px]">{a.text}</div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{a.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-ai-blue" />
              <h3 className="text-display font-semibold text-[15px]">Today</h3>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { t: "Design sync", time: "10:00" },
                { t: "1:1 with Maya", time: "13:30" },
                { t: "Roadmap review", time: "16:00" },
              ].map((e) => (
                <div key={e.t} className="flex items-center justify-between rounded-lg bg-surface/60 px-3 py-2 text-[12.5px]">
                  <span>{e.t}</span>
                  <span className="text-muted-foreground">{e.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden glass rounded-2xl p-5">
            <div className="absolute inset-0 -z-10 opacity-30 gradient-signature blur-3xl" />
            <div className="text-[11px] uppercase tracking-wider text-ai-pink font-semibold">AI Suggestion</div>
            <p className="mt-2 text-[13px]">You haven't reviewed yesterday's Slack discussion on pricing. Want me to summarize it into a memory?</p>
            <div className="mt-3 flex gap-2">
              <button className="rounded-lg gradient-ai px-3 py-1.5 text-[11.5px] font-medium text-white">Summarize</button>
              <button className="rounded-lg bg-surface px-3 py-1.5 text-[11.5px] text-muted-foreground">Skip</button>
            </div>
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
