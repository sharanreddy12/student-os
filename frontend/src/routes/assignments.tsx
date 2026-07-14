import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { CheckCircle2, Plus, Filter, Edit, Trash2, Home, Calendar, FileText, GraduationCap, BarChart3, ArrowLeft } from "lucide-react";
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
    Array<{ id: number; title: string; subject_id: number; status: string; due_date: string; priority: string; description?: string }>
  >([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "todo" | "in_progress" | "done">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);

  useEffect(() => {
    Promise.all([apiClient.getAssignments(), apiClient.getSubjects()])
      .then(([assignmentsData, subjectsData]) => {
        setAssignments(assignmentsData || []);
        setSubjects(subjectsData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this assignment?")) {
      try {
        await apiClient.deleteAssignment(id);
        setAssignments(assignments.filter((a) => a.id !== id));
      } catch (error) {
        console.error("Failed to delete assignment:", error);
      }
    }
  };

  const handleEdit = (assignment: any) => {
    setEditingAssignment(assignment);
    setShowAddModal(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingAssignment) {
        await apiClient.updateAssignment(editingAssignment.id, data);
        setAssignments(assignments.map((a) => (a.id === editingAssignment.id ? { ...a, ...data } : a)));
      } else {
        const newAssignment = await apiClient.createAssignment(data);
        setAssignments([...assignments, newAssignment]);
      }
      setShowAddModal(false);
      setEditingAssignment(null);
    } catch (error) {
      console.error("Failed to save assignment:", error);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await apiClient.updateAssignment(id, { status: newStatus });
      setAssignments(assignments.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const filteredAssignments = assignments.filter((a) => filter === "all" || a.status === filter);

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
            <MagneticButton onClick={() => setShowAddModal(true)}>
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
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {filter === "all" ? "No assignments yet. Create your first assignment!" : `No ${filter} assignments.`}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssignments.map((assignment) => {
                const subject = subjects.find((s) => s.id === assignment.subject_id);
                const progress = assignment.status === "done" ? 100 : assignment.status === "in_progress" ? 50 : 0;
                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-4 rounded-xl relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{assignment.title}</h3>
                          <span
                            className={`h-2 w-2 rounded-full ${statusColors[assignment.status as keyof typeof statusColors]}`}
                          />
                        </div>
                        {subject && (
                          <p className="text-sm text-muted-foreground mt-1">{subject.name}</p>
                        )}
                        {assignment.description && (
                          <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Due: {new Date(assignment.due_date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-2xl font-semibold">{progress}%</div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(assignment)}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(assignment.id)}
                            className="p-1 hover:bg-white/10 rounded text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full rounded-full"
                          style={{ background: "var(--gradient-brand)" }}
                        />
                      </div>
                      <select
                        value={assignment.status}
                        onChange={(e) => handleStatusChange(assignment.id, e.target.value)}
                        className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 outline-none"
                      >
                        <option value="todo" className="bg-background">Todo</option>
                        <option value="in_progress" className="bg-background">In Progress</option>
                        <option value="done" className="bg-background">Done</option>
                      </select>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {showAddModal && (
        <AddAssignmentModal
          onClose={() => {
            setShowAddModal(false);
            setEditingAssignment(null);
          }}
          onSave={handleSave}
          subjects={subjects}
          editingAssignment={editingAssignment}
        />
      )}
    </div>
  );
}

function Sidebar() {
  const items = [
    { icon: Home, label: "Home", active: false, to: "/dashboard" },
    { icon: Calendar, label: "Timetable", active: false, to: "/timetable" },
    { icon: FileText, label: "Notes", active: false, to: "/notes" },
    { icon: CheckCircle2, label: "Assignments", active: true, to: "/assignments" },
    { icon: GraduationCap, label: "Subjects", active: false, to: "/subjects" },
    { icon: GraduationCap, label: "Attendance", active: false, to: "/attendance" },
    { icon: BarChart3, label: "Analytics", active: false, to: "/analytics" },
  ];

  return (
    <aside className="w-60 shrink-0 border-r border-white/5 p-4">
      <Link to="/" className="mb-8 flex items-center gap-2 text-sm font-semibold">
        <span
          className="grid h-7 w-7 place-items-center rounded-lg"
          style={{ background: "var(--gradient-brand)" }}
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

function AddAssignmentModal({
  onClose,
  onSave,
  subjects,
  editingAssignment,
}: {
  onClose: () => void;
  onSave: (data: any) => void;
  subjects: any[];
  editingAssignment: any;
}) {
  const [title, setTitle] = useState(editingAssignment?.title || "");
  const [description, setDescription] = useState(editingAssignment?.description || "");
  const [subjectId, setSubjectId] = useState(editingAssignment?.subject_id || "");
  const [dueDate, setDueDate] = useState(editingAssignment?.due_date || "");
  const [priority, setPriority] = useState(editingAssignment?.priority || "medium");
  const [status, setStatus] = useState(editingAssignment?.status || "todo");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      subject_id: parseInt(subjectId) || 1,
      due_date: dueDate,
      priority,
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
        className="glass-strong w-full max-w-lg p-6 shadow-elevate"
      >
        <h2 className="text-xl font-semibold mb-4">
          {editingAssignment ? "Edit Assignment" : "Add Assignment"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
              required
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
              required
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
            <label className="text-sm text-muted-foreground mb-1 block">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
              >
                <option value="low" className="bg-background">Low</option>
                <option value="medium" className="bg-background">Medium</option>
                <option value="high" className="bg-background">High</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
              >
                <option value="todo" className="bg-background">Todo</option>
                <option value="in_progress" className="bg-background">In Progress</option>
                <option value="done" className="bg-background">Done</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <MagneticButton type="submit" className="flex-1">
              {editingAssignment ? "Update" : "Add"} Assignment
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
