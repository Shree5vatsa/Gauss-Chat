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
        "hover:bg-muted/70",
        isActive && "bg-muted",
        hasUnread && "bg-primary/5",
      )}
    >
      <AvatarWithBadge
        name={name}
        src={avatar}
        isGroup={isGroup}
        isOnline={isOnline}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h5
            className={cn(
              "text-sm truncate",
              hasUnread && "font-semibold text-foreground",
            )}
          >
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
