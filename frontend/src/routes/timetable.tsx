import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo, useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Plus, Edit, Trash2, Home, FileText, CheckCircle2, GraduationCap, BarChart3, ArrowLeft, Sparkles, Building, UserRound, Search } from "lucide-react";
import { apiClient } from "@/api/client";
import { MagneticButton } from "@/components/landing/atoms";

export const Route = createFileRoute("/timetable")({
  ssr: false,
  beforeLoad: async () => {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!accessToken) {
      throw redirect({ to: "/login" });
    }
  },
  component: Timetable,
});

function Timetable() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    Promise.all([apiClient.getTimetable(), apiClient.getSubjects()])
      .then(([timetableData, subjectsData]) => {
        setTimetable((timetableData as any[]) || []);
        setSubjects((subjectsData as any[]) || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const filteredEntries = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return timetable;
    return timetable.filter((entry) => {
      const subject = subjects.find((s) => s.id === entry.subject_id);
      return [subject?.name, entry.location, entry.faculty_name, entry.building, entry.class_type, entry.notes]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value));
    });
  }, [query, subjects, timetable]);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this class?")) {
      try {
        await apiClient.deleteTimetableEntry(id);
        setTimetable((prev) => prev.filter((t) => t.id !== id));
      } catch (error) {
        console.error("Failed to delete class:", error);
      }
    }
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setShowAddModal(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingEntry) {
        const updatedEntry = await apiClient.updateTimetableEntry(editingEntry.id, data);
        setTimetable((prev) => prev.map((t) => (t.id === editingEntry.id ? updatedEntry : t)));
      } else {
        const newEntry = await apiClient.createTimetableEntry(data);
        setTimetable((prev) => [...prev, newEntry]);
      }
      setShowAddModal(false);
      setEditingEntry(null);
    } catch (error) {
      console.error("Failed to save class:", error);
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
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">Timetable</h1>
              <p className="mt-2 text-muted-foreground">Plan your week with subjects, rooms, and recurring classes.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground">
                <Search className="h-4 w-4" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search classes"
                  className="w-40 bg-transparent outline-none placeholder:text-muted-foreground"
                />
              </label>
              <MagneticButton onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4" /> Add Class
              </MagneticButton>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading timetable…</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-7">
              {days.map((day, dayIndex) => {
                const entriesForDay = filteredEntries
                  .filter((t) => t.day_of_week === dayIndex && t.is_active !== false)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time));

                return (
                  <div key={day} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between px-1 py-1">
                      <div className="text-sm font-medium text-foreground">{day}</div>
                      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{entriesForDay.length}</div>
                    </div>
                    {entriesForDay.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-muted-foreground">
                        No classes yet
                      </div>
                    ) : (
                      entriesForDay.map((entry) => {
                        const subject = subjects.find((s) => s.id === entry.subject_id);
                        const subjectColor = subject?.color || "#3b82f6";
                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group rounded-xl border border-white/10 bg-background/70 p-3 shadow-sm"
                            style={{ borderLeftColor: subjectColor, borderLeftWidth: 3 }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-sm font-medium">{subject?.name || `Subject ${entry.subject_id}`}</div>
                                <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <Clock className="h-3 w-3" /> {entry.start_time} - {entry.end_time}
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <button onClick={() => handleEdit(entry)} className="rounded p-1 hover:bg-white/10" aria-label="Edit class">
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button onClick={() => handleDelete(entry.id)} className="rounded p-1 text-red-400 hover:bg-white/10" aria-label="Delete class">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                              {entry.location ? (
                                <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {entry.location}</div>
                              ) : null}
                              {entry.faculty_name ? (
                                <div className="flex items-center gap-1"><UserRound className="h-3 w-3" /> {entry.faculty_name}</div>
                              ) : null}
                              {entry.building ? (
                                <div className="flex items-center gap-1"><Building className="h-3 w-3" /> {entry.building}</div>
                              ) : null}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                                {entry.class_type || "lecture"}
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                                {entry.recurrence || "weekly"}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {showAddModal && (
        <AddClassModal
          onClose={() => {
            setShowAddModal(false);
            setEditingEntry(null);
          }}
          onSave={handleSave}
          subjects={subjects}
          editingEntry={editingEntry}
          days={days}
        />
      )}
    </div>
  );
}

function Sidebar() {
  const items = [
    { icon: Home, label: "Home", active: false, to: "/dashboard" },
    { icon: Calendar, label: "Timetable", active: true, to: "/timetable" },
    { icon: FileText, label: "Notes", active: false, to: "/notes" },
    { icon: CheckCircle2, label: "Assignments", active: false, to: "/assignments" },
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

function AddClassModal({
  onClose,
  onSave,
  subjects,
  editingEntry,
  days,
}: {
  onClose: () => void;
  onSave: (data: any) => void;
  subjects: any[];
  editingEntry: any;
  days: string[];
}) {
  const [day, setDay] = useState(editingEntry?.day_of_week ?? 0);
  const [subjectId, setSubjectId] = useState(editingEntry?.subject_id ?? "");
  const [startTime, setStartTime] = useState(editingEntry?.start_time || "");
  const [endTime, setEndTime] = useState(editingEntry?.end_time || "");
  const [location, setLocation] = useState(editingEntry?.location || "");
  const [facultyName, setFacultyName] = useState(editingEntry?.faculty_name || "");
  const [building, setBuilding] = useState(editingEntry?.building || "");
  const [classType, setClassType] = useState(editingEntry?.class_type || "lecture");
  const [recurrence, setRecurrence] = useState(editingEntry?.recurrence || "weekly");
  const [notes, setNotes] = useState(editingEntry?.notes || "");
  const [isActive, setIsActive] = useState(editingEntry?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      day_of_week: day,
      subject_id: parseInt(subjectId),
      start_time: startTime,
      end_time: endTime,
      location: location || undefined,
      faculty_name: facultyName || undefined,
      building: building || undefined,
      class_type: classType,
      recurrence,
      notes: notes || undefined,
      is_active: isActive,
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
          {editingEntry ? "Edit Class" : "Add Class"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Day</label>
            <select
              value={day}
              onChange={(e) => setDay(parseInt(e.target.value))}
              className="w-full glass px-4 py-2 rounded-lg bg-transparent outline-none"
              required
            >
              {days.map((d, i) => (
                <option key={d} value={i} className="bg-background">
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full glass px-4 py-2 rounded-lg bg-transparent outline-none"
              required
            >
              <option value="" className="bg-background">
                Select a subject
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id} className="bg-background">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full glass px-4 py-2 rounded-lg bg-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full glass px-4 py-2 rounded-lg bg-transparent outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Location (optional)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Room 204"
              className="w-full glass px-4 py-2 rounded-lg bg-transparent outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Faculty</label>
              <input
                type="text"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                placeholder="Dr. Ada"
                className="w-full glass px-4 py-2 rounded-lg bg-transparent outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Building</label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="Block A"
                className="w-full glass px-4 py-2 rounded-lg bg-transparent outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Class type</label>
              <select
                value={classType}
                onChange={(e) => setClassType(e.target.value)}
                className="w-full glass px-4 py-2 rounded-lg bg-transparent outline-none"
              >
                {['lecture','lab','tutorial','seminar','practice','exam'].map((type) => (
                  <option key={type} value={type} className="bg-background">
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Recurrence</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full glass px-4 py-2 rounded-lg bg-transparent outline-none"
              >
                {['none','weekly','biweekly','custom'].map((value) => (
                  <option key={value} value={value} className="bg-background">
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bring laptop, review chapters..."
              className="w-full glass px-4 py-2 rounded-lg bg-transparent outline-none min-h-20"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active class
          </label>
          <div className="flex gap-3 pt-4">
            <MagneticButton type="submit" className="flex-1">
              {editingEntry ? "Update" : "Add"} Class
            </MagneticButton>
            <MagneticButton
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </MagneticButton>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
