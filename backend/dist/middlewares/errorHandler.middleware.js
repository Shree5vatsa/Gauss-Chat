"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const http_config_1 = require("../config/http.config");
const app_Error_1 = require("../utils/app-Error");
const errorHandler = (error, req, res, next) => {
    console.log(`Error occured: ${req.path}`, error);
    if (error instanceof app_Error_1.AppError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            errorCode: error.errorCode,
        });
    }
    return res.status(http_config_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal Server Error",
        error: error?.message || "Sorry, something went wrong",
        errorCode: error.errorCode,
    });
};
exports.errorHandler = errorHandler;
