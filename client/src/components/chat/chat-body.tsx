import { useChat } from "@/hooks/useChat";
import { useSocket } from "@/hooks/useSocket";
import type { MessageType } from "@/types/chat.types";
import { useEffect, useRef } from "react";
import ChatBodyMessage from "./chat-body-message";

interface Props {
  chatId: string | null;
  messages: MessageType[];
  onReply: (message: MessageType) => void;
}

const ChatBody = ({ chatId, messages, onReply }: Props) => {
  const { socket } = useSocket();
  const { addNewMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!messages.length) return;
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  // Listen for real-time new messages
  useEffect(() => {
    if (!chatId) return;
    if (!socket) return;

    const handleNewMessage = (msg: MessageType) => {
      // Only add message if it belongs to current chat
      if (msg.chatId === chatId) {
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
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatBody;
