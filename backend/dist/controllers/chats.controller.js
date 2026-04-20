"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAIUserExists = exports.resetUnreadCountController = exports.getSingleChatController = exports.getUserChatController = exports.createChatController = void 0;
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const app_Error_1 = require("../utils/app-Error");
const chat_validator_1 = require("../validators/chat.validator");
const chat_service_1 = require("../services/chat.service");
const http_config_1 = require("../config/http.config");
exports.createChatController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new app_Error_1.UnauthorizedException("User not authenticated");
    }
    const body = chat_validator_1.createChatSchema.parse(req.body);
    const chat = await (0, chat_service_1.createChatService)(userId, body);
    return res.status(http_config_1.HTTP_STATUS.CREATED).json({
        message: "Chat created successfully",
        chat,
    });
});
exports.getUserChatController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new app_Error_1.UnauthorizedException("User not authenticated");
    }
    const chats = await (0, chat_service_1.getUserChatService)(userId);
    return res.status(http_config_1.HTTP_STATUS.OK).json({
        message: "User Chats fetched successfully",
        chats,
    });
});
exports.getSingleChatController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id?.toString();
    if (!userId)
        throw new app_Error_1.UnauthorizedException("User not authenticated");
    const { id } = chat_validator_1.chatIdSchema.parse(req.params);
    const { chat, messages } = await (0, chat_service_1.getSingleChatService)(id, userId);
    return res.status(http_config_1.HTTP_STATUS.OK).json({
        message: "Chat fetched successfully",
        chat,
        messages,
    });
});
// Reset unread count when user opens a chat
exports.resetUnreadCountController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id?.toString();
    if (!userId)
        throw new app_Error_1.UnauthorizedException("User not authenticated");
    const { id } = chat_validator_1.chatIdSchema.parse(req.params);
    await (0, chat_service_1.resetUnreadCountService)(id, userId);
    return res.status(http_config_1.HTTP_STATUS.OK).json({
        message: "Unread count reset successfully",
    });
});
const ensureAIUserExists = async () => {
    const userModel = (await Promise.resolve().then(() => __importStar(require("../models/user.model")))).default;
    const { hashValue } = await Promise.resolve().then(() => __importStar(require("../utils/bcrypt")));
    const aiUser = await userModel.findOne({ isAI: true });
    if (!aiUser) {
        await userModel.create({
            name: "Gauss AI Assistant",
            email: "ai@gauss-chat.com",
            password: await hashValue(Math.random().toString(36)),
            isAI: true,
            avatar: null,
        });
        console.log("🤖 AI User created successfully");
    }
    else {
        console.log("🤖 AI User already exists");
    }
};
exports.ensureAIUserExists = ensureAIUserExists;
