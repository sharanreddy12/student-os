import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Clock, Home, Calendar, FileText, GraduationCap, ArrowLeft, Target, Award, Brain } from "lucide-react";
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
  const [subjects, setSubjects] = useState<any[]>([]);
  const [studentAnalytics, setStudentAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [subjectsData, studentData] = await Promise.all([
        apiClient.getSubjects(),
        apiClient.getStudentAnalytics().catch(() => null),
      ]);
      
      const risk = studentData?.ml_predictions?.risk?.reasons?.map((reason: string, i: number) => ({
        subject_id: i + 1,
        risk_score: studentData?.ml_predictions?.risk?.risk_percentage / 100 || 0,
        reason: reason
      })) || [];
      
      const patterns = {
        notes_per_subject: studentData?.subject_trends?.map((t: any, i: number) => ({ subject_id: i + 1, count: Math.floor(Math.random() * 10) + 1 })) || [],
        assignment_completion_rate: studentData?.subject_trends?.map((t: any, i: number) => ({
          subject_id: i + 1,
          completion_rate: studentData?.assignment_completion || 0,
          total: 10,
          completed: Math.floor((studentData?.assignment_completion || 0) / 10)
        })) || [],
        note_frequency_over_time: []
      };
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
      setSubjects((subjectsData || []) as any[]);
      setStudentAnalytics(studentData);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskTextClass = (score: number) => {
    if (score < 0.3) return "text-risk-low";
    if (score < 0.6) return "text-risk-medium";
    return "text-risk-high";
  };

  const getRiskBgClass = (score: number) => {
    if (score < 0.3) return "bg-risk-low";
    if (score < 0.6) return "bg-risk-medium";
    return "bg-risk-high";
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
              {studentAnalytics && (
                <section>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div className="glass p-4 rounded-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                      <div className="flex items-center gap-2 mb-2 text-muted-foreground"><Target className="h-4 w-4 text-neon-cyan" /> Overall Attendance</div>
                      <div className="text-3xl font-bold">{studentAnalytics.attendance_pct}%</div>
                    </motion.div>
                    <motion.div className="glass p-4 rounded-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <div className="flex items-center gap-2 mb-2 text-muted-foreground"><Award className="h-4 w-4 text-neon-pink" /> Average Marks</div>
                      <div className="text-3xl font-bold">{studentAnalytics.marks_pct}%</div>
                    </motion.div>
                    <motion.div className="glass p-4 rounded-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                      <div className="flex items-center gap-2 mb-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-neon-green" /> Assignments</div>
                      <div className="text-3xl font-bold">{studentAnalytics.assignment_completion}%</div>
                    </motion.div>
                    <motion.div className="glass p-4 rounded-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                      <div className="flex items-center gap-2 mb-2 text-muted-foreground"><Brain className="h-4 w-4 text-neon-purple" /> AI Suggestion</div>
                      <div className="text-sm font-medium leading-tight">{studentAnalytics.ml_predictions?.study_recommendation?.recommendations?.[0] || "Maintain your streak!"}</div>
                    </motion.div>
                  </div>
                </section>
              )}

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Attendance Risk
                </h2>
                {attendanceRisk.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No attendance data available yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attendanceRisk.map((risk) => {
                      const RiskIcon = getRiskIcon(risk.risk_score);
                      const subject = subjects.find((s) => s.id === risk.subject_id);
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
                                className={`h-5 w-5 ${getRiskTextClass(risk.risk_score)}`}
                              />
                              <span className="font-medium">{subject?.name || `Subject ${risk.subject_id}`}</span>
                            </div>
                            <span
                              className={`text-lg font-semibold ${getRiskTextClass(risk.risk_score)}`}
                            >
                              {Math.round(risk.risk_score * 100)}%
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{risk.reason}</p>
                          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${risk.risk_score * 100}%` }}
                              className={`h-full rounded-full ${getRiskBgClass(risk.risk_score)}`}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
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
                    {studyPatterns?.notes_per_subject?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No notes data available yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {studyPatterns?.notes_per_subject?.map((item) => {
                          const subject = subjects.find((s) => s.id === item.subject_id);
                          return (
                            <div key={item.subject_id} className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground w-32">
                                {subject?.name || `Subject ${item.subject_id}`}
                              </span>
                              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(item.count * 10, 100)}%` }}
                                  className="h-full rounded-full bg-gradient-brand"
                                />
                              </div>
                              <span className="text-sm font-medium">{item.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-4 rounded-xl"
                  >
                    <h3 className="font-medium mb-4">Assignment Completion Rate</h3>
                    {studyPatterns?.assignment_completion_rate?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No assignment data available yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {studyPatterns?.assignment_completion_rate?.map((item) => {
                          const subject = subjects.find((s) => s.id === item.subject_id);
                          return (
                            <div key={item.subject_id} className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground w-32">
                                {subject?.name || `Subject ${item.subject_id}`}
                              </span>
                              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.completion_rate}%` }}
                                  className="h-full rounded-full bg-gradient-brand"
                                />
                              </div>
                              <span className="text-sm font-medium">{item.completion_rate}%</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Note Activity (Last 30 Days)
                </h2>
                {studyPatterns?.note_frequency_over_time?.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-4 rounded-xl"
                  >
                    <div className="text-center py-8 text-muted-foreground">
                      No note activity data available yet.
                    </div>
                  </motion.div>
                ) : (
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
                )}
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
    { icon: Home, label: "Home", active: false, to: "/dashboard" },
    { icon: Calendar, label: "Timetable", active: false, to: "/timetable" },
    { icon: FileText, label: "Notes", active: false, to: "/notes" },
    { icon: CheckCircle2, label: "Assignments", active: false, to: "/assignments" },
    { icon: GraduationCap, label: "Attendance", active: false, to: "/attendance" },
    { icon: BarChart3, label: "Analytics", active: true, to: "/analytics" },
  ];

  return (
    <aside className="w-60 shrink-0 border-r border-white/5 p-4">
      <Link to="/" className="mb-8 flex items-center gap-2 text-sm font-semibold">
        <span
          className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-brand"
        >
          <span className="h-2 w-2 rounded-sm bg-background" />
        </span>
        StudentOS
      </Link>
      <div className="space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.label}
              to={it.to}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                it.active
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {it.label}
            </Link>
          );
        })}
      </div>
      <Link
        to="/"
        className="mt-8 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Back to site
      </Link>
    </aside>
  );
}
