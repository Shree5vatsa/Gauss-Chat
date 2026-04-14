import userModel from "../models/user.model";
import { NotFoundException } from "../utils/app-Error";
import cloudinary from "../config/cloudinary.config";

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

export const deleteUserAccountService = async (userId: string) => {
  const user = await userModel.findByIdAndDelete(userId);
  if (!user) {
    throw new NotFoundException("User not found");
  }
  return user;
};

