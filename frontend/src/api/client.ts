const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface ApiResponse<T> {
  data?: T;
  error?: string;
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
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if available (except for auth endpoints)
    if (this.accessToken && !endpoint.startsWith("/auth")) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && this.refreshToken) {
      const refreshSuccess = await this.refreshAccessToken();
      if (refreshSuccess) {
        // Retry original request with new token
        headers["Authorization"] = `Bearer ${this.accessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      } else {
        // Refresh failed, clear tokens and redirect to login
        this.clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new Error("Authentication failed");
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Request failed");
    }

    return response.json();
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
  async register(name: string, email: string, password: string) {
    const response = await this.request<{ access_token: string; refresh_token: string }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      },
    );

    // Store tokens
    if (response.access_token && response.refresh_token) {
      this.setTokens(response.access_token, response.refresh_token);
    }

    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<{ access_token: string; refresh_token: string }>(
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

    return response;
  }

  async logout() {
    this.clearTokens();
  }

  async getMe() {
    return this.request("/auth/me");
  }

  // Subjects
  async getSubjects() {
    return this.request("/subjects");
  }

  async createSubject(data: { name: string; code: string; color: string }) {
    return this.request("/subjects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSubject(id: number, data: Partial<{ name: string; code: string; color: string }>) {
    return this.request(`/subjects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteSubject(id: number) {
    return this.request(`/subjects/${id}`, {
      method: "DELETE",
    });
  }

  // Timetable
  async getTimetable() {
    return this.request("/timetable");
  }

  async createTimetableEntry(data: {
    subject_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    location?: string;
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
      day?: string;
      start_time?: string;
      end_time?: string;
      location?: string;
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
    return this.request(`/assignments${queryString ? `?${queryString}` : ""}`);
  }

  async createAssignment(data: {
    subject_id: number;
    title: string;
    description?: string;
    due_date: string;
    priority: string;
  }) {
    return this.request("/assignments", {
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

  // Notes
  async getNotes(subject_id?: number) {
    const queryString = subject_id ? `?subject_id=${subject_id}` : "";
    return this.request(`/notes${queryString}`);
  }

  async getNote(id: number) {
    return this.request(`/notes/${id}`);
  }

  async createNote(data: { subject_id: number; title: string; content: string }) {
    return this.request("/notes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateNote(id: number, data: { title?: string; content?: string }) {
    return this.request(`/notes/${id}`, {
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

  async getStudyPatterns() {
    return this.request("/analytics/study-patterns");
  }
}

export const apiClient = new ApiClient();
