import { memo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { MessageType } from "@/types/chat.types";
import AvatarWithBadge from "../avatarWithBadge";
import { formatChatTime } from "@/lib/helper";
import { Button } from "../ui/button";
import { ReplyIcon, Bot } from "lucide-react"; // ✅ ADD Bot icon

interface Props {
  message: MessageType;
  onReply: (message: MessageType) => void;
}

const ChatMessageBody = memo(({ message, onReply }: Props) => {
  const { user } = useAuth();

  const userId = user?._id || null;
  const isCurrentUser = message.sender?._id === userId;
  const isAIMessage = message.sender?.isAI === true; // ✅ Check if message is from AI
  const isSending = message.status === "sending...";
  const senderName = isCurrentUser ? "You" : message.sender?.name;

  const replySenderName =
    message.replyTo?.sender?._id === userId
      ? "You"
      : message.replyTo?.sender?.name;

  const containerClass = cn(
    "group flex gap-2 py-3 px-4 animate-in fade-in slide-in-from-bottom duration-300",
    isCurrentUser && "flex-row-reverse text-left",
  );

  const contentWrapperClass = cn(
    "max-w-[70%] flex flex-col relative",
    isCurrentUser && "items-end",
  );

  // ✅ Special styling for AI messages
  const messageClass = cn(
    "min-w-[180px] px-3.5 py-2.5 text-sm break-words shadow-sm transition-all duration-300",
    isCurrentUser
      ? isSending
        ? "bg-primary/60 text-primary-foreground/80 rounded-tr-xl rounded-l-xl"
        : "bg-primary text-primary-foreground rounded-tr-xl rounded-l-xl"
      : isAIMessage
        ? "bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-2 border-purple-500/30 rounded-bl-xl rounded-r-xl animate-pulse-glow" // ✅ AI special effect
        : isSending
          ? "bg-muted/60 text-foreground/80 rounded-bl-xl rounded-r-xl"
          : "bg-muted text-foreground rounded-bl-xl rounded-r-xl",
  );

  const replyBoxClass = cn(
    "mb-2 p-2 text-xs rounded-md border-l-4 shadow-sm text-left",
    isCurrentUser
      ? "bg-primary-foreground/10 border-l-primary-foreground"
      : isAIMessage
        ? "bg-purple-500/10 border-l-purple-500" // ✅ AI reply box styling
        : "bg-muted-foreground/10 border-l-primary",
  );

  return (
    <div className={containerClass}>
      {/* Avatar - Only for other users */}
      {!isCurrentUser && (
        <div className="flex-shrink-0 flex items-start">
          <AvatarWithBadge
            name={message.sender?.name || "Unknown"}
            src={message.sender?.avatar || ""}
            isAI={isAIMessage} // ✅ Pass isAI flag
            size="w-8 h-8"
          />
        </div>
      )}

      <div className={contentWrapperClass}>
        <div
          className={cn(
            "flex items-center gap-1",
            isCurrentUser && "flex-row-reverse",
          )}
        >
          {/* Message Bubble */}
          <div className={messageClass}>
            {/* Header: Name + Time + AI Badge */}
            <div className="flex items-center gap-2 mb-0.5 pb-1">
              <span className="text-xs font-semibold flex items-center gap-1">
                {isAIMessage && <Bot className="w-3 h-3 text-purple-500" />}{" "}
                {/* ✅ AI icon */}
                {senderName}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatChatTime(message?.createdAt)}
              </span>
            </div>

            {/* Reply To Box */}
            {message.replyTo && (
              <div className={replyBoxClass}>
                <h5 className="font-medium text-xs">{replySenderName}</h5>
                <p className="font-normal text-muted-foreground max-w-[250px] truncate">
                  {message?.replyTo?.content ||
                    (message?.replyTo?.image ? "📷 Photo" : "")}
                </p>
              </div>
            )}

            {/* Image */}
            {message?.image && (
              <img
                src={message?.image}
                alt="Message attachment"
                className="rounded-lg max-w-xs max-h-60 object-cover mt-1"
                loading="lazy"
              />
            )}

            {/* Text Content */}
            {message.content && <p className="mt-0.5">{message.content}</p>}

            {/* ✅ AI Thinking Animation (for streaming messages) */}
            {isAIMessage && message.streaming && (
              <div className="flex gap-1 mt-2">
                <span
                  className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            )}
          </div>

          {/* Reply Button (on hover) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onReply(message)}
            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full !size-7 shrink-0"
          >
            <ReplyIcon
              size={14}
              className={cn(
                "text-muted-foreground",
                isCurrentUser && "scale-x-[-1]",
              )}
            />
          </Button>
        </div>

        {/* Message Status */}
        {message.status && !isAIMessage && (
          <span className="block text-[10px] text-muted-foreground mt-0.5">
            {message.status}
          </span>
        )}
      </div>
    </div>
  );
});

ChatMessageBody.displayName = "ChatMessageBody";

export default ChatMessageBody;
