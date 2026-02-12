import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Request, Response } from "express";
import { sendMessageSchema } from "../validators/message.validator";
import { HTTP_STATUS } from "../config/http.config";
import { sendMessageService } from "../services/message.service";


export const sendMessageController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?._id;
        const body = sendMessageSchema.parse(req.body);

        const result = await sendMessageService(userId, body);

        return res.status(HTTP_STATUS.OK).json({
            message: "Message sent successfully",
            ...result,
        });
    }
);