import type { LoginType, RegisterType, UserType } from "@/types/auth.type";
import { create } from "zustand";
import { toast } from "sonner";
import { useSocket } from "./useSocket";
import { API } from "@/lib/axios-client";
import { navigate } from "@/lib/navigation";

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
      //proceed to chat page
      navigate("/chat");
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
      navigate("/chat");
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
      navigate("/");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Logout failed");
    }
  },

  isAuthStatus: async () => {
    console.log("isAuthStatus called");
    set({ isAuthStatusLoading: true });
    try {
      const response = await API.get("/auth/status");
      console.log("isAuthStatus response:", response.data);
      set({ user: response.data.user });
      useSocket.getState().connectSocket();
    } catch (err: any) {
      console.log(
        "isAuthStatus error:",
        err.response?.status,
        err.response?.data,
      );
      // Don't show toast for auth status
    } finally {
      set({ isAuthStatusLoading: false });
    }
  },
}));
