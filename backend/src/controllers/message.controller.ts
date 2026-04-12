import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Request, Response } from "express";
import { sendMessageSchema } from "../validators/message.validator";
import { HTTP_STATUS } from "../config/http.config";
import { sendMessageService } from "../services/message.service";
import {
  emitNewMessageTochatRoom,
  emitLastMessageToParticipants,
} from "../lib/socket";

export const sendMessageController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id?.toString();
    const body = sendMessageSchema.parse(req.body);

    const { userMessage, chat } = await sendMessageService(userId, body);

    // Get participant IDs for last message update
    const participantIds = chat.participants.map((p: any) => p._id?.toString());

    // Emit message to all users in the chat room (except sender)
    emitNewMessageTochatRoom(userId, body.chatId, userMessage);

    // Emit last message update to all participants
    emitLastMessageToParticipants(participantIds, body.chatId, userMessage);

    return res.status(HTTP_STATUS.OK).json({
      message: "Message sent successfully",
      userMessage,
    });
  },
);
