import { memo, useEffect, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { ArrowLeft, UserPlus, Search, UsersIcon, Check } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Spinner } from "../ui/spinner";
import type { UserType } from "../../types/auth.type";
import AvatarWithBadge from "../avatarWithBadge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import aiAssistantImg from "@/assets/ai_assistant.png";

export const NewChatPopover = memo(() => {
  const navigate = useNavigate();
  const { fetchAllUsers, users, isUsersLoading, createChat, isCreatingChat } =
    useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAllUsers();
    }
  }, [isOpen, fetchAllUsers]);

  const toggleUserSelection = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id)
        ? prev.filter((userId) => userId !== id)
        : [...prev, id],
    );
  };

  const handleBack = () => {
    setIsGroupMode(false);
    setGroupName("");
    setSelectedUsers([]);
    setSearchTerm("");
  };

  const resetState = () => {
    setIsGroupMode(false);
    setGroupName("");
    setSelectedUsers([]);
    setSearchTerm("");
    setLoadingUserId(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetState();
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers?.length === 0) return;
    const response = await createChat({
      isGroup: true,
      participants: selectedUsers,
      groupName: groupName.trim(),
    });
    if (response?._id) {
      setIsOpen(false);
      resetState();
      navigate(`/chat/${response._id}`);
    }
  };

  const handleCreateChat = async (userIdOrAIChat: string) => {
    setLoadingUserId(userIdOrAIChat);
    try {
      const isAIChat = userIdOrAIChat === "ai";

      const response = await createChat({
        isGroup: false,
        participantId: isAIChat ? undefined : userIdOrAIChat,
        isAiChat: isAIChat,
      });
      if (response?._id) {
        setIsOpen(false);
        resetState();
        navigate(`/chat/${response._id}`);
      }
    } finally {
      setLoadingUserId(null);
    }
  };

  // Filter users based on search
  const filteredUsers = users?.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="h-9 px-3 gap-1.5 rounded-full border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-all duration-200 active:scale-95"
        >
          <UserPlus className="!h-4 !w-4 !stroke-1.5" />
          <span className="text-sm font-medium hidden sm:inline">New Chat</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-96 z-[999] p-0 rounded-xl shadow-lg
          min-h-[400px] max-h-[80vh] flex flex-col
          animate-in fade-in zoom-in-95 duration-200
        "
      >
        {/* Header */}
        <div className="border-b p-4 space-y-3">
          <div className="flex items-center gap-2">
            {isGroupMode && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-7 w-7 rounded-full"
              >
                <ArrowLeft size={16} />
              </Button>
            )}
            <h3 className="text-lg font-semibold">
              {isGroupMode ? "New Group" : "New Chat"}
            </h3>
          </div>

          {/* Search Input */}
          <InputGroup className="bg-background">
            <InputGroupInput
              value={isGroupMode ? groupName : searchTerm}
              onChange={
                isGroupMode
                  ? (e) => setGroupName(e.target.value)
                  : (e) => setSearchTerm(e.target.value)
              }
              placeholder={
                isGroupMode ? "Enter group name" : "Search name or email"
              }
              autoFocus
            />
            <InputGroupAddon>
              {isGroupMode ? <UsersIcon size={16} /> : <Search size={16} />}
            </InputGroupAddon>
          </InputGroup>
        </div>

        {/* User List */}
        <div
          className="flex-1 overflow-y-auto custom-scroll
  px-2 py-2 space-y-1
"
        >
          {isUsersLoading ? (
            <div className="flex items-center justify-center h-32">
              <Spinner className="w-6 h-6" />
            </div>
          ) : !isGroupMode ? (
            <>
              {/* New Group Option */}
              <button
                onClick={() => setIsGroupMode(true)}
                className="w-full flex items-center gap-3 p-2 rounded-lg
          hover:bg-accent transition-colors
        "
              >
                <div className="bg-primary/10 p-2 rounded-full">
                  <UsersIcon className="size-4 text-primary" />
                </div>
                <span className="text-sm font-medium">New Group</span>
              </button>

              {/* AI Chat Option with actual AI avatar image */}
              <button
                onClick={() => handleCreateChat("ai")}
                className="w-full flex items-center gap-3 p-2 rounded-lg
          hover:bg-accent transition-colors
        "
              >
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-2 rounded-full">
                  <img
                    src={aiAssistantImg}
                    alt="AI Assistant"
                    className="size-4 rounded-full object-cover"
                  />
                </div>
                <span className="text-sm font-medium">
                  Chat with AI Assistant
                </span>
                {loadingUserId === "ai" && (
                  <Spinner className="w-4 h-4 ml-auto" />
                )}
              </button>

              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-muted-foreground">
                    or select a user
                  </span>
                </div>
              </div>

              {/* User List for 1-on-1 */}
              {filteredUsers?.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No users found
                </div>
              ) : (
                filteredUsers?.map((user) => (
                  <ChatUserItem
                    key={user._id}
                    user={user}
                    isLoading={loadingUserId === user._id}
                    disabled={loadingUserId !== null}
                    onClick={handleCreateChat}
                  />
                ))
              )}
            </>
          ) : (
            // Group Mode - User Selection
            <>
              {filteredUsers?.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No users found
                </div>
              ) : (
                filteredUsers?.map((user) => (
                  <GroupUserItem
                    key={user._id}
                    user={user}
                    isSelected={selectedUsers.includes(user._id)}
                    onToggle={toggleUserSelection}
                  />
                ))
              )}
            </>
          )}
        </div>

        {/* Footer - Create Group Button */}
        {isGroupMode && (
          <div className="border-t p-4">
            <Button
              onClick={handleCreateGroup}
              className="w-full"
              disabled={
                isCreatingChat ||
                !groupName.trim() ||
                selectedUsers.length === 0
              }
            >
              {isCreatingChat && <Spinner className="w-4 h-4 mr-2" />}
              Create Group ({selectedUsers.length} members)
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});

NewChatPopover.displayName = "NewChatPopover";


const UserAvatar = memo(({ user }: { user: UserType }) => {
  // Check if AI profile
  const isAIUser =
    user.email === "ai@gauss-chat.com" || user.name === "Gauss AI Assistant";

  return (
    <>
      <AvatarWithBadge
        name={user.name}
        src={user.avatar ?? ""}
        size="w-8 h-8"
        isAI={isAIUser}
      />
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-medium truncate flex items-center gap-1">
          {isAIUser && (
            <svg
              className="w-3.5 h-3.5 text-purple-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          )}
          {user.name}
        </h5>
        <p className="text-xs text-muted-foreground truncate">
          {isAIUser ? "AI Assistant" : user.email}
        </p>
      </div>
    </>
  );
});
UserAvatar.displayName = "UserAvatar";

const ChatUserItem = memo(
  ({
    user,
    isLoading,
    disabled,
    onClick,
  }: {
    user: UserType;
    disabled: boolean;
    isLoading: boolean;
    onClick: (id: string) => void;
  }) => (
    <button
      className="w-full flex items-center gap-3 p-2 rounded-lg
        hover:bg-accent transition-colors text-left
        disabled:opacity-50 disabled:cursor-not-allowed
      "
      disabled={isLoading || disabled}
      onClick={() => onClick(user._id)}
    >
      <UserAvatar user={user} />
      {isLoading && <Spinner className="w-4 h-4 ml-auto" />}
    </button>
  ),
);
ChatUserItem.displayName = "ChatUserItem";

const GroupUserItem = memo(
  ({
    user,
    isSelected,
    onToggle,
  }: {
    user: UserType;
    isSelected: boolean;
    onToggle: (id: string) => void;
  }) => {
    const isAIUser =
      user.email === "ai@gauss-chat.com" || user.name === "Gauss AI Assistant";

    return (
      <label
        role="button"
        className="w-full flex items-center gap-3 p-2 rounded-lg
          hover:bg-accent transition-colors cursor-pointer
        "
        onClick={() => onToggle(user._id)}
      >
        <AvatarWithBadge
          name={user.name}
          src={user.avatar ?? ""}
          size="w-8 h-8"
          isAI={isAIUser}
        />
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-medium truncate flex items-center gap-1">
            {isAIUser && (
              <svg
                className="w-3.5 h-3.5 text-purple-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            )}
            {user.name}
          </h5>
          <p className="text-xs text-muted-foreground truncate">
            {isAIUser ? "AI Assistant" : user.email}
          </p>
        </div>
        <div
          className={cn(
            "w-4 h-4 rounded border flex items-center justify-center",
            isSelected
              ? "bg-primary border-primary"
              : "border-muted-foreground",
          )}
        >
          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>
      </label>
    );
  },
);
GroupUserItem.displayName = "GroupUserItem";
