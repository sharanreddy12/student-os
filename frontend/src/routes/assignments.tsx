import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { CheckCircle2, Plus, Filter } from "lucide-react";
import { apiClient } from "@/api/client";
import { MagneticButton } from "@/components/landing/atoms";

export const Route = createFileRoute("/assignments")({
  ssr: false,
  beforeLoad: async () => {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!accessToken) {
      throw redirect({ to: "/login" });
    }
  },
  component: Assignments,
});

function Assignments() {
  const [assignments, setAssignments] = useState<
    Array<{ id: number; title: string; subject_id: number; status: string; due_date: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "todo" | "in_progress" | "done">("all");

  // TODO: Fetch assignments on mount
  // useEffect(() => {
  //   apiClient.getAssignments().then(setAssignments).finally(() => setLoading(false));
  // }, []);

  const statusColors = {
    todo: "bg-[color:var(--neon-amber)]",
    in_progress: "bg-[color:var(--neon-blue)]",
    done: "bg-[color:var(--neon-green)]",
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-hero opacity-70" />
        <div className="absolute inset-0 bg-grid opacity-40" />
      </div>

      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">Assignments</h1>
              <p className="mt-2 text-muted-foreground">Track your coursework</p>
            </div>
            <MagneticButton>
              <Plus className="h-4 w-4" /> Add Assignment
            </MagneticButton>
          </div>

          <div className="flex gap-2 mb-6">
            {(["all", "todo", "in_progress", "done"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                  filter === status
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:bg-white/5"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <div className="space-y-3">
              {/* TODO: Render actual assignments */}
              {[
                {
                  title: "ML Report",
                  subject: "Machine Learning",
                  due: "2026-07-15",
                  status: "in_progress",
                  progress: 72,
                },
                {
                  title: "Chem Lab",
                  subject: "Chemistry",
                  due: "2026-07-18",
                  status: "todo",
                  progress: 40,
                },
                {
                  title: "Web Project",
                  subject: "Web Development",
                  due: "2026-07-20",
                  status: "done",
                  progress: 100,
                },
              ].map((assignment) => (
                <motion.div
                  key={assignment.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass p-4 rounded-xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{assignment.title}</h3>
                        <span
                          className={`h-2 w-2 rounded-full ${statusColors[assignment.status as keyof typeof statusColors]}`}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{assignment.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">Due: {assignment.due}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold">{assignment.progress}%</div>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${assignment.progress}%` }}
                      className="h-full rounded-full"
                      style={{ background: "var(--gradient-brand)" }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  const items = [
    { icon: () => null, label: "Timetable" },
    { icon: CheckCircle2, label: "Assignments", active: true },
    { icon: () => null, label: "Attendance" },
  ];

  return (
    <aside className="w-60 shrink-0 border-r border-white/5 p-4">
      <Link to="/dashboard" className="mb-8 flex items-center gap-2 text-sm font-semibold">
        <span
          className="grid h-7 w-7 place-items-center rounded-lg"
          style={{ background: "var(--gradient-brand)" }}
        >
          <span className="h-2 w-2 rounded-sm bg-background" />
        </span>
        StudentOS
      </Link>
      <div className="space-y-1">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <Link
              key={i}
              to={it.label === "Assignments" ? "/assignments" : "/dashboard"}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                it.active
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />} {it.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
