import { HTTP_STATUS } from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { registerService, loginService } from "../services/auth.service";
import { clearJwtAuthCookie, setJwtAuthCookie } from "../utils/cookie";
import { loginSchema, registerSchema } from "../validators/auth.validator";
import { Request, Response } from "express"; // Import both from express
import { changePasswordService } from "../services/auth.service";
import { changePasswordSchema } from "../validators/auth.validator";
import { UnauthorizedException } from "../utils/app-Error";

export const registerController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = registerSchema.parse(req.body);

    const user = await registerService(body);

    const userId = user._id as unknown as string;

    return (await setJwtAuthCookie({ res, userId }))
      .status(HTTP_STATUS.CREATED)
      .json({
        message: "User created and login successfully",
        user,
      });
  },
);

export const loginController = asyncHandler(
  //yo chai passed as a controller
  async (req: Request, res: Response) => {
    const body = loginSchema.parse(req.body);

    const user = await loginService(body);

    const userId = user._id as unknown as string;

    return (await setJwtAuthCookie({ res, userId }))
      .status(HTTP_STATUS.OK)
      .json({
        message: "User logged in successfully",
        user,
      });
  },
);
export const logoutController = asyncHandler(
  async (req: Request, res: Response) => {
    return await clearJwtAuthCookie(res).status(HTTP_STATUS.OK).json({
      message: "User logged out successfully",
    });
  },
);

export const authStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    return res.status(HTTP_STATUS.OK).json({
      message: "User fetched successfully",
      user,
    });
  },
);

export const changePasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const { newPassword } = changePasswordSchema.parse(req.body); // Remove email from body
    const userId = req.user?._id?.toString();

    if (!userId) {
      throw new UnauthorizedException("User not authenticated");
    }

    await changePasswordService(userId, newPassword);

    return res.status(HTTP_STATUS.OK).json({
      message: "Password changed successfully",
    });
  },
);