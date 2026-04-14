import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Request, Response } from "express";
import {
  getUserService,
  updateUserProfileService,
  deleteUserAccountService,
} from "../services/user.service";
import { HTTP_STATUS } from "../config/http.config";

export const getUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.id;
    const users = await getUserService(userId as string);

    return res.status(HTTP_STATUS.OK).json({
      message: "Users fetched successfully",
      users,
    });
  },
);

export const updateProfileController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id?.toString();
    const { name, avatar } = req.body;

    const updatedUser = await updateUserProfileService(userId, {
      name,
      avatar,
    });

    return res.status(HTTP_STATUS.OK).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  },
);

export const deleteAccountController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id?.toString();

    await deleteUserAccountService(userId);

    return res.status(HTTP_STATUS.OK).json({
      message: "Account deleted successfully",
    });
  },
);
