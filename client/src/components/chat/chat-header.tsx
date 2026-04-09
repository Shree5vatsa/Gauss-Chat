import { getOtherUserAndGroup } from "@/lib/helper";
import { PROTECTED_ROUTES } from "@/routes/routes";
import type { ChatType } from "@/types/chat.types";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AvatarWithBadge from "../avatarWithBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/drop-down-menu";

interface Props {
  chat: ChatType;
  currentUserId: string | null;
}

const ChatHeader = ({ chat, currentUserId }: Props) => {
  const navigate = useNavigate();
  const { name, subheading, avatar, isOnline, isGroup } = getOtherUserAndGroup(
    chat,
    currentUserId,
  );

  return (
    <div
      className="sticky top-0
      flex items-center justify-between
      border-b border-border
      bg-card/95 backdrop-blur-sm
      px-4 py-2 z-50
    "
    >
      {/* Left Section: Back Button + Avatar + Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(PROTECTED_ROUTES.CHAT)}
          className="lg:hidden p-1 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>

        <AvatarWithBadge
          name={name}
          src={avatar}
          isGroup={isGroup}
          isOnline={isOnline}
          size="w-10 h-10"
        />

        <div>
          <h5 className="font-semibold text-base line-clamp-1">{name}</h5>
          <p
            className={`text-xs ${
              isOnline ? "text-green-500" : "text-muted-foreground"
            }`}
          >
            {subheading}
          </p>
        </div>
      </div>

      {/* Right Section: Menu Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>Chat Info</DropdownMenuItem>
          <DropdownMenuItem>Search Messages</DropdownMenuItem>
          <DropdownMenuItem className="text-red-500">
            Delete Chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ChatHeader;
