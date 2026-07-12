import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { GraduationCap, Calendar as CalendarIcon, Check, X, AlertCircle } from "lucide-react";
import { apiClient } from "@/api/client";

export const Route = createFileRoute("/attendance")({
  ssr: false,
  beforeLoad: async () => {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!accessToken) {
      throw redirect({ to: "/login" });
    }
  },
  component: Attendance,
});

function Attendance() {
  const [attendance, setAttendance] = useState<
    Array<{ id: number; subject_id: number; date: string; status: string }>
  >([]);
  const [summary, setSummary] = useState<
    Array<{ subject_id: number; total: number; present: number; percentage: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  // TODO: Fetch attendance data on mount
  // useEffect(() => {
  //   Promise.all([
  //     apiClient.getAttendance(),
  //     apiClient.getAttendanceSummary()
  //   ]).then(([att, summ]) => {
  //     setAttendance(att);
  //     setSummary(summ);
  //   }).finally(() => setLoading(false));
  // }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-hero opacity-70" />
        <div className="absolute inset-0 bg-grid opacity-40" />
      </div>

      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-semibold tracking-tight">Attendance</h1>
            <p className="mt-2 text-muted-foreground">Track your class attendance</p>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* TODO: Render actual summary data */}
                {[
                  { subject: "Physics", percentage: 92, color: "var(--neon-green)" },
                  { subject: "Chemistry", percentage: 88, color: "var(--neon-blue)" },
                  { subject: "Mathematics", percentage: 71, color: "var(--neon-amber)" },
                ].map((stat) => (
                  <motion.div
                    key={stat.subject}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-4 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{stat.subject}</span>
                      <span className={`text-2xl font-semibold`} style={{ color: stat.color }}>
                        {stat.percentage}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.percentage}%` }}
                        className="h-full rounded-full"
                        style={{ background: stat.color }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              <h2 className="text-xl font-semibold mb-4">Recent Records</h2>
              <div className="space-y-2">
                {/* TODO: Render actual attendance records */}
                {[
                  { date: "2026-07-10", subject: "Physics", status: "present" },
                  { date: "2026-07-09", subject: "Chemistry", status: "present" },
                  { date: "2026-07-08", subject: "Mathematics", status: "absent" },
                ].map((record) => (
                  <motion.div
                    key={`${record.date}-${record.subject}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass p-4 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/5">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{record.subject}</div>
                        <div className="text-sm text-muted-foreground">{record.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {record.status === "present" && (
                        <span className="flex items-center gap-1 text-sm text-[color:var(--neon-green)]">
                          <Check className="h-4 w-4" /> Present
                        </span>
                      )}
                      {record.status === "absent" && (
                        <span className="flex items-center gap-1 text-sm text-[color:var(--neon-amber)]">
                          <X className="h-4 w-4" /> Absent
                        </span>
                      )}
                      {record.status === "excused" && (
                        <span className="flex items-center gap-1 text-sm text-[color:var(--neon-blue)]">
                          <AlertCircle className="h-4 w-4" /> Excused
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  const items = [
    { icon: () => null, label: "Timetable" },
    { icon: () => null, label: "Assignments" },
    { icon: GraduationCap, label: "Attendance", active: true },
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
              to={it.label === "Attendance" ? "/attendance" : "/dashboard"}
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
