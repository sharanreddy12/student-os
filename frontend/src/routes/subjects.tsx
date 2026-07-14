import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import {
  Home,
  Calendar,
  FileText,
  CheckCircle2,
  BarChart3,
  GraduationCap,
  Search,
  Plus,
  Sparkles,
  ArrowLeft,
  MoreHorizontal,
  Pencil,
  Trash2,
  Filter,
  ArrowUpDown,
  CheckCircle,
  CircleOff,
} from "lucide-react";
import { apiClient } from "@/api/client";

export const Route = createFileRoute("/subjects")({
  ssr: false,
  component: SubjectsPage,
});

interface SubjectItem {
  id: number;
  user_id: number;
  name: string;
  code: string;
  semester: number;
  credits: number;
  faculty_name?: string | null;
  classroom?: string | null;
  color: string;
  minimum_attendance_percentage: number;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
}

function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    semester: "1",
    credits: "3",
    faculty_name: "",
    classroom: "",
    color: "#3b82f6",
    minimum_attendance_percentage: "75",
    description: "",
    is_active: true,
  });
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getSubjects();
      setSubjects((data as SubjectItem[]) || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const filteredSubjects = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    return [...subjects]
      .filter((subject) => {
        const matchesSearch =
          subject.name.toLowerCase().includes(normalizedSearch) ||
          subject.code.toLowerCase().includes(normalizedSearch) ||
          (subject.faculty_name || "").toLowerCase().includes(normalizedSearch);
        const matchesSemester = semesterFilter === "all" || String(subject.semester) === semesterFilter;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && subject.is_active) ||
          (statusFilter === "inactive" && !subject.is_active);
        return matchesSearch && matchesSemester && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "semester":
            return a.semester - b.semester;
          case "credits":
            return a.credits - b.credits;
          case "attendance":
            return a.minimum_attendance_percentage - b.minimum_attendance_percentage;
          case "created_at":
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
  }, [subjects, search, semesterFilter, statusFilter, sortBy]);

  const resetForm = () => {
    setForm({
      name: "",
      code: "",
      semester: "1",
      credits: "3",
      faculty_name: "",
      classroom: "",
      color: "#3b82f6",
      minimum_attendance_percentage: "75",
      description: "",
      is_active: true,
    });
    setEditingSubject(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (subject: SubjectItem) => {
    setEditingSubject(subject);
    setForm({
      name: subject.name,
      code: subject.code,
      semester: String(subject.semester),
      credits: String(subject.credits),
      faculty_name: subject.faculty_name || "",
      classroom: subject.classroom || "",
      color: subject.color,
      minimum_attendance_percentage: String(subject.minimum_attendance_percentage),
      description: subject.description || "",
      is_active: subject.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        semester: Number(form.semester),
        credits: Number(form.credits),
        faculty_name: form.faculty_name || null,
        classroom: form.classroom || null,
        color: form.color,
        minimum_attendance_percentage: Number(form.minimum_attendance_percentage),
        description: form.description || null,
        is_active: form.is_active,
      };

      if (editingSubject) {
        await apiClient.updateSubject(editingSubject.id, payload);
      } else {
        await apiClient.createSubject(payload);
      }
      await loadSubjects();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save subject");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (subjectId: number) => {
    if (!window.confirm("Delete this subject?")) return;
    try {
      await apiClient.deleteSubject(subjectId);
      await loadSubjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete subject");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="w-60 shrink-0 border-r border-white/5 p-4">
          <Link to="/dashboard" className="mb-8 flex items-center gap-2 text-sm font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-brand">
              <span className="h-2 w-2 rounded-sm bg-background" />
            </span>
            StudentOS
          </Link>
          <div className="space-y-1">
            {[
              { icon: Home, label: "Home", to: "/dashboard" },
              { icon: Calendar, label: "Timetable", to: "/timetable" },
              { icon: FileText, label: "Notes", to: "/notes" },
              { icon: CheckCircle2, label: "Assignments", to: "/assignments" },
              { icon: GraduationCap, label: "Attendance", to: "/attendance" },
              { icon: BarChart3, label: "Analytics", to: "/analytics" },
            ].map((it) => {
              const Icon = it.icon;
              return (
                <Link
                  key={it.label}
                  to={it.to}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  <Icon className="h-4 w-4" /> {it.label}
                </Link>
              );
            })}
            <Link
              to="/subjects"
              className="flex w-full items-center gap-3 rounded-lg bg-white/10 px-3 py-2 text-sm text-foreground"
            >
              <Sparkles className="h-4 w-4" /> Subjects
            </Link>
          </div>
          <Link to="/dashboard" className="mt-8 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Back to dashboard
          </Link>
        </aside>

        <main className="flex-1 p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Subjects</div>
              <h1 className="text-3xl font-semibold">Manage your academic subjects</h1>
              <p className="mt-2 text-sm text-muted-foreground">Keep everything linked to a subject in one place.</p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" /> Create Subject
            </button>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, code, or faculty"
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)} className="w-full bg-transparent outline-none">
                <option value="all">All semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((value) => (
                  <option key={value} value={String(value)}>{`Sem ${value}`}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-transparent outline-none">
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full bg-transparent outline-none">
                <option value="created_at">Recently created</option>
                <option value="name">Name</option>
                <option value="semester">Semester</option>
                <option value="credits">Credits</option>
                <option value="attendance">Attendance</option>
              </select>
            </label>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-sm text-muted-foreground">Loading subjects…</div>
          ) : filteredSubjects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">No subjects yet.</h2>
              <p className="mt-2 text-sm text-muted-foreground">Create your first subject to begin building your academic workspace.</p>
              <button type="button" onClick={openCreateModal} className="mt-5 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-medium text-white">Create Subject</button>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredSubjects.map((subject) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl" style={{ backgroundColor: subject.color }} />
                      <div>
                        <div className="text-lg font-semibold">{subject.name}</div>
                        <div className="text-sm text-muted-foreground">{subject.code}</div>
                      </div>
                    </div>
                    <div className="relative">
                      <button type="button" onClick={() => setMenuOpenId(menuOpenId === subject.id ? null : subject.id)} className="rounded-full p-2 hover:bg-white/10">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {menuOpenId === subject.id ? (
                        <div className="absolute right-0 z-10 mt-2 w-36 rounded-xl border border-white/10 bg-background p-2 shadow-lg">
                          <button type="button" onClick={() => { setMenuOpenId(null); openEditModal(subject); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-white/10">
                            <Pencil className="h-4 w-4" /> Edit
                          </button>
                          <button type="button" onClick={() => { setMenuOpenId(null); handleDelete(subject.id); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-400 hover:bg-white/10">
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                    <div><span className="text-foreground">Faculty:</span> {subject.faculty_name || "—"}</div>
                    <div><span className="text-foreground">Credits:</span> {subject.credits}</div>
                    <div><span className="text-foreground">Attendance:</span> {subject.minimum_attendance_percentage}%</div>
                    <div><span className="text-foreground">Room:</span> {subject.classroom || "—"}</div>
                    <div><span className="text-foreground">Semester:</span> {subject.semester}</div>
                    <div><span className="text-foreground">Status:</span> {subject.is_active ? "Active" : "Inactive"}</div>
                  </div>

                  {subject.description ? <div className="mt-4 text-sm text-muted-foreground">{subject.description}</div> : null}
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-background p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{editingSubject ? "Edit subject" : "Create subject"}</div>
                <h2 className="text-2xl font-semibold">{editingSubject ? editingSubject.name : "New subject"}</h2>
              </div>
              <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="rounded-full p-2 hover:bg-white/10">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm text-muted-foreground">Subject Name</span>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 outline-none" />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">Subject Code</span>
                <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 outline-none" />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">Faculty</span>
                <input value={form.faculty_name} onChange={(e) => setForm({ ...form, faculty_name: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 outline-none" />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">Semester</span>
                <input type="number" min="1" required value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 outline-none" />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">Credits</span>
                <input type="number" min="1" required value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 outline-none" />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">Room</span>
                <input value={form.classroom} onChange={(e) => setForm({ ...form, classroom: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 outline-none" />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">Attendance Threshold</span>
                <input type="number" min="0" max="100" required value={form.minimum_attendance_percentage} onChange={(e) => setForm({ ...form, minimum_attendance_percentage: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 outline-none" />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">Color</span>
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 p-1" />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm text-muted-foreground">Description</span>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 outline-none" />
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Active subject
              </label>

              <div className="md:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="rounded-xl border border-white/10 px-4 py-2 text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{submitting ? "Saving..." : editingSubject ? "Update Subject" : "Create Subject"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
