import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { Calendar, Clock, MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { apiClient } from "@/api/client";
import { MagneticButton, Panel3D } from "@/components/landing/atoms";

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
  const [timetable, setTimetable] = useState<
    Array<{
      id: number;
      subject_id: number;
      day: string;
      start_time: string;
      end_time: string;
      location?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // TODO: Fetch timetable data on mount
  // useEffect(() => {
  //   apiClient.getTimetable().then(setTimetable).finally(() => setLoading(false));
  // }, []);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
              <h1 className="text-4xl font-semibold tracking-tight">Timetable</h1>
              <p className="mt-2 text-muted-foreground">Manage your weekly schedule</p>
            </div>
            <MagneticButton onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" /> Add Class
            </MagneticButton>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <div className="grid grid-cols-7 gap-4">
              {days.map((day) => (
                <div key={day} className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground text-center py-2">
                    {day}
                  </div>
                  {/* TODO: Render timetable entries for this day */}
                  <div className="glass p-3 rounded-xl">
                    <div className="text-xs font-medium">Physics</div>
                    <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> 09:00 - 10:00
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Room 204
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {showAddModal && <AddClassModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}

function Sidebar() {
  const items = [
    { icon: Calendar, label: "Timetable", active: true },
    { icon: () => null, label: "Notes" },
    { icon: () => null, label: "Assignments" },
    { icon: () => null, label: "Attendance" },
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
              to={it.label === "Timetable" ? "/timetable" : "/dashboard"}
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

function AddClassModal({ onClose }: { onClose: () => void }) {
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
        <h2 className="text-xl font-semibold mb-4">Add Class</h2>
        {/* TODO: Add form for creating timetable entry */}
        <div className="text-sm text-muted-foreground">Form coming soon...</div>
        <MagneticButton onClick={onClose} variant="ghost" className="mt-4">
          Close
        </MagneticButton>
      </motion.div>
    </motion.div>
  );
}
