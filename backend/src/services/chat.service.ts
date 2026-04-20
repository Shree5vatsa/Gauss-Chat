import { userInfo } from "os";
import ChatModel from "../models/chat.model";
import userModel from "../models/user.model";
import { BadRequestException, NotFoundException } from "../utils/app-Error";
import MessageModel from "../models/message.model";
import { emitNewChatToParticipants } from "../lib/socket";
import { hashValue } from "../utils/bcrypt";

export const createChatService = async (
  userId: string,
  body: {
    participantId?: string;
    isGroup?: boolean;
    participants?: string[];
    groupName?: string;
    groupAvatar?: string;
    isAiChat?: boolean; 
  },
) => {
  const {
    participantId,
    isGroup,
    participants,
    groupName,
    groupAvatar,
    isAiChat,
  } = body;

  let chat;
  let allParticipantIds: string[] = [];

  //HANDLE AI CHAT (1-on-1 with AI)
  if (isAiChat) {
    // Check if AI user exists, if not create it
    let aiUser = await userModel.findOne({ isAI: true });

    if (!aiUser) {
      aiUser = await userModel.create({
        name: "Gauss AI Assistant",
        email: "ai@gauss-chat.com",
        password: await hashValue(Math.random().toString(36)),
        isAI: true,
        avatar: null,
      });
    }

    allParticipantIds = [userId, aiUser._id.toString()];

    // Check if AI chat already exists
    const existingChat = await ChatModel.findOne({
      participants: { $all: allParticipantIds, $size: 2 },
      isAiChat: true,
    }).populate("participants", "name avatar isAI");

    if (existingChat) return existingChat;

    chat = await ChatModel.create({
      participants: allParticipantIds,
      isGroup: false,
      isAiChat: true,
      createdBy: userId,
    });
  }
  //EXISTING GROUP CHAT LOGIC
  else if (isGroup && participants?.length && groupName) {
    allParticipantIds = [userId, ...participants];

    chat = await ChatModel.create({
      participants: allParticipantIds,
      isGroup: true,
      groupName,
      createdBy: userId,
      admin: userId,
      groupAvatar,
    });
  }
  //EXISTING 1-on-1 CHAT LOGIC
  else if (participantId && !isAiChat) {
    const otherUser = await userModel.findById(participantId);
    if (!otherUser) {
      throw new NotFoundException("User not found");
    }
    allParticipantIds = [userId, participantId];

    const existingChat = await ChatModel.findOne({
      participants: {
        $all: allParticipantIds,
        $size: 2,
      },
    }).populate("participants", "name avatar isAI");

    if (existingChat) return existingChat;

    chat = await ChatModel.create({
      participants: allParticipantIds,
      isGroup: false,
      createdBy: userId,
    });
  }

  const populatedChat = await chat?.populate(
    "participants",
    "name avatar isAI",
  );
  const participantIdStrings = populatedChat?.participants?.map((p) => {
    return p._id?.toString();
  });
  emitNewChatToParticipants(participantIdStrings, populatedChat);

  return chat;
};

export const getUserChatService = async (userId: string) => {
  const chats = await ChatModel.find({
    participants: { $in: [userId] },
  })
    .populate("participants", "name avatar isAI")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    })
    .sort({ updatedAt: -1 });

  
  const validChats = chats.filter((chat) => {
   
    const allParticipantsExist = chat.participants.every((p) => p !== null);
    if (!chat.isGroup && chat.participants.length < 2) return false;
    return allParticipantsExist;
  });

  const chatsWithUnread = validChats.map((chat) => {
    const chatObj = chat.toObject();
    const unreadCount = chat.unreadCount?.get(userId) || 0;
    return {
      ...chatObj,
      unreadCount,
    };
  });

  return chatsWithUnread;
};

export const getSingleChatService = async (chatId: string, userId: string) => {
  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: {
      $in: [userId],
    },
  }).populate("participants", "name avatar isAI");

  if (!chat)
    throw new BadRequestException("Chat not found or you are not authorized");

  const messages = await MessageModel.find({ chatId })
    .populate("sender", "name avatar isAI")
    .populate({
      path: "replyTo",
      select: "content image sender",
      populate: {
        path: "sender",
        select: "name avatar isAI",
      },
    })
    .sort({ createdAt: 1 });

  return {
    chat,
    messages,
  };
};

export const validateChatParticipant = async (
  chatId: string,
  userId: string,
) => {
  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: {
      $in: [userId],
    },
  });
  if (!chat) throw new BadRequestException("User not a participant in chat");
  return chat;
};
 
export const resetUnreadCountService = async (
  chatId: string,
  userId: string,
) => {
  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: { $in: [userId] },
  });

  if (!chat) throw new BadRequestException("Chat not found");

  chat.unreadCount?.set(userId, 0);
  await chat.save();

  return chat;
};
