import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Home, Calendar, FileText, CheckCircle2, BarChart3, GraduationCap,
  Search, Command, Sparkles, Brain, Send, Plus, Flame, Target,
  TrendingUp, Bell, Settings, ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "StudentOS · Dashboard" },
      { name: "description", content: "Your intelligent workspace — notes, classes, and AI in one place." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [cmd, setCmd] = useState(false);
  useEffect(() => {
    function h(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setCmd(v=>!v);
      }
      if (e.key === "Escape") setCmd(false);
    }
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-hero opacity-70"/>
        <div className="absolute inset-0 bg-grid opacity-40"/>
      </div>

      <div className="flex min-h-screen">
        <Sidebar/>
        <main className="flex-1 min-w-0 px-8 py-8">
          <TopBar onCmd={() => setCmd(true)}/>
          <Greeting/>
          <Bento/>
        </main>
        <AIPanel/>
      </div>

      {cmd && <CommandPalette onClose={() => setCmd(false)}/>}
    </div>
  );
}

function Sidebar() {
  const items = [
    { icon: Home, label: "Home", active: true },
    { icon: Calendar, label: "Timetable" },
    { icon: FileText, label: "Notes" },
    { icon: CheckCircle2, label: "Assignments" },
    { icon: GraduationCap, label: "Attendance" },
    { icon: BarChart3, label: "Analytics" },
  ];
  return (
    <aside className="w-60 shrink-0 border-r border-white/5 p-4">
      <Link to="/" className="mb-8 flex items-center gap-2 text-sm font-semibold">
        <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: "var(--gradient-brand)" }}>
          <span className="h-2 w-2 rounded-sm bg-background"/>
        </span>
        StudentOS
      </Link>
      <div className="space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <button key={it.label}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                it.active ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4"/> {it.label}
              {it.active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[color:var(--neon-cyan)] shadow-[0_0_8px_var(--neon-cyan)]"/>}
            </button>
          );
        })}
      </div>
      <div className="mt-8 rounded-2xl glass p-4">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Sparkles className="h-3 w-3 text-[color:var(--neon-purple)]"/> Focus
        </div>
        <div className="text-sm">Physics · 25 min</div>
        <button className="mt-3 w-full rounded-lg py-2 text-xs font-medium text-white"
          style={{ background: "var(--gradient-brand)" }}>Start session</button>
      </div>
      <Link to="/" className="mt-8 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3"/> Back to site
      </Link>
    </aside>
  );
}

function TopBar({ onCmd }: { onCmd: () => void }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <button onClick={onCmd}
        className="glass flex flex-1 max-w-md items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Search className="h-4 w-4"/>
        <span>Search or ask anything…</span>
        <span className="ml-auto flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px]">
          <Command className="h-2.5 w-2.5"/>K
        </span>
      </button>
      <button className="glass grid h-10 w-10 place-items-center"><Bell className="h-4 w-4"/></button>
      <button className="glass grid h-10 w-10 place-items-center"><Settings className="h-4 w-4"/></button>
      <div className="grid h-10 w-10 place-items-center rounded-full" style={{ background: "var(--gradient-brand)" }}>
        <span className="text-xs font-semibold text-white">AS</span>
      </div>
    </div>
  );
}

function Greeting() {
  return (
    <div className="mb-8">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Friday · Jul 10</div>
      <h1 className="mt-1 text-4xl font-semibold tracking-tight">Good morning, Alex.</h1>
      <p className="mt-2 text-muted-foreground">You're on a 27-day streak. 2 assignments due this week.</p>
    </div>
  );
}

function Bento() {
  return (
    <div className="grid grid-cols-12 gap-4 auto-rows-[minmax(150px,auto)]">
      <Card cls="col-span-12 md:col-span-8 row-span-2">
        <CardTitle title="Today"/>
        <div className="space-y-2">
          {[
            { t: "09:00", label: "Physics · Lecture", room: "Room 204", tag: "class" },
            { t: "11:00", label: "DSA · Lab", room: "Lab 3", tag: "class", active: true },
            { t: "14:00", label: "ML Report · Focus block", room: "Deep work", tag: "focus" },
            { t: "16:30", label: "Study group · Kinematics", room: "Library", tag: "meet" },
          ].map((r,i)=>(
            <motion.div key={i}
              initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.06 }}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 ${r.active ? "bg-white/10" : "bg-white/[0.03]"}`}
            >
              <div className="font-mono text-xs text-muted-foreground w-12">{r.t}</div>
              <div className="flex-1">
                <div className="text-sm font-medium">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.room}</div>
              </div>
              {r.active && <span className="h-2 w-2 rounded-full bg-[color:var(--neon-cyan)] shadow-[0_0_10px_var(--neon-cyan)]"/>}
            </motion.div>
          ))}
        </div>
      </Card>

      <Card cls="col-span-12 md:col-span-4">
        <CardTitle title="Streak" icon={Flame} accent="var(--neon-amber)"/>
        <div className="flex items-end justify-between">
          <div className="text-5xl font-semibold">27</div>
          <div className="flex gap-0.5">
            {Array.from({length:14}).map((_,i)=>(
              <div key={i} className="w-1.5 rounded-sm"
                style={{ height: `${16+(i%5)*7}px`, background: "color-mix(in oklab, var(--neon-amber) 60%, transparent)"}}/>
            ))}
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">day study streak</div>
      </Card>

      <Card cls="col-span-12 md:col-span-4">
        <CardTitle title="On-track" icon={Target} accent="var(--neon-green)"/>
        <div className="text-5xl font-semibold">82<span className="text-2xl text-muted-foreground">%</span></div>
        <div className="mt-2 h-1.5 rounded-full bg-white/10">
          <motion.div initial={{width:0}} animate={{width:"82%"}} transition={{duration:1.2}}
            className="h-full rounded-full" style={{ background: "linear-gradient(to right, var(--neon-green), var(--neon-cyan))"}}/>
        </div>
      </Card>

      <Card cls="col-span-12 md:col-span-6">
        <CardTitle title="Assignments" icon={CheckCircle2}/>
        <div className="space-y-3">
          {[["ML Report", 72, "Fri"],["Chem Lab", 40, "Mon"],["Web Project", 90, "Wed"]].map(([l,v,d])=>(
            <div key={l as string}>
              <div className="mb-1 flex justify-between text-xs">
                <span>{l}</span><span className="text-muted-foreground">Due {d} · {v}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10">
                <motion.div initial={{width:0}} whileInView={{width:`${v}%`}} viewport={{once:true}} transition={{duration:1}}
                  className="h-full rounded-full" style={{ background: "var(--gradient-brand)"}}/>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card cls="col-span-12 md:col-span-6">
        <CardTitle title="Focus (weekly)" icon={TrendingUp}/>
        <div className="flex h-32 items-end gap-2">
          {[3,5,4,6,8,5,7,9,6,8,10,7].map((v,i)=>(
            <motion.div key={i} initial={{height:0}} whileInView={{height:`${v*10}%`}} viewport={{once:true}}
              transition={{ delay:i*0.04, duration:0.7 }}
              className="flex-1 rounded-t-md"
              style={{ background: "linear-gradient(to top, var(--neon-blue), var(--neon-purple))"}}/>
          ))}
        </div>
      </Card>

      <Card cls="col-span-12 md:col-span-8">
        <CardTitle title="Recent notes" icon={FileText}/>
        <div className="grid gap-2 md:grid-cols-2">
          {[
            "Kinematics · Ch. 4",
            "DSA · Trees & recursion",
            "ML · Gradient descent",
            "Chem · Thermodynamics",
          ].map(n=>(
            <div key={n} className="rounded-xl bg-white/[0.03] px-4 py-3 text-sm hover:bg-white/[0.06] transition-colors cursor-pointer">
              <div className="font-medium">{n}</div>
              <div className="text-xs text-muted-foreground mt-1">Updated 2h ago · 4 min read</div>
            </div>
          ))}
        </div>
      </Card>

      <Card cls="col-span-12 md:col-span-4" accent>
        <CardTitle title="Suggested" icon={Sparkles} accent="var(--neon-purple)"/>
        <div className="text-sm text-foreground/90">Review Kinematics before tomorrow's lecture.</div>
        <button className="mt-4 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-white"
          style={{ background: "var(--gradient-brand)" }}>
          <Plus className="h-3 w-3"/> Add to today
        </button>
      </Card>
    </div>
  );
}

function Card({ children, cls, accent }: { children: React.ReactNode; cls?: string; accent?: boolean }) {
  return (
    <motion.div
      initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
      transition={{ duration:0.6, ease:[0.22,1,0.36,1] }}
      className={`glass p-5 ${cls ?? ""}`}
      style={ accent ? { background: "linear-gradient(140deg, color-mix(in oklab, var(--neon-purple) 20%, transparent), color-mix(in oklab, var(--neon-blue) 12%, transparent))"} : undefined}
    >
      {children}
    </motion.div>
  );
}
function CardTitle({ title, icon: Icon = FileText, accent = "var(--neon-blue)" }: any) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="grid h-7 w-7 place-items-center rounded-lg"
        style={{ background: `color-mix(in oklab, ${accent} 20%, transparent)` }}>
        <Icon className="h-3.5 w-3.5" style={{ color: accent }}/>
      </div>
      <span className="text-sm font-medium">{title}</span>
    </div>
  );
}

function AIPanel() {
  const [msgs, setMsgs] = useState([
    { from: "ai", text: "Hi Alex — Physics tomorrow. Want a 20-min recap on Kinematics?" },
  ]);
  const [input, setInput] = useState("");
  function send() {
    if (!input.trim()) return;
    setMsgs(m => [...m, { from: "user", text: input }]);
    setInput("");
    setTimeout(() => {
      setMsgs(m => [...m, { from: "ai", text: "On it. Pulling Ch. 4, Lecture 09/12, and past-paper Q3 — ready in your Notes." }]);
    }, 700);
  }
  return (
    <aside className="w-[340px] shrink-0 border-l border-white/5 p-5 hidden xl:flex flex-col">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl" style={{ background: "var(--gradient-brand)"}}>
          <Brain className="h-4 w-4 text-white"/>
        </div>
        <div>
          <div className="text-sm font-semibold">AI Assistant</div>
          <div className="text-[10px] text-muted-foreground">Knows your semester</div>
        </div>
        <span className="ml-auto h-2 w-2 rounded-full bg-[color:var(--neon-green)] shadow-[0_0_10px_var(--neon-green)]"/>
      </div>
      <div className="flex-1 space-y-3 overflow-auto">
        {msgs.map((m,i)=>(
          <motion.div key={i} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
            className={m.from==="user"?"flex justify-end":"flex justify-start"}>
            <div className={m.from==="user"
              ? "max-w-[85%] rounded-2xl rounded-br-sm bg-white/10 px-3 py-2 text-sm"
              : "max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 text-sm"}
              style={m.from==="ai" ? { background: "color-mix(in oklab, var(--neon-purple) 18%, transparent)"} : undefined}>
              {m.text}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 glass flex items-center gap-2 px-3 py-2">
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter" && send()}
          placeholder="Ask anything…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"/>
        <button onClick={send} className="grid h-7 w-7 place-items-center rounded-md" style={{ background: "var(--gradient-brand)"}}>
          <Send className="h-3.5 w-3.5 text-white"/>
        </button>
      </div>
    </aside>
  );
}

function CommandPalette({ onClose }: { onClose: () => void }) {
  const items = [
    { icon: FileText, label: "New note", hint: "N" },
    { icon: CheckCircle2, label: "Add assignment", hint: "A" },
    { icon: Calendar, label: "Open timetable", hint: "T" },
    { icon: Sparkles, label: "Ask AI…", hint: "⏎" },
    { icon: BarChart3, label: "Analytics dashboard", hint: "D" },
  ];
  return (
    <motion.div
      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-32 px-4"
    >
      <motion.div
        initial={{opacity:0, y:-10, scale:0.98}} animate={{opacity:1, y:0, scale:1}}
        onClick={e=>e.stopPropagation()}
        className="glass-strong w-full max-w-lg shadow-elevate"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground"/>
          <input autoFocus placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"/>
          <span className="text-[10px] text-muted-foreground">esc</span>
        </div>
        <div className="p-2">
          {items.map((it,i)=>{
            const Icon = it.icon;
            return (
              <button key={i} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10">
                <Icon className="h-4 w-4 text-muted-foreground"/>
                {it.label}
                <span className="ml-auto text-[10px] text-muted-foreground">{it.hint}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
