import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";
import { Calendar, FileText, CheckCircle2, Users, Sparkles, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type PanelDef = {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  className: string;
  depth: number;
  body: React.ReactNode;
  accent: string;
};

const PANELS: PanelDef[] = [
  {
    title: "Today",
    icon: Calendar,
    accent: "var(--neon-blue)",
    className: "left-[2%] top-[8%] w-[240px]",
    depth: 40,
    body: (
      <div className="space-y-2 text-xs">
        <Row time="09:00" label="Physics · Lecture" />
        <Row time="11:00" label="DSA · Lab" active />
        <Row time="14:00" label="Study block" />
      </div>
    ),
  },
  {
    title: "AI Assistant",
    icon: Sparkles,
    accent: "var(--neon-purple)",
    className: "right-[3%] top-[4%] w-[260px]",
    depth: 60,
    body: (
      <div className="space-y-2 text-xs">
        <div className="rounded-lg bg-white/5 px-3 py-2 text-foreground/80">
          "Summarize today's Physics chapter"
        </div>
        <div
          className="rounded-lg px-3 py-2 text-foreground/90"
          style={{ background: "color-mix(in oklab, var(--neon-purple) 18%, transparent)" }}
        >
          Kinematics · 4 key equations · 6 min read
        </div>
      </div>
    ),
  },
  {
    title: "Assignments",
    icon: CheckCircle2,
    accent: "var(--neon-cyan)",
    className: "left-[6%] bottom-[10%] w-[230px]",
    depth: 30,
    body: (
      <div className="space-y-2 text-xs">
        <Progress label="ML Report" value={72} />
        <Progress label="Chem Lab" value={40} />
        <Progress label="Web Project" value={90} />
      </div>
    ),
  },
  {
    title: "Attendance",
    icon: Users,
    accent: "var(--neon-green)",
    className: "right-[6%] bottom-[14%] w-[220px]",
    depth: 50,
    body: (
      <div className="flex items-end gap-1 h-16">
        {[70, 82, 64, 90, 76, 88, 74, 92].map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${v}%`,
              background: `linear-gradient(to top, var(--neon-green), color-mix(in oklab, var(--neon-cyan) 60%, transparent))`,
            }}
          />
        ))}
      </div>
    ),
  },
  {
    title: "Notes",
    icon: FileText,
    accent: "var(--neon-blue)",
    className: "left-1/2 -translate-x-1/2 top-[2%] w-[280px]",
    depth: 20,
    body: (
      <div className="space-y-1.5 text-xs">
        <div className="h-2 w-4/5 rounded-full bg-white/15" />
        <div className="h-2 w-full rounded-full bg-white/10" />
        <div className="h-2 w-3/5 rounded-full bg-white/10" />
        <div className="h-2 w-2/3 rounded-full bg-white/10" />
      </div>
    ),
  },
  {
    title: "Analytics",
    icon: BarChart3,
    accent: "var(--neon-purple)",
    className: "left-1/2 -translate-x-1/2 bottom-[4%] w-[260px]",
    depth: 70,
    body: (
      <div className="flex items-center gap-3">
        <Ring value={78} />
        <div className="text-xs space-y-1">
          <div className="text-foreground/70">Weekly focus</div>
          <div className="text-lg font-semibold">14h 32m</div>
          <div className="text-[color:var(--neon-green)]">+12%</div>
        </div>
      </div>
    ),
  },
];

function Row({ time, label, active }: { time: string; label: string; active?: boolean }) {
  return (
    <div
      className={cn("flex items-center gap-2 rounded-md px-2 py-1.5", active ? "bg-white/10" : "")}
    >
      <span className="font-mono text-[10px] text-muted-foreground">{time}</span>
      <span className="text-foreground/85">{label}</span>
      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[color:var(--neon-cyan)] shadow-[0_0_8px_var(--neon-cyan)]" />
      )}
    </div>
  );
}
function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: "var(--gradient-brand)" }}
        />
      </div>
    </div>
  );
}
function Ring({ value }: { value: number }) {
  const c = 2 * Math.PI * 22;
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" className="-rotate-90">
      <circle
        cx="30"
        cy="30"
        r="22"
        stroke="white"
        strokeOpacity="0.1"
        strokeWidth="5"
        fill="none"
      />
      <circle
        cx="30"
        cy="30"
        r="22"
        stroke="url(#g)"
        strokeWidth="5"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={c - (c * value) / 100}
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stopColor="oklch(0.68 0.19 260)" />
          <stop offset="1" stopColor="oklch(0.66 0.22 295)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function FloatingOS() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 20 });
  const smy = useSpring(my, { stiffness: 60, damping: 20 });

  useEffect(() => {
    function h(e: MouseEvent) {
      mx.set((e.clientX / window.innerWidth - 0.5) * 2);
      my.set((e.clientY / window.innerHeight - 0.5) * 2);
    }
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, [mx, my]);

  return (
    <div className="relative h-[560px] w-full">
      {PANELS.map((p, i) => (
        <FloatingPanel key={i} panel={p} mx={smx} my={smy} idx={i} />
      ))}
    </div>
  );
}

function FloatingPanel({
  panel,
  mx,
  my,
  idx,
}: {
  panel: PanelDef;
  mx: ReturnType<typeof useSpring>;
  my: ReturnType<typeof useSpring>;
  idx: number;
}) {
  const Icon = panel.icon;
  const tx = useTransform(mx, (v) => v * panel.depth);
  const ty = useTransform(my, (v) => v * panel.depth * 0.6);
  return (
    <motion.div
      style={{ x: tx, y: ty }}
      className={cn("absolute", panel.className)}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.1 + idx * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="animate-float" style={{ animationDelay: `${idx * 0.6}s` }}>
        <div className="glass-strong p-4 shadow-elevate">
          <div className="mb-3 flex items-center gap-2">
            <div
              className="grid h-6 w-6 place-items-center rounded-md"
              style={{ background: `color-mix(in oklab, ${panel.accent} 20%, transparent)` }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: panel.accent }} />
            </div>
            <span className="text-xs font-medium tracking-wide text-foreground/90">
              {panel.title}
            </span>
          </div>
          {panel.body}
        </div>
      </div>
    </motion.div>
  );
}
