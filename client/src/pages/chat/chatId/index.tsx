import EmptyState from "@/components/empty-state";
import { useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useChat } from "@/hooks/useChat";
import useChatId from "@/hooks/useChatId";
import ChatHeader from "@/components/chat/chat-header";
import ChatBody from "@/components/chat/chat-body";
import ChatFooter from "@/components/chat/chat-footer";
import { useState } from "react";
import type { MessageType } from "@/types/chat.types";
import { useAuth } from "@/hooks/useAuth";

const SingleChat = () => {
  const chatId = useChatId();
  const { socket } = useSocket();
  const { fetchSingleChat, singleChat, isSingleChatLoading } = useChat();
  const [replyTo, setReplyTo] = useState<MessageType | null>(null);
  const { user } = useAuth();

  // Fetch chat when chatId changes
  useEffect(() => {
    if (chatId) {
      console.log("Fetching chat:", chatId);
      fetchSingleChat(chatId);
    }
  }, [chatId, fetchSingleChat]);

  // Join/leave chat room for real-time messages
  useEffect(() => {
    if (!socket || !chatId) return;

    // Join the chat room
    socket.emit("chat:join", chatId, (err?: string) => {
      if (err) {
        console.error("Failed to join chat:", err);
      } else {
        console.log("Joined chat room:", chatId);
      }
    });

    // Leave when component unmounts or chatId changes
    return () => {
      socket.emit("chat:leave", chatId);
      console.log("Left chat room:", chatId);
    };
  }, [socket, chatId]);

  // Debug: log singleChat state
  useEffect(() => {
    console.log("singleChat state:", singleChat);
  }, [singleChat]);

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

  return (
    <div className="h-full w-full flex flex-col">
      <ChatHeader chat={singleChat.chat} currentUserId={user?._id || null} />
      <ChatBody
        chatId={chatId}
        messages={singleChat.messages || []}
        onReply={setReplyTo}
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
