import { useChat } from "@/hooks/useChat";
import { useSocket } from "@/hooks/useSocket";
import type { MessageType } from "@/types/chat.types";
import { useEffect, useRef } from "react";
import ChatBodyMessage from "./chat-body-message";

interface Props {
  chatId: string | null;
  messages: MessageType[];
  onReply: (message: MessageType) => void;
  isOtherUserTyping?: boolean;
  typingUserName?: string;
  isGroupChat?: boolean;
}

const ChatBody = ({
  chatId,
  messages,
  onReply,
  isOtherUserTyping = false,
  typingUserName = "",
  isGroupChat = false,
}: Props) => {
  const { socket } = useSocket();
  const { addNewMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!messages.length) return;
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  // Auto-scroll when typing indicator appears/disappears
  useEffect(() => {
    if (typingRef.current) {
      typingRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [isOtherUserTyping]);

  // Listen for real-time new messages
  useEffect(() => {
    if (!chatId) return;
    if (!socket) return;

    const handleNewMessage = (msg: MessageType) => {
      console.log(
        "🟢 ChatBody received message:",
        msg._id,
        "Content:",
        msg.content,
      );

      // Only add message if it belongs to current chat
      if (msg.chatId === chatId) {
        console.log("✅ Adding message to current chat");
        addNewMessage(chatId, msg);
      }
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, chatId, addNewMessage]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "auto",
          block: "end",
        });
      }, 100);
    }
  }, []);

  // Get display text for typing indicator
  const getTypingText = () => {
    if (!isOtherUserTyping) return null;
    if (isGroupChat && typingUserName) {
      return `${typingUserName} is typing...`;
    }
    return "Typing...";
  };

  const typingText = getTypingText();

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="w-full max-w-4xl mx-auto flex flex-col px-4 py-6">
        {messages.map((message) => (
          <ChatBodyMessage
            key={message._id}
            message={message}
            onReply={onReply}
          />
        ))}

        {/* Typing Indicator - shown at bottom of messages */}
        {typingText && (
          <div ref={typingRef} className="px-4 py-2">
            <span className="text-xs text-muted-foreground animate-pulse">
              {typingText}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatBody;
