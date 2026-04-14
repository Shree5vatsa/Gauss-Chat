import userModel from "../models/user.model";
import { NotFoundException } from "../utils/app-Error";
import cloudinary from "../config/cloudinary.config";
import { emitUserAccountDeleted } from "../lib/socket";

export const findByIdUserService = async (userId: string) => {
  return await userModel.findById(userId);
};

export const getUserService = async (userId: string) => {
  return await userModel.find({ _id: { $ne: userId } }).select("-password");
};

export const updateUserProfileService = async (
  userId: string,
  body: { name?: string; avatar?: string },
) => {
  const { name, avatar } = body;

  let avatarUrl = undefined;

  if (avatar && avatar.startsWith("data:image")) {
    const uploadResult = await cloudinary.uploader.upload(avatar, {
      folder: "avatars",
    });
    avatarUrl = uploadResult.secure_url;
  }

  const updateData: any = {};
  if (name) updateData.name = name;
  if (avatarUrl) updateData.avatar = avatarUrl;

  const updatedUser = await userModel.findByIdAndUpdate(userId, updateData, {
    new: true,
    select: "-password",
  });

  if (!updatedUser) {
    throw new NotFoundException("User not found");
  }

  return updatedUser;
};

import ChatModel from "../models/chat.model";
import MessageModel from "../models/message.model";

export const deleteUserAccountService = async (userId: string) => {
  // Get all chats the user was in to notify participants
  const userChats = await ChatModel.find({ participants: userId }).select(
    "participants",
  );
  const participantIds = new Set<string>();

  for (const chat of userChats) {
    for (const p of chat.participants) {
      if (p.toString() !== userId) {
        participantIds.add(p.toString());
      }
    }
  }

  // Delete user
  const user = await userModel.findByIdAndDelete(userId);
  if (!user) {
    throw new NotFoundException("User not found");
  }

  // Remove user from all chats
  await ChatModel.updateMany(
    { participants: userId },
    { $pull: { participants: userId } },
  );

  // Delete empty chats
  await ChatModel.deleteMany({ participants: { $size: 0 } });

  // Delete user's messages
  await MessageModel.deleteMany({ sender: userId });

  // Notify other users to refresh their chat list
  for (const participantId of participantIds) {
    emitUserAccountDeleted(participantId, userId);
  }

  return user;
};

