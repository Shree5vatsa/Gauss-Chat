import EmptyState from "@/components/empty-state";
import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useChat } from "@/hooks/useChat";
import useChatId from "@/hooks/useChatId";
import ChatHeader from "@/components/chat/chat-header";
import ChatBody from "@/components/chat/chat-body";
import ChatFooter from "@/components/chat/chat-footer";
import type { MessageType } from "@/types/chat.types";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/axios-client";

const SingleChat = () => {
  const chatId = useChatId();
  const { socket } = useSocket();
  const { fetchSingleChat, singleChat, isSingleChatLoading, resetUnreadInStore } = useChat();
  const [replyTo, setReplyTo] = useState<MessageType | null>(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState<string>("");
  const { user } = useAuth();

  // Fetch chat when chatId changes
  useEffect(() => {
    if (chatId) {
      console.log("Fetching chat:", chatId);
      fetchSingleChat(chatId);
    }
  }, [chatId, fetchSingleChat]);

  // Reset unread count when chat is opened:
  // 1. resetUnreadInStore → zeroes the badge immediately in the UI (zustand)
  // 2. API call        → persists the zero back to MongoDB
  useEffect(() => {
    if (chatId && user?._id) {
      resetUnreadInStore(chatId);
      API.post(`/chat/${chatId}/reset-unread`).catch((err) =>
        console.error("Failed to reset unread in DB:", err),
      );
    }
  }, [chatId, user, resetUnreadInStore]);

  // Join/leave chat room for real-time messages
  useEffect(() => {
    if (!socket || !chatId) return;

    socket.emit("chat:join", chatId, (err?: string) => {
      if (err) {
        console.error("Failed to join chat:", err);
      } else {
        console.log("Joined chat room:", chatId);
      }
    });

    return () => {
      socket.emit("chat:leave", chatId);
      console.log("Left chat room:", chatId);
    };
  }, [socket, chatId]);

  // Listen for typing events with user name
  useEffect(() => {
    if (!socket) return;

    const handleTypingStart = (data: { chatId: string; userName: string }) => {
      if (data.chatId === chatId) {
        setIsOtherUserTyping(true);
        setTypingUserName(data.userName);
      }
    };

    const handleTypingStop = (data: { chatId: string }) => {
      if (data.chatId === chatId) {
        setIsOtherUserTyping(false);
        setTypingUserName("");
      }
    };

    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, [socket, chatId]);


  if (!chatId) {
    return <EmptyState />;
  }

  if (isSingleChatLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!singleChat || !singleChat.chat) {
    return (
      <EmptyState
        title="Chat not found"
        description="This chat may have been deleted"
      />
    );
  }

  const isGroupChat = singleChat.chat.isGroup;

  return (
    <div className="h-full w-full flex flex-col">
      <ChatHeader chat={singleChat.chat} currentUserId={user?._id || null} />

      <ChatBody
        chatId={chatId}
        messages={singleChat.messages || []}
        onReply={setReplyTo}
        isOtherUserTyping={isOtherUserTyping}
        typingUserName={typingUserName}
        isGroupChat={isGroupChat}
        isAiChat={singleChat.chat.isAiChat}
      />

      <ChatFooter
        chatId={chatId}
        currentUserId={user?._id || null}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
};

export default SingleChat;
