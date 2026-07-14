import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Home,
  Calendar,
  FileText,
  CheckCircle2,
  BarChart3,
  GraduationCap,
  Search,
  Command,
  Sparkles,
  Brain,
  Send,
  Plus,
  Flame,
  Target,
  TrendingUp,
  Bell,
  Settings,
  ArrowLeft,
  LogOut,
  Edit,
  Trash2,
  Shield,
  Users,
  Briefcase,
  Activity,
  Award,
  Clock
} from "lucide-react";
import { apiClient } from "@/api/client";
import { MagneticButton } from "@/components/landing/atoms";
import { useUser } from "@/contexts/UserContext";
import { ManagementPanels } from "@/components/dashboard/ManagementPanels";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: async () => {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!accessToken) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "StudentOS · Dashboard" },
      {
        name: "description",
        content: "Your intelligent workspace — notes, classes, and AI in one place.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [cmd, setCmd] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const { user, loading } = useUser();

  useEffect(() => {
    function h(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd((v) => !v);
      }
      if (e.key === "Escape") setCmd(false);
    }
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-cyan border-t-transparent" />
          <div className="text-sm font-medium text-muted-foreground">Loading workspace…</div>
        </div>
      </div>
    );
  }

  const isStudent = !user || user.role === "STUDENT";

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-hero opacity-70" />
        <div className="absolute inset-0 bg-grid opacity-40" />
      </div>

      <div className="flex min-h-screen">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
        <main className="flex-1 min-w-0 px-8 py-8 overflow-y-auto max-h-screen">
          <TopBar onCmd={() => setCmd(true)} />
          {activeTab === "home" ? (
            <>
              <Greeting />
              {isStudent ? <Bento /> : <OverviewDashboard user={user} setActiveTab={setActiveTab} />}
            </>
          ) : (
            user && <ManagementPanels user={user} tab={activeTab} />
          )}
        </main>
        {isStudent && <AIPanel />}
      </div>

      {cmd && <CommandPalette onClose={() => setCmd(false)} />}
    </div>
  );
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
}

function Sidebar({ activeTab, setActiveTab, user }: SidebarProps) {
  let items: Array<{ icon: any; label: string; tab?: string; to?: string }> = [];

  if (user?.role === "SUPER_ADMIN") {
    items = [
      { icon: Home, label: "Home", tab: "home" },
      { icon: Shield, label: "Super Admins", tab: "super_admins" },
      { icon: Users, label: "Admins", tab: "admins" },
      { icon: FileText, label: "Audit Directory", tab: "audit" },
    ];
  } else if (user?.role === "ADMIN") {
    items = [
      { icon: Home, label: "Home", tab: "home" },
      { icon: GraduationCap, label: "Teachers", tab: "teachers" },
      { icon: Users, label: "Students", tab: "students" },
    ];
  } else if (user?.role === "TEACHER") {
    items = [
      { icon: Home, label: "Home", tab: "home" },
      { icon: Users, label: "Students", tab: "students" },
      { icon: GraduationCap, label: "Subjects", tab: "subjects" },
      { icon: CheckCircle2, label: "Grading", tab: "assignments" },
      { icon: Award, label: "Term Marks", tab: "marks" },
    ];
  } else {
    // STUDENT
    items = [
      { icon: Home, label: "Home", tab: "home", to: "/dashboard" },
      { icon: Calendar, label: "Timetable", to: "/timetable" },
      { icon: FileText, label: "Notes", to: "/notes" },
      { icon: CheckCircle2, label: "Assignments", to: "/assignments" },
      { icon: GraduationCap, label: "Subjects", to: "/subjects" },
      { icon: GraduationCap, label: "Attendance", to: "/attendance" },
      { icon: Award, label: "Marks", to: "/marks" },
      { icon: Bell, label: "Announcements", to: "/announcements" },
      { icon: BarChart3, label: "Analytics", to: "/analytics" },
    ];
  }

  return (
    <aside className="w-60 shrink-0 border-r border-white/5 p-4 flex flex-col justify-between">
      <div>
        <Link to="/" className="mb-8 flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-brand">
            <span className="h-2 w-2 rounded-sm bg-background" />
          </span>
          StudentOS
        </Link>
        <div className="space-y-1">
          {items.map((it) => {
            const Icon = it.icon;
            const isActive = it.tab ? activeTab === it.tab : false;
            
            if (it.to) {
              return (
                <Link
                  key={it.label}
                  to={it.to}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" /> {it.label}
                </Link>
              );
            }

            return (
              <button
                key={it.label}
                onClick={() => it.tab && setActiveTab(it.tab)}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-left ${
                  isActive
                    ? "bg-white/10 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {it.label}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-neon-cyan shadow-[0_0_8px_var(--neon-cyan)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="space-y-4">
        {user?.role === "STUDENT" && (
          <div className="rounded-2xl glass p-4">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3 w-3 text-neon-purple" /> Focus
            </div>
            <div className="text-sm">Physics · 25 min</div>
            <button type="button" className="mt-3 w-full rounded-lg py-2 text-xs font-medium text-white bg-gradient-brand">
              Start session
            </button>
          </div>
        )}
        <Link
          to="/"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back to site
        </Link>
      </div>
    </aside>
  );
}

function TopBar({ onCmd }: { onCmd: () => void }) {
  const { user } = useUser();
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    apiClient.getNotifications()
      .then((data: any) => setNotifications(data || []))
      .catch(() => setNotifications([]));
  }, []);

  // Generate initials from user name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          onClick={onCmd}
          className="glass flex flex-1 max-w-md items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Search className="h-4 w-4" />
          <span>Search or ask anything…</span>
          <span className="ml-auto flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px]">
            <Command className="h-2.5 w-2.5" />K
          </span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="glass grid h-10 w-10 place-items-center relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {notifications.some(n => !n.is_read) && (
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-strong border border-white/10 shadow-2xl p-4 z-50 max-h-75 overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold">Notifications</h4>
                {notifications.some(n => !n.is_read) && (
                  <button
                    onClick={async () => {
                      try {
                        await apiClient.markAllNotificationsRead();
                        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="text-[10px] text-neon-cyan hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center">No notifications</p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className={`text-xs p-3 rounded-xl border transition-colors ${
                      n.is_read ? "bg-white/1 border-white/5 text-muted-foreground" : "bg-white/4 border-white/10 text-foreground"
                    }`}>
                      <div className="font-semibold">{n.title}</div>
                      <div className="text-muted-foreground mt-0.5">{n.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button type="button" className="glass grid h-10 w-10 place-items-center" aria-label="Settings">
          <Settings className="h-4 w-4" />
        </button>
        <button 
          type="button"
          onClick={() => setShowProfile(true)}
          className="grid h-10 w-10 place-items-center rounded-full bg-gradient-brand hover:shadow-lg hover:shadow-neon-cyan/50 transition-all cursor-pointer"
        >
          <span className="text-xs font-semibold text-white">
            {user ? getInitials(user.name || "") : "ST"}
          </span>
        </button>
      </div>
      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} />}
    </>
  );
}

function Greeting() {
  const { user, loading } = useUser();

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  // Generate initials from user name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="mb-8">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{dateStr}</div>
      <h1 className="mt-1 text-4xl font-semibold tracking-tight">
        {loading ? "Loading..." : `Hi, ${user?.name || "Student"}.`}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Welcome back to your intelligent workspace.
      </p>
    </div>
  );
}

interface OverviewDashboardProps {
  user: any;
  setActiveTab: (tab: string) => void;
}

function OverviewDashboard({ user, setActiveTab }: OverviewDashboardProps) {
  const [stats, setStats] = useState({
    superAdmins: 0,
    admins: 0,
    teachers: 0,
    students: 0,
    subjects: 0,
    assignments: 0,
  });
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        if (user?.role === "SUPER_ADMIN") {
          const [saList, aList, tList, sList, analyticsData] = await Promise.all([
            apiClient.getSuperAdmins().catch(() => []) as Promise<any[]>,
            apiClient.getAdmins().catch(() => []) as Promise<any[]>,
            apiClient.getTeachers().catch(() => []) as Promise<any[]>,
            apiClient.getStudents().catch(() => []) as Promise<any[]>,
            apiClient.getAdminAnalytics().catch(() => null),
          ]);
          setStats({
            superAdmins: saList.length,
            admins: aList.length,
            teachers: tList.length,
            students: sList.length,
            subjects: 0,
            assignments: 0,
          });
          setAnalytics(analyticsData);
        } else if (user?.role === "ADMIN") {
          const [tList, sList, subList, analyticsData] = await Promise.all([
            apiClient.getTeachers().catch(() => []) as Promise<any[]>,
            apiClient.getStudents().catch(() => []) as Promise<any[]>,
            apiClient.getSubjects().catch(() => []) as Promise<any[]>,
            apiClient.getAdminAnalytics().catch(() => null),
          ]);
          setStats({
            superAdmins: 0,
            admins: 0,
            teachers: tList.length,
            students: sList.length,
            subjects: subList.length,
            assignments: 0,
          });
          setAnalytics(analyticsData);
        } else if (user?.role === "TEACHER") {
          const [sList, subList, asgList, analyticsData] = await Promise.all([
            apiClient.getStudents().catch(() => []) as Promise<any[]>,
            apiClient.getSubjects().catch(() => []) as Promise<any[]>,
            apiClient.getAssignments().catch(() => []) as Promise<any[]>,
            apiClient.getTeacherAnalytics().catch(() => null),
          ]);
          setStats({
            superAdmins: 0,
            admins: 0,
            teachers: 0,
            students: sList.length,
            subjects: subList.length,
            assignments: asgList.length,
          });
          setAnalytics(analyticsData);
        }
      } catch (e) {
        console.error("Failed to load dashboard stats:", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading workspace summary…</div>;
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === "SUPER_ADMIN" && (
          <>
            <StatCard
              title="Super Admins"
              value={stats.superAdmins}
              icon={Shield}
              color="var(--neon-purple)"
              onClick={() => setActiveTab("super_admins")}
            />
            <StatCard
              title="Admins"
              value={stats.admins}
              icon={Users}
              color="var(--neon-blue)"
              onClick={() => setActiveTab("admins")}
            />
            <StatCard
              title="Teachers"
              value={stats.teachers}
              icon={GraduationCap}
              color="var(--neon-green)"
            />
            <StatCard
              title="Students"
              value={stats.students}
              icon={Users}
              color="var(--neon-cyan)"
              onClick={() => setActiveTab("audit")}
            />
          </>
        )}

        {user?.role === "ADMIN" && (
          <>
            <StatCard
              title="Teachers Registered"
              value={stats.teachers}
              icon={GraduationCap}
              color="var(--neon-green)"
              onClick={() => setActiveTab("teachers")}
            />
            <StatCard
              title="Total Students"
              value={stats.students}
              icon={Users}
              color="var(--neon-cyan)"
              onClick={() => setActiveTab("students")}
            />
            <StatCard
              title="Shared Subjects"
              value={stats.subjects}
              icon={FileText}
              color="var(--neon-blue)"
            />
          </>
        )}

        {user?.role === "TEACHER" && (
          <>
            <StatCard
              title="My Students"
              value={stats.students}
              icon={Users}
              color="var(--neon-cyan)"
              onClick={() => setActiveTab("students")}
            />
            <StatCard
              title="Subjects Taught"
              value={stats.subjects}
              icon={GraduationCap}
              color="var(--neon-blue)"
              onClick={() => setActiveTab("subjects")}
            />
            <StatCard
              title="Submissions & Marks"
              value={stats.assignments}
              icon={CheckCircle2}
              color="var(--neon-purple)"
              onClick={() => setActiveTab("assignments")}
            />
          </>
        )}
      </div>

      {analytics && (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-white/5 glass">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-neon-cyan" /> Academic ERP Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Overall Average Attendance:</span>
                <span className="font-semibold text-foreground">{Math.round(analytics.overall_average_attendance ?? 0)}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Overall Average Marks:</span>
                <span className="font-semibold text-foreground">{Math.round(analytics.overall_average_marks ?? 0)}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Students At Attendance Risk:</span>
                <span className={`font-semibold px-2 py-0.5 rounded text-xs ${
                  analytics.at_risk_students_count > 0 ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                }`}>
                  {analytics.at_risk_students_count ?? 0} students
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/5 glass">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-neon-green" /> Daily Attendance Trend (ML)
            </h3>
            {analytics.daily_attendance_trend && Object.keys(analytics.daily_attendance_trend).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(analytics.daily_attendance_trend).slice(-4).map(([date, val]: any) => (
                  <div key={date} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-mono">{date}:</span>
                    <span className="font-medium text-foreground">{Math.round(val * 100)}% present</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent trend data.</p>
            )}
          </div>
        </div>
      )}

      {analytics && user?.role === "TEACHER" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-white/5 glass">
              <div className="text-sm text-muted-foreground">Average Attendance Rate</div>
              <div className="text-3xl font-semibold mt-2 text-neon-green">
                {Math.round(analytics.average_attendance_rate ?? 0)}%
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-white/5 glass">
              <div className="text-sm text-muted-foreground">Average Class Grade Score</div>
              <div className="text-3xl font-semibold mt-2 text-neon-blue">
                {Math.round(analytics.average_performance ?? 0)}%
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-white/5 glass">
              <div className="text-sm text-muted-foreground">At Risk Roster Students</div>
              <div className="text-3xl font-semibold mt-2 text-red-400">
                {analytics.at_risk_students_count ?? 0}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/5 glass">
            <h3 className="text-lg font-semibold mb-4">Subject Analytics & Roster Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2 text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 font-semibold">Subject</th>
                    <th className="px-6 py-3 font-semibold text-center">Enrolled Students</th>
                    <th className="px-6 py-3 font-semibold text-center">Average Attendance</th>
                    <th className="px-6 py-3 font-semibold text-center">Average Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.subject_breakdown && analytics.subject_breakdown.length > 0 ? (
                    analytics.subject_breakdown.map((sbj: any) => (
                      <tr key={sbj.subject_id} className="border-b border-white/5 hover:bg-white/1 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{sbj.subject_name}</td>
                        <td className="px-6 py-4 text-center font-mono">{sbj.student_count}</td>
                        <td className="px-6 py-4 text-center font-mono text-neon-green">
                          {sbj.average_attendance !== null ? `${Math.round(sbj.average_attendance)}%` : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-neon-cyan">
                          {sbj.average_marks !== null ? `${Math.round(sbj.average_marks)}%` : "N/A"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                        No subject breakdown data available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  onClick?: () => void;
}

function StatCard({ title, value, icon: Icon, color, onClick }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={onClick}
      className={`p-6 rounded-2xl border border-white/5 glass shadow-elevate flex flex-col justify-between h-40 ${
        onClick ? "cursor-pointer hover:border-white/10" : ""
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          {title}
        </span>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="text-4xl font-semibold mt-4">{value}</div>
    </motion.div>
  );
}

function Bento() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ name: "", code: "", color: "#3b82f6" });
  const [marks, setMarks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const syntheticSubjects = [
    { id: 101, name: "Mathematics", code: "MA101", classroom: "Room 204", color: "#7C3AED" },
    { id: 102, name: "Physics", code: "PH101", classroom: "Lab 2", color: "#0EA5E9" },
    { id: 103, name: "Computer Science", code: "CS101", classroom: "Room 112", color: "#22C55E" },
  ];

  const syntheticAssignments = [
    { id: 801, title: "Math chapter review", due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), subject_id: 101, status: "todo" },
    { id: 802, title: "Physics lab report", due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), subject_id: 102, status: "in_progress" },
    { id: 803, title: "CS project outline", due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), subject_id: 103, status: "todo" },
  ];

  const syntheticNotes = [
    { id: 701, subject_id: 101, title: "Integrals summary", updated_at: new Date().toISOString() },
    { id: 702, subject_id: 102, title: "Electric circuits guide", updated_at: new Date().toISOString() },
    { id: 703, subject_id: 103, title: "Data structures cheat sheet", updated_at: new Date().toISOString() },
  ];

  const syntheticMarks = [
    { id: 601, subject_id: 101, grade: "A", percentage: 89 },
    { id: 602, subject_id: 102, grade: "A-", percentage: 86 },
    { id: 603, subject_id: 103, grade: "B+", percentage: 83 },
  ];

  const syntheticAnnouncements = [
    { id: 501, title: "Holiday schedule updated", created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 502, title: "Project submission guidelines", created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  const syntheticAnalytics = {
    attendance_pct: 87.3,
    marks_pct: 82.5,
    assignment_completion: 78.0,
    study_streak: 6,
    upcoming_deadlines: syntheticAssignments.map((item) => ({ title: item.title, due_date: item.due_date, subject_name: syntheticSubjects.find((s) => s.id === item.subject_id)?.name || "N/A" })),
    weak_subjects: ["Physics"],
    strong_subjects: ["Computer Science"],
  };

  useEffect(() => {
    Promise.all([
      apiClient.getTodayTimetable(),
      apiClient.getAssignments(),
      apiClient.getAttendanceSummary(),
      apiClient.getSubjects(),
      apiClient.getNotes(),
      apiClient.getMarks(),
      apiClient.getAnnouncements(),
      apiClient.getStudentAnalytics(),
    ])
      .then(([timetableData, assignmentsData, attendanceData, subjectsData, notesData, marksData, announcementsData, analyticsData]) => {
        setTimetable((timetableData as any[]) || []);
        setAssignments((assignmentsData as any[]) || []);
        setAttendanceSummary((attendanceData as any[]) || []);
        setSubjects((subjectsData as any[]) || []);
        setNotes((notesData as any[]) || []);
        setMarks((marksData as any[]) || []);
        setAnnouncements((announcementsData as any[]) || []);
        setAnalytics(analyticsData || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const todayClasses = timetable.filter((t) => t.is_active !== false);
  const upcomingAssignments = assignments.filter((a) => a.status !== "done").slice(0, 3);
  const overallAttendance = attendanceSummary && attendanceSummary.length > 0
    ? attendanceSummary.reduce((acc: number, curr: any) => acc + curr.percentage, 0) / attendanceSummary.length
    : 0;

  const displaySubjects = !loading && subjects.length === 0 ? syntheticSubjects : subjects;
  const displayTodayClasses = !loading && todayClasses.length === 0 ? syntheticSubjects.map((subject, index) => ({
    id: 900 + index,
    subject_id: subject.id,
    start_time: ["09:00", "10:15", "11:30"][index],
    end_time: ["10:00", "11:15", "12:30"][index],
    location: subject.classroom,
    is_active: true,
  })) : todayClasses;
  const displayAssignments = !loading && upcomingAssignments.length === 0 ? syntheticAssignments : upcomingAssignments;
  const displayNotes = !loading && notes.length === 0 ? syntheticNotes : notes;
  const displayMarks = !loading && marks.length === 0 ? syntheticMarks : marks;
  const displayAnnouncements = !loading && announcements.length === 0 ? syntheticAnnouncements : announcements;
  const displayAnalytics = !loading && !analytics ? syntheticAnalytics : analytics;
  const displayAttendanceSummary = !loading && attendanceSummary?.length === 0 ? [
    { subject_id: 101, percentage: 88, total_classes: 8, attended: 7 },
    { subject_id: 102, percentage: 84, total_classes: 7, attended: 6 },
  ] : attendanceSummary;
  const displayOverallAttendance = displayAttendanceSummary && displayAttendanceSummary.length > 0
    ? displayAttendanceSummary.reduce((acc: number, curr: any) => acc + curr.percentage, 0) / displayAttendanceSummary.length
    : overallAttendance;
  
  // Calculate next class
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const nextClass = todayClasses.find((t) => {
    const [startHour, startMin] = t.start_time.split(':').map(Number);
    const classTime = startHour * 60 + startMin;
    return classTime > currentTime;
  }) || todayClasses[0];

  // Helper to get subject name by ID
  const getSubjectName = (subjectId: number) => {
    const subject = displaySubjects.find((s) => s.id === subjectId);
    return subject ? subject.name : `Subject ${subjectId}`;
  };

  const handleDeleteSubject = async (id: number) => {
    if (confirm("Are you sure you want to delete this subject? This will also delete related data.")) {
      try {
        await apiClient.deleteSubject(id);
        setSubjects(subjects.filter((s) => s.id !== id));
      } catch (error) {
        console.error("Failed to delete subject:", error);
      }
    }
  };

  const handleEditSubject = (subject: any) => {
    setEditingSubject(subject);
    setEditFormData({ name: subject.name, code: subject.code, color: subject.color });
    setShowSubjectsModal(true);
  };

  const handleSaveSubject = async (data: any) => {
    try {
      if (editingSubject) {
        await apiClient.updateSubject(editingSubject.id, data);
        setSubjects(subjects.map((s) => (s.id === editingSubject.id ? { ...s, ...data } : s)));
      } else {
        const newSubject = await apiClient.createSubject(data);
        setSubjects([...subjects, newSubject]);
      }
      setShowSubjectsModal(false);
      setEditingSubject(null);
      setEditFormData({ name: "", code: "", color: "#3b82f6" });
    } catch (error) {
      console.error("Failed to save subject:", error);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 auto-rows-[minmax(150px,auto)]">
      <Card cls="col-span-12 md:col-span-8 row-span-2">
        <CardTitle title="Today" />
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : todayClasses.length === 0 ? (
          <div className="space-y-2">
            {displayTodayClasses.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4 rounded-xl px-4 py-3 bg-white/3"
              >
                <div className="font-mono text-xs text-muted-foreground w-12">{r.start_time}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{getSubjectName(r.subject_id)}</div>
                  <div className="text-xs text-muted-foreground">{r.location || "TBD"}</div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {todayClasses.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4 rounded-xl px-4 py-3 bg-white/3"
              >
                <div className="font-mono text-xs text-muted-foreground w-12">
                  {r.start_time}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{getSubjectName(r.subject_id)}</div>
                  <div className="text-xs text-muted-foreground">{r.location || "TBD"}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      <Card cls="col-span-12 md:col-span-4">
        <CardTitle title="Next Class" icon={Clock} accent="var(--neon-purple)" />
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : !nextClass ? (
          <div className="text-sm text-muted-foreground">No more classes today.</div>
        ) : (
          <div>
            <div className="text-lg font-semibold">{getSubjectName(nextClass.subject_id)}</div>
            <div className="text-sm text-muted-foreground mt-1">{nextClass.location || "TBD"}</div>
            <div className="text-xs text-muted-foreground mt-2">
              {nextClass.start_time} - {nextClass.end_time}
            </div>
          </div>
        )}
      </Card>

      <Card cls="col-span-12 md:col-span-4">
        <CardTitle title="Attendance" icon={GraduationCap} accent="var(--neon-green)" />
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <>
            <div className="text-5xl font-semibold">
              {Math.round(displayOverallAttendance)}<span className="text-2xl text-muted-foreground">%</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">overall attendance</div>
          </>
        )}
      </Card>

      <Card cls="col-span-12 md:col-span-4">
        <CardTitle title="Subjects" icon={FileText} accent="var(--neon-blue)" />
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <>
            <div className="text-5xl font-semibold">{displaySubjects.length}</div>
            <div className="mt-2 text-xs text-muted-foreground">active subjects</div>
            {displaySubjects[0] ? (
              <div className="mt-3 text-sm text-muted-foreground">
                Latest: <span className="font-medium text-foreground">{displaySubjects[0].name}</span>
              </div>
            ) : null}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setShowSubjectsModal(true)}
                className="text-xs text-(--neon-blue) hover:underline"
              >
                Quick add
              </button>
              <Link to="/subjects" className="text-xs text-(--neon-blue) hover:underline">
                Open full view
              </Link>
            </div>
          </>
        )}
      </Card>

      <Card cls="col-span-12 md:col-span-6">
        <CardTitle title="Assignments" icon={CheckCircle2} />
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-3">
            {displayAssignments.map((a) => (
              <div key={a.id}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{a.title}</span>
                  <span className="text-muted-foreground">
                    Due {new Date(a.due_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">{getSubjectName(a.subject_id)}</div>
                <div className="h-1.5 rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: a.status === "done" ? "100%" : "50%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="h-full rounded-full bg-gradient-brand"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card cls="col-span-12 md:col-span-6">
        <CardTitle title="Notes" icon={FileText} />
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {displayNotes.map((n) => (
              <div
                key={n.id}
                className="rounded-xl bg-white/3 px-4 py-3 text-sm hover:bg-white/6 transition-colors cursor-pointer"
              >
                <div className="font-medium">{n.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getSubjectName(n.subject_id)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Updated {new Date(n.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card cls="col-span-12 md:col-span-6">
        <CardTitle title="Recent Marks" icon={Award} accent="var(--neon-orange)" />
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : marks.length === 0 ? (
          <div className="space-y-2">
            {displayMarks.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl">
                <div>
                  <div className="text-sm font-medium">{getSubjectName(m.subject_id)}</div>
                  <div className="text-xs text-muted-foreground">{m.grade || 'N/A'}</div>
                </div>
                <div className="text-lg font-semibold">{Math.round(m.percentage || 0)}%</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {displayMarks.slice(0, 3).map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl">
                <div>
                  <div className="text-sm font-medium">{getSubjectName(m.subject_id)}</div>
                  <div className="text-xs text-muted-foreground">{m.grade || 'N/A'}</div>
                </div>
                <div className="text-lg font-semibold">{Math.round(m.percentage || 0)}%</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card cls="col-span-12 md:col-span-6">
        <CardTitle title="Announcements" icon={Bell} accent="var(--neon-cyan)" />
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="space-y-2">
            {displayAnnouncements.map((a) => (
              <div key={a.id} className="p-3 bg-white/3 rounded-xl">
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {displayAnnouncements.slice(0, 3).map((a) => (
              <div key={a.id} className="p-3 bg-white/3 rounded-xl">
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card cls="col-span-12 md:col-span-6">
        <CardTitle title="Performance Summary" icon={TrendingUp} accent="var(--neon-green)" />
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : !analytics ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Attendance</span>
              <span className="font-semibold">{Math.round(displayAnalytics.attendance_pct)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Marks</span>
              <span className="font-semibold">{Math.round(displayAnalytics.marks_pct)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Assignment Completion</span>
              <span className="font-semibold">{Math.round(displayAnalytics.assignment_completion)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Study Streak</span>
              <span className="font-semibold">{displayAnalytics.study_streak} days</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Attendance</span>
              <span className="font-semibold">{Math.round(analytics.attendance_pct || 0)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Marks</span>
              <span className="font-semibold">{Math.round(analytics.marks_pct || 0)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Assignment Completion</span>
              <span className="font-semibold">{Math.round(analytics.assignment_completion || 0)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Study Streak</span>
              <span className="font-semibold">{analytics.study_streak || 0} days</span>
            </div>
          </div>
        )}
      </Card>

      <Card cls="col-span-12 md:col-span-4" accent>
        <CardTitle title="Quick Actions" icon={Plus} accent="var(--neon-purple)" />
        <div className="space-y-2">
          <Link
            to="/timetable"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/6 transition-colors"
          >
            <Calendar className="h-4 w-4" /> Add class
          </Link>
          <Link
            to="/assignments"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/6 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" /> Add assignment
          </Link>
          <Link
            to="/notes"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/6 transition-colors"
          >
            <FileText className="h-4 w-4" /> Create note
          </Link>
        </div>
      </Card>

      {showSubjectsModal && (
        <SubjectsModal
          onClose={() => {
            setShowSubjectsModal(false);
            setEditingSubject(null);
          }}
          onSave={handleSaveSubject}
          subjects={subjects}
          editingSubject={editingSubject}
          onDelete={loading ? undefined : handleDeleteSubject}
        />
      )}
    </div>
  );
}

function Card({
  children,
  cls,
  accent,
}: {
  children: React.ReactNode;
  cls?: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`glass p-5 ${cls ?? ""}${accent ? " bg-gradient-card-accent" : ""}`}
    >
      {children}
    </motion.div>
  );
}
function getCardIconClass(accent: string): string {
  const map: Record<string, string> = {
    "var(--neon-green)": "bg-card-icon-green",
    "var(--neon-amber)": "bg-card-icon-amber",
    "var(--neon-purple)": "bg-card-icon-purple",
  };
  return map[accent] ?? "bg-card-icon-blue";
}

function CardTitle({
  title,
  icon: Icon = FileText,
  accent = "var(--neon-blue)",
}: {
  title: string;
  icon?: React.ElementType;
  accent?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div
        className={`grid h-7 w-7 place-items-center rounded-lg ${getCardIconClass(accent)}`}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
      </div>
      <span className="text-sm font-medium">{title}</span>
    </div>
  );
}

function AIPanel() {
  const [msgs, setMsgs] = useState<Array<{ from: "user" | "ai"; text: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    // Fetch notes to check if user has any study material
    apiClient.getNotes().then((data) => {
      setNotes((data as any[]) || []);
    }).catch(() => setNotes([]));
  }, []);

  async function send() {
    if (!input.trim()) return;

    setMsgs((m) => [...m, { from: "user", text: input }]);
    setInput("");
    setLoading(true);

    try {
      const response = (await apiClient.chat(input)) as { answer?: string };
      setMsgs((m) => [...m, { from: "ai", text: response.answer || "I couldn't find relevant information in your notes." }]);
    } catch (error) {
      setMsgs((m) => [...m, { from: "ai", text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="w-85 shrink-0 border-l border-white/5 p-5 hidden xl:flex flex-col">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-brand">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold">AI Assistant</div>
          <div className="text-[10px] text-muted-foreground">Knows your semester</div>
        </div>
        <span className="ml-auto h-2 w-2 rounded-full bg-neon-green shadow-[0_0_10px_var(--neon-green)]" />
      </div>
      <div className="flex-1 space-y-3 overflow-auto">
        {msgs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Ask anything about your notes, assignments, or subjects.
            </p>
          </motion.div>
        ) : (
          msgs.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={m.from === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  m.from === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-white/10 px-3 py-2 text-sm"
                    : "max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 text-sm"
                }
              >
                {m.text}
              </div>
            </motion.div>
          ))
        )}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 text-sm bg-neon-purple-faded">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                Thinking...
              </span>
            </div>
          </motion.div>
        )}
      </div>
      <div className="mt-4 glass flex items-center gap-2 px-3 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask anything…"
          disabled={loading}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
        />
        <button
          type="button"
          onClick={send}
          aria-label="Send message"
          className="grid h-7 w-7 place-items-center rounded-md bg-gradient-brand"
        >
          <Send className="h-3.5 w-3.5 text-white" />
        </button>
      </div>
    </aside>
  );
}

function ProfileModal({
  user,
  onClose,
}: {
  user: any;
  onClose: () => void;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await apiClient.logout();
    router.navigate({ to: "/login" });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-md p-6 shadow-elevate"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Profile</div>
            <h2 className="text-2xl font-semibold">{user?.name ?? "User"}</h2>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-brand text-white text-sm font-semibold">
            {user ? user.name.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase() : "US"}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Role</div>
            <div className="mt-1 font-semibold text-neon-cyan">{user?.role ?? "STUDENT"}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Email</div>
            <div className="mt-1 font-medium">{user?.email ?? "—"}</div>
          </div>
          {user?.roll_number && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Roll Number</div>
              <div className="mt-1 font-medium">{user.roll_number}</div>
            </div>
          )}
          {user?.department && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Department</div>
              <div className="mt-1 font-medium">{user.department}</div>
            </div>
          )}
          {user?.designation && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Designation</div>
              <div className="mt-1 font-medium">{user.designation}</div>
            </div>
          )}
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">User ID</div>
            <div className="mt-1 font-medium">{user?.id ?? "—"}</div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/5"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400"
          >
            Logout
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SubjectsModal({
  onClose,
  onSave,
  subjects,
  editingSubject,
  onDelete,
}: {
  onClose: () => void;
  onSave: (data: any) => void;
  subjects: any[];
  editingSubject: any;
  onDelete?: (id: number) => void;
}) {
  // Set CSS variable from data attribute for subject color swatches
  useEffect(() => {
    document.querySelectorAll<HTMLElement>('[data-subject-color]').forEach((el) => {
      const color = el.getAttribute('data-subject-color');
      if (color) {
        el.style.setProperty('--subject-color', color);
      }
    });
  }, [subjects]);
  const [name, setName] = useState(editingSubject?.name || "");
  const [code, setCode] = useState(editingSubject?.code || "");
  const [color, setColor] = useState(editingSubject?.color || "#3b82f6");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, code, color });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-2xl p-6 shadow-elevate max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Manage Subjects</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 hover:bg-white/10 rounded">
            ✕
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="flex items-center justify-between glass p-3 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-full bg-subject-color"
                  data-subject-color={subject.color}
                />
                <div>
                  <div className="font-medium">{subject.name}</div>
                  <div className="text-xs text-muted-foreground">{subject.code}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setName(subject.name);
                    setCode(subject.code);
                    setColor(subject.color);
                  }}
                  aria-label="Edit subject"
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <Edit className="h-3 w-3" />
                </button>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(subject.id)}
                    aria-label="Delete subject"
                    className="p-1 hover:bg-white/10 rounded text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-4">
          <h3 className="text-sm font-medium mb-3">
            {editingSubject ? "Edit Subject" : "Add New Subject"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="subject-name" className="text-sm text-muted-foreground mb-1 block">Name</label>
                <input
                  id="subject-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
                  required
                />
              </div>
              <div>
                <label htmlFor="subject-code" className="text-sm text-muted-foreground mb-1 block">Code</label>
                <input
                  id="subject-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Color</label>
              <div className="flex gap-2">
                {[
                  { hex: "#3b82f6", cls: "bg-swatch-blue" },
                  { hex: "#10b981", cls: "bg-swatch-green" },
                  { hex: "#f59e0b", cls: "bg-swatch-amber" },
                  { hex: "#ef4444", cls: "bg-swatch-red" },
                  { hex: "#8b5cf6", cls: "bg-swatch-purple" },
                  { hex: "#ec4899", cls: "bg-swatch-pink" },
                ].map(({ hex, cls }) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setColor(hex)}
                    aria-label={`Select color ${hex}`}
                    className={`h-8 w-8 rounded-full ${cls} ${color === hex ? "ring-2 ring-white" : ""}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <MagneticButton type="submit" className="flex-1">
                {editingSubject ? "Update" : "Add"} Subject
              </MagneticButton>
              <MagneticButton type="button" onClick={onClose} variant="ghost">
                Close
              </MagneticButton>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-32 px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-lg shadow-elevate"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <span className="text-[10px] text-muted-foreground">esc</span>
        </div>
        <div className="p-2">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <button
                key={i}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
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