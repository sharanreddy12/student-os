import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { GraduationCap, Calendar as CalendarIcon, Check, X, AlertCircle, Plus, Edit, Trash2, Home, HomeIcon, FileText, CheckCircle2, BarChart3, ArrowLeft } from "lucide-react";
import { apiClient } from "@/api/client";
import { MagneticButton } from "@/components/landing/atoms";

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
  const [subjects, setSubjects] = useState<any[]>([]);
  const [summary, setSummary] = useState<
    Array<{ subject_id: number; total_classes: number; attended: number; percentage: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      apiClient.getAttendance() as Promise<Array<{ id: number; subject_id: number; date: string; status: string }>>,
      apiClient.getAttendanceSummary() as Promise<Array<{ subject_id: number; total_classes: number; attended: number; percentage: number }>>,
      apiClient.getSubjects() as Promise<any[]>,
    ])
      .then(([attendanceData, summaryData, subjectsData]) => {
        setAttendance(attendanceData || []);
        setSummary(summaryData || []);
        setSubjects(subjectsData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this attendance record?")) {
      try {
        await apiClient.deleteAttendance(id);
        setAttendance(attendance.filter((a) => a.id !== id));
      } catch (error) {
        console.error("Failed to delete attendance:", error);
      }
    }
  };

  const handleEdit = (record: any) => {
    setEditingAttendance(record);
    setShowAddModal(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingAttendance) {
        await apiClient.updateAttendance(editingAttendance.id, data);
        setAttendance(attendance.map((a) => (a.id === editingAttendance.id ? { ...a, ...data } : a)));
      } else {
        const newRecord = await apiClient.createAttendance(data) as { id: number; subject_id: number; date: string; status: string };
        setAttendance([...attendance, newRecord]);
      }
      setShowAddModal(false);
      setEditingAttendance(null);
    } catch (error) {
      console.error("Failed to save attendance:", error);
    }
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
              <h1 className="text-4xl font-semibold tracking-tight">Attendance</h1>
              <p className="mt-2 text-muted-foreground">Track your class attendance</p>
            </div>
            <MagneticButton onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" /> Add Record
            </MagneticButton>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {summary.length === 0 ? (
                  <div className="col-span-3 text-center py-8 text-muted-foreground">
                    No attendance data yet. Add your first record!
                  </div>
                ) : (
                  summary.map((stat) => {
                    const subject = subjects.find((s) => s.id === stat.subject_id);
                    const colorClass =
                      stat.percentage >= 75
                        ? "text-attendance-high"
                        : stat.percentage >= 50
                          ? "text-attendance-medium"
                          : "text-attendance-low";
                    const barClass =
                      stat.percentage >= 75
                        ? "bg-attendance-high"
                        : stat.percentage >= 50
                          ? "bg-attendance-medium"
                          : "bg-attendance-low";
                    return (
                      <motion.div
                        key={stat.subject_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-4 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">{subject?.name || `Subject ${stat.subject_id}`}</span>
                          <span className={`text-2xl font-semibold ${colorClass}`}>
                            {stat.percentage}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.percentage}%` }}
                            className={`h-full rounded-full ${barClass}`}
                          />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {stat.attended}/{stat.total_classes} classes attended
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              <h2 className="text-xl font-semibold mb-4">Recent Records</h2>
              <div className="space-y-2">
                {attendance.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No attendance records yet.
                  </div>
                ) : (
                  attendance
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((record) => {
                      const subject = subjects.find((s) => s.id === record.subject_id);
                      return (
                        <motion.div
                          key={record.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="glass p-4 rounded-xl flex items-center justify-between relative group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/5">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium">{subject?.name || `Subject ${record.subject_id}`}</div>
                              <div className="text-sm text-muted-foreground">{new Date(record.date).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {record.status === "present" && (
                              <span className="flex items-center gap-1 text-sm text-(--neon-green)">
                                <Check className="h-4 w-4" /> Present
                              </span>
                            )}
                            {record.status === "absent" && (
                              <span className="flex items-center gap-1 text-sm text-(--neon-amber)">
                                <X className="h-4 w-4" /> Absent
                              </span>
                            )}
                            {record.status === "excused" && (
                              <span className="flex items-center gap-1 text-sm text-(--neon-blue)">
                                <AlertCircle className="h-4 w-4" /> Excused
                              </span>
                            )}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(record)}
                                className="p-1 hover:bg-white/10 rounded"
                                aria-label="Edit attendance record"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(record.id)}
                                className="p-1 hover:bg-white/10 rounded text-red-400"
                                aria-label="Delete attendance record"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {showAddModal && (
        <AddAttendanceModal
          onClose={() => {
            setShowAddModal(false);
            setEditingAttendance(null);
          }}
          onSave={handleSave}
          subjects={subjects}
          editingAttendance={editingAttendance}
        />
      )}
    </div>
  );
}

function Sidebar() {
  const items = [
    { icon: Home, label: "Home", active: false, to: "/dashboard" },
    { icon: CalendarIcon, label: "Timetable", active: false, to: "/timetable" },
    { icon: FileText, label: "Notes", active: false, to: "/notes" },
    { icon: CheckCircle2, label: "Assignments", active: false, to: "/assignments" },
    { icon: GraduationCap, label: "Subjects", active: false, to: "/subjects" },
    { icon: GraduationCap, label: "Attendance", active: true, to: "/attendance" },
    { icon: BarChart3, label: "Analytics", active: false, to: "/analytics" },
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

function AddAttendanceModal({
  onClose,
  onSave,
  subjects,
  editingAttendance,
}: {
  onClose: () => void;
  onSave: (data: any) => void;
  subjects: any[];
  editingAttendance: any;
}) {
  const [subjectId, setSubjectId] = useState(editingAttendance?.subject_id || "");
  const [date, setDate] = useState(editingAttendance?.date || "");
  const [status, setStatus] = useState(editingAttendance?.status || "present");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      subject_id: parseInt(subjectId) || 1,
      date,
      status,
    });
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
        <h2 className="text-xl font-semibold mb-4">
          {editingAttendance ? "Edit Record" : "Add Attendance Record"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
              required
              aria-label="Select subject"
            >
              <option value="" className="bg-background">Select a subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id} className="bg-background">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
              required
              aria-label="Select date"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
              aria-label="Select status"
            >
              <option value="present" className="bg-background">Present</option>
              <option value="absent" className="bg-background">Absent</option>
              <option value="excused" className="bg-background">Excused</option>
            </select>
          </div>
          <div className="flex gap-2 mt-6">
            <MagneticButton type="submit" className="flex-1">
              {editingAttendance ? "Update" : "Add"} Record
            </MagneticButton>
            <MagneticButton type="button" onClick={onClose} variant="ghost">
              Cancel
            </MagneticButton>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
