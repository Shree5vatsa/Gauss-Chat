import { memo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { MessageType } from "@/types/chat.types";
import AvatarWithBadge from "../avatarWithBadge";
import { formatChatTime } from "@/lib/helper";
import { Button } from "../ui/button";
import { ReplyIcon, Bot, X, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogClose } from "../ui/dialog";

interface Props {
  message: MessageType;
  onReply: (message: MessageType) => void;
}

const ChatMessageBody = memo(({ message, onReply }: Props) => {
  const { user } = useAuth();
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const userId = user?._id || null;
  const isCurrentUser = message.sender?._id === userId;
  const isAIMessage = message.sender?.isAI === true;
  const isSending = message.status === "sending...";
  const senderName = isCurrentUser ? "You" : message.sender?.name;

  const replySenderName =
    message.replyTo?.sender?._id === userId
      ? "You"
      : message.replyTo?.sender?.name;

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageOpen(true);
  };

  const containerClass = cn(
    "group flex gap-2 py-3 px-4 animate-in fade-in slide-in-from-bottom duration-300",
    isCurrentUser && "flex-row-reverse text-left",
  );

  const contentWrapperClass = cn(
    "max-w-[70%] flex flex-col relative",
    isCurrentUser && "items-end",
  );

  const messageClass = cn(
    "min-w-[180px] px-3.5 py-2.5 text-sm break-words shadow-sm transition-all duration-300",
    isCurrentUser
      ? isSending
        ? "bg-primary/60 text-primary-foreground/80 rounded-tr-xl rounded-l-xl"
        : "bg-primary text-primary-foreground rounded-tr-xl rounded-l-xl"
      : isAIMessage
        ? "bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-2 border-purple-500/30 rounded-bl-xl rounded-r-xl animate-pulse-glow"
        : isSending
          ? "bg-muted/60 text-foreground/80 rounded-bl-xl rounded-r-xl"
          : "bg-muted text-foreground rounded-bl-xl rounded-r-xl",
  );

  const replyBoxClass = cn(
    "mb-2 p-2 text-xs rounded-md border-l-4 shadow-sm text-left",
    isCurrentUser
      ? "bg-primary-foreground/10 border-l-primary-foreground"
      : isAIMessage
        ? "bg-purple-500/10 border-l-purple-500"
        : "bg-muted-foreground/10 border-l-primary",
  );


  return (
    <>
      <div className={containerClass}>
        {!isCurrentUser && (
          <div className="flex-shrink-0 flex items-start">
            <AvatarWithBadge
              name={message.sender?.name || "Unknown"}
              src={message.sender?.avatar || ""}
              isAI={isAIMessage}
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
            <div className={messageClass}>
              <div className="flex items-center gap-2 mb-0.5 pb-1">
                <span className="text-xs font-semibold flex items-center gap-1">
                  {isAIMessage && <Bot className="w-3 h-3 text-purple-500" />}
                  {senderName}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatChatTime(message?.createdAt)}
                </span>
              </div>

              {message.replyTo && (
                <div className={replyBoxClass}>
                  <h5 className="font-medium text-xs">{replySenderName}</h5>
                  <p className="font-normal text-muted-foreground max-w-[250px] truncate">
                    {message?.replyTo?.content ||
                      (message?.replyTo?.image ? "📷 Photo" : "")}
                  </p>
                </div>
              )}

              {message?.image && (
                <div className="relative group/image mt-1">
                  <img
                    src={message?.image}
                    alt="Message attachment"
                    className="rounded-lg max-w-xs max-h-60 object-cover cursor-pointer transition-transform hover:scale-105"
                    loading="lazy"
                    onClick={() => handleImageClick(message.image!)}
                  />
                  <button
                    onClick={() => handleImageClick(message.image!)}
                    className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1.5 opacity-0 group-hover/image:opacity-100 transition-opacity"
                  >
                    <ZoomIn className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}

              {message.content && <p className="mt-0.5">{message.content}</p>}

              {/* Show spinner while streaming but has partial content */}
              {isAIMessage && message.streaming && message.content && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

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

          {message.status && !isAIMessage && (
            <span className="block text-[10px] text-muted-foreground mt-0.5">
              {message.status}
            </span>
          )}
        </div>
      </div>

      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent
          className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent shadow-none border-none"
          showCloseButton={false}
        >
          <div className="relative flex items-center justify-center w-full h-full">
            <img
              src={selectedImage || ""}
              alt="Full size"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            />
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

ChatMessageBody.displayName = "ChatMessageBody";

export default ChatMessageBody;
