import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ApiUser } from "@/lib/admin/types";

type AuthState = {
  user: ApiUser | null;
  setSession: (user: ApiUser) => void;
  setUser: (user: ApiUser) => void;
  clearSession: () => void;
  logout: () => void;
  isLoggedIn: () => boolean;
  isAdmin: () => boolean;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setSession: (user) => set({ user }),
      setUser: (user) => set({ user }),
      clearSession: () => set({ user: null }),
      logout: () => set({ user: null }),
      isLoggedIn: () => !!get().user,
      // Allow any non-customer role into the superadmin UI (e.g. "admin", "super_admin").
      // The actual visible sections are still restricted by /users/me/permissions.
      isAdmin: () => (get().user?.role_name ?? "").toLowerCase() === "super_admin",
    }),
    { name: "cmm-superadmin-auth" },
  ),
);
