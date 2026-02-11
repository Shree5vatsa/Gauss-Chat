import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Request, Response } from "express";
import { UnauthorizedException } from "../utils/app-Error";
import { chatIdSchema, createChatSchema } from "../validators/chat.validator";
import { createChatService, getUserChatService, getSingleChatService } from "../services/chat.service";
import { HTTP_STATUS } from "../config/http.config";

export const createChatController = asyncHandler(
    async(req:Request,res:Response)=>{
        const userId = req.user?._id;
        if (!userId) {
            throw new UnauthorizedException("User not authenticated");
        }
        const body = createChatSchema.parse(req.body);
        
        const chat = await createChatService(userId, body);

        return res.status(HTTP_STATUS.CREATED).json({
            message: "Chat created successfully",
            chat,
        });

    }
)


export const getUserChatController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?._id;
        if (!userId) {
            throw new UnauthorizedException("User not authenticated");
        }
        const chats = await getUserChatService(userId);

        return res.status(HTTP_STATUS.OK).json({
            message: "User Chats fetched successfully",
            chats,
        })
    }
)

export const getSingleChatController = asyncHandler(
    async (req: Request, res: Response)=>{
        const userId = req.user?._id;
        
        const { id } = chatIdSchema.parse(req.params);
        
        const {chat, messages} = await getSingleChatService(id, userId);
        
        return res.status(HTTP_STATUS.OK).json({
            message: "Chat fetched successfully",
            chat,
            messages,
        });
    }
)