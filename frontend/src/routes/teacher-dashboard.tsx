import { createFileRoute, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import { useUser } from "@/contexts/UserContext";
import {
  BookOpen, Calendar, Users, FileText, TrendingUp, AlertTriangle,
  Clock, Award, CheckCircle, XCircle, BarChart3, Settings, LogOut,
  Bell, Plus, Search, Command, Home, Edit2, Trash2, UserPlus,
  RefreshCw, Check, AlertCircle, X, Key, GraduationCap, Upload
} from "lucide-react";

export const Route = createFileRoute("/teacher-dashboard")({
  ssr: false,
  beforeLoad: async () => {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!accessToken) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "StudentOS · Teacher Dashboard" },
      { name: "description", content: "Teacher portal — manage classes, students, assignments, and analytics." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeacherDashboard,
});

type Tab = "home" | "subjects" | "students" | "assignments" | "marks" | "attendance";

function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const { user, loading } = useUser();
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-cyan border-t-transparent" />
          <div className="text-sm font-medium text-muted-foreground">Loading teacher dashboard…</div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-hero opacity-70" />
        <div className="absolute inset-0 bg-grid opacity-40" />
      </div>
      <div className="flex min-h-screen">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
        <main className="flex-1 min-w-0 px-8 py-8 overflow-y-auto max-h-screen">
          <TopBar user={user} />
          {activeTab === "home" && <HomeTab />}
          {activeTab === "subjects" && <SubjectsTab />}
          {activeTab === "students" && <StudentsTab />}
          {activeTab === "assignments" && <AssignmentsTab />}
          {activeTab === "marks" && <MarksTab />}
          {activeTab === "attendance" && <AttendanceTab />}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ activeTab, setActiveTab, user }: { activeTab: Tab; setActiveTab: (t: Tab) => void; user: any }) {
  const items: { id: Tab; icon: any; label: string }[] = [
    { id: "home", icon: Home, label: "Dashboard" },
    { id: "subjects", icon: BookOpen, label: "My Subjects" },
    { id: "students", icon: Users, label: "Students" },
    { id: "assignments", icon: FileText, label: "Assignments" },
    { id: "marks", icon: Award, label: "Term Marks" },
    { id: "attendance", icon: Calendar, label: "Attendance" },
  ];
  return (
    <aside className="w-64 glass border-r border-border/20 flex flex-col">
      <div className="p-6 border-b border-border/20">
        <h1 className="text-xl font-bold bg-linear-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">StudentOS</h1>
        <p className="text-xs text-muted-foreground mt-1">Teacher Portal</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {items.map((it) => (
          <button key={it.id} onClick={() => setActiveTab(it.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === it.id ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}>
            <it.icon className="h-4 w-4" /><span className="text-sm font-medium">{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-border/20">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-8 w-8 rounded-full bg-linear-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-xs font-bold">
            {user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "T"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || "Teacher"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ user }: { user: any }) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-2xl font-semibold">Teacher Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, {user?.name || "Teacher"}</p>
      </div>
    </header>
  );
}

// ─── HELPER COMPONENTS ──────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <RefreshCw className="h-4 w-4 animate-spin" /> Loading...
    </div>
  );
}

function AlertBox({ type, message }: { type: "error" | "success"; message: string }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div className={`rounded-xl p-4 flex gap-3 text-sm ${isError ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-green-500/10 border border-green-500/20 text-green-400"}`}>
      {isError ? <AlertCircle className="h-5 w-5 shrink-0" /> : <Check className="h-5 w-5 shrink-0" />}
      <span>{message}</span>
    </div>
  );
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl glass-strong border border-white/5 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <h3 className="text-xl font-semibold mb-6">{title}</h3>
        {children}
      </motion.div>
    </div>
  );
}

// ─── HOME TAB ────────────────────────────────────────────────
function HomeTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const [analytics, subjects] = await Promise.all([
          apiClient.getTeacherAnalytics().catch(() => null),
          apiClient.getAllSubjects().catch(() => []),
        ]);
        setStats({ subjectsCount: (subjects as any[])?.length || 0, analytics });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);
  if (loading) return <Spinner />;
  const cards = [
    { title: "My Subjects", value: stats?.subjectsCount || 0, icon: BookOpen, color: "from-neon-cyan to-blue-500" },
    { title: "Avg Attendance", value: `${Math.round(stats?.analytics?.average_attendance_rate || 0)}%`, icon: TrendingUp, color: "from-green-500 to-emerald-500" },
    { title: "Avg Marks", value: `${Math.round(stats?.analytics?.average_performance || 0)}%`, icon: Award, color: "from-orange-500 to-red-500" },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, i) => (
        <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          className="glass rounded-xl p-6 border border-border/20">
          <div className="flex items-start justify-between">
            <div><p className="text-sm text-muted-foreground">{card.title}</p><p className="text-3xl font-bold mt-2">{card.value}</p></div>
            <div className={`h-10 w-10 rounded-lg bg-linear-to-br ${card.color} flex items-center justify-center`}><card.icon className="h-5 w-5 text-white" /></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── SUBJECTS TAB ────────────────────────────────────────────
function SubjectsTab() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<number | "">("");
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [form, setForm] = useState({ name: "", code: "", department: "", semester: 1, section: "", credits: 3, classroom: "", color: "#3b82f6", description: "", academic_year: "", is_active: true });

  const loadSubjects = async () => {
    try { setLoading(true); const data = await apiClient.getSubjectsPaginated({ search: search || undefined, semester: semesterFilter || undefined }); setSubjects(data as any[]); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { loadSubjects(); }, [search, semesterFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      if (editingSubject) { await apiClient.updateSubject(editingSubject.id, form); setSuccess("Subject updated"); }
      else { await apiClient.createSubject(form as any); setSuccess("Subject created"); }
      setShowModal(false); setEditingSubject(null); setForm({ name: "", code: "", department: "", semester: 1, section: "", credits: 3, classroom: "", color: "#3b82f6", description: "", academic_year: "", is_active: true }); loadSubjects();
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-semibold">My Subjects</h2><p className="text-sm text-muted-foreground">Manage your subjects</p></div>
        <button onClick={() => { setEditingSubject(null); setForm({ name: "", code: "", department: "", semester: 1, section: "", credits: 3, classroom: "", color: "#3b82f6", description: "", academic_year: "", is_active: true }); setShowModal(true); }}
          className="flex items-center gap-2 rounded-xl py-2 px-4 text-sm font-medium text-white bg-gradient-brand"><Plus className="h-4 w-4" /> Add Subject</button>
      </div>
      {error && <AlertBox type="error" message={error} />}{success && <AlertBox type="success" message={success} />}
      <div className="flex gap-4">
        <div className="glass flex items-center gap-3 px-4 py-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or code..." className="flex-1 bg-transparent outline-none text-sm" />
        </div>
        <select value={semesterFilter} onChange={e => setSemesterFilter(e.target.value ? Number(e.target.value) : "")}
          className="glass bg-white/3 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none">
          <option value="">All</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
        </select>
      </div>
      {loading ? <Spinner /> : subjects.length === 0 ? <div className="text-center py-12 text-muted-foreground">No subjects found.</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {subjects.map(s => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-6 border border-border/20" style={{ borderLeft: `4px solid ${s.color}` }}>
              <div className="flex justify-between items-start mb-3">
                <div><h3 className="font-semibold text-lg">{s.name}</h3><p className="text-xs text-muted-foreground font-mono">{s.code}</p></div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingSubject(s); setForm({ name: s.name, code: s.code, department: s.department || "", semester: s.semester, section: s.section || "", credits: s.credits, classroom: s.classroom || "", color: s.color, description: s.description || "", academic_year: s.academic_year || "", is_active: s.is_active }); setShowModal(true); }} className="p-1.5 rounded text-muted-foreground hover:bg-white/10"><Edit2 className="h-3.5 w-3.5" /></button>
                  <button onClick={async () => { if (confirm("Deactivate this subject?")) { try { await apiClient.deleteSubject(s.id); setSuccess("Subject deactivated"); loadSubjects(); } catch (e: any) { setError(e.message); } } }} className="p-1.5 rounded text-red-400 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                <span>Sem {s.semester} · {s.credits} credits</span><span>{s.department || "N/A"}</span>
                {s.classroom && <span>Room: {s.classroom}</span>}{s.academic_year && <span>Year: {s.academic_year}</span>}
              </div>
              <div className="flex gap-3 text-xs pt-3 border-t border-border/20">
                <span className="text-neon-cyan">{s.student_count ?? 0} Students</span>
                {s.avg_attendance !== undefined && <span>Att: {s.avg_attendance}%</span>}
                {s.avg_marks !== undefined && <span>Marks: {s.avg_marks}%</span>}
              </div>
              <div className="mt-2"><span className={`px-2 py-0.5 rounded-full text-[10px] ${s.is_active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{s.is_active ? "Active" : "Inactive"}</span></div>
            </motion.div>
          ))}
        </div>
      )}
      {showModal && (
        <Modal onClose={() => setShowModal(false)} title={editingSubject ? "Edit Subject" : "Create Subject"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground">Name *</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Code *</label><input required value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground">Department</label><input value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Section</label><input value={form.section} onChange={e => setForm({...form, section: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground">Semester</label><input type="number" min="1" value={form.semester} onChange={e => setForm({...form, semester: Number(e.target.value)})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Credits</label><input type="number" min="1" value={form.credits} onChange={e => setForm({...form, credits: Number(e.target.value)})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Color</label><input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="w-full h-11 bg-transparent cursor-pointer rounded-xl" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Classroom</label><input value={form.classroom} onChange={e => setForm({...form, classroom: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /><label className="text-sm">Active</label></div>
            <button type="submit" className="w-full rounded-xl py-3 text-sm font-semibold text-white bg-gradient-brand">{editingSubject ? "Save Changes" : "Create Subject"}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── STUDENTS TAB ────────────────────────────────────────────
function StudentsTab() {
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<number | "">("");
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", roll_number: "", department: "", semester: 1, section: "", year: new Date().getFullYear(), phone: "", parent_name: "", parent_phone: "" });
  const [assignForm, setAssignForm] = useState({ student_id: "", subject_id: "" });

  const loadData = async () => {
    try { setLoading(true); const [s, subs] = await Promise.all([apiClient.getStudents(), apiClient.getAllSubjects()]); setStudents(s as any[]); setSubjects(subs as any[]); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, []);

  const filtered = students.filter(s => {
    const ms = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()) || s.roll_number?.toLowerCase().includes(search.toLowerCase());
    const mf = !semesterFilter || s.semester === semesterFilter;
    return ms && mf;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      if (editingStudent) { await apiClient.updateStudent(editingStudent.id, form); setSuccess("Student updated"); }
      else { await apiClient.createStudent(form as any); setSuccess("Student created"); }
      setShowModal(false); setEditingStudent(null); loadData();
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-semibold">Students</h2><p className="text-sm text-muted-foreground">Register and manage students</p></div>
        <div className="flex gap-2">
          {subjects.length > 0 && students.length > 0 && (
            <button onClick={() => { setAssignForm({ student_id: String(students[0]?.id || ""), subject_id: String(subjects[0]?.id || "") }); setShowAssignModal(true); }}
              className="flex items-center gap-2 rounded-xl py-2 px-4 text-sm font-medium text-foreground bg-white/5 border border-white/5 hover:bg-white/10"><Key className="h-4 w-4" /> Assign Subject</button>
          )}
          <button onClick={() => { setEditingStudent(null); setForm({ name: "", email: "", password: "", roll_number: "", department: "", semester: 1, section: "", year: new Date().getFullYear(), phone: "", parent_name: "", parent_phone: "" }); setShowModal(true); }}
            className="flex items-center gap-2 rounded-xl py-2 px-4 text-sm font-medium text-white bg-gradient-brand"><UserPlus className="h-4 w-4" /> Register Student</button>
        </div>
      </div>
      {error && <AlertBox type="error" message={error} />}{success && <AlertBox type="success" message={success} />}
      <div className="flex gap-4">
        <div className="glass flex items-center gap-3 px-4 py-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="flex-1 bg-transparent outline-none text-sm" />
        </div>
        <select value={semesterFilter} onChange={e => setSemesterFilter(e.target.value ? Number(e.target.value) : "")}
          className="glass bg-white/3 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none">
          <option value="">All</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
        </select>
      </div>
      {loading ? <Spinner /> : filtered.length === 0 ? <div className="text-center py-12 text-muted-foreground">No students found.</div> : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 glass">
          <table className="w-full text-left text-sm border-collapse">
            <thead><tr className="border-b border-white/5 bg-white/2 text-muted-foreground text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Student</th><th className="px-6 py-4 font-semibold">Roll No</th><th className="px-6 py-4 font-semibold">Dept</th>
              <th className="px-6 py-4 font-semibold">Class</th><th className="px-6 py-4 font-semibold">Email</th><th className="px-6 py-4 font-semibold">Status</th><th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/1">
                  <td className="px-6 py-4"><div className="font-medium">{s.name}</div></td>
                  <td className="px-6 py-4 font-mono text-xs">{s.roll_number || "-"}</td>
                  <td className="px-6 py-4 text-xs">{s.department || "-"}</td>
                  <td className="px-6 py-4 text-xs">Sem {s.semester} · {s.section || "-"}</td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">{s.email}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.status === "ACTIVE" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{s.status}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingStudent(s); setForm({ name: s.name, email: s.email, password: "", roll_number: s.roll_number || "", department: s.department || "", semester: s.semester || 1, section: s.section || "", year: s.year || new Date().getFullYear(), phone: s.phone || "", parent_name: s.parent_name || "", parent_phone: s.parent_phone || "" }); setShowModal(true); }} className="p-1.5 rounded text-muted-foreground hover:bg-white/10"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={async () => { if (confirm("Deactivate?")) { try { await apiClient.deactivateStudent(s.id); setSuccess("Deactivated"); loadData(); } catch (e: any) { setError(e.message); } } }} className="p-1.5 rounded text-red-400 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <Modal onClose={() => setShowModal(false)} title={editingStudent ? "Edit Student" : "Register Student"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground">Name *</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Email *</label><input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">{editingStudent ? "New Password" : "Password *"}</label><input type="password" required={!editingStudent} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground">Roll Number *</label><input required value={form.roll_number} onChange={e => setForm({...form, roll_number: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Department *</label><input required value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground">Semester</label><input type="number" value={form.semester} onChange={e => setForm({...form, semester: Number(e.target.value)})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Section</label><input value={form.section} onChange={e => setForm({...form, section: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Year</label><input type="number" value={form.year} onChange={e => setForm({...form, year: Number(e.target.value)})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground">Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Parent</label><input value={form.parent_name} onChange={e => setForm({...form, parent_name: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            </div>
            <button type="submit" className="w-full rounded-xl py-3 text-sm font-semibold text-white bg-gradient-brand">{editingStudent ? "Save Changes" : "Register"}</button>
          </form>
        </Modal>
      )}
      {showAssignModal && (
        <Modal onClose={() => setShowAssignModal(false)} title="Assign Subject to Student">
          <form onSubmit={async (e) => { e.preventDefault(); setError(""); setSuccess(""); try { await apiClient.assignStudentToSubject({ student_id: Number(assignForm.student_id), subject_id: Number(assignForm.subject_id) }); setSuccess("Assigned"); setShowAssignModal(false); } catch (e: any) { setError(e.message); } }} className="space-y-4">
            <div><label className="text-xs font-medium text-muted-foreground">Student</label>
              <select value={assignForm.student_id} onChange={e => setAssignForm({...assignForm, student_id: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none text-foreground">
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
              </select></div>
            <div><label className="text-xs font-medium text-muted-foreground">Subject</label>
              <select value={assignForm.subject_id} onChange={e => setAssignForm({...assignForm, subject_id: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none text-foreground">
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select></div>
            <button type="submit" className="w-full rounded-xl py-3 text-sm font-semibold text-white bg-gradient-brand">Assign</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── ASSIGNMENTS TAB ─────────────────────────────────────────
function AssignmentsTab() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradingAsg, setGradingAsg] = useState<any>(null);
  const [form, setForm] = useState({ subject_id: "", title: "", description: "", due_date: "", priority: "medium", max_marks: 100 });
  const [gradeForm, setGradeForm] = useState({ marks_obtained: "", max_marks: "100" });

  const loadData = async () => {
    try { setLoading(true); const [asgs, subs] = await Promise.all([apiClient.getAssignments(), apiClient.getAllSubjects()]); setAssignments(asgs as any[]); setSubjects(subs as any[]); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, []);

  const getSubjectName = (id: number) => subjects.find(s => s.id === id)?.name || `Subject ${id}`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-semibold">Assignments</h2><p className="text-sm text-muted-foreground">Create and grade assignments</p></div>
        <button onClick={() => { setForm({ subject_id: subjects[0]?.id ? String(subjects[0].id) : "", title: "", description: "", due_date: "", priority: "medium", max_marks: 100 }); setShowModal(true); }}
          className="flex items-center gap-2 rounded-xl py-2 px-4 text-sm font-medium text-white bg-gradient-brand"><Plus className="h-4 w-4" /> Create</button>
      </div>
      {error && <AlertBox type="error" message={error} />}{success && <AlertBox type="success" message={success} />}
      {loading ? <Spinner /> : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 glass">
          <table className="w-full text-left text-sm border-collapse">
            <thead><tr className="border-b border-white/5 bg-white/2 text-muted-foreground text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Title</th><th className="px-6 py-4 font-semibold">Subject</th><th className="px-6 py-4 font-semibold">Due</th><th className="px-6 py-4 font-semibold">Marks</th><th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr></thead>
            <tbody>
              {assignments.length === 0 ? <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No assignments yet.</td></tr>
                : assignments.map(a => (
                  <tr key={a.id} className="border-b border-white/5 hover:bg-white/1">
                    <td className="px-6 py-4"><div className="font-medium">{a.title}</div>{a.description && <div className="text-xs text-muted-foreground">{a.description}</div>}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{getSubjectName(a.subject_id)}</td>
                    <td className="px-6 py-4 text-xs">{new Date(a.due_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-mono text-sm">{a.marks_obtained !== null ? `${a.marks_obtained}/${a.max_marks || 100}` : <span className="text-muted-foreground">-</span>}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setGradingAsg(a); setGradeForm({ marks_obtained: String(a.marks_obtained || ""), max_marks: String(a.max_marks || 100) }); setShowGradeModal(true); }}
                        className="inline-flex items-center gap-1 rounded-lg py-1 px-3 text-xs bg-white/5 border border-white/5 hover:bg-white/10 text-neon-cyan"><Award className="h-3 w-3" /> Grade</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <Modal onClose={() => setShowModal(false)} title="Create Assignment">
          <form onSubmit={async (e) => { e.preventDefault(); setError(""); setSuccess(""); try { await apiClient.createAssignment({ subject_id: Number(form.subject_id), title: form.title, description: form.description || undefined, due_date: new Date(form.due_date).toISOString(), priority: form.priority }); setSuccess("Created"); setShowModal(false); loadData(); } catch (e: any) { setError(e.message); } }} className="space-y-4">
            <div><label className="text-xs font-medium text-muted-foreground">Subject</label>
              <select value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})} required className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none text-foreground">
                <option value="">Select</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select></div>
            <div><label className="text-xs font-medium text-muted-foreground">Title *</label><input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground">Due *</label><input required type="datetime-local" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Max Marks</label><input type="number" value={form.max_marks} onChange={e => setForm({...form, max_marks: Number(e.target.value)})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            </div>
            <button type="submit" className="w-full rounded-xl py-3 text-sm font-semibold text-white bg-gradient-brand">Create</button>
          </form>
        </Modal>
      )}
      {showGradeModal && (
        <Modal onClose={() => setShowGradeModal(false)} title={`Grade: ${gradingAsg?.title}`}>
          <form onSubmit={async (e) => { e.preventDefault(); setError(""); setSuccess(""); try { await apiClient.updateAssignment(gradingAsg.id, { marks_obtained: Number(gradeForm.marks_obtained), max_marks: Number(gradeForm.max_marks), status: "done" } as any); setSuccess("Graded"); setShowGradeModal(false); loadData(); } catch (e: any) { setError(e.message); } }} className="space-y-4">
            <div><label className="text-xs font-medium text-muted-foreground">Marks Obtained</label><input type="number" step="0.5" required value={gradeForm.marks_obtained} onChange={e => setGradeForm({...gradeForm, marks_obtained: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Max Marks</label><input type="number" required value={gradeForm.max_marks} onChange={e => setGradeForm({...gradeForm, max_marks: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            <button type="submit" className="w-full rounded-xl py-3 text-sm font-semibold text-white bg-gradient-brand">Submit Grade</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── MARKS TAB ───────────────────────────────────────────────
function MarksTab() {
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [studentSubjects, setStudentSubjects] = useState<any[]>([]);
  const [marksList, setMarksList] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMark, setEditingMark] = useState<any>(null);
  const [marksForm, setMarksForm] = useState({ subject_id: "", quiz: "", assignment: "", lab: "", internal: "", mid_exam: "", practical: "", final: "" });

  const loadData = async () => {
    try { setLoading(true); const [s, subs] = await Promise.all([apiClient.getStudents(), apiClient.getAllSubjects()]); setStudents(s as any[]); setSubjects(subs as any[]); if (s.length > 0 && !selectedStudentId) setSelectedStudentId(String(s[0].id)); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const loadMarks = async (studentId: number) => {
    try { const data = await apiClient.getMarks(studentId); setMarksList(data || []); }
    catch (e) { console.error(e); }
  };

  const loadAssignedSubjects = async (studentId: number) => {
    try {
      const assignments = await apiClient.getStudentSubjects({ student_id: studentId });
      const assignedIds = (assignments as any[]).filter((entry) => entry.is_active !== false).map((entry) => entry.subject_id);
      setStudentSubjects(subjects.filter((subject) => assignedIds.includes(subject.id)));
    } catch (e) {
      console.error(e);
      setStudentSubjects([]);
    }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (selectedStudentId) { loadMarks(Number(selectedStudentId)); loadAssignedSubjects(Number(selectedStudentId)); } }, [selectedStudentId, subjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      const payload = { quiz: Number(marksForm.quiz) || 0, assignment: Number(marksForm.assignment) || 0, lab: Number(marksForm.lab) || 0, internal: Number(marksForm.internal) || 0, mid_exam: Number(marksForm.mid_exam) || 0, practical: Number(marksForm.practical) || 0, final: Number(marksForm.final) || 0 };
      if (editingMark) { await apiClient.updateMark(editingMark.id, payload); setSuccess("Marks updated"); }
      else { await apiClient.createMark({ user_id: Number(selectedStudentId), subject_id: Number(marksForm.subject_id), ...payload }); setSuccess("Marks saved"); }
      setShowModal(false); setEditingMark(null); if (selectedStudentId) loadMarks(Number(selectedStudentId));
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Term Marks</h2>
          <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}
            className="glass bg-neutral-900 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none text-foreground">
            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
          </select>
        </div>
      </div>
      {error && <AlertBox type="error" message={error} />}{success && <AlertBox type="success" message={success} />}
      {loading ? <Spinner /> : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 glass">
          <table className="w-full text-left text-sm border-collapse">
            <thead><tr className="border-b border-white/5 bg-white/2 text-muted-foreground text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Subject</th><th className="px-6 py-4 text-center font-semibold">Quiz</th><th className="px-6 py-4 text-center font-semibold">Asg</th>
              <th className="px-6 py-4 text-center font-semibold">Lab</th><th className="px-6 py-4 text-center font-semibold">Int</th><th className="px-6 py-4 text-center font-semibold">Mid</th>
              <th className="px-6 py-4 text-center font-semibold">Prac</th><th className="px-6 py-4 text-center font-semibold">Final</th><th className="px-6 py-4 text-center font-semibold">Total</th>
              <th className="px-6 py-4 text-center font-semibold">Grade</th><th className="px-6 py-4 text-right font-semibold">Actions</th>
            </tr></thead>
            <tbody>
              {subjects.length === 0 ? <tr><td colSpan={11} className="px-6 py-8 text-center text-muted-foreground">No subjects available.</td></tr>
                : subjects.map(sbj => {
                    const m = marksList.find(x => x.subject_id === sbj.id);
                    const total = m ? (m.quiz||0)+(m.assignment||0)+(m.lab||0)+(m.internal||0)+(m.mid_exam||0)+(m.practical||0)+(m.final||0) : 0;
                    let grade = "N/A";
                    if (m) { if (total>=90) grade="O"; else if (total>=80) grade="A+"; else if (total>=70) grade="A"; else if (total>=60) grade="B"; else if (total>=50) grade="C"; else grade="F"; }
                    return (
                      <tr key={sbj.id} className="border-b border-white/5 hover:bg-white/1">
                        <td className="px-6 py-4"><div className="font-medium">{sbj.name}</div><div className="text-xs text-muted-foreground">{sbj.code}</div></td>
                        <td className="px-6 py-4 text-center font-mono text-xs">{m?.quiz??"-"}</td>
                        <td className="px-6 py-4 text-center font-mono text-xs">{m?.assignment??"-"}</td>
                        <td className="px-6 py-4 text-center font-mono text-xs">{m?.lab??"-"}</td>
                        <td className="px-6 py-4 text-center font-mono text-xs">{m?.internal??"-"}</td>
                        <td className="px-6 py-4 text-center font-mono text-xs">{m?.mid_exam??"-"}</td>
                        <td className="px-6 py-4 text-center font-mono text-xs">{m?.practical??"-"}</td>
                        <td className="px-6 py-4 text-center font-mono text-xs">{m?.final??"-"}</td>
                        <td className="px-6 py-4 text-center font-mono text-xs font-semibold text-neon-green">{m ? total : "-"}</td>
                        <td className="px-6 py-4 text-center"><span className={`px-2 py-0.5 rounded text-xs font-bold ${grade==="F"?"bg-red-500/10 text-red-400":grade==="O"?"bg-purple-500/10 text-purple-400":"bg-green-500/10 text-green-400"}`}>{grade}</span></td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => { setEditingMark(m||null); setMarksForm({ subject_id: String(sbj.id), quiz: String(m?.quiz??""), assignment: String(m?.assignment??""), lab: String(m?.lab??""), internal: String(m?.internal??""), mid_exam: String(m?.mid_exam??""), practical: String(m?.practical??""), final: String(m?.final??"") }); setShowModal(true); }}
                            className="inline-flex items-center gap-1 rounded-lg py-1 px-3 text-xs bg-white/5 border border-white/5 hover:bg-white/10 text-neon-cyan"><Award className="h-3 w-3" /> {m ? "Edit" : "Enter"}</button>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <Modal onClose={() => setShowModal(false)} title={editingMark ? "Edit Marks" : "Enter Marks"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground">Quiz</label><input type="number" step="0.5" value={marksForm.quiz} onChange={e => setMarksForm({...marksForm, quiz: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Assignment</label><input type="number" step="0.5" value={marksForm.assignment} onChange={e => setMarksForm({...marksForm, assignment: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground">Lab</label><input type="number" step="0.5" value={marksForm.lab} onChange={e => setMarksForm({...marksForm, lab: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Internal</label><input type="number" step="0.5" value={marksForm.internal} onChange={e => setMarksForm({...marksForm, internal: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground">Mid Exam</label><input type="number" step="0.5" value={marksForm.mid_exam} onChange={e => setMarksForm({...marksForm, mid_exam: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Practical</label><input type="number" step="0.5" value={marksForm.practical} onChange={e => setMarksForm({...marksForm, practical: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Final Exam</label><input type="number" step="0.5" value={marksForm.final} onChange={e => setMarksForm({...marksForm, final: e.target.value})} className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none" /></div>
            <button type="submit" className="w-full rounded-xl py-3 text-sm font-semibold text-white bg-gradient-brand">{editingMark ? "Save Changes" : "Submit Marks"}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── ATTENDANCE TAB ──────────────────────────────────────────
function AttendanceTab() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusMap, setStatusMap] = useState<Record<number, string>>({});

  const loadData = async () => {
    try { setLoading(true); const subs = await apiClient.getAllSubjects(); setSubjects(subs as any[]); if (subs.length > 0) setSelectedSubjectId(String(subs[0].id)); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const loadStudents = async (subjectId: number) => {
    try {
      const data = await apiClient.getStudents();
      setStudents(data as any[]);
      const map: Record<number, string> = {};
      data.forEach((s: any) => { map[s.id] = "present"; });
      setStatusMap(map);
    } catch (e: any) { setError(e.message); }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (selectedSubjectId) loadStudents(Number(selectedSubjectId)); }, [selectedSubjectId]);

  const handleMarkAll = (status: string) => {
    const map: Record<number, string> = {};
    students.forEach(s => { map[s.id] = status; });
    setStatusMap(map);
  };

  const handleSave = async () => {
    setError(""); setSuccess("");
    try {
      for (const student of students) {
        const status = statusMap[student.id] || "present";
        await apiClient.createAttendance({ subject_id: Number(selectedSubjectId), date: new Date(date).toISOString(), status });
      }
      setSuccess(`Attendance saved for ${students.length} students`);
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Attendance</h2>
          <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}
            className="glass bg-neutral-900 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none text-foreground">
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="glass bg-neutral-900 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none text-foreground" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleMarkAll("present")} className="rounded-lg py-2 px-3 text-xs bg-green-500/10 text-green-400 border border-green-500/20">All Present</button>
          <button onClick={() => handleMarkAll("absent")} className="rounded-lg py-2 px-3 text-xs bg-red-500/10 text-red-400 border border-red-500/20">All Absent</button>
          <button onClick={handleSave} className="flex items-center gap-2 rounded-xl py-2 px-4 text-sm font-medium text-white bg-gradient-brand"><Check className="h-4 w-4" /> Save</button>
        </div>
      </div>
      {error && <AlertBox type="error" message={error} />}{success && <AlertBox type="success" message={success} />}
      {loading ? <Spinner /> : students.length === 0 ? <div className="text-center py-12 text-muted-foreground">No students assigned to this subject.</div> : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 glass">
          <table className="w-full text-left text-sm border-collapse">
            <thead><tr className="border-b border-white/5 bg-white/2 text-muted-foreground text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Student</th><th className="px-6 py-4 font-semibold">Roll No</th><th className="px-6 py-4 font-semibold text-center">Present</th>
              <th className="px-6 py-4 font-semibold text-center">Absent</th><th className="px-6 py-4 font-semibold text-center">Late</th><th className="px-6 py-4 font-semibold text-center">Leave</th>
            </tr></thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/1">
                  <td className="px-6 py-4"><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.email}</div></td>
                  <td className="px-6 py-4 font-mono text-xs">{s.roll_number || "-"}</td>
                  {(["present","absent","late","leave"] as const).map(st => (
                    <td key={st} className="px-6 py-4 text-center">
                      <input type="radio" name={`att-${s.id}`} checked={statusMap[s.id] === st} onChange={() => setStatusMap(prev => ({...prev, [s.id]: st}))}
                        className="accent-neon-cyan cursor-pointer" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}