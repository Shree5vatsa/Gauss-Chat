import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { v4 as uuidv4 } from "uuid";

export const isUserOnline = (userId?: string) => {
  if (!userId) return false;
  const socketState = useSocket.getState();
  const onlineUsers = socketState.onlineUsers || [];

  const { user } = useAuth.getState();

  if (user?._id === userId) {
    return true;
  }
  
  return onlineUsers.includes(userId);
};

export const generateUUID = () => {
  return uuidv4();
};