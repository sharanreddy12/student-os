const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  subject_id: number;
  updated_at: string;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on init
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("access_token");
      this.refreshToken = localStorage.getItem("refresh_token");
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_data");
    }
  }

  private isAuthError(status: number, detail: string | null): boolean {
    if (status === 401) {
      return true;
    }

    if (status !== 403) {
      return false;
    }

    const normalizedDetail = detail?.toLowerCase() ?? "";
    return [
      "not authenticated",
      "authentication failed",
      "invalid authentication credentials",
      "invalid refresh token",
      "user not found",
      "token expired",
      "expired token",
      "inactive or retired",
    ].some((message) => normalizedDetail.includes(message));
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Always read auth tokens from localStorage before sending request so token state stays current.
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("access_token");
      this.refreshToken = localStorage.getItem("refresh_token");
    }

    // Add auth token if available (except login/register/refresh endpoints)
    if (
      this.accessToken &&
      !["/auth/login", "/auth/register", "/auth/refresh"].some((path) => endpoint.startsWith(path))
    ) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    let responseText = "";
    try {
      responseText = await response.text();
    } catch {
      /* ignore empty response */
    }

    let parsedBody: { detail?: string; message?: string } | null = null;
    if (responseText) {
      try {
        parsedBody = JSON.parse(responseText) as { detail?: string; message?: string };
      } catch {
        /* ignore invalid JSON */
      }
    }

    const errorText = parsedBody?.detail || parsedBody?.message || "Request failed";
    const isAuthFailure = this.isAuthError(response.status, errorText);

    if (isAuthFailure && response.status === 401 && this.refreshToken) {
      const refreshSuccess = await this.refreshAccessToken();
      if (refreshSuccess) {
        headers["Authorization"] = `Bearer ${this.accessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });

        try {
          responseText = await response.text();
        } catch {
          /* ignore empty response */
        }

        if (responseText) {
          try {
            parsedBody = JSON.parse(responseText) as { detail?: string; message?: string };
          } catch {
            /* ignore invalid JSON */
          }
        }
      } else {
        this.clearTokens();
        if (typeof window !== "undefined") {
          localStorage.removeItem("user_data");
          window.location.href = "/login";
        }
        throw new Error("Authentication failed");
      }
    }

    if (isAuthFailure) {
      this.clearTokens();
      if (typeof window !== "undefined") {
        localStorage.removeItem("user_data");
        window.location.href = "/login";
      }
      throw new Error("Authentication failed");
    }

    if (!response.ok) {
      throw new Error(errorText);
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    if (!responseText) {
      return undefined as unknown as T;
    }

    try {
      return JSON.parse(responseText) as T;
    } catch {
      return responseText as unknown as T;
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as { access_token: string };
      this.accessToken = data.access_token;
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", data.access_token);
      }
      return true;
    } catch {
      return false;
    }
  }

  // Auth endpoints
  async register(studentId: string, name: string, email: string, password: string) {
    const response = await this.request<{ access_token: string; refresh_token: string; user?: any }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ student_id: studentId, name, email, password }),
      },
    );

    // Store tokens
    if (response.access_token && response.refresh_token) {
      this.setTokens(response.access_token, response.refresh_token);
    }

    // Store user data immediately to avoid stale greeting after registration
    if (response.user && typeof window !== "undefined") {
      localStorage.setItem("user_data", JSON.stringify(response.user));
    }

    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<{ access_token: string; refresh_token: string; user?: any }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    );

    // Store tokens
    if (response.access_token && response.refresh_token) {
      this.setTokens(response.access_token, response.refresh_token);
    }

    // Store user data immediately to avoid race condition
    if (response.user && typeof window !== "undefined") {
      localStorage.setItem("user_data", JSON.stringify(response.user));
    }

    return response;
  }

  async logout() {
    this.clearTokens();
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_data");
      window.dispatchEvent(new CustomEvent("user-logout"));
    }
  }

  async getMe() {
    return this.request("/auth/me");
  }

  // Subjects
  async getSubjects() {
    return this.request<any[]>("/subjects");
  }

  async createSubject(data: {
    name: string;
    code: string;
    semester?: number;
    credits?: number;
    faculty_name?: string | null;
    classroom?: string | null;
    color: string;
    minimum_attendance_percentage?: number;
    description?: string | null;
    is_active?: boolean;
  }) {
    return this.request("/subjects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSubject(
    id: number,
    data: Partial<{
      name: string;
      code: string;
      semester: number;
      credits: number;
      faculty_name: string | null;
      classroom: string | null;
      color: string;
      minimum_attendance_percentage: number;
      description: string | null;
      is_active: boolean;
    }>,
  ) {
    return this.request(`/subjects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getSubjectsPaginated(params?: {
    search?: string;
    semester?: number;
    department?: string;
    status?: string;
    page?: number;
    per_page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set("search", params.search);
    if (params?.semester) queryParams.set("semester", String(params.semester));
    if (params?.department) queryParams.set("department", params.department);
    if (params?.status) queryParams.set("status", params.status);
    if (params?.page) queryParams.set("page", String(params.page));
    if (params?.per_page) queryParams.set("per_page", String(params.per_page));
    const qs = queryParams.toString();
    return this.request<any[]>(`/subjects${qs ? `?${qs}` : ""}`);
  }

  async getAllSubjects() {
    return this.request<any[]>("/subjects/all");
  }

  async deleteSubject(id: number) {
    return this.request(`/subjects/${id}`, {
      method: "DELETE",
    });
  }

  // Student-Subject assignments
  async getStudentSubjects(params?: { subject_id?: number; student_id?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.subject_id) queryParams.set("subject_id", String(params.subject_id));
    if (params?.student_id) queryParams.set("student_id", String(params.student_id));
    const qs = queryParams.toString();
    return this.request<any[]>(`/student-subjects${qs ? `?${qs}` : ""}`);
  }

  async assignStudentToSubject(data: {
    student_id: number;
    subject_id: number;
    semester?: number;
    section?: string;
    academic_year?: string;
  }) {
    return this.request<any>("/student-subjects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async removeStudentFromSubject(assignmentId: number) {
    return this.request(`/student-subjects/${assignmentId}`, {
      method: "DELETE",
    });
  }

  async getSubjectStudents(subjectId: number) {
    return this.request<any[]>(`/student-subjects/students/${subjectId}`);
  }

  // Timetable
  async getTimetable() {
    return this.request("/timetable");
  }

  async getTodayTimetable() {
    return this.request("/timetable/today");
  }

  async getNextTimetableEntry() {
    return this.request("/timetable/next");
  }

  async createTimetableEntry(data: {
    subject_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    location?: string;
    faculty_name?: string;
    building?: string;
    class_type?: string;
    recurrence?: string;
    notes?: string;
    is_active?: boolean;
  }) {
    return this.request("/timetable", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTimetableEntry(
    id: number,
    data: {
      subject_id?: number;
      day_of_week?: number;
      start_time?: string;
      end_time?: string;
      location?: string;
      faculty_name?: string;
      building?: string;
      class_type?: string;
      recurrence?: string;
      notes?: string;
      is_active?: boolean;
    },
  ) {
    return this.request(`/timetable/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteTimetableEntry(id: number) {
    return this.request(`/timetable/${id}`, {
      method: "DELETE",
    });
  }

  // Assignments
  async getAssignments(params?: { status?: string; subject_id?: number }) {
    const queryString = params
      ? new URLSearchParams(
          Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
        ).toString()
      : "";
    return this.request<any[]>(`/assignments${queryString ? `?${queryString}` : ""}`);
  }

  async createAssignment(data: {
    subject_id: number;
    title: string;
    description?: string;
    due_date: string;
    priority: string;
  }) {
    return this.request<any>("/assignments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateAssignment(
    id: number,
    data: {
      title?: string;
      description?: string;
      due_date?: string;
      status?: string;
      priority?: string;
    },
  ) {
    return this.request(`/assignments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteAssignment(id: number) {
    return this.request(`/assignments/${id}`, {
      method: "DELETE",
    });
  }

  // Attendance
  async getAttendance(subject_id?: number) {
    const queryString = subject_id ? `?subject_id=${subject_id}` : "";
    return this.request(`/attendance${queryString}`);
  }

  async createAttendance(data: { subject_id: number; date: string; status: string }) {
    return this.request("/attendance", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getAttendanceSummary() {
    return this.request("/attendance/summary");
  }

  async updateAttendance(id: number, data: { subject_id?: number; date?: string; status?: string }) {
    return this.request(`/attendance/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteAttendance(id: number) {
    return this.request(`/attendance/${id}`, {
      method: "DELETE",
    });
  }

  // Notes
  async getNotes(subject_id?: number): Promise<Note[]> {
    const queryString = subject_id ? `?subject_id=${subject_id}` : "";
    return this.request<Note[]>(`/notes${queryString}`);
  }

  async getNote(id: number): Promise<Note> {
    return this.request<Note>(`/notes/${id}`);
  }

  async createNote(data: { subject_id: number; title: string; content: string }): Promise<Note> {
    return this.request<Note>("/notes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateNote(id: number, data: { title?: string; content?: string }): Promise<Note> {
    return this.request<Note>(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: number) {
    return this.request(`/notes/${id}`, {
      method: "DELETE",
    });
  }

  // AI Assistant
  async chat(message: string, session_id?: number) {
    return this.request("/assistant/chat", {
      method: "POST",
      body: JSON.stringify({ message, session_id }),
    });
  }

  async summarize(subject_id: number) {
    return this.request("/assistant/summarize", {
      method: "POST",
      body: JSON.stringify({ subject_id }),
    });
  }

  async quiz(subject_id: number, topic?: string) {
    return this.request("/assistant/quiz", {
      method: "POST",
      body: JSON.stringify({ subject_id, topic }),
    });
  }

  // Analytics
  async getAttendanceRisk() {
    return this.request("/analytics/attendance-risk");
  }

  // User Management - Super Admins
  async createSuperAdmin(data: { name: string; email: string; password: string; confirm_password: string }) {
    return this.request("/super-admins", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSuperAdmins() {
    return this.request<any[]>("/super-admins");
  }

  async updateSuperAdmin(id: number, data: any) {
    return this.request(`/super-admins/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deactivateSuperAdmin(id: number) {
    return this.request(`/super-admins/${id}/deactivate`, {
      method: "PATCH",
    });
  }

  // User Management - Admins
  async createAdmin(data: { name: string; email: string; password: string; confirm_password: string }) {
    return this.request("/admins", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getAdmins() {
    return this.request<any[]>("/admins");
  }

  async updateAdmin(id: number, data: any) {
    return this.request(`/admins/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deactivateAdmin(id: number) {
    return this.request(`/admins/${id}/deactivate`, {
      method: "PATCH",
    });
  }

  // User Management - Teachers
  async createTeacher(data: { name: string; email: string; password: string; department: string; designation: string }) {
    return this.request("/teachers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getTeachers() {
    return this.request<any[]>("/teachers");
  }

  async updateTeacher(id: number, data: any) {
    return this.request(`/teachers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deactivateTeacher(id: number) {
    return this.request(`/teachers/${id}/deactivate`, {
      method: "PATCH",
    });
  }

  // User Management - Students
  async createStudent(data: {
    name: string;
    email: string;
    password: string;
    roll_number: string;
    department: string;
    semester: number;
    section: string;
  }) {
    return this.request("/students", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getStudents() {
    return this.request<any[]>("/students");
  }

  async updateStudent(id: number, data: any) {
    return this.request(`/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deactivateStudent(id: number) {
    return this.request(`/students/${id}/deactivate`, {
      method: "PATCH",
    });
  }

  async assignSubjectToStudent(studentId: number, data: {
    name: string;
    code: string;
    semester?: number;
    credits?: number;
    faculty_name?: string | null;
    classroom?: string | null;
    color: string;
    minimum_attendance_percentage?: number;
    description?: string | null;
    is_active?: boolean;
  }) {
    return this.request(`/students/${studentId}/subjects`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async assignTeacherToSubject(teacherId: number, subjectId: number) {
    return this.request(`/teachers/${teacherId}/subjects/${subjectId}`, {
      method: "POST",
    });
  }

  async getStudyPatterns() {
    return this.request("/analytics/study-patterns");
  }

  // Phase 4 New ERP Analytics
  async getStudentAnalytics() {
    return this.request<any>("/analytics/student");
  }

  async getTeacherAnalytics() {
    return this.request<any>("/analytics/teacher");
  }

  async getAdminAnalytics() {
    return this.request<any>("/analytics/admin");
  }

  // Marks / Grading
  async getMarks(studentId?: number) {
    const url = studentId ? `/marks/student/${studentId}` : "/marks/my";
    return this.request<any[]>(url);
  }

  async getMyMarks() {
    return this.request<any[]>("/marks/my");
  }

  async createMark(data: {
    user_id: number;
    subject_id: number;
    quiz?: number;
    assignment?: number;
    lab?: number;
    internal?: number;
    mid_exam?: number;
    practical?: number;
    final?: number;
  }) {
    return this.request<any>("/marks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateMark(
    id: number,
    data: Partial<{
      quiz: number;
      assignment: number;
      lab: number;
      internal: number;
      mid_exam: number;
      practical: number;
      final: number;
    }>,
  ) {
    return this.request<any>(`/marks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Announcements
  async getAnnouncements(subjectId?: number) {
    const url = subjectId ? `/announcements/subject/${subjectId}` : "/announcements/my";
    return this.request<any[]>(url);
  }

  async getMyAnnouncements() {
    return this.request<any[]>("/announcements/my");
  }

  async createAnnouncement(data: { subject_id: number; title: string; content: string }) {
    return this.request<any>("/announcements", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Notifications
  async getNotifications() {
    return this.request<any[]>("/notifications");
  }

  async markNotificationRead(id: number) {
    return this.request<any>(`/notifications/${id}/read`, {
      method: "POST",
    });
  }

  async markAllNotificationsRead() {
    return this.request<void>("/notifications/read-all", {
      method: "POST",
    });
  }
}

export const apiClient = new ApiClient();