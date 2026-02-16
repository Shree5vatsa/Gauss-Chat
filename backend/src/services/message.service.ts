import mongoose from "mongoose";
import ChatModel from "../models/chat.model";
import MessageModel from "../models/message,model";

import { BadRequestException } from "../utils/app-Error";
import cloudinary from "../config/cloudinary.config";
import { emitLastMessageToParticipants, emitNewMessageTochatRoom } from "../lib/socket";

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
      select: "name avatar",
    },
    {
      path: "replyTo",
      select: "content image sender",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    },
  ]);

  chat.lastMessage = newMessage._id as mongoose.Types.ObjectId;
  await chat.save();

  //web socket
  emitNewMessageTochatRoom(userId, chatId, newMessage);
  
  const allParticipantIds = chat.participants.map((id) => id.toString());
  emitLastMessageToParticipants(allParticipantIds,chatId,newMessage);

  return {
    userMessage: newMessage,
    chat,
  };
};
