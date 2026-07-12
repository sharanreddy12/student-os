import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import type { ReactNode, MouseEvent } from "react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function GlowOrb({
  className,
  color = "blue",
}: {
  className?: string;
  color?: "blue" | "purple" | "cyan";
}) {
  const map = {
    blue: "var(--neon-blue)",
    purple: "var(--neon-purple)",
    cyan: "var(--neon-cyan)",
  } as const;
  return (
    <div
      className={cn("pointer-events-none absolute rounded-full animate-pulse-glow", className)}
      style={{ background: `radial-gradient(circle, ${map[color]}, transparent 65%)` }}
    />
  );
}

type MagneticButtonProps = {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "ghost";
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};
export function MagneticButton({
  children,
  className,
  variant = "primary",
  onClick,
  type = "button",
  disabled,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });

  function onMove(e: MouseEvent<HTMLButtonElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - r.left - r.width / 2) * 0.25);
    y.set((e.clientY - r.top - r.height / 2) * 0.35);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      disabled={disabled}
      style={{ x: sx, y: sy }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors",
        variant === "primary"
          ? "text-white shadow-glow"
          : "glass text-foreground/90 hover:text-foreground",
        className,
      )}
    >
      {variant === "primary" && (
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full animate-gradient"
          style={{ background: "var(--gradient-brand)" }}
        />
      )}
      {children}
    </motion.button>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--neon-cyan)] shadow-[0_0_10px_var(--neon-cyan)]" />
      {children}
    </div>
  );
}

export function Panel3D({
  children,
  className,
  intensity = 8,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 150, damping: 20 });
  const sry = useSpring(ry, { stiffness: 150, damping: 20 });
  const transform = useTransform(
    [srx, sry],
    ([a, b]) => `perspective(1200px) rotateX(${a}deg) rotateY(${b}deg)`,
  );

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * intensity);
    rx.set(-py * intensity);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      style={{ transform }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
