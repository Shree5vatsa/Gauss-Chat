import { HTTP_STATUS } from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { registerService } from "../services/auth.service";
import { setJwtAuthCookie } from "../utils/cookie";
import { registerSchema } from "../validators/auth.validator";
import { Request, Response } from "express"; // Import both from express

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
