import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";

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