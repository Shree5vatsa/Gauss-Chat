"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccountController = exports.updateProfileController = exports.getUserController = void 0;
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const user_service_1 = require("../services/user.service");
const http_config_1 = require("../config/http.config");
exports.getUserController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.params.id;
    const users = await (0, user_service_1.getUserService)(userId);
    return res.status(http_config_1.HTTP_STATUS.OK).json({
        message: "Users fetched successfully",
        users,
    });
});
exports.updateProfileController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id?.toString();
    const { name, avatar } = req.body;
    const updatedUser = await (0, user_service_1.updateUserProfileService)(userId, {
        name,
        avatar,
    });
    return res.status(http_config_1.HTTP_STATUS.OK).json({
        message: "Profile updated successfully",
        user: updatedUser,
    });
});
exports.deleteAccountController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id?.toString();
    await (0, user_service_1.deleteUserAccountService)(userId);
    return res.status(http_config_1.HTTP_STATUS.OK).json({
        message: "Account deleted successfully",
    });
});
