import { userInfo } from "os";
import ChatModel from "../models/chat.model";
import userModel from "../models/user.model";
import { BadRequestException, NotFoundException } from "../utils/app-Error";
import MessageModel from "../models/message.model";
import { emitNewChatToParticipants } from "../lib/socket";

export const createChatService = async (
  userId: string,
  body: {
    participantId?: string;
    isGroup?: boolean;
    participants?: string[];
    groupName?: string;
    groupAvatar?: string;
  },
) => {
  const { participantId, isGroup, participants, groupName, groupAvatar } = body;

  let chat;
  let allParticipantIds: string[] = [];

  if (isGroup && participants?.length && groupName) {
    allParticipantIds = [userId, ...participants];

    chat = await ChatModel.create({
      participants: allParticipantIds,
      isGroup: true,
      groupName,
      createdBy: userId,
      admin: userId,
      groupAvatar,
    });
  } else if (participantId) {
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
    }).populate("participants", "name avatar");

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
    .populate("participants", "name avatar")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    })
    .sort({ updatedAt: -1 });

  // ✅ ADD UNREAD COUNT FOR CURRENT USER
  const chatsWithUnread = chats.map((chat) => {
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
  }).populate("participants", "name avatar");

  if (!chat)
    throw new BadRequestException("Chat not found or you are not authorized");

  const messages = await MessageModel.find({ chatId })
    .populate("sender", "name avatar")
    .populate({
      path: "replyTo",
      select: "content image sender",
      populate: {
        path: "sender",
        select: "name avatar",
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
