import { ErrorRequestHandler } from "express";
import { HTTP_STATUS } from "../config/http.config";



export const errorHandler: ErrorRequestHandler = (
    error,
    req,
    res,
    next
): any => {
    console.log(`Error occured: ${req.path}`, error);

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal Server Error",
        error: error?.message || "Sorry, something went wrong",
    });
};