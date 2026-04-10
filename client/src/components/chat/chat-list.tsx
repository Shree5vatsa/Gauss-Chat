import { useEffect, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { Spinner } from "../ui/spinner";
import ChatListItem from "./chat-list-item";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ChatListHeader from "./chat-list-header";
import { useSocket } from "@/hooks/useSocket";
import type { ChatType } from "@/types/chat.types";
import type { MessageType } from "@/types/chat.types";

const ChatList = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const {
    fetchChats,
    chats,
    isChatsLoading,
    addNewChat,
    updateChatLastMessage,
  } = useChat();
  const { user } = useAuth();
  const currentUserId = user?._id || null;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "individuals" | "groups" | "unread"
  >("all");

  // ============================================
  // Filter Logic
  // ============================================
  const filteredChats =
    chats?.filter((chat) => {
      // Step 1: Apply search filter
      const matchesSearch =
        chat.groupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.participants?.some(
          (p) =>
            p._id !== currentUserId &&
            p.name?.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      if (!matchesSearch) return false;

      // Step 2: Apply type filter
      if (filterType === "individuals") return !chat.isGroup;
      if (filterType === "groups") return chat.isGroup;
      if (filterType === "unread") return (chat.unreadCount || 0) > 0;

      return true; // "all" filter
    }) || [];

  // ============================================
  // Counts for Badges
  // ============================================
  const totalCount = chats?.length || 0;
  const individualsCount = chats?.filter((c) => !c.isGroup).length || 0;
  const groupsCount = chats?.filter((c) => c.isGroup).length || 0;
  const unreadCount =
    chats?.filter((c) => (c.unreadCount || 0) > 0).length || 0;

  // ============================================
  // Effects
  // ============================================
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (!socket) return;

    const handleNewChat = (newChat: ChatType) => {
      console.log("Received new chat", newChat);
      addNewChat(newChat);
    };

    socket.on("chat:new", handleNewChat);

    return () => {
      socket.off("chat:new", handleNewChat);
    };
  }, [addNewChat, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleChatUpdate = (data: {
      chatId: string;
      lastMessage: MessageType;
    }) => {
      console.log("Received update on chat", data.lastMessage);
      updateChatLastMessage(data.chatId, data.lastMessage);
    };

    socket.on("chat:update", handleChatUpdate);

    return () => {
      socket.off("chat:update", handleChatUpdate);
    };
  }, [socket, updateChatLastMessage]);

  const onRoute = (id: string) => {
    navigate(`/chat/${id}`);
  };

  // ============================================
  // Render
  // ============================================
  return (
    <div
      className="fixed inset-y-0
      pb-20 lg:pb-0
      lg:max-w-[420px]
      lg:block
      border-r
      border-border
      bg-card
      max-w-[calc(100%-40px)]
      w-full
      left-16
      z-[98]
    "
    >
      <div className="flex-col">
        {/* Chat List Header with Filters */}
        <ChatListHeader
          onSearch={setSearchQuery}
          filterType={filterType}
          onFilterChange={setFilterType}
          totalCount={totalCount}
          individualsCount={individualsCount}
          groupsCount={groupsCount}
          unreadCount={unreadCount}
        />

        {/* Chat List */}
        <div
          className="
            flex-1 h-[calc(100vh-180px)]
            overflow-y-auto
          "
        >
          <div className="px-3 py-2 space-y-1">
            {isChatsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Spinner className="w-7 h-7" />
              </div>
            ) : filteredChats?.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                {searchQuery
                  ? "No chats found"
                  : filterType === "unread"
                    ? "No unread messages"
                    : filterType === "individuals"
                      ? "No individual chats"
                      : filterType === "groups"
                        ? "No group chats"
                        : "No chats created"}
              </div>
            ) : (
              filteredChats?.map((chat) => (
                <ChatListItem
                  key={chat._id}
                  chat={chat}
                  currentUserId={currentUserId}
                  onClick={() => onRoute(chat._id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatList;
