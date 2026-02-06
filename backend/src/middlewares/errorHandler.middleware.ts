import { ErrorRequestHandler } from "express";
import { HTTP_STATUS } from "../config/http.config";
import { AppError } from "../utils/app-Error";



export const errorHandler: ErrorRequestHandler = (
    error,
    req,
    res,
    next
): any => {
    console.log(`Error occured: ${req.path}`, error);

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            errorCode: error.errorCode, 
        })
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal Server Error",
        error: error?.message || "Sorry, something went wrong",
        errorCode: error.errorCode,
    });
};