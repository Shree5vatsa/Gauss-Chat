import { API } from "@/lib/axios-client";
import type { UserType } from "@/types/auth.type";
import type {
  ChatType,
  CreateChatType,
  CreateMessageType,
  MessageType,
} from "@/types/chat.types";
import { toast } from "sonner";
import { create } from "zustand";
import { generateUUID } from "@/lib/helper";
import { useAuth } from "./useAuth";

interface ChatState {
  chats: ChatType[];
  users: UserType[];
  singleChat: {
    chat: ChatType;
    messages: MessageType[];
  } | null;

  isChatsLoading: boolean;
  isUsersLoading: boolean;
  isCreatingChat: boolean;
  isSingleChatLoading: boolean;
  isSendingMsg: boolean;

  fetchAllUsers: () => void;
  fetchChats: () => void;
  createChat: (payload: CreateChatType) => Promise<ChatType | null>;
  fetchSingleChat: (chatId: string) => void;
  sendMessage: (payload: CreateMessageType) => void;

  addNewChat: (newChat: ChatType) => void;
  updateChatLastMessage: (chatId: string, lastMessage: MessageType) => void;
  addNewMessage: (chatId: string, message: MessageType) => void;
}

export const useChat = create<ChatState>()((set, get) => ({
  chats: [],
  users: [],
  singleChat: null,

  isChatsLoading: false,
  isUsersLoading: false,
  isCreatingChat: false,
  isSingleChatLoading: false,
  isSendingMsg: false,

  fetchAllUsers: async () => {
    set({ isUsersLoading: true });

    try {
      const { data } = await API.get("/user/all");
      set({ users: data.users });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  fetchChats: async () => {
    set({ isChatsLoading: true });
    try {
      const { data } = await API.get("/chat/all");
      set({ chats: data.chats });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch chats");
    } finally {
      set({ isChatsLoading: false });
    }
  },

  createChat: async (payload: CreateChatType) => {
    set({ isCreatingChat: true });
    try {
      const response = await API.post("/chat/create", {
        ...payload,
      });
      get().addNewChat(response.data.chat);
      toast.success("Chat created successfully");
      return response.data.chat;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create chat");
      return null;
    } finally {
      set({ isCreatingChat: false });
    }
  },

  fetchSingleChat: async (chatId: string) => {
    set({ isSingleChatLoading: true });
    try {
      const { data } = await API.get(`/chat/${chatId}`);
      set({ singleChat: data });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch chats");
    } finally {
      set({ isSingleChatLoading: false });
    }
  },

  sendMessage: async (payload: CreateMessageType) => {
    set({ isSendingMsg: true });
    const { chatId, replyTo, content, image } = payload;
    const { user } = useAuth.getState();

    if (!chatId || !user?._id) return;

    const tempUserId = generateUUID();

    const tempMessage = {
      _id: tempUserId,
      chatId,
      content: content || "",
      image: image || null,
      sender: user,
      replyTo: replyTo || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "sending...",
    };

    // Add temp message
    set((state) => {
      if (state.singleChat?.chat?._id !== chatId) return state;
      return {
        singleChat: {
          ...state.singleChat,
          messages: [...state.singleChat.messages, tempMessage],
        },
      };
    });

    try {
      const { data } = await API.post("/chat/message/send", {
        chatId,
        content,
        image,
        replyToId: replyTo?._id,
      });
      const { userMessage } = data;

      // ✅ UPDATE the temp message instead of replacing (no new element, just update properties)
      set((state) => {
        if (!state.singleChat) return state;

        return {
          singleChat: {
            ...state.singleChat,
            messages: state.singleChat.messages.map((msg) =>
              msg._id === tempUserId
                ? {
                    ...userMessage,
                    status: "sent",
                    // Preserve the same _id to avoid re-mount
                    _id: tempUserId,
                  }
                : msg,
            ),
          },
        };
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send message");
      // Remove temp message on error
      set((state) => {
        if (!state.singleChat) return state;
        return {
          singleChat: {
            ...state.singleChat,
            messages: state.singleChat.messages.filter(
              (msg) => msg._id !== tempUserId,
            ),
          },
        };
      });
    } finally {
      set({ isSendingMsg: false });
    }
  },

  addNewChat: (newChat: ChatType) => {
    set((state) => {
      const existingChatIndex = state.chats.findIndex(
        (chat) => chat._id === newChat._id,
      );
      if (existingChatIndex !== -1) {
        return {
          chats: [
            newChat,
            ...state.chats.filter((chat) => chat._id !== newChat._id),
          ],
        };
      } else {
        return { chats: [newChat, ...state.chats] };
      }
    });
  },

  updateChatLastMessage: (chatId: string, lastMessage: MessageType) => {
    set((state) => {
      const chat = state.chats.find((ch) => ch._id === chatId);
      if (!chat) return state;

      return {
        chats: [
          { ...chat, lastMessage },
          ...state.chats.filter((ch) => ch._id !== chatId),
        ],
      };
    });
  },

  // ✅ FIXED: Added duplicate message check
  addNewMessage: (chatId: string, message: MessageType) => {
    const chat = get().singleChat;
    if (chat?.chat._id === chatId) {
      // Check if message already exists to prevent duplicates
      const messageExists = chat.messages.some((m) => m._id === message._id);
      if (messageExists) {
        console.log(
          "⚠️ Message already exists, skipping duplicate:",
          message._id,
        );
        return;
      }

      set({
        singleChat: {
          chat: chat.chat,
          messages: [...chat.messages, message],
        },
      });
    }
  },
}));
