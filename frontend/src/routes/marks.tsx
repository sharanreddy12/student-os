import { createFileRoute, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Award,
  TrendingUp,
  BookOpen,
  GraduationCap,
  BarChart3,
  ArrowLeft
} from "lucide-react";
import { apiClient } from "@/api/client";
import { useUser } from "@/contexts/UserContext";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/marks")({
  ssr: false,
  beforeLoad: async () => {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!accessToken) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "StudentOS · Marks" },
      {
        name: "description",
        content: "View your academic performance and grades.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Marks,
});

function Marks() {
  const { user } = useUser();
  const [marks, setMarks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      apiClient.getMarks(),
      apiClient.getSubjects(),
      apiClient.getStudentAnalytics(),
    ])
      .then(([marksData, subjectsData, analyticsData]) => {
        setMarks(marksData || []);
        setSubjects(subjectsData || []);
        setAnalytics(analyticsData || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject ? subject.name : `Subject ${subjectId}`;
  };

  const getSubjectColor = (subjectId: number) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject ? subject.color : "#3b82f6";
  };

  const getGradeColor = (grade: string) => {
    if (!grade) return "text-muted-foreground";
    if (grade.startsWith("O")) return "text-green-400";
    if (grade.startsWith("A")) return "text-blue-400";
    if (grade.startsWith("B")) return "text-yellow-400";
    if (grade.startsWith("C")) return "text-orange-400";
    return "text-red-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-cyan border-t-transparent" />
          <div className="text-sm font-medium text-muted-foreground">Loading marks…</div>
        </div>
      </div>
    );
  }

  const overallPercentage = marks.length > 0
    ? marks.reduce((acc, m) => acc + (m.percentage || 0), 0) / marks.length
    : 0;

  const overallCGPA = overallPercentage / 10;

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-hero opacity-70" />
        <div className="absolute inset-0 bg-grid opacity-40" />
      </div>

      <div className="min-h-screen px-8 py-8 max-w-7xl mx-auto">
        <header className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Academic Performance</h1>
          <p className="text-muted-foreground mt-2">
            Track your grades and academic progress
          </p>
        </header>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6 border border-border/20"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Percentage</p>
                <p className="text-3xl font-bold mt-2">{Math.round(overallPercentage)}%</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-neon-cyan to-blue-500 flex items-center justify-center">
                <Award className="h-5 w-5 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6 border border-border/20"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CGPA</p>
                <p className="text-3xl font-bold mt-2">{overallCGPA.toFixed(2)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-neon-purple to-pink-500 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6 border border-border/20"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Subjects</p>
                <p className="text-3xl font-bold mt-2">{marks.length}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6 border border-border/20"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Performance Trend</p>
                <p className="text-3xl font-bold mt-2">
                  {analytics?.ml_predictions?.performance?.expected_grade?.split(" ")[0] || "N/A"}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Subject-wise Marks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6 border border-border/20"
        >
          <h3 className="text-xl font-semibold mb-6">Subject-wise Performance</h3>
          
          {marks.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No marks available yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {marks.map((mark, idx) => (
                <motion.div
                  key={mark.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-6 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="h-12 w-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: getSubjectColor(mark.subject_id) }}
                      >
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{getSubjectName(mark.subject_id)}</h4>
                        <p className="text-sm text-muted-foreground">
                          {subjects.find(s => s.id === mark.subject_id)?.code || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${getGradeColor(mark.grade || "")}`}>
                        {mark.grade || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">{Math.round(mark.percentage || 0)}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Quiz</p>
                      <p className="font-semibold">{mark.quiz || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Assignment</p>
                      <p className="font-semibold">{mark.assignment || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Lab</p>
                      <p className="font-semibold">{mark.lab || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Internal</p>
                      <p className="font-semibold">{mark.internal || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Mid Exam</p>
                      <p className="font-semibold">{mark.mid_exam || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Practical</p>
                      <p className="font-semibold">{mark.practical || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Final</p>
                      <p className="font-semibold">{mark.final || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-semibold">{mark.total || 0}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(mark.percentage || 0)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${mark.percentage || 0}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ML Predictions */}
        {analytics?.ml_predictions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-xl p-6 border border-border/20 mt-6"
          >
            <h3 className="text-xl font-semibold mb-4">AI Predictions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium mb-2">Expected Performance</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {analytics.ml_predictions.performance?.explanation || "No prediction available"}
                </p>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Expected CGPA</p>
                    <p className="text-2xl font-bold">
                      {analytics.ml_predictions.performance?.expected_cgpa || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expected Grade</p>
                    <p className="text-2xl font-bold">
                      {analytics.ml_predictions.performance?.expected_grade || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium mb-2">Backlog Risk</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {analytics.ml_predictions.performance?.backlog_prediction?.explanation || "No prediction available"}
                </p>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Risk Level</p>
                    <p className="text-2xl font-bold">
                      {analytics.ml_predictions.performance?.backlog_prediction?.risk || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Probability</p>
                    <p className="text-2xl font-bold">
                      {analytics.ml_predictions.performance?.backlog_prediction?.probability || 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
