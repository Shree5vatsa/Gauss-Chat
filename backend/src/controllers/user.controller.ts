import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Request, Response } from "express";
import { getUserService } from "../services/user.service";
import { HTTP_STATUS } from "../config/http.config";

export const getUserController = asyncHandler(
    async(req: Request,res:Response)=>{
        const userId = req.params.id;
        const users = await getUserService(userId as string);

        return res.status(HTTP_STATUS.OK).json({
            message:"Users fetched successfully",
            users,
        })
    }
)