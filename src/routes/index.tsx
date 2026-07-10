import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles, ArrowRight, Play, Github, BookOpen, Command, Brain,
  FileText, Calculator, ImageIcon, ListChecks, Quote, Zap,
  TrendingUp, Flame, Calendar, Target, Briefcase, Rocket,
  GraduationCap, Award, Code2,
} from "lucide-react";
import { BootSequence } from "@/components/landing/BootSequence";
import { FloatingOS } from "@/components/landing/FloatingOS";
import { GlowOrb, MagneticButton, Panel3D, SectionLabel } from "@/components/landing/atoms";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    // if user already booted this session, skip
    if (typeof window !== "undefined" && sessionStorage.getItem("sos-booted")) {
      setBooted(true);
    }
  }, []);
  useEffect(() => {
    if (booted && typeof window !== "undefined") sessionStorage.setItem("sos-booted", "1");
  }, [booted]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {!booted && <BootSequence onDone={() => setBooted(true)} />}
      <AmbientBackground />
      <Nav />
      <AnimatePresence>
        {booted && (
          <motion.main
            initial={{ opacity: 0, filter: "blur(20px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Hero />
            <AICore />
            <Workspace />
            <Notes />
            <RAG />
            <Analytics />
            <Timeline />
            <Career />
            <FinalCTA />
            <Footer />
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- ambient ---------- */
function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-hero" />
      <div className="absolute inset-0 bg-grid opacity-60" />
      <GlowOrb color="blue" className="h-[500px] w-[500px] left-[-150px] top-[10%]" />
      <GlowOrb color="purple" className="h-[420px] w-[420px] right-[-120px] top-[40%]" />
      <GlowOrb color="cyan" className="h-[380px] w-[380px] left-[30%] top-[110%]" />
    </div>
  );
}

/* ---------- nav ---------- */
function Nav() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="fixed top-4 left-1/2 z-50 -translate-x-1/2"
    >
      <div className="glass-strong flex items-center gap-1 px-2 py-2 pl-4">
        <Link to="/" className="mr-4 flex items-center gap-2 text-sm font-semibold tracking-tight">
          <LogoMark />
          <span>StudentOS</span>
        </Link>
        <NavLink label="AI" href="#ai" />
        <NavLink label="Workspace" href="#workspace" />
        <NavLink label="Analytics" href="#analytics" />
        <NavLink label="Career" href="#career" />
        <Link
          to="/dashboard"
          className="ml-2 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-white shadow-glow"
          style={{ background: "var(--gradient-brand)" }}
        >
          Launch <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </motion.nav>
  );
}
function NavLink({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} className="rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">
      {label}
    </a>
  );
}
function LogoMark() {
  return (
    <span className="grid h-6 w-6 place-items-center rounded-md" style={{ background: "var(--gradient-brand)" }}>
      <span className="h-2 w-2 rounded-sm bg-background" />
    </span>
  );
}

/* ---------- hero ---------- */
function Hero() {
  return (
    <section className="relative pt-40 pb-24">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="flex justify-center"
        >
          <SectionLabel>System online</SectionLabel>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(20px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.35, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 text-[clamp(3rem,9vw,7.5rem)] font-semibold leading-[0.95] tracking-tight"
        >
          Student<span className="text-gradient">OS</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.9 }}
          className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
        >
          Your AI operating system for academic success. One intelligent surface for notes, classes, assignments, and everything in between.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.9 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/dashboard">
            <MagneticButton>
              <Sparkles className="h-4 w-4" />
              Launch StudentOS
            </MagneticButton>
          </Link>
          <MagneticButton variant="ghost">
            <Play className="h-4 w-4" />
            Watch demo
          </MagneticButton>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto mt-20 max-w-6xl px-6"
      >
        <FloatingOS />
      </motion.div>
    </section>
  );
}

/* ---------- AI Core ---------- */
function AICore() {
  const [step, setStep] = useState(0);
  const messages = [
    { from: "user", text: "What should I study today?" },
    { from: "ai", text: "You have Physics tomorrow — I noticed 3 concepts from Chapter 4 aren't in your notes yet." },
    { from: "ai", text: "2 assignments are pending, and Mathematics attendance dropped to 71%." },
    { from: "ai", text: "Recommended focus: 2h Physics · 45m Math review · 30m ML report." },
  ];
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && step === 0) {
          let i = 0;
          const t = setInterval(() => {
            i++;
            setStep(i);
            if (i >= messages.length) clearInterval(t);
          }, 900);
        }
      },
      { threshold: 0.4 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [step, messages.length]);

  return (
    <section id="ai" ref={ref} className="relative py-40">
      <div className="mx-auto max-w-6xl px-6 grid gap-16 lg:grid-cols-2 items-center">
        <div>
          <SectionLabel>The AI</SectionLabel>
          <h2 className="mt-5 text-5xl md:text-6xl font-semibold tracking-tight">
            An intelligence <br /> that <span className="text-gradient">knows your semester.</span>
          </h2>
          <p className="mt-6 max-w-lg text-muted-foreground">
            Not a chatbot bolted on. StudentOS understands your timetable, notes, deadlines, and progress — and quietly plans your next move.
          </p>
        </div>
        <div className="relative">
          <Panel3D intensity={6}>
            <div className="relative">
              <div className="absolute -inset-8 rounded-[3rem] blur-3xl opacity-70"
                style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--neon-purple) 40%, transparent), transparent 70%)" }} />
              <div className="relative glass-strong shadow-elevate p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl"
                    style={{ background: "var(--gradient-brand)" }}>
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">AI Core</div>
                    <div className="text-xs text-muted-foreground">Thinking with your data</div>
                  </div>
                  <span className="ml-auto h-2 w-2 rounded-full bg-[color:var(--neon-green)] shadow-[0_0_10px_var(--neon-green)]" />
                </div>
                <div className="space-y-3 min-h-[260px]">
                  {messages.slice(0, step).map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ duration: 0.5 }}
                      className={m.from === "user" ? "flex justify-end" : "flex justify-start"}
                    >
                      <div className={
                        m.from === "user"
                          ? "max-w-[80%] rounded-2xl rounded-br-sm bg-white/10 px-4 py-2 text-sm"
                          : "max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2 text-sm"
                      }
                        style={m.from === "ai" ? { background: "color-mix(in oklab, var(--neon-purple) 18%, transparent)" } : undefined}>
                        {m.text}
                      </div>
                    </motion.div>
                  ))}
                  {step < messages.length && (
                    <div className="flex gap-1.5 pl-2">
                      {[0,1,2].map(i=>(
                        <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-[color:var(--neon-purple)]"
                          animate={{ opacity: [0.3,1,0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i*0.15 }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Panel3D>
        </div>
      </div>
    </section>
  );
}

/* ---------- Workspace ---------- */
function Workspace() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1, 1.05]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.8, 1], [0, 1, 1, 0.4]);

  return (
    <section id="workspace" ref={ref} className="relative py-40">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <SectionLabel>The Digital Workspace</SectionLabel>
        <h2 className="mt-5 text-5xl md:text-6xl font-semibold tracking-tight">
          Your entire semester, <br /> <span className="text-gradient">assembled.</span>
        </h2>
      </div>
      <motion.div style={{ scale, opacity }} className="mx-auto mt-16 max-w-7xl px-6">
        <Panel3D intensity={4}>
          <div className="glass-strong shadow-elevate p-4">
            <BentoDashboard />
          </div>
        </Panel3D>
      </motion.div>
    </section>
  );
}

function BentoDashboard() {
  return (
    <div className="grid grid-cols-6 gap-3 min-h-[520px]">
      <Cell className="col-span-2 row-span-2" title="Timetable" icon={Calendar}>
        <div className="grid grid-cols-5 gap-1 text-[10px]">
          {Array.from({ length: 25 }).map((_, i) => {
            const on = [2,7,8,13,17,20].includes(i);
            return (
              <div key={i}
                className="aspect-square rounded-md"
                style={{
                  background: on ? "color-mix(in oklab, var(--neon-blue) 30%, transparent)" : "rgba(255,255,255,0.04)",
                  boxShadow: on ? "0 0 20px color-mix(in oklab, var(--neon-blue) 40%, transparent)" : undefined,
                }}/>
            );
          })}
        </div>
      </Cell>
      <Cell className="col-span-2" title="Assignments" icon={ListChecks}>
        <div className="space-y-2 text-xs">
          {[["ML Report", 72],["Chem Lab", 40],["Web Project", 90]].map(([l,v])=>(
            <div key={l as string}>
              <div className="mb-1 flex justify-between text-muted-foreground text-[10px]">
                <span>{l}</span><span>{v}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/10">
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${v}%` }} viewport={{ once: true }} transition={{ duration: 1 }}
                  className="h-full rounded-full" style={{ background: "var(--gradient-brand)" }} />
              </div>
            </div>
          ))}
        </div>
      </Cell>
      <Cell className="col-span-2" title="Streak" icon={Flame} accent="var(--neon-amber)">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-4xl font-semibold">27</div>
            <div className="text-xs text-muted-foreground">day streak</div>
          </div>
          <div className="flex gap-0.5">
            {Array.from({length:14}).map((_,i)=>(
              <div key={i} className="w-1.5 rounded-sm"
                style={{ height: `${20 + (i%5)*8}px`,
                  background: "color-mix(in oklab, var(--neon-amber) 60%, transparent)"}}/>
            ))}
          </div>
        </div>
      </Cell>
      <Cell className="col-span-2" title="Attendance" icon={GraduationCap} accent="var(--neon-green)">
        <div className="flex items-center gap-4">
          <RingBig value={86} />
          <div className="text-xs space-y-1">
            <div className="text-foreground/90">Physics · 92%</div>
            <div className="text-foreground/90">CS · 88%</div>
            <div className="text-[color:var(--neon-amber)]">Math · 71% ↓</div>
          </div>
        </div>
      </Cell>
      <Cell className="col-span-2" title="AI Focus" icon={Sparkles} accent="var(--neon-purple)">
        <div className="text-xs text-foreground/85">
          Next best action:
          <div className="mt-2 rounded-lg px-3 py-2"
            style={{ background: "color-mix(in oklab, var(--neon-purple) 18%, transparent)" }}>
            Review Kinematics · 25 min
          </div>
        </div>
      </Cell>
      <Cell className="col-span-3" title="Notes" icon={FileText}>
        <div className="space-y-1.5">
          <div className="h-2 w-3/4 rounded-full bg-white/15" />
          <div className="h-2 w-full rounded-full bg-white/10" />
          <div className="h-2 w-2/3 rounded-full bg-white/10" />
          <div className="mt-2 rounded-lg bg-black/40 p-2 font-mono text-[10px] text-[color:var(--neon-cyan)]">
            const F = m * a; // Newton's second law
          </div>
        </div>
      </Cell>
      <Cell className="col-span-3" title="Resources" icon={BookOpen}>
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          {["Physics.pdf","Slides 04","Past Papers","MIT OCW","Video 12","Lab Manual"].map(r=>(
            <div key={r} className="rounded-md bg-white/5 px-2 py-2 text-foreground/80">{r}</div>
          ))}
        </div>
      </Cell>
    </div>
  );
}

function Cell({
  children, title, icon: Icon, className, accent = "var(--neon-blue)",
}: { children: React.ReactNode; title: string; icon: React.ComponentType<{className?:string}>; className?: string; accent?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }}
      className={`glass p-4 ${className ?? ""}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-6 w-6 place-items-center rounded-md"
          style={{ background: `color-mix(in oklab, ${accent} 20%, transparent)` }}>
          <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
        </div>
        <span className="text-xs font-medium text-foreground/90">{title}</span>
      </div>
      {children}
    </motion.div>
  );
}
function RingBig({ value }: { value: number }) {
  const c = 2*Math.PI*26;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
      <circle cx="36" cy="36" r="26" stroke="white" strokeOpacity="0.1" strokeWidth="6" fill="none"/>
      <motion.circle cx="36" cy="36" r="26" stroke="url(#gg)" strokeWidth="6" fill="none" strokeLinecap="round"
        initial={{ strokeDashoffset: c }}
        whileInView={{ strokeDashoffset: c - (c*value)/100 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: [0.22,1,0.36,1] }}
        strokeDasharray={c}/>
      <defs>
        <linearGradient id="gg" x1="0" x2="1">
          <stop offset="0" stopColor="oklch(0.72 0.17 160)"/>
          <stop offset="1" stopColor="oklch(0.78 0.14 210)"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ---------- Notes ---------- */
function Notes() {
  return (
    <section className="relative py-40">
      <div className="mx-auto max-w-6xl px-6 grid gap-16 lg:grid-cols-2 items-center">
        <div className="order-2 lg:order-1">
          <Panel3D intensity={5}>
            <div className="glass-strong shadow-elevate p-5">
              <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
                <FileText className="h-4 w-4 text-[color:var(--neon-cyan)]" />
                <span className="text-sm font-medium">Kinematics · Ch. 4</span>
                <div className="ml-auto flex gap-1.5">
                  <Chip><Sparkles className="h-3 w-3" /> Summarize</Chip>
                  <Chip><ListChecks className="h-3 w-3" /> Quiz</Chip>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <h3 className="text-lg font-semibold">Equations of motion</h3>
                <p className="text-foreground/80">
                  For constant acceleration, four kinematic equations relate displacement, velocity, acceleration and time.
                </p>
                <div className="rounded-xl bg-black/40 p-3 font-mono text-xs text-[color:var(--neon-cyan)]">
                  v = u + at{"\n"}s = ut + ½at²{"\n"}v² = u² + 2as
                </div>
                <div className="flex flex-wrap gap-2">
                  <Tag icon={Calculator}>Math</Tag>
                  <Tag icon={Code2}>Code</Tag>
                  <Tag icon={ImageIcon}>Image</Tag>
                  <Tag icon={Quote}>Cite</Tag>
                </div>
                <div className="rounded-xl p-3 text-xs"
                  style={{ background: "color-mix(in oklab, var(--neon-purple) 15%, transparent)" }}>
                  <div className="mb-1 flex items-center gap-2 text-[color:var(--neon-purple)]">
                    <Sparkles className="h-3.5 w-3.5" /> AI summary
                  </div>
                  Three key equations describe motion under constant acceleration. Practice deriving v² = u² + 2as from the other two.
                </div>
              </div>
            </div>
          </Panel3D>
        </div>
        <div className="order-1 lg:order-2">
          <SectionLabel>Notes</SectionLabel>
          <h2 className="mt-5 text-5xl md:text-6xl font-semibold tracking-tight">
            Notes that <span className="text-gradient">think back.</span>
          </h2>
          <p className="mt-6 max-w-lg text-muted-foreground">
            Markdown, math, code, images — all in one calm editor. Summarize a chapter, generate a quiz, or ask a question without leaving the page.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-foreground/85">
            {[
              "Rich markdown with LaTeX & code blocks",
              "AI summary and quiz on any selection",
              "Auto-linked to your syllabus and lectures",
            ].map(t=>(
              <li key={t} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--neon-cyan)] shadow-[0_0_8px_var(--neon-cyan)]" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-1 text-[10px] text-foreground/85">{children}</span>;
}
function Tag({ icon: Icon, children }: { icon: React.ComponentType<{className?:string}>; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[10px] text-muted-foreground">
      <Icon className="h-3 w-3" /> {children}
    </span>
  );
}

/* ---------- RAG ---------- */
function RAG() {
  return (
    <section className="relative py-40">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <SectionLabel>Retrieval Augmented</SectionLabel>
        <h2 className="mt-5 text-5xl md:text-6xl font-semibold tracking-tight">
          Watch your knowledge <br /> <span className="text-gradient">assemble the answer.</span>
        </h2>
      </div>
      <div className="mx-auto mt-16 max-w-5xl px-6">
        <div className="glass-strong shadow-elevate relative overflow-hidden p-8">
          <RAGViz />
        </div>
      </div>
    </section>
  );
}

function RAGViz() {
  const chunks = [
    { top: "10%", left: "6%", label: "Ch. 4 · Kinematics" },
    { top: "55%", left: "10%", label: "Lecture notes 09/12" },
    { top: "20%", left: "30%", label: "Lab 02 results" },
    { top: "70%", left: "34%", label: "Past paper Q3" },
  ];
  return (
    <div className="relative h-[440px]">
      {/* Question */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="absolute left-6 top-4 glass px-4 py-3 text-sm max-w-xs"
      >
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Student</div>
        "Explain projectile motion with an example from lab 02"
      </motion.div>

      {/* Knowledge chunks */}
      {chunks.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i*0.15 }}
          className="absolute glass px-3 py-2 text-xs"
          style={{ top: c.top, left: c.left }}
        >
          <motion.div
            animate={{ boxShadow: [
              "0 0 0px transparent",
              "0 0 30px color-mix(in oklab, var(--neon-cyan) 60%, transparent)",
              "0 0 0px transparent",
            ]}}
            transition={{ duration: 2.4, repeat: Infinity, delay: i*0.4 }}
            className="absolute inset-0 rounded-2xl"
          />
          <span className="relative">{c.label}</span>
        </motion.div>
      ))}

      {/* Lines to AI */}
      <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[[14,20],[16,60],[35,25],[38,75]].map(([x,y],i)=>(
          <motion.line key={i} x1={x} y1={y} x2="72" y2="50"
            stroke="url(#linegrad)" strokeWidth="0.3"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 + i*0.15, duration: 1 }}/>
        ))}
        <defs>
          <linearGradient id="linegrad" x1="0" x2="1">
            <stop offset="0" stopColor="oklch(0.78 0.14 210)" stopOpacity="0.7"/>
            <stop offset="1" stopColor="oklch(0.66 0.22 295)" stopOpacity="0.9"/>
          </linearGradient>
        </defs>
      </svg>

      {/* AI orb */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6 }}
        className="absolute left-[68%] top-[38%] grid h-24 w-24 place-items-center rounded-full"
        style={{ background: "var(--gradient-brand)", boxShadow: "0 0 80px color-mix(in oklab, var(--neon-purple) 60%, transparent)" }}
      >
        <Brain className="h-10 w-10 text-white" />
      </motion.div>

      {/* Answer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="absolute bottom-4 right-4 max-w-sm glass-strong p-4 text-sm"
      >
        <div className="mb-1 flex items-center gap-2 text-[color:var(--neon-purple)] text-xs">
          <Sparkles className="h-3.5 w-3.5" /> Answer
        </div>
        Projectile motion decomposes into horizontal (constant v) and vertical (g) components. In lab 02, your 30° launch matched theory within 4%.
        <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
          <span>· Ch.4</span><span>· Lab 02</span><span>· Lecture 09/12</span>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- Analytics ---------- */
function Analytics() {
  return (
    <section id="analytics" className="relative py-40">
      <div className="mx-auto max-w-6xl px-6 grid gap-16 lg:grid-cols-2 items-center">
        <div>
          <SectionLabel>Analytics</SectionLabel>
          <h2 className="mt-5 text-5xl md:text-6xl font-semibold tracking-tight">
            Every subject <br /><span className="text-gradient">measured, honestly.</span>
          </h2>
          <p className="mt-6 max-w-lg text-muted-foreground">
            Attendance rings, assignment velocity, study streaks, subjects trending down — surfaced early, never nagging.
          </p>
        </div>
        <Panel3D intensity={5}>
          <div className="glass-strong shadow-elevate p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <StatCard icon={TrendingUp} label="Focus / wk" value="14h 32m" accent="var(--neon-blue)" />
              <StatCard icon={Flame} label="Streak" value="27d" accent="var(--neon-amber)" />
              <StatCard icon={Target} label="On-track" value="82%" accent="var(--neon-green)" />
            </div>
            <div className="rounded-xl bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Weekly study hours</span>
                <span className="text-[color:var(--neon-green)]">+12%</span>
              </div>
              <div className="flex h-32 items-end gap-2">
                {[3,5,4,6,8,5,7,9,6,8,10,7].map((v,i)=>(
                  <motion.div key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${v*10}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i*0.05, duration: 0.8, ease: [0.22,1,0.36,1] }}
                    className="flex-1 rounded-t-md"
                    style={{ background: "linear-gradient(to top, var(--neon-blue), var(--neon-purple))" }}/>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl p-3 text-xs"
              style={{ background: "color-mix(in oklab, var(--neon-amber) 15%, transparent)" }}>
              <div className="flex items-center gap-2 text-[color:var(--neon-amber)]">
                <Zap className="h-4 w-4"/> Mathematics attendance dropping
              </div>
              <span className="text-foreground/70">71% · action recommended</span>
            </div>
          </div>
        </Panel3D>
      </div>
    </section>
  );
}
function StatCard({ icon: Icon, label, value, accent }: any) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3 w-3" style={{ color: accent }}/> {label}
      </div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

/* ---------- Timeline ---------- */
function Timeline() {
  const items = [
    { icon: Calendar, label: "Week 1 · Onboarding" },
    { icon: FileText, label: "Assignments · sprint 1" },
    { icon: GraduationCap, label: "Midterms" },
    { icon: Code2, label: "Capstone project" },
    { icon: Award, label: "Finals" },
    { icon: Briefcase, label: "Placement season" },
  ];
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const line = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "100%"]);
  return (
    <section ref={ref} className="relative py-40">
      <div className="mx-auto max-w-4xl px-6 text-center mb-16">
        <SectionLabel>Semester Timeline</SectionLabel>
        <h2 className="mt-5 text-5xl md:text-6xl font-semibold tracking-tight">
          Your semester, <br /> <span className="text-gradient">on rails.</span>
        </h2>
      </div>
      <div className="relative mx-auto max-w-3xl px-6">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />
        <motion.div style={{ height: line }}
          className="absolute left-1/2 top-0 w-px -translate-x-1/2"
          //@ts-ignore
          initial={false}
        >
          <div className="h-full w-full" style={{ background: "var(--gradient-brand)", boxShadow: "0 0 20px var(--neon-blue)"}}/>
        </motion.div>
        <div className="space-y-14">
          {items.map((it, i) => {
            const Icon = it.icon;
            const left = i % 2 === 0;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className={`relative flex ${left ? "justify-start" : "justify-end"}`}
              >
                <div className={`w-[45%] glass p-4 ${left ? "text-right pr-6" : "pl-6"}`}>
                  <div className={`flex items-center gap-2 ${left ? "justify-end" : ""}`}>
                    <Icon className="h-4 w-4 text-[color:var(--neon-cyan)]"/>
                    <span className="text-sm font-medium">{it.label}</span>
                  </div>
                </div>
                <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ background: "var(--gradient-brand)", boxShadow: "0 0 20px var(--neon-blue)" }}/>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Career ---------- */
function Career() {
  const stages = [
    { icon: BookOpen, title: "Semester 1", desc: "Foundations" },
    { icon: Code2, title: "Projects", desc: "Build in public" },
    { icon: Award, title: "Skills", desc: "Certifications" },
    { icon: Briefcase, title: "Internships", desc: "Real-world XP" },
    { icon: FileText, title: "Resume", desc: "Auto-crafted" },
    { icon: Rocket, title: "Dream company", desc: "Ship your career" },
  ];
  return (
    <section id="career" className="relative py-40">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <SectionLabel>Career Mode</SectionLabel>
        <h2 className="mt-5 text-5xl md:text-6xl font-semibold tracking-tight">
          From day one <br /> to <span className="text-gradient">dream offer.</span>
        </h2>
      </div>
      <div className="mx-auto mt-16 max-w-6xl px-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stages.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i*0.08, duration: 0.6 }}
              className="glass p-5 text-center"
            >
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl mb-3"
                style={{ background: "color-mix(in oklab, var(--neon-purple) 20%, transparent)" }}>
                <Icon className="h-5 w-5 text-[color:var(--neon-purple)]"/>
              </div>
              <div className="text-sm font-semibold">{s.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Final CTA ---------- */
function FinalCTA() {
  return (
    <section className="relative py-48 text-center">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[420px] w-[420px] rounded-full animate-pulse-glow"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--neon-purple) 60%, transparent), transparent 70%)" }}/>
      </div>
      <div className="relative mx-auto max-w-3xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="text-5xl md:text-7xl font-semibold tracking-tight"
        >
          Everything a student needs. <br />
          <span className="text-gradient">One intelligent OS.</span>
        </motion.h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/dashboard">
            <MagneticButton><Sparkles className="h-4 w-4"/> Launch StudentOS</MagneticButton>
          </Link>
          <MagneticButton variant="ghost"><Github className="h-4 w-4"/> GitHub</MagneticButton>
          <MagneticButton variant="ghost"><BookOpen className="h-4 w-4"/> Documentation</MagneticButton>
        </div>
      </div>
    </section>
  );
}

/* ---------- footer ---------- */
function Footer() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <LogoMark/> <span className="font-semibold text-foreground">StudentOS</span>
          <span>· © 2026</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <span className="inline-flex items-center gap-1">
            <Command className="h-3 w-3"/> Press K anywhere
          </span>
        </div>
      </div>
    </footer>
  );
}
