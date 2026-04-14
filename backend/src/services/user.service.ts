import userModel from "../models/user.model";
import { NotFoundException } from "../utils/app-Error";

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

  const updatedUser = await userModel.findByIdAndUpdate(
    userId,
    { name, avatar },
    { new: true, select: "-password" },
  );

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
