import mongoose from "mongoose";
import ChatModel from "../models/chat.model";
import MessageModel from "../models/message.model";
import { BadRequestException } from "../utils/app-Error";
import cloudinary from "../config/cloudinary.config";
import {
  emitLastMessageToParticipants,
  emitNewMessageTochatRoom,
} from "../lib/socket";
import userModel from "../models/user.model";

export const sendMessageService = async (
  userId: string,
  body: {
    chatId: string;
    content?: string;
    image?: string;
    replyToId?: string;
  },
) => {
  const { chatId, content, image, replyToId } = body;

  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: { $in: [userId] },
  });

  if (!chat)
    throw new BadRequestException("Chat not found or you are not authorized");

  if (replyToId) {
    const replyMessage = await MessageModel.findOne({
      _id: replyToId,
      chatId,
    });
    if (!replyMessage) throw new BadRequestException("Reply message not found");
  }

  let imageUrl;

  if (image) {
    const uploadedImage = await cloudinary.uploader.upload(image);
    imageUrl = uploadedImage.secure_url;
  }

  const newMessage = await MessageModel.create({
    chatId,
    sender: userId,
    content,
    image: imageUrl,
    replyTo: replyToId,
  });

  await newMessage.populate([
    {
      path: "sender",
      select: "name avatar isAI",
    },
    {
      path: "replyTo",
      select: "content image sender",
      populate: {
        path: "sender",
        select: "name avatar isAI",
      },
    },
  ]);

  chat.lastMessage = newMessage._id as mongoose.Types.ObjectId;

  // INCREMENT UNREAD COUNT FOR ALL PARTICIPANTS EXCEPT SENDER
  const participants = chat.participants.map((p) => p.toString());
  for (const participantId of participants) {
    if (participantId !== userId) {
      const currentCount = chat.unreadCount?.get(participantId) || 0;
      chat.unreadCount?.set(participantId, currentCount + 1);
    }
  }

  await chat.save();

  //web socket
  emitNewMessageTochatRoom(userId, chatId, newMessage);

  const allParticipantIds = chat.participants.map((id) => id.toString());
  emitLastMessageToParticipants(allParticipantIds, chatId, newMessage);

  // ✅ HANDLE AI RESPONSE
  if (chat.isAiChat) {
    // Get the AI participant (the bot)
    const aiParticipant = await userModel.findOne({ isAI: true });

    // Check if the sender is NOT the AI (so we don't create infinite loops)
    const isSenderAI = await userModel.findById(userId).select("isAI");

    if (aiParticipant && (!isSenderAI || !isSenderAI.isAI)) {
      // Get last 5 messages for context
      const recentMessages = await MessageModel.find({ chatId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("sender", "isAI");

      const conversationHistory = recentMessages.reverse().map((msg) => ({
        role: (msg.sender as any)?.isAI ? "assistant" : "user",
        content: msg.content || "",
      }));

      // Generate AI response
      const { getAIResponse } = await import("./ai.service");
      const aiResponseText = await getAIResponse(
        content || "",
        conversationHistory,
      );

      // Create AI response message
      const aiMessage = await MessageModel.create({
        chatId,
        sender: aiParticipant._id,
        content: aiResponseText,
        replyTo: newMessage._id,
      });

      await aiMessage.populate([
        {
          path: "sender",
          select: "name avatar isAI",
        },
        {
          path: "replyTo",
          select: "content image sender",
          populate: {
            path: "sender",
            select: "name avatar isAI",
          },
        },
      ]);

      // Update lastMessage in chat
      chat.lastMessage = aiMessage._id as mongoose.Types.ObjectId;

      // ✅ FIXED: DO NOT increment unread count for AI responses
      // The user is actively in the chat, so AI messages should be marked as read immediately
      // No unread increment needed for the user

      await chat.save();

      // Emit AI message
      emitNewMessageTochatRoom(aiParticipant._id.toString(), chatId, aiMessage);
      emitLastMessageToParticipants(allParticipantIds, chatId, aiMessage);
    }
  }

  return {
    userMessage: newMessage,
    chat,
  };
};
