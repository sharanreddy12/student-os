import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Users, Shield, FileText, CheckCircle2, UserPlus, 
  Trash2, Edit2, Key, Check, AlertCircle, RefreshCw, Plus, X, Award
} from "lucide-react";
import { apiClient } from "@/api/client";
import { User } from "@/contexts/UserContext";

// Interface for API responses/user schemas in panels
interface ManagementUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  roll_number?: string;
  department?: string;
  designation?: string;
  semester?: number;
  section?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

interface ManagementPanelsProps {
  user: User;
  tab: string;
}

export function ManagementPanels({ user, tab }: ManagementPanelsProps) {
  if (user.role === "SUPER_ADMIN") {
    return <SuperAdminPanel tab={tab} currentUser={user} />;
  }
  if (user.role === "ADMIN") {
    return <AdminPanel tab={tab} currentUser={user} />;
  }
  if (user.role === "TEACHER") {
    return <TeacherPanel tab={tab} currentUser={user} />;
  }
  return null;
}

// ----------------------------------------------------
// SUPER ADMIN PANEL
// ----------------------------------------------------
function SuperAdminPanel({ tab, currentUser }: { tab: string; currentUser: User }) {
  const [usersList, setUsersList] = useState<ManagementUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagementUser | null>(null);

  // Form states
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "super_admins") {
        const data = await apiClient.getSuperAdmins();
        setUsersList(data as ManagementUser[]);
      } else if (tab === "admins") {
        const data = await apiClient.getAdmins();
        setUsersList(data as ManagementUser[]);
      } else if (tab === "audit") {
        // Fetch all students/teachers/admins/superadmins
        const [saList, aList, tList, sList] = await Promise.all([
          apiClient.getSuperAdmins(),
          apiClient.getAdmins(),
          apiClient.getTeachers(),
          apiClient.getStudents(),
        ]);
        setUsersList([
          ...(saList as ManagementUser[]),
          ...(aList as ManagementUser[]),
          ...(tList as ManagementUser[]),
          ...(sList as ManagementUser[]),
        ]);
      }
    } catch (err) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [tab]);

  const handleDeactivate = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this account?")) return;
    setError("");
    setSuccess("");
    try {
      if (tab === "super_admins") {
        await apiClient.deactivateSuperAdmin(id);
      } else {
        await apiClient.deactivateAdmin(id);
      }
      setSuccess("Account deactivated successfully");
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deactivation failed");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    try {
      if (editingUser) {
        // Update user
        if (tab === "super_admins") {
          await apiClient.updateSuperAdmin(editingUser.id, {
            name: form.name,
            email: form.email,
            password: form.password || undefined,
          });
        } else {
          await apiClient.updateAdmin(editingUser.id, {
            name: form.name,
            email: form.email,
            password: form.password || undefined,
          });
        }
        setSuccess("Account updated successfully");
      } else {
        // Create user
        if (tab === "super_admins") {
          await apiClient.createSuperAdmin(form);
        } else {
          await apiClient.createAdmin(form);
        }
        setSuccess("Account created successfully");
      }
      setShowAddModal(false);
      setEditingUser(null);
      setForm({ name: "", email: "", password: "", confirm_password: "" });
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  };

  const handleEdit = (user: ManagementUser) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      confirm_password: "",
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold capitalize">{tab.replace("_", " ")} Workspace</h2>
          <p className="text-sm text-muted-foreground">Manage your system directory accounts & credentials</p>
        </div>
        {tab !== "audit" && (
          <button
            onClick={() => {
              setEditingUser(null);
              setForm({ name: "", email: "", password: "", confirm_password: "" });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 rounded-xl py-2 px-4 text-sm font-medium text-white bg-gradient-brand"
          >
            <UserPlus className="h-4 w-4" /> Add {tab === "super_admins" ? "Super Admin" : "Admin"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex gap-3 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 flex gap-3 text-sm text-green-400">
          <Check className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading system directory data...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 glass">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/2 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">User Details</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Last Login</th>
                <th className="px-6 py-4 font-semibold">Created By</th>
                {tab !== "audit" && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No active accounts found in this directory.
                  </td>
                </tr>
              ) : (
                usersList.map((usr) => (
                  <tr key={usr.id} className="border-b border-white/5 hover:bg-white/1 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{usr.name}</div>
                      <div className="text-xs text-muted-foreground">{usr.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      <span className={`px-2 py-0.5 rounded ${
                        usr.role === "SUPER_ADMIN" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                        usr.role === "ADMIN" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        usr.role === "TEACHER" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                        "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      }`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        usr.status === "ACTIVE" ? "bg-green-500/15 text-green-400" :
                        usr.status === "INACTIVE" ? "bg-red-500/15 text-red-400" :
                        "bg-yellow-500/15 text-yellow-400"
                      }`}>
                        {usr.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {usr.last_login ? new Date(usr.last_login).toLocaleString() : "Never logged in"}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {usr.created_by ? `User ID: ${usr.created_by}` : "System initialization"}
                    </td>
                    {tab !== "audit" && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(usr)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
                            title="Edit Account"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {usr.status === "ACTIVE" && usr.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeactivate(usr.id)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Deactivate Account"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Super Admin/Admin Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl glass-strong border border-white/5 shadow-2xl p-6 relative"
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-semibold mb-6">
              {editingUser ? "Edit Account" : `Create New ${tab === "super_admins" ? "Super Admin" : "Admin"}`}
            </h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Full NameLabel</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@domain.com"
                  className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {editingUser ? "New Password (Leave blank to keep current)" : "Password"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Confirm PasswordLabel</label>
                <input
                  type="password"
                  required={!editingUser || !!form.password}
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl py-3 text-sm font-semibold text-white bg-gradient-brand mt-6"
              >
                {editingUser ? "Save Changes" : "Create Account"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// ADMIN PANEL
// ----------------------------------------------------
function AdminPanel({ tab, currentUser }: { tab: string; currentUser: User }) {
  const [teachersList, setTeachersList] = useState<ManagementUser[]>([]);
  const [studentsList, setStudentsList] = useState<ManagementUser[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<ManagementUser | null>(null);

  // Form states
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    designation: "",
  });

  const [assignForm, setAssignForm] = useState({
    teacher_id: "",
    subject_id: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "teachers") {
        const [teachers, subjects] = await Promise.all([
          apiClient.getTeachers(),
          apiClient.getSubjects(),
        ]);
        setTeachersList(teachers as ManagementUser[]);
        setSubjectsList(subjects as any[]);
      } else if (tab === "students") {
        const data = await apiClient.getStudents();
        setStudentsList(data as ManagementUser[]);
      }
    } catch (err) {
      setError("Failed to fetch administrative records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  const handleDeactivate = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this Teacher?")) return;
    setError("");
    setSuccess("");
    try {
      await apiClient.deactivateTeacher(id);
      setSuccess("Teacher deactivated successfully");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deactivation failed");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      if (editingTeacher) {
        await apiClient.updateTeacher(editingTeacher.id, {
          name: form.name,
          email: form.email,
          password: form.password || undefined,
          department: form.department,
          designation: form.designation,
        });
        setSuccess("Teacher updated successfully");
      } else {
        await apiClient.createTeacher(form);
        setSuccess("Teacher created successfully");
      }
      setShowAddModal(false);
      setEditingTeacher(null);
      setForm({ name: "", email: "", password: "", department: "", designation: "" });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await apiClient.assignTeacherToSubject(
        Number(assignForm.teacher_id),
        Number(assignForm.subject_id)
      );
      setSuccess("Teacher assigned to subject successfully");
      setShowAssignModal(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assignment failed");
    }
  };

  const handleEdit = (usr: ManagementUser) => {
    setEditingTeacher(usr);
    setForm({
      name: usr.name,
      email: usr.email,
      password: "",
      department: usr.department || "",
      designation: usr.designation || "",
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold capitalize">{tab} Directory</h2>
          <p className="text-sm text-muted-foreground">Administer academic staff profiles & core subject configurations</p>
        </div>
        {tab === "teachers" && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (teachersList.length === 0 || subjectsList.length === 0) {
                  alert("Requires both Teachers and Student Subjects to perform mapping.");
                  return;
                }
                setAssignForm({ teacher_id: String(teachersList[0]?.id || ""), subject_id: String(subjectsList[0]?.id || "") });
                setShowAssignModal(true);
              }}
              className="flex items-center gap-2 rounded-xl py-2 px-4 text-sm font-medium text-foreground bg-white/5 border border-white/5 hover:bg-white/10"
            >
              <Key className="h-4 w-4" /> Assign Teacher
            </button>
            <button
              onClick={() => {
                setEditingTeacher(null);
                setForm({ name: "", email: "", password: "", department: "", designation: "" });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 rounded-xl py-2 px-4 text-sm font-medium text-white bg-gradient-brand"
            >
              <UserPlus className="h-4 w-4" /> Add Teacher
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex gap-3 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 flex gap-3 text-sm text-green-400">
          <Check className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading administrative data...
        </div>
      ) : tab === "teachers" ? (
        <div className="overflow-x-auto rounded-2xl border border-white/5 glass">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/2 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Teacher Details</th>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold">Designation</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachersList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No Teachers registered yet.
                  </td>
                </tr>
              ) : (
                teachersList.map((usr) => (
                  <tr key={usr.id} className="border-b border-white/5 hover:bg-white/1 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{usr.name}</div>
                      <div className="text-xs text-muted-foreground">{usr.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{usr.department}</td>
                    <td className="px-6 py-4 text-sm">{usr.designation}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        usr.status === "ACTIVE" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                      }`}>
                        {usr.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(usr)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
                          title="Edit Profile"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {usr.status === "ACTIVE" && (
                          <button
                            onClick={() => handleDeactivate(usr.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Deactivate Profile"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 glass">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/2 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Student Name</th>
                <th className="px-6 py-4 font-semibold">Roll Number</th>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold">Class info</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {studentsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No Students registered in the directory yet.
                  </td>
                </tr>
              ) : (
                studentsList.map((usr) => (
                  <tr key={usr.id} className="border-b border-white/5 hover:bg-white/1 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{usr.name}</div>
                      <div className="text-xs text-muted-foreground">{usr.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">{usr.roll_number || "TBD"}</td>
                    <td className="px-6 py-4 text-sm">{usr.department}</td>
                    <td className="px-6 py-4 text-sm">
                      Semester {usr.semester} · Sec {usr.section}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        usr.status === "ACTIVE" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                      }`}>
                        {usr.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl glass-strong border border-white/5 shadow-2xl p-6 relative"
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-semibold mb-6">
              {editingTeacher ? "Edit Teacher Profile" : "Add New Academic Teacher"}
            </h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Dr. Alan Turing"
                  className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="turing@faculty.edu"
                  className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {editingTeacher ? "New Password (Leave blank to keep current)" : "Password"}
                </label>
                <input
                  type="password"
                  required={!editingTeacher}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Department</label>
                <input
                  type="text"
                  required
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="Computer Science"
                  className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Designation</label>
                <input
                  type="text"
                  required
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  placeholder="Professor / Asst. Professor"
                  className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl py-3 text-sm font-semibold text-white bg-gradient-brand mt-6"
              >
                {editingTeacher ? "Save Changes" : "Create Teacher Profile"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl glass-strong border border-white/5 shadow-2xl p-6 relative"
          >
            <button
              onClick={() => setShowAssignModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-semibold mb-6">Assign Teacher to Subject</h3>
            <form onSubmit={handleAssignTeacher} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Select Teacher</label>
                <select
                  value={assignForm.teacher_id}
                  onChange={(e) => setAssignForm({ ...assignForm, teacher_id: e.target.value })}
                  className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none text-foreground"
                >
                  {teachersList.map((t) => (
                    <option key={t.id} value={t.id} className="bg-neutral-900 text-foreground">
                      {t.name} ({t.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Select Subject</label>
                <select
                  value={assignForm.subject_id}
                  onChange={(e) => setAssignForm({ ...assignForm, subject_id: e.target.value })}
                  className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none text-foreground"
                >
                  {subjectsList.map((s) => (
                    <option key={s.id} value={s.id} className="bg-neutral-900 text-foreground">
                      {s.name} ({s.code}) - User ID: {s.user_id}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl py-3 text-sm font-semibold text-white bg-gradient-brand mt-6"
              >
                Assign Teacher Mapping
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// TEACHER PANEL
// ----------------------------------------------------
function TeacherPanel({ tab, currentUser }: { tab: string; currentUser: User }) {
  const [studentsList, setStudentsList] = useState<ManagementUser[]>([]);
  const [assignmentsList, setAssignmentsList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [marksList, setMarksList] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showEnterMarksModal, setShowEnterMarksModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<ManagementUser | null>(null);
  const [gradingAssignment, setGradingAssignment] = useState<any | null>(null);
  const [editingMark, setEditingMark] = useState<any | null>(null);

  // Forms
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roll_number: "",
    department: "",
    semester: 1,
    section: "",
  });

  const [assignSubjectForm, setAssignSubjectForm] = useState({
    student_id: "",
    name: "",
    code: "",
    semester: 1,
    credits: 3,
    color: "#3b82f6",
    minimum_attendance_percentage: 75,
    classroom: "",
    description: "",
  });

  const [gradeForm, setGradeForm] = useState({
    marks_obtained: "",
    max_marks: "100",
  });

  const [marksForm, setMarksForm] = useState({
    subject_id: "",
    quiz: "",
    assignment: "",
    lab: "",
    internal: "",
    mid_exam: "",
    practical: "",
    final: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [students, assignments, subjects] = await Promise.all([
        apiClient.getStudents(),
        apiClient.getAssignments(),
        apiClient.getSubjects(),
      ]);
      setStudentsList(students as ManagementUser[]);
      setAssignmentsList(assignments as any[]);
      setSubjectsList(subjects as any[]);
      if (students.length > 0 && !selectedStudentId) {
        setSelectedStudentId(String(students[0].id));
      }
    } catch (err) {
      setError("Failed to load teacher workspace records");
    } finally {
      setLoading(false);
    }
  };

  const loadStudentMarks = async (studentId: number) => {
    try {
      const data = await apiClient.getMarks(studentId);
      setMarksList(data || []);
    } catch (err) {
      console.error("Failed to load student marks", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  useEffect(() => {
    if (selectedStudentId) {
      loadStudentMarks(Number(selectedStudentId));
    }
  }, [selectedStudentId]);

  const handleDeactivate = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this student?")) return;
    setError("");
    setSuccess("");
    try {
      await apiClient.deactivateStudent(id);
      setSuccess("Student deactivated successfully");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deactivation failed");
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      if (editingStudent) {
        await apiClient.updateStudent(editingStudent.id, {
          name: form.name,
          email: form.email,
          password: form.password || undefined,
          roll_number: form.roll_number,
          department: form.department,
          semester: Number(form.semester),
          section: form.section,
        });
        setSuccess("Student updated successfully");
      } else {
        await apiClient.createStudent({
          ...form,
          semester: Number(form.semester),
        });
        setSuccess("Student created successfully");
      }
      setShowAddModal(false);
      setEditingStudent(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  };

  const handleAssignSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await apiClient.assignSubjectToStudent(Number(assignSubjectForm.student_id), {
        name: assignSubjectForm.name,
        code: assignSubjectForm.code,
        semester: Number(assignSubjectForm.semester),
        credits: Number(assignSubjectForm.credits),
        color: assignSubjectForm.color,
        minimum_attendance_percentage: Number(assignSubjectForm.minimum_attendance_percentage),
        classroom: assignSubjectForm.classroom || null,
        description: assignSubjectForm.description || null,
      });
      setSuccess("Subject assigned to student successfully");
      setShowAssignModal(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Subject assignment failed");
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await apiClient.updateAssignment(gradingAssignment.id, {
        status: "done",
        // Enforce parsing or update local state
        ...({
          marks_obtained: Number(gradeForm.marks_obtained),
          max_marks: Number(gradeForm.max_marks),
        } as any)
      });
      setSuccess("Marks updated successfully");
      setShowGradeModal(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save grades");
    }
  };

  const handleMarksFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const payload = {
        quiz: marksForm.quiz ? Number(marksForm.quiz) : 0.0,
        assignment: marksForm.assignment ? Number(marksForm.assignment) : 0.0,
        lab: marksForm.lab ? Number(marksForm.lab) : 0.0,
        internal: marksForm.internal ? Number(marksForm.internal) : 0.0,
        mid_exam: marksForm.mid_exam ? Number(marksForm.mid_exam) : 0.0,
        practical: marksForm.practical ? Number(marksForm.practical) : 0.0,
        final: marksForm.final ? Number(marksForm.final) : 0.0,
      };

      if (editingMark) {
        await apiClient.updateMark(editingMark.id, payload);
        setSuccess("Term marks updated successfully");
      } else {
        await apiClient.createMark({
          user_id: Number(selectedStudentId),
          subject_id: Number(marksForm.subject_id),
          ...payload,
        });
        setSuccess("Term marks recorded successfully");
      }
      setShowEnterMarksModal(false);
      setEditingMark(null);
      if (selectedStudentId) {
        loadStudentMarks(Number(selectedStudentId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save term marks");
    }
  };

  const handleOpenMarks = (subjectId: number, existingMark?: any) => {
    if (existingMark) {
      setEditingMark(existingMark);
      setMarksForm({
        subject_id: String(subjectId),
        quiz: String(existingMark.quiz ?? ""),
        assignment: String(existingMark.assignment ?? ""),
        lab: String(existingMark.lab ?? ""),
        internal: String(existingMark.internal ?? ""),
        mid_exam: String(existingMark.mid_exam ?? ""),
        practical: String(existingMark.practical ?? ""),
        final: String(existingMark.final ?? ""),
      });
    } else {
      setEditingMark(null);
      setMarksForm({
        subject_id: String(subjectId),
        quiz: "",
        assignment: "",
        lab: "",
        internal: "",
        mid_exam: "",
        practical: "",
        final: "",
      });
    }
    setShowEnterMarksModal(true);
  };

  const handleEditStudent = (usr: ManagementUser) => {
    setEditingStudent(usr);
    setForm({
      name: usr.name,
      email: usr.email,
      password: "",
      roll_number: usr.roll_number || "",
      department: usr.department || "",
      semester: usr.semester || 1,
      section: usr.section || "",
    });
    setShowAddModal(true);
  };

  const handleOpenGrade = (assignment: any) => {
    setGradingAssignment(assignment);
    setGradeForm({
      marks_obtained: String(assignment.marks_obtained || ""),
      max_marks: String(assignment.max_marks || 100),
    });
    setShowGradeModal(true);
  };

  // Helper mapping
  const getStudentName = (userId: number) => {
    const student = studentsList.find((s) => s.id === userId);
    return student ? student.name : `Student ID: ${userId}`;
  };

  const getSubjectName = (subjectId: number) => {
    const subject = subjectsList.find((s) => s.id === subjectId);
    return subject ? `${subject.name} (${subject.code})` : `Subject ID: ${subjectId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold capitalize">{tab} Workspace</h2>
          <p className="text-sm text-muted-foreground">Manage your assigned academic rosters, curriculum, and grades</p>
        </div>
        <div className="flex gap-2">
          {tab === "subjects" && studentsList.length > 0 && (
            <button
              onClick={() => {
                setAssignSubjectForm({
                  student_id: String(studentsList[0].id),
                  name: "",
                  code: "",
                  semester: 1,
                  credits: 3,
                  color: "#3b82f6",
                  minimum_attendance_percentage: 75,
                  classroom: "",
                  description: "",
                });
                setShowAssignModal(true);
              }}
              className="flex items-center gap-2 rounded-xl py-2 px-4 text-sm font-medium text-white bg-gradient-brand"
            >
              <Plus className="h-4 w-4" /> Assign Subject to Student
            </button>
          )}
          {tab === "students" && (
            <button
              onClick={() => {
                setEditingStudent(null);
                setForm({ name: "", email: "", password: "", roll_number: "", department: "", semester: 1, section: "" });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 rounded-xl py-2 px-4 text-sm font-medium text-white bg-gradient-brand"
            >
              <UserPlus className="h-4 w-4" /> Register Student
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex gap-3 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 flex gap-3 text-sm text-green-400">
          <Check className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading academic logs...
        </div>
      ) : tab === "students" ? (
        <div className="overflow-x-auto rounded-2xl border border-white/5 glass">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/2 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Student Name</th>
                <th className="px-6 py-4 font-semibold">Roll Number</th>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold">Class info</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {studentsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No Students assigned or registered under your account.
                  </td>
                </tr>
              ) : (
                studentsList.map((usr) => (
                  <tr key={usr.id} className="border-b border-white/5 hover:bg-white/1 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{usr.name}</div>
                      <div className="text-xs text-muted-foreground">{usr.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">{usr.roll_number}</td>
                    <td className="px-6 py-4 text-sm">{usr.department}</td>
                    <td className="px-6 py-4 text-sm">
                      Sem {usr.semester} · Sec {usr.section}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        usr.status === "ACTIVE" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                      }`}>
                        {usr.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditStudent(usr)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
                          title="Edit Student Info"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {usr.status === "ACTIVE" && (
                          <button
                            onClick={() => handleDeactivate(usr.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Deactivate Student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : tab === "assignments" ? (
        <div className="overflow-x-auto rounded-2xl border border-white/5 glass">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/2 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Student Name</th>
                <th className="px-6 py-4 font-semibold">Assignment Title</th>
                <th className="px-6 py-4 font-semibold">Subject</th>
                <th className="px-6 py-4 font-semibold">Due Date</th>
                <th className="px-6 py-4 font-semibold">Marks</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignmentsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No student assignments created or submitted.
                  </td>
                </tr>
              ) : (
                assignmentsList.map((asg) => (
                  <tr key={asg.id} className="border-b border-white/5 hover:bg-white/1 transition-colors">
                    <td className="px-6 py-4 font-medium">{getStudentName(asg.user_id)}</td>
                    <td className="px-6 py-4">
                      <div>{asg.title}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">{asg.description || "No description"}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{getSubjectName(asg.subject_id)}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(asg.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">
                      {asg.marks_obtained !== null && asg.marks_obtained !== undefined ? (
                        <span className="text-green-400 font-semibold">
                          {asg.marks_obtained} / {asg.max_marks || 100}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Ungraded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenGrade(asg)}
                        className="flex items-center gap-1 ml-auto rounded-lg py-1 px-3 text-xs bg-white/5 border border-white/5 hover:bg-white/10 text-neon-cyan"
                      >
                        <Award className="h-3 w-3" /> Grade
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : tab === "marks" ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-white/3 border border-white/5 rounded-2xl p-4 glass">
            <span className="text-sm font-medium text-muted-foreground">Active Roster Student:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="glass bg-neutral-900 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none text-foreground cursor-pointer focus:border-neon-cyan"
            >
              {studentsList.length === 0 ? (
                <option value="">No students registered</option>
              ) : (
                studentsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.roll_number ?? "No Roll No"})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/5 glass">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/2 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Subject</th>
                  <th className="px-6 py-4 font-semibold text-center">Quiz (20)</th>
                  <th className="px-6 py-4 font-semibold text-center">Asg (20)</th>
                  <th className="px-6 py-4 font-semibold text-center">Lab (20)</th>
                  <th className="px-6 py-4 font-semibold text-center">Internal (30)</th>
                  <th className="px-6 py-4 font-semibold text-center">Mid (30)</th>
                  <th className="px-6 py-4 font-semibold text-center">Practical (30)</th>
                  <th className="px-6 py-4 font-semibold text-center">Final (50)</th>
                  <th className="px-6 py-4 font-semibold text-center">Total (100)</th>
                  <th className="px-6 py-4 font-semibold text-center">Grade</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjectsList.filter(sbj => sbj.user_id === Number(selectedStudentId)).length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center text-muted-foreground">
                      No subjects assigned to this student. Assign a subject first.
                    </td>
                  </tr>
                ) : (
                  subjectsList
                    .filter(sbj => sbj.user_id === Number(selectedStudentId))
                    .map((sbj) => {
                      const m = marksList.find((x) => x.subject_id === sbj.id);
                      const total = m
                        ? (m.quiz ?? 0) +
                          (m.assignment ?? 0) +
                          (m.lab ?? 0) +
                          (m.internal ?? 0) +
                          (m.mid_exam ?? 0) +
                          (m.practical ?? 0) +
                          (m.final ?? 0)
                        : 0;
                      
                      let letterGrade = "N/A";
                      if (m) {
                        if (total >= 90) letterGrade = "O";
                        else if (total >= 80) letterGrade = "A+";
                        else if (total >= 70) letterGrade = "A";
                        else if (total >= 60) letterGrade = "B";
                        else if (total >= 50) letterGrade = "C";
                        else letterGrade = "F";
                      }

                      return (
                        <tr key={sbj.id} className="border-b border-white/5 hover:bg-white/1 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-foreground">{sbj.name}</div>
                            <div className="text-xs text-muted-foreground">{sbj.code}</div>
                          </td>
                          <td className="px-6 py-4 text-center font-mono text-xs">{m ? m.quiz ?? 0 : "-"}</td>
                          <td className="px-6 py-4 text-center font-mono text-xs">{m ? m.assignment ?? 0 : "-"}</td>
                          <td className="px-6 py-4 text-center font-mono text-xs">{m ? m.lab ?? 0 : "-"}</td>
                          <td className="px-6 py-4 text-center font-mono text-xs">{m ? m.internal ?? 0 : "-"}</td>
                          <td className="px-6 py-4 text-center font-mono text-xs">{m ? m.mid_exam ?? 0 : "-"}</td>
                          <td className="px-6 py-4 text-center font-mono text-xs">{m ? m.practical ?? 0 : "-"}</td>
                          <td className="px-6 py-4 text-center font-mono text-xs">{m ? m.final ?? 0 : "-"}</td>
                          <td className="px-6 py-4 text-center font-mono text-xs font-semibold text-neon-green">
                            {m ? total : "-"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {m ? (
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                letterGrade === "F" ? "bg-red-500/10 text-red-400" :
                                letterGrade === "O" ? "bg-purple-500/10 text-purple-400" :
                                "bg-green-500/10 text-green-400"
                              }`}>
                                {letterGrade}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleOpenMarks(sbj.id, m)}
                              className="inline-flex items-center gap-1 rounded-lg py-1 px-3 text-xs bg-white/5 border border-white/5 hover:bg-white/10 text-neon-cyan"
                            >
                              <Award className="h-3 w-3" /> {m ? "Edit Marks" : "Enter Marks"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectsList.length === 0 ? (
            <div className="col-span-full p-8 text-center text-muted-foreground glass border border-white/5 rounded-2xl">
              No subjects registered. Switch tab to assign subjects to students.
            </div>
          ) : (
            subjectsList.map((sbj) => (
              <div
                key={sbj.id}
                className="p-6 rounded-2xl border border-white/5 glass flex flex-col justify-between"
                style={{ borderLeft: `4px solid ${sbj.color || "#3b82f6"}` }}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs text-muted-foreground">{sbj.code}</span>
                    <span className="text-xs rounded px-2 py-0.5 bg-white/5 text-muted-foreground">
                      Credits: {sbj.credits}
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">{sbj.name}</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Assigned to: <span className="text-foreground">{getStudentName(sbj.user_id)}</span>
                  </p>
                </div>
                <div className="text-xs text-muted-foreground border-t border-white/5 pt-3">
                  Room: {sbj.classroom || "TBD"}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl glass-strong border border-white/5 shadow-2xl p-6 relative"
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-semibold mb-6">
              {editingStudent ? "Edit Student Details" : "Register Student"}
            </h3>
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Alan Turing"
                    className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="alan@student.edu"
                    className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {editingStudent ? "New Password (Leave blank to keep current)" : "Password"}
                </label>
                <input
                  type="password"
                  required={!editingStudent}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={form.roll_number}
                    onChange={(e) => setForm({ ...form, roll_number: e.target.value })}
                    placeholder="CS2026-001"
                    className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Department</label>
                  <input
                    type="text"
                    required
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="Computer Science"
                    className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Semester</label>
                  <input
                    type="number"
                    required
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                    placeholder="1"
                    min="1"
                    className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Section</label>
                  <input
                    type="text"
                    required
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    placeholder="A"
                    className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl py-3 text-sm font-semibold text-white bg-gradient-brand mt-6"
              >
                {editingStudent ? "Save Student Changes" : "Register Student"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Assign Subject Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl glass-strong border border-white/5 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setShowAssignModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-semibold mb-6">Assign Subject to Student</h3>
            <form onSubmit={handleAssignSubjectSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Select Student</label>
                <select
                  value={assignSubjectForm.student_id}
                  onChange={(e) => setAssignSubjectForm({ ...assignSubjectForm, student_id: e.target.value })}
                  className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none text-foreground"
                >
                  {studentsList.map((s) => (
                    <option key={s.id} value={s.id} className="bg-neutral-900 text-foreground">
                      {s.name} ({s.roll_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={assignSubjectForm.name}
                    onChange={(e) => setAssignSubjectForm({ ...assignSubjectForm, name: e.target.value })}
                    placeholder="Algorithms 101"
                    className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={assignSubjectForm.code}
                    onChange={(e) => setAssignSubjectForm({ ...assignSubjectForm, code: e.target.value })}
                    placeholder="CS301"
                    className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Semester</label>
                  <input
                    type="number"
                    required
                    value={assignSubjectForm.semester}
                    onChange={(e) => setAssignSubjectForm({ ...assignSubjectForm, semester: Number(e.target.value) })}
                    placeholder="1"
                    min="1"
                    className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Credits</label>
                  <input
                    type="number"
                    required
                    value={assignSubjectForm.credits}
                    onChange={(e) => setAssignSubjectForm({ ...assignSubjectForm, credits: Number(e.target.value) })}
                    placeholder="3"
                    min="1"
                    className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Classroom</label>
                  <input
                    type="text"
                    value={assignSubjectForm.classroom}
                    onChange={(e) => setAssignSubjectForm({ ...assignSubjectForm, classroom: e.target.value })}
                    placeholder="LHC-102"
                    className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Hex Color</label>
                  <input
                    type="color"
                    required
                    value={assignSubjectForm.color}
                    onChange={(e) => setAssignSubjectForm({ ...assignSubjectForm, color: e.target.value })}
                    className="w-full h-11 bg-transparent border-0 cursor-pointer rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl py-3 text-sm font-semibold text-white bg-gradient-brand mt-6"
              >
                Assign Subject to Student
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Grade Modal */}
      {showGradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl glass-strong border border-white/5 shadow-2xl p-6 relative"
          >
            <button
              onClick={() => setShowGradeModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-semibold mb-2">Grade Assignment</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Enter academic score details for: <span className="text-foreground font-semibold">{gradingAssignment?.title}</span>
            </p>
            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Marks Obtained</label>
                <input
                  type="number"
                  required
                  step="0.5"
                  value={gradeForm.marks_obtained}
                  onChange={(e) => setGradeForm({ ...gradeForm, marks_obtained: e.target.value })}
                  placeholder="85"
                  className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Max Marks</label>
                <input
                  type="number"
                  required
                  value={gradeForm.max_marks}
                  onChange={(e) => setGradeForm({ ...gradeForm, max_marks: e.target.value })}
                  placeholder="100"
                  className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl py-3 text-sm font-semibold text-white bg-gradient-brand mt-6"
              >
                Submit Grades
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Enter Term Marks Modal */}
      {showEnterMarksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl glass-strong border border-white/5 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setShowEnterMarksModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-semibold mb-2">
              {editingMark ? "Edit Term Marks" : "Enter Term Marks"}
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Input term weightage marks for student. Leaving field empty defaults to 0.
            </p>
            <form onSubmit={handleMarksFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Quiz (Max 20)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={marksForm.quiz}
                    onChange={(e) => setMarksForm({ ...marksForm, quiz: e.target.value })}
                    placeholder="18"
                    className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Assignment (Max 20)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={marksForm.assignment}
                    onChange={(e) => setMarksForm({ ...marksForm, assignment: e.target.value })}
                    placeholder="19"
                    className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Lab (Max 20)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={marksForm.lab}
                    onChange={(e) => setMarksForm({ ...marksForm, lab: e.target.value })}
                    placeholder="17.5"
                    className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Internal (Max 30)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="30"
                    value={marksForm.internal}
                    onChange={(e) => setMarksForm({ ...marksForm, internal: e.target.value })}
                    placeholder="27"
                    className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Mid Exam (Max 30)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="30"
                    value={marksForm.mid_exam}
                    onChange={(e) => setMarksForm({ ...marksForm, mid_exam: e.target.value })}
                    placeholder="26.5"
                    className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Practical (Max 30)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="30"
                    value={marksForm.practical}
                    onChange={(e) => setMarksForm({ ...marksForm, practical: e.target.value })}
                    placeholder="28"
                    className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Final Exam (Max 50)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={marksForm.final}
                  onChange={(e) => setMarksForm({ ...marksForm, final: e.target.value })}
                  placeholder="45"
                  className="w-full glass bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl py-3 text-sm font-semibold text-white bg-gradient-brand mt-6"
              >
                {editingMark ? "Save Marks Changes" : "Submit Term Marks"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
