import groupImg from "@/assets/group-chat-logo.png";
import aiAssistantImg from "@/assets/ai_assistant.png";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  src?: string;
  size?: string;
  isOnline?: boolean;
  isGroup?: boolean;
  isAI?: boolean;
  className?: string;
}

const AvatarWithBadge = ({
  name,
  src,
  isOnline,
  isGroup = false,
  isAI = false,
  size = "w-9 h-9",
  className,
}: Props) => {
  // Resolve avatar source — AI and group always use a static import
  const avatar = isAI ? aiAssistantImg : isGroup ? groupImg : (src ?? "");

  const showOnlineStatus = isOnline && !isGroup && !isAI;

  return (
    <div className="relative shrink-0">
      <Avatar className={size}>
        {/*
         * key={avatar} forces Radix UI to remount AvatarImage whenever the
         * src changes. Without this, Radix's internal loading state machine
         * can get stuck in "error" when src starts as "" and then updates,
         * causing the fallback to display instead of the image.
         */}
        <AvatarImage key={avatar} src={avatar} className="object-cover" />
        {/* ✅ Only show fallback for non-AI users */}
        {!isAI && (
          <AvatarFallback
            className={cn(
              `bg-primary/15 text-primary font-bold text-4xl`,
              className && className,
            )}
          >
            {name?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>

      {showOnlineStatus && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 bg-green-500" />
      )}
    </div>
  );
};

export default AvatarWithBadge;
