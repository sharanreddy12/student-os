import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const LINES = [
  "> initializing StudentOS v1.0.0 ...",
  "> loading AI core .................. ok",
  "> mounting knowledge engine ........ ok",
  "> syncing semester graph ........... ok",
  "> preparing workspace .............. ok",
  "> authentication ready ............. ok",
  "> system online.",
];

export function BootSequence({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState<string[]>([]);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      setShown((s) => [...s, LINES[i]]);
      i++;
      if (i >= LINES.length) {
        clearInterval(iv);
        setTimeout(() => setHiding(true), 700);
        setTimeout(onDone, 1500);
      }
    }, 320);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <AnimatePresence>
      {!hiding && (
        <motion.div
          key="boot"
          exit={{ opacity: 0, filter: "blur(20px)" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
        >
          <div className="absolute inset-0 bg-hero opacity-40" />
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="relative w-[min(560px,90vw)] font-mono text-sm">
            <div className="mb-6 flex items-center gap-2 text-muted-foreground">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--neon-amber)]/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--neon-green)]/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--neon-blue)]/70" />
              </div>
              <span className="text-xs uppercase tracking-[0.3em]">studentos • boot</span>
            </div>
            <div className="glass-strong p-6 shadow-elevate">
              {shown.map((l, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-foreground/90"
                >
                  {l}
                </motion.div>
              ))}
              <span className="inline-block h-4 w-2 translate-y-0.5 bg-[color:var(--neon-cyan)] animate-caret" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
