import { z } from "zod";
import type { MessageType } from "@/types/chat.types";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Paperclip, Send, X } from "lucide-react";
import { Form, FormField, FormItem } from "../ui/form";
import { Input } from "../ui/input";
import ChatReplyBar from "./chat-reply-bar";
import { useChat } from "@/hooks/useChat";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  chatId: string | null;
  currentUserId: string | null;
  replyTo: MessageType | null;
  onCancelReply: () => void;
}

const ChatFooter = ({
  chatId,
  currentUserId,
  replyTo,
  onCancelReply,
}: Props) => {
  const messageSchema = z.object({
    message: z.string().optional(),
  });

  const { sendMessage, isSendingMsg } = useChat();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [image, setImage] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null); 

  const form = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleTyping = () => {
    if (!socket || !chatId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const userName = user?.name || "Someone";

    socket.emit("typing:start", { chatId, userName });

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { chatId });
    }, 1500);
  };

  const onSubmit = async (values: { message?: string }) => {
    if (isSendingMsg) return;
    if (!values.message?.trim() && !image) {
      toast.error("Please enter a message or select an image");
      return;
    }

    // Stop typing indicator before sending
    if (socket && chatId) {
      socket.emit("typing:stop", { chatId });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const payload = {
      chatId,
      content: values.message,
      image: image || undefined,
      replyTo: replyTo,
    };

    await sendMessage(payload); 
    onCancelReply();
    handleRemoveImage();
    form.reset();

    
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 50);
  };

  return (
    <>
      {/* Reply Bar (appears above input when replying) */}
      {replyTo && !isSendingMsg && (
        <ChatReplyBar
          replyTo={replyTo}
          currentUserId={currentUserId}
          onCancel={onCancelReply}
        />
      )}

      {/* Main Footer */}
      <div
        className="sticky bottom-0 inset-x-0 z-[999]
        bg-card border-t border-border
        py-3
      "
      >
        {/* Image Preview */}
        {image && !isSendingMsg && (
          <div className="max-w-6xl mx-auto px-4 pb-2">
            <div className="relative w-fit">
              <img
                src={image}
                alt="Preview"
                className="object-cover h-16 w-16 rounded-md border border-border"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleRemoveImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Input Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="max-w-6xl mx-auto px-4 flex items-end gap-2"
          >
            {/* Attach Button */}
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isSendingMsg}
                className="rounded-full shrink-0"
                onClick={() => imageInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                disabled={isSendingMsg}
                ref={imageInputRef}
                onChange={handleImageChange}
              />
            </div>

            {/* Message Input */}
            <FormField
              control={form.control}
              name="message"
              disabled={isSendingMsg}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <Input
                    {...field}
                    autoComplete="off"
                    placeholder="Type a message..."
                    className="min-h-[40px] bg-background"
                    ref={messageInputRef} 
                    onChange={(e) => {
                      field.onChange(e);
                      handleTyping();
                    }}
                  />
                </FormItem>
              )}
            />

            {/* Send Button */}
            <Button
              type="submit"
              size="icon"
              className="rounded-full shrink-0"
              disabled={isSendingMsg}
            >
              {isSendingMsg ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
};

export default ChatFooter;
