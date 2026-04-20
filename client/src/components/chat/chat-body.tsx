import { useChat } from "@/hooks/useChat";
import { useSocket } from "@/hooks/useSocket";
import type { MessageType } from "@/types/chat.types";
import { useEffect, useRef } from "react";
import ChatBodyMessage from "./chat-body-message";
import AvatarWithBadge from "../avatarWithBadge";

interface Props {
  chatId: string | null;
  messages: MessageType[];
  onReply: (message: MessageType) => void;
  isOtherUserTyping?: boolean;
  typingUserName?: string;
  isGroupChat?: boolean;
  isAiChat?: boolean;
}

// Standalone AI thinking bubble — shown in the chat body while waiting for AI
const AIThinkingBubble = () => (
  <div className="flex gap-2 py-3 px-4 animate-in fade-in slide-in-from-bottom duration-300">
    <div className="flex-shrink-0 flex items-start">
      <AvatarWithBadge
        name="Gauss AI Assistant"
        src=""
        isAI={true}
        size="w-8 h-8"
      />
    </div>
    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-2 border-purple-500/30 rounded-bl-xl rounded-r-xl px-4 py-3">
      <div className="flex items-center gap-1.5">
        <div
          className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  </div>
);

const ChatBody = ({
  chatId,
  messages,
  onReply,
  isOtherUserTyping = false,
  typingUserName = "",
  isGroupChat = false,
  isAiChat = false,
}: Props) => {
  const { socket } = useSocket();
  const { addNewMessage, isSendingMsg } = useChat();
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

  // Auto-scroll when AI thinking bubble appears
  useEffect(() => {
    if (isSendingMsg) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [isSendingMsg]);

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
    <div className="flex-1 overflow-y-auto bg-background chat-body-scroll">
      <div className="w-full max-w-4xl mx-auto flex flex-col px-4 py-6">
        {messages.map((message) => (
          <ChatBodyMessage
            key={message._id}
            message={message}
            onReply={onReply}
          />
        ))}

        {/* AI Thinking Bubble - shown while waiting for AI response */}
        {isAiChat && isSendingMsg && <AIThinkingBubble />}

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
