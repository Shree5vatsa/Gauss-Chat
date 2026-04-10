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
  lg:w-[480px]
  lg:block
  border-r
  border-border
  bg-card
  w-full
  z-[98]
  left-16
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
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-24 h-24 mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-muted-foreground text-sm font-medium">
                  {searchQuery
                    ? "No chats found"
                    : filterType === "unread"
                      ? "No unread messages"
                      : filterType === "individuals"
                        ? "No individual chats"
                        : filterType === "groups"
                          ? "No group chats"
                          : "No chats yet"}
                </p>
                <p className="text-muted-foreground/60 text-xs mt-1">
                  {searchQuery
                    ? "Try a different search term"
                    : "Start a new conversation by clicking the + button"}
                </p>
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
