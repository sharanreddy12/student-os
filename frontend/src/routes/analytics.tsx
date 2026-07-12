import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { apiClient } from "@/api/client";

export const Route = createFileRoute("/analytics")({
  ssr: false,
  beforeLoad: async () => {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!accessToken) {
      throw redirect({ to: "/login" });
    }
  },
  component: Analytics,
});

function Analytics() {
  const [attendanceRisk, setAttendanceRisk] = useState<
    Array<{ subject_id: number; risk_score: number; reason: string }>
  >([]);
  const [studyPatterns, setStudyPatterns] = useState<{
    notes_per_subject: Array<{ subject_id: number; count: number }>;
    assignment_completion_rate: Array<{
      subject_id: number;
      completion_rate: number;
      total: number;
      completed: number;
    }>;
    note_frequency_over_time: Array<{ date: string; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [risk, patterns] = await Promise.all([
        apiClient.getAttendanceRisk(),
        apiClient.getStudyPatterns(),
      ]);
      setAttendanceRisk(risk as Array<{ subject_id: number; risk_score: number; reason: string }>);
      setStudyPatterns(
        patterns as {
          notes_per_subject: Array<{ subject_id: number; count: number }>;
          assignment_completion_rate: Array<{
            subject_id: number;
            completion_rate: number;
            total: number;
            completed: number;
          }>;
          note_frequency_over_time: Array<{ date: string; count: number }>;
        },
      );
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 0.3) return "var(--neon-green)";
    if (score < 0.6) return "var(--neon-amber)";
    return "var(--neon-red)";
  };

  const getRiskIcon = (score: number) => {
    if (score < 0.3) return CheckCircle2;
    if (score < 0.6) return AlertTriangle;
    return AlertTriangle;
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
          <div className="mb-8">
            <h1 className="text-4xl font-semibold tracking-tight">Analytics</h1>
            <p className="mt-2 text-muted-foreground">Insights into your academic performance</p>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Attendance Risk
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attendanceRisk.map((risk) => {
                    const RiskIcon = getRiskIcon(risk.risk_score);
                    return (
                      <motion.div
                        key={risk.subject_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-4 rounded-xl"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <RiskIcon
                              className="h-5 w-5"
                              style={{ color: getRiskColor(risk.risk_score) }}
                            />
                            <span className="font-medium">Subject {risk.subject_id}</span>
                          </div>
                          <span
                            className="text-lg font-semibold"
                            style={{ color: getRiskColor(risk.risk_score) }}
                          >
                            {Math.round(risk.risk_score * 100)}%
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{risk.reason}</p>
                        <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${risk.risk_score * 100}%` }}
                            className="h-full rounded-full"
                            style={{ background: getRiskColor(risk.risk_score) }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Study Patterns
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-4 rounded-xl"
                  >
                    <h3 className="font-medium mb-4">Notes per Subject</h3>
                    <div className="space-y-3">
                      {studyPatterns?.notes_per_subject?.map((item) => (
                        <div key={item.subject_id} className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-20">
                            Subject {item.subject_id}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(item.count * 10, 100)}%` }}
                              className="h-full rounded-full"
                              style={{ background: "var(--gradient-brand)" }}
                            />
                          </div>
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-4 rounded-xl"
                  >
                    <h3 className="font-medium mb-4">Assignment Completion Rate</h3>
                    <div className="space-y-3">
                      {studyPatterns?.assignment_completion_rate?.map((item) => (
                        <div key={item.subject_id} className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-20">
                            Subject {item.subject_id}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.completion_rate}%` }}
                              className="h-full rounded-full"
                              style={{ background: "var(--gradient-brand)" }}
                            />
                          </div>
                          <span className="text-sm font-medium">{item.completion_rate}%</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Note Activity (Last 30 Days)
                </h2>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass p-4 rounded-xl"
                >
                  <div className="flex items-end gap-1 h-32">
                    {studyPatterns?.note_frequency_over_time?.slice(-14).map((item, i: number) => (
                      <motion.div
                        key={item.date}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(item.count * 20, 10)}%` }}
                        className="flex-1 bg-white/10 hover:bg-white/20 rounded-t transition-colors relative group"
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {item.date}: {item.count} notes
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </section>
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
    { icon: () => null, label: "Assignments" },
    { icon: () => null, label: "Attendance" },
    { icon: () => null, label: "Notes" },
    { icon: BarChart3, label: "Analytics", active: true },
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
              to={it.label === "Analytics" ? "/analytics" : "/dashboard"}
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
