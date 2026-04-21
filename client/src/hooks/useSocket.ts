import { io, Socket } from "socket.io-client";
import { create } from "zustand";


const BASE_URL = import.meta.env.VITE_API_URL;

interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const useSocket = create<SocketState>()((set, get) => ({
  socket: null,
  onlineUsers: [],

  connectSocket: () => {
    const { socket } = get();
    console.log("connectSocket called, current socket:", socket?.connected);

    if (socket?.connected) {
      console.log("Socket already connected, skipping");
      return;
    }

    console.log("Creating new socket connection to:", BASE_URL);
    const newSocket = io(BASE_URL, {
      withCredentials: true,
      autoConnect: true,
    });

    set({ socket: newSocket });

    newSocket.on("connect", () => {
      console.log("Socket connected successfully!", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    newSocket.on("online:users", (userIds) => {
      
      console.log("Online users received:", userIds);
      set({ onlineUsers: userIds });
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      set({ onlineUsers: [] });
    });
  },

  disconnectSocket: () => {
    const { socket } = get();
    console.log("disconnectSocket called");
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
      console.log("Socket disconnected");
    }
  },
}));
