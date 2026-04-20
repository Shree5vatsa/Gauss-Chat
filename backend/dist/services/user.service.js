"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserAccountService = exports.updateUserProfileService = exports.getUserService = exports.findByIdUserService = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const app_Error_1 = require("../utils/app-Error");
const cloudinary_config_1 = __importDefault(require("../config/cloudinary.config"));
const socket_1 = require("../lib/socket");
const findByIdUserService = async (userId) => {
    return await user_model_1.default.findById(userId);
};
exports.findByIdUserService = findByIdUserService;
const getUserService = async (userId) => {
    return await user_model_1.default
        .find({
        _id: { $ne: userId },
        isAI: { $ne: true },
    })
        .select("-password");
};
exports.getUserService = getUserService;
const updateUserProfileService = async (userId, body) => {
    const { name, avatar } = body;
    let avatarUrl = undefined;
    if (avatar && avatar.startsWith("data:image")) {
        const uploadResult = await cloudinary_config_1.default.uploader.upload(avatar, {
            folder: "avatars",
        });
        avatarUrl = uploadResult.secure_url;
    }
    const updateData = {};
    if (name)
        updateData.name = name;
    if (avatarUrl)
        updateData.avatar = avatarUrl;
    const updatedUser = await user_model_1.default.findByIdAndUpdate(userId, updateData, {
        new: true,
        select: "-password",
    });
    if (!updatedUser) {
        throw new app_Error_1.NotFoundException("User not found");
    }
    return updatedUser;
};
exports.updateUserProfileService = updateUserProfileService;
const chat_model_1 = __importDefault(require("../models/chat.model"));
const message_model_1 = __importDefault(require("../models/message.model"));
const deleteUserAccountService = async (userId) => {
    // Get all chats the user was in to notify participants
    const userChats = await chat_model_1.default.find({ participants: userId }).select("participants");
    const participantIds = new Set();
    for (const chat of userChats) {
        for (const p of chat.participants) {
            if (p.toString() !== userId) {
                participantIds.add(p.toString());
            }
        }
    }
    // Delete user
    const user = await user_model_1.default.findByIdAndDelete(userId);
    if (!user) {
        throw new app_Error_1.NotFoundException("User not found");
    }
    // Remove user from all chats
    await chat_model_1.default.updateMany({ participants: userId }, { $pull: { participants: userId } });
    // Delete empty chats
    await chat_model_1.default.deleteMany({ participants: { $size: 0 } });
    // Delete user's messages
    await message_model_1.default.deleteMany({ sender: userId });
    // Notify other users to refresh their chat list
    for (const participantId of participantIds) {
        (0, socket_1.emitUserAccountDeleted)(participantId, userId);
    }
    return user;
};
exports.deleteUserAccountService = deleteUserAccountService;
