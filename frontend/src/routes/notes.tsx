import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { FileText, Plus, Brain, Send, Sparkles, Trash2, Edit, Home, Calendar, CheckCircle2, GraduationCap, BarChart3, ArrowLeft, Search } from "lucide-react";
import { apiClient, type Note } from "@/api/client";
import { MagneticButton } from "@/components/landing/atoms";

interface ChatResponse {
  session_id: number;
  answer: string;
}

export const Route = createFileRoute("/notes")({
  ssr: false,
  beforeLoad: async () => {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!accessToken) {
      throw redirect({ to: "/login" });
    }
  },
  component: Notes,
});

function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([apiClient.getNotes(), apiClient.getSubjects()])
      .then(([notesData, subjectsData]) => {
        setNotes(notesData || []);
        setSubjects((subjectsData || []) as any[]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await apiClient.deleteNote(id);
        setNotes(notes.filter((n) => n.id !== id));
      } catch (error) {
        console.error("Failed to delete note:", error);
      }
    }
  };

  const handleEdit = (note: any) => {
    setEditingNote(note);
    setShowCreateModal(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingNote) {
        await apiClient.updateNote(editingNote.id, data);
        setNotes(notes.map((n) => (n.id === editingNote.id ? { ...n, ...data } : n)));
      } else {
        const newNote = await apiClient.createNote(data);
        setNotes([...notes, newNote]);
      }
      setShowCreateModal(false);
      setEditingNote(null);
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === null || note.subject_id === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await apiClient.chat(
        userMessage,
        sessionId ? parseInt(sessionId) : undefined,
      ) as ChatResponse;
      setSessionId(String(response.session_id));
      setChatMessages((prev) => [...prev, { role: "assistant", content: response.answer }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
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
              <h1 className="text-4xl font-semibold tracking-tight">Notes</h1>
              <p className="mt-2 text-muted-foreground">
                Your knowledge base with AI-powered insights
              </p>
            </div>
            <div className="flex gap-2">
              <MagneticButton onClick={() => setChatOpen(true)} variant="ghost">
                <Brain className="h-4 w-4" /> AI Chat
              </MagneticButton>
              <MagneticButton onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4" /> New Note
              </MagneticButton>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1 glass flex items-center gap-2 px-4 py-2 rounded-lg">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
            <select
              value={selectedSubject || ""}
              onChange={(e) => setSelectedSubject(e.target.value ? parseInt(e.target.value) : null)}
              aria-label="Filter by subject"
              className="glass px-4 py-2 rounded-lg bg-transparent outline-none text-sm"
            >
              <option value="" className="bg-background">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id} className="bg-background">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || selectedSubject ? "No notes match your search." : "No notes yet. Create your first note!"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => {
                const subject = subjects.find((s) => s.id === note.subject_id);
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-4 rounded-xl hover:bg-white/5 transition-colors relative group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{note.title}</h3>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(note);
                          }}
                          aria-label="Edit note"
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(note.id);
                          }}
                          aria-label="Delete note"
                          className="p-1 hover:bg-white/10 rounded text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {subject && (
                      <div className="text-xs text-muted-foreground mb-2">{subject.name}</div>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
                    <div className="mt-3 text-xs text-muted-foreground">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
      {showCreateModal && (
        <CreateNoteModal
          onClose={() => {
            setShowCreateModal(false);
            setEditingNote(null);
          }}
          onSave={handleSave}
          subjects={subjects}
          editingNote={editingNote}
        />
      )}
    </div>
  );
}

function Sidebar() {
  const items = [
    { icon: Home, label: "Home", active: false, to: "/dashboard" },
    { icon: Calendar, label: "Timetable", active: false, to: "/timetable" },
    { icon: FileText, label: "Notes", active: true, to: "/notes" },
    { icon: CheckCircle2, label: "Assignments", active: false, to: "/assignments" },
    { icon: GraduationCap, label: "Attendance", active: false, to: "/attendance" },
    { icon: BarChart3, label: "Analytics", active: false, to: "/analytics" },
  ];

  return (
    <aside className="w-60 shrink-0 border-r border-white/5 p-4">
      <Link to="/" className="mb-8 flex items-center gap-2 text-sm font-semibold">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-brand">
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

function ChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await apiClient.chat(
        userMessage,
        sessionId ? parseInt(sessionId) : undefined,
      ) as ChatResponse;
      setSessionId(String(response.session_id));
      setMessages((prev) => [...prev, { role: "assistant", content: response.answer }]);
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed right-0 top-0 h-full w-96 glass-strong border-l border-white/10 p-4 z-50"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          <h2 className="font-semibold">AI Assistant</h2>
        </div>
        <button onClick={onClose} aria-label="Close chat" className="p-1 hover:bg-white/10 rounded">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[calc(100vh-140px)]">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Ask questions about your notes</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg ${
              msg.role === "user" ? "bg-white/10 ml-8" : "bg-(--gradient-brand)/20 mr-8"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about your notes..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/20"
        />
        <button
          onClick={handleSend}
          aria-label="Send message"
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

function CreateNoteModal({
  onClose,
  onSave,
  subjects,
  editingNote,
}: {
  onClose: () => void;
  onSave: (data: any) => void;
  subjects: any[];
  editingNote: any;
}) {
  const [title, setTitle] = useState(editingNote?.title || "");
  const [content, setContent] = useState(editingNote?.content || "");
  const [subjectId, setSubjectId] = useState(editingNote?.subject_id || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      content,
      subject_id: parseInt(subjectId) || 1,
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
          {editingNote ? "Edit Note" : "Create Note"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Note title"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
              required
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              aria-label="Select subject"
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
            <label className="text-sm text-muted-foreground mb-1 block">Content (Markdown supported)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              aria-label="Note content"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
              required
            />
          </div>
          <div className="flex gap-2 mt-6">
            <MagneticButton type="submit" className="flex-1">
              {editingNote ? "Update" : "Create"} Note
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
