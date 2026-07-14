import { createFileRoute, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  BookOpen,
  User,
  ArrowLeft,
  Filter
} from "lucide-react";
import { apiClient } from "@/api/client";
import { useUser } from "@/contexts/UserContext";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/announcements")({
  ssr: false,
  beforeLoad: async () => {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!accessToken) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "StudentOS · Announcements" },
      {
        name: "description",
        content: "View latest announcements from your teachers.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Announcements,
});

function Announcements() {
  const { user } = useUser();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    Promise.all([
      apiClient.getAnnouncements(),
      apiClient.getSubjects(),
    ])
      .then(([announcementsData, subjectsData]) => {
        setAnnouncements(announcementsData || []);
        setSubjects(subjectsData || []);
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

  const getTeacherName = (teacherId: number) => {
    // In a real app, you'd fetch teacher data. For now, use a placeholder
    return "Teacher";
  };

  const filteredAnnouncements = filter === "all" 
    ? announcements 
    : announcements.filter((a) => {
        const subject = subjects.find((s) => s.id === a.subject_id);
        return subject && subject.name.toLowerCase().includes(filter.toLowerCase());
      });

  const groupedAnnouncements = filteredAnnouncements.reduce((acc, announcement) => {
    const date = new Date(announcement.created_at).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(announcement);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-cyan border-t-transparent" />
          <div className="text-sm font-medium text-muted-foreground">Loading announcements…</div>
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

      <div className="min-h-screen px-8 py-8 max-w-7xl mx-auto">
        <header className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Announcements</h1>
              <p className="text-muted-foreground mt-2">
                Stay updated with latest news from your teachers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {announcements.length} total
              </span>
            </div>
          </div>
        </header>

        {/* Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neon-cyan"
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.name}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Announcements List */}
        {Object.keys(groupedAnnouncements).length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-12 border border-border/20 text-center"
          >
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Announcements</h3>
            <p className="text-muted-foreground">
              {filter === "all" 
                ? "No announcements have been posted yet." 
                : `No announcements for ${filter}.`}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAnnouncements).map(([date, dateAnnouncements], dateIdx) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dateIdx * 0.1 }}
              >
                <h3 className="text-lg font-semibold mb-4 text-muted-foreground">{date}</h3>
                <div className="space-y-4">
                  {dateAnnouncements.map((announcement, idx) => (
                    <motion.div
                      key={announcement.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="glass rounded-xl p-6 border border-border/20"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: getSubjectColor(announcement.subject_id) }}
                        >
                          <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-lg">{announcement.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {getSubjectName(announcement.subject_id)}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                              {new Date(announcement.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground mt-3 leading-relaxed">
                            {announcement.content}
                          </p>
                          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>Posted by Teacher</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
