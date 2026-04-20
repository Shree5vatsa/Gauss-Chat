import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import type { ChatType } from "@/types/chat.types";
import { v4 as uuidv4 } from "uuid";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";

export const isUserOnline = (userId?: string, isAI?: boolean) => {
  if (!userId) return false;

  // AI users are never online
  if (isAI) return false;

  const { user } = useAuth.getState();
  const { onlineUsers } = useSocket.getState();

  // Current user is always online for themselves
  if (user?._id === userId) {
    return true;
  }

  return onlineUsers.includes(userId);
};

export const generateUUID = () => {
  return uuidv4();
};

export const getOtherUserAndGroup = (
  chat: ChatType,
  currentUserId: string | null,
) => {
  const isGroup = chat?.isGroup;

  if (isGroup) {
    return {
      name: chat.groupName || "Unnamed Group",
      subheading: `${chat.participants.length} members`,
      avatar: "",
      isGroup: true,
      isOnline: false,
      isAI: false,
    };
  }

  const other = chat?.participants.find((p) => p._id !== currentUserId);

  const isAI = chat.isAiChat === true || other?.isAI === true;

  const displayName = isAI ? "Gauss AI Assistant" : other?.name || "Unknown";
  const isOnline = isAI ? false : isUserOnline(other?._id ?? "", false);

  // Return empty avatar for AI — AvatarWithBadge resolves the actual image via isAI prop
  const avatar = isAI ? "" : other?.avatar || "";

  return {
    name: displayName,
    subheading: isAI ? "AI Assistant" : isOnline ? "Online" : "Offline",
    avatar: avatar,
    isGroup: false,
    isOnline: isOnline, 
    isAI: isAI,
  };
};

export const formatChatTime = (date: string | Date) => {
  if (!date) return "";
  const newDate = new Date(date);
  if (isNaN(newDate.getTime())) return "Invalid date";

  if (isToday(newDate)) return format(newDate, "h:mm a");
  if (isYesterday(newDate)) return "Yesterday";
  if (isThisWeek(newDate)) return format(newDate, "EEEE");
  return format(newDate, "M/d");
};
