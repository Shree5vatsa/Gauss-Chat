import { getOtherUserAndGroup } from "@/lib/helper";
import { cn } from "@/lib/utils";
import type { ChatType } from "@/types/chat.types";
import { useLocation } from "react-router-dom";
import AvatarWithBadge from "../avatarWithBadge";
import { formatChatTime } from "@/lib/helper";

interface PropsType {
  chat: ChatType;
  currentUserId: string | null;
  onClick?: () => void;
}

const ChatListItem = ({ chat, currentUserId, onClick }: PropsType) => {
  const { pathname } = useLocation();
  const { lastMessage, createdAt, unreadCount = 0 } = chat;

  const { name, avatar, isOnline, isGroup } = getOtherUserAndGroup(
    chat,
    currentUserId,
  );

  // ✅ Check if this is an AI chat
  const isAIChat = chat.isAiChat;
  const isAI = isAIChat; // For AI chat, show AI avatar

  const getLastMessageText = () => {
    if (!lastMessage) {
      return isGroup
        ? chat.createdBy === currentUserId
          ? "Group created"
          : "You were added"
        : "Send a message";
    }
    if (lastMessage.image) return "📷 Photo";

    if (isGroup && lastMessage.sender) {
      return `${
        lastMessage.sender._id === currentUserId
          ? "You"
          : lastMessage.sender.name
      }: ${lastMessage.content}`;
    }

    return lastMessage.content;
  };

  const isActive = pathname.includes(chat._id);
  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-lg",
        "transition-all duration-200",
        "hover:bg-black/5 dark:hover:bg-white/10",
        isActive && "bg-black/10 dark:bg-white/15",
        hasUnread && "bg-primary/5",
      )}
    >
      <AvatarWithBadge
        name={name}
        src={avatar}
        isGroup={isGroup}
        isOnline={isOnline}
        isAI={isAI} // ✅ Pass isAI flag
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h5
            className={cn(
              "text-sm truncate flex items-center gap-1",
              hasUnread && "font-semibold text-foreground",
            )}
          >
            {isAI && (
              <svg
                className="w-3.5 h-3.5 text-purple-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            )}
            {name}
          </h5>
          <span
            className={cn(
              "text-xs ml-2 shrink-0",
              hasUnread ? "text-primary font-medium" : "text-muted-foreground",
            )}
          >
            {formatChatTime(lastMessage?.updatedAt || createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "text-xs truncate flex-1",
              hasUnread
                ? "text-foreground font-medium"
                : "text-muted-foreground",
            )}
          >
            {getLastMessageText()}
          </p>

          {hasUnread && (
            <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-[10px] font-semibold text-primary-foreground flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ChatListItem;
