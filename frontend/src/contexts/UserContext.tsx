import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient } from "@/api/client";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT";
  status: "ACTIVE" | "INACTIVE" | "RETIRED";
  student_id?: string;
  department?: string;
  designation?: string;
  roll_number?: string;
  semester?: number;
  section?: string;
  created_by?: number;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("user_data");
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    if (!accessToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userData = (await apiClient.getMe()) as User;
      setUser(userData);
      if (typeof window !== "undefined") {
        localStorage.setItem("user_data", JSON.stringify(userData));
      }
    } catch (err) {
      console.error("UserContext: Failed to fetch user:", err);
      const message = err instanceof Error ? err.message : "Failed to fetch user";
      if (
        message === "Not authenticated" ||
        message === "Authentication failed" ||
        message === "Invalid authentication credentials"
      ) {
        apiClient.clearTokens();
        if (typeof window !== "undefined") {
          localStorage.removeItem("user_data");
          window.location.href = "/login";
        }
      }
      setError(message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    if (!accessToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    // If we already have cached user data, show it immediately and refresh in the background.
    if (user) {
      setLoading(false);
      fetchUser();
    } else {
      fetchUser();
    }
  }, []);

  // Listen for storage changes (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token") {
        fetchUser();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Also listen for custom login event
  useEffect(() => {
    const handleLogin = async () => {
      // Wait a bit for localStorage to be updated, then refresh
      setTimeout(() => {
        fetchUser();
      }, 100);
    };

    window.addEventListener("user-login", handleLogin);
    return () => window.removeEventListener("user-login", handleLogin);
  }, []);

  // Listen for logout events to clear cached user state immediately
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setLoading(false);
      setError(null);
    };

    window.addEventListener("user-logout", handleLogout);
    return () => window.removeEventListener("user-logout", handleLogout);
  }, []);

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <UserContext.Provider value={{ user, loading, error, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
