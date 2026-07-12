import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { FileText, Plus, Brain, Send, Sparkles, Trash2, Edit } from "lucide-react";
import { apiClient } from "@/api/client";
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
  const [notes, setNotes] = useState<
    Array<{ id: number; title: string; content: string; subject_id: number; updated_at: string }>
  >([]);
  const [selectedNote, setSelectedNote] = useState<{
    id: number;
    title: string;
    content: string;
    subject_id: number;
    updated_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const data = await apiClient.getNotes();
      setNotes(
        data as Array<{
          id: number;
          title: string;
          content: string;
          subject_id: number;
          updated_at: string;
        }>,
      );
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setLoading(false);
    }
  };

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

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedNote(note)}
                  className="glass p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">{note.title}</h3>
                    <div className="flex gap-1">
                      <button className="p-1 hover:bg-white/10 rounded">
                        <Edit className="h-3 w-3" />
                      </button>
                      <button className="p-1 hover:bg-white/10 rounded">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
      {showCreateModal && (
        <CreateNoteModal onClose={() => setShowCreateModal(false)} onSuccess={fetchNotes} />
      )}
    </div>
  );
}

function Sidebar() {
  const items = [
    { icon: () => null, label: "Timetable" },
    { icon: () => null, label: "Assignments" },
    { icon: () => null, label: "Attendance" },
    { icon: FileText, label: "Notes", active: true },
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
              to={it.label === "Notes" ? "/notes" : "/dashboard"}
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
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
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
              msg.role === "user" ? "bg-white/10 ml-8" : "bg-[color:var(--gradient-brand)]/20 mr-8"
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
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

function CreateNoteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const handleSubmit = async () => {
    try {
      await apiClient.createNote({
        title,
        content,
        subject_id: parseInt(subjectId) || 1,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create note:", error);
    }
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
        <h2 className="text-xl font-semibold mb-4">Create Note</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <MagneticButton onClick={handleSubmit} className="flex-1">
            Create Note
          </MagneticButton>
          <MagneticButton onClick={onClose} variant="ghost">
            Cancel
          </MagneticButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
