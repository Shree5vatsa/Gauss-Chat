import type { MessageType } from "@/types/chat.types";
import { Button } from "../ui/button";
import { X } from "lucide-react";

interface Props {
  replyTo: MessageType | null;
  currentUserId: string | null;
  onCancel: () => void;
}

const ChatReplyBar = ({ replyTo, currentUserId, onCancel }: Props) => {
  if (!replyTo) return null;

  const senderName =
    replyTo.sender?._id === currentUserId ? "You" : replyTo.sender?.name;

  return (
    <div
      className="relative bottom-0 left-0 right-0
      animate-in slide-in-from-bottom-2 duration-200
      bg-card border-t border-border
      px-4 py-2
    "
    >
      <div
        className="flex items-center justify-between gap-3
        p-2 rounded-md
        border-l-4 border-l-primary
        bg-primary/5
      "
      >
        {/* Left Section: Reply Content */}
        <div className="flex-1 min-w-0">
          <h5 className="text-xs font-semibold text-primary mb-0.5">
            Replying to {senderName}
          </h5>
          <p className="text-sm text-muted-foreground truncate">
            {replyTo?.image ? "📷 Photo" : replyTo?.content || "Message"}
          </p>
        </div>

        {/* Right Section: Cancel Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="shrink-0 h-7 w-7 rounded-full hover:bg-destructive/10"
        >
          <X
            size={16}
            className="text-muted-foreground hover:text-destructive transition-colors"
          />
        </Button>
      </div>
    </div>
  );
};

export default ChatReplyBar;
