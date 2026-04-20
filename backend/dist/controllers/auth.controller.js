"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordController = exports.authStatusController = exports.logoutController = exports.loginController = exports.registerController = void 0;
const http_config_1 = require("../config/http.config");
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const auth_service_1 = require("../services/auth.service");
const cookie_1 = require("../utils/cookie");
const auth_validator_1 = require("../validators/auth.validator");
const auth_service_2 = require("../services/auth.service");
const auth_validator_2 = require("../validators/auth.validator");
const app_Error_1 = require("../utils/app-Error");
exports.registerController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const body = auth_validator_1.registerSchema.parse(req.body);
    const user = await (0, auth_service_1.registerService)(body);
    const userId = user._id;
    return (await (0, cookie_1.setJwtAuthCookie)({ res, userId }))
        .status(http_config_1.HTTP_STATUS.CREATED)
        .json({
        message: "User created and login successfully",
        user,
    });
});
exports.loginController = (0, asyncHandler_middleware_1.asyncHandler)(
//yo chai passed as a controller
async (req, res) => {
    const body = auth_validator_1.loginSchema.parse(req.body);
    const user = await (0, auth_service_1.loginService)(body);
    const userId = user._id;
    return (await (0, cookie_1.setJwtAuthCookie)({ res, userId }))
        .status(http_config_1.HTTP_STATUS.OK)
        .json({
        message: "User logged in successfully",
        user,
    });
});
exports.logoutController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    return await (0, cookie_1.clearJwtAuthCookie)(res).status(http_config_1.HTTP_STATUS.OK).json({
        message: "User logged out successfully",
    });
});
exports.authStatusController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    return res.status(http_config_1.HTTP_STATUS.OK).json({
        message: "User fetched successfully",
        user,
    });
});
exports.changePasswordController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { newPassword } = auth_validator_2.changePasswordSchema.parse(req.body); // Remove email from body
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new app_Error_1.UnauthorizedException("User not authenticated");
    }
    await (0, auth_service_2.changePasswordService)(userId, newPassword);
    return res.status(http_config_1.HTTP_STATUS.OK).json({
        message: "Password changed successfully",
    });
});
