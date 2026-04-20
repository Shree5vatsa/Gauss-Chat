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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageService = void 0;
const chat_model_1 = __importDefault(require("../models/chat.model"));
const message_model_1 = __importDefault(require("../models/message.model"));
const app_Error_1 = require("../utils/app-Error");
const cloudinary_config_1 = __importDefault(require("../config/cloudinary.config"));
const socket_1 = require("../lib/socket");
const user_model_1 = __importDefault(require("../models/user.model"));
const sendMessageService = async (userId, body) => {
    const { chatId, content, image, replyToId } = body;
    const chat = await chat_model_1.default.findOne({
        _id: chatId,
        participants: { $in: [userId] },
    });
    if (!chat)
        throw new app_Error_1.BadRequestException("Chat not found or you are not authorized");
    if (replyToId) {
        const replyMessage = await message_model_1.default.findOne({
            _id: replyToId,
            chatId,
        });
        if (!replyMessage)
            throw new app_Error_1.BadRequestException("Reply message not found");
    }
    let imageUrl;
    if (image) {
        const uploadedImage = await cloudinary_config_1.default.uploader.upload(image);
        imageUrl = uploadedImage.secure_url;
    }
    const newMessage = await message_model_1.default.create({
        chatId,
        sender: userId,
        content,
        image: imageUrl,
        replyTo: replyToId,
    });
    await newMessage.populate([
        {
            path: "sender",
            select: "name avatar isAI",
        },
        {
            path: "replyTo",
            select: "content image sender",
            populate: {
                path: "sender",
                select: "name avatar isAI",
            },
        },
    ]);
    chat.lastMessage = newMessage._id;
    // INCREMENT UNREAD COUNT FOR ALL PARTICIPANTS EXCEPT SENDER
    const participants = chat.participants.map((p) => p.toString());
    for (const participantId of participants) {
        if (participantId !== userId) {
            const currentCount = chat.unreadCount?.get(participantId) || 0;
            chat.unreadCount?.set(participantId, currentCount + 1);
        }
    }
    await chat.save();
    //web socket
    (0, socket_1.emitNewMessageTochatRoom)(userId, chatId, newMessage);
    const allParticipantIds = chat.participants.map((id) => id.toString());
    (0, socket_1.emitLastMessageToParticipants)(allParticipantIds, chatId, newMessage);
    //HANDLE AI RESPONSE
    if (chat.isAiChat) {
        // Get the AI participant (the bot)
        const aiParticipant = await user_model_1.default.findOne({ isAI: true });
        // Check if the sender is NOT the AI (so we don't create infinite loops)
        const isSenderAI = await user_model_1.default.findById(userId).select("isAI");
        if (aiParticipant && (!isSenderAI || !isSenderAI.isAI)) {
            // Get last 5 messages for context
            const recentMessages = await message_model_1.default.find({ chatId })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("sender", "isAI");
            const conversationHistory = recentMessages.reverse().map((msg) => ({
                role: msg.sender?.isAI ? "assistant" : "user",
                content: msg.content || "",
            }));
            // Generate AI response
            const { getAIResponse } = await Promise.resolve().then(() => __importStar(require("./ai.service")));
            const aiResponseText = await getAIResponse(content || "", conversationHistory);
            // Create AI response message
            const aiMessage = await message_model_1.default.create({
                chatId,
                sender: aiParticipant._id,
                content: aiResponseText,
                replyTo: newMessage._id,
            });
            await aiMessage.populate([
                {
                    path: "sender",
                    select: "name avatar isAI",
                },
                {
                    path: "replyTo",
                    select: "content image sender",
                    populate: {
                        path: "sender",
                        select: "name avatar isAI",
                    },
                },
            ]);
            // Update lastMessage in chat
            chat.lastMessage = aiMessage._id;
            await chat.save();
            // Emit AI message
            (0, socket_1.emitNewMessageTochatRoom)(aiParticipant._id.toString(), chatId, aiMessage);
            (0, socket_1.emitLastMessageToParticipants)(allParticipantIds, chatId, aiMessage);
        }
    }
    return {
        userMessage: newMessage,
        chat,
    };
};
exports.sendMessageService = sendMessageService;
