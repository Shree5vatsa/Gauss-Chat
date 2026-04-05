import type { LoginType, RegisterType, UserType } from "@/types/auth.type";
import { create } from "zustand";
import { toast } from "sonner";
import { useSocket } from "./useSocket";
import { API } from "@/lib/axios-client";


interface AuthState {
  user: UserType | null;
  isLoggingIn: boolean;
  isSigningUp: boolean;
  isAuthStatusLoading: boolean;

  register: (data: RegisterType) => void;
  login: (data: LoginType) => void;
  logout: () => void;
  isAuthStatus: () => void;
}

//without persist

export const useAuth = create<AuthState>()((set) => ({
  user: null,
  isSigningUp: false,
  isLoggingIn: false,
  isAuthStatusLoading: false,

  register: async (data: RegisterType) => {
    set({ isSigningUp: true });
    try {
      const response = await API.post("/auth/register", data);
      set({ user: response.data.user });
      // can't use hooks outside components
      // So Zustand gives getState() as a workaround
      useSocket.getState().connectSocket();
      toast.success("Register successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Register failed");
    } finally {
      set({ isSigningUp: false });
    }
  },
  login: async (data: LoginType) => {
    set({ isLoggingIn: true });
    try {
      const response = await API.post("/auth/login", data);
      set({ user: response.data.user });
      useSocket.getState().connectSocket();
      toast.success("Login successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },
  logout: async () => {
    try {
      await API.post("/auth/logout");
      set({ user: null });
      useSocket.getState().disconnectSocket();
      toast.success("Logout successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Logout failed");
    }
  },
  isAuthStatus: async () => {
    set({ isAuthStatusLoading: true });
    try {
      const response = await API.get("/auth/me");
      set({ user: response.data.user });
      useSocket.getState().connectSocket();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Authentication failed");
      console.log(err);
    } finally {
      set({ isAuthStatusLoading: false });
    }
  },
}));