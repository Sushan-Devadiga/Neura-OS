import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function AIDock() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-6 right-6 z-40 grid h-12 w-12 place-items-center rounded-full gradient-signature animate-gradient text-white",
          "shadow-[0_8px_32px_-8px_rgba(122,90,248,0.8)] transition-transform hover:scale-110",
        )}
        aria-label="Open AI assistant"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="fixed bottom-24 right-6 z-40 w-[380px] max-w-[calc(100vw-2rem)] glass-strong rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="grid h-7 w-7 place-items-center rounded-lg gradient-signature">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <div className="text-[13px] font-semibold">NeuraOS Assistant</div>
                <div className="text-[10.5px] text-muted-foreground">Context: your workspace</div>
              </div>
            </div>
            <div className="rounded-xl bg-surface/70 p-3 text-[12.5px] text-muted-foreground">
              Hi — I see everything you've worked on. Ask me to plan your day, draft a doc,
              search your memory, or kick off an agent.
            </div>
            <div className="mt-3 flex items-end gap-2 rounded-xl border border-border bg-background/70 p-2">
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ask anything…"
                rows={1}
                className="flex-1 resize-none bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
              <button
                disabled={!value.trim()}
                className="grid h-8 w-8 place-items-center rounded-lg gradient-ai text-white disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
