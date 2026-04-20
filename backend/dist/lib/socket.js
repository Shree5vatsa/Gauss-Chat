"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitUserAccountDeleted = exports.emitLastMessageToParticipants = exports.emitNewMessageTochatRoom = exports.emitNewChatToParticipants = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const env_config_1 = require("../config/env.config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const chat_service_1 = require("../services/chat.service");
const chat_model_1 = __importDefault(require("../models/chat.model"));
let io = null;
const onlineUsers = new Map();
const initializeSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: env_config_1.Env.FRONTEND_ORIGIN,
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    io.use(async (socket, next) => {
        try {
            const rawCookie = socket.handshake.headers.cookie;
            if (!rawCookie)
                return next(new Error("Unauthorized"));
            const token = rawCookie?.split("=")?.[1]?.trim();
            if (!token)
                return next(new Error("Unauthorized"));
            const decodedToken = jsonwebtoken_1.default.verify(token, env_config_1.Env.JWT_SECRET);
            if (!decodedToken)
                return next(new Error("Unauthorized"));
            socket.userId = decodedToken.userId;
            next();
        }
        catch (error) {
            next(new Error("Internal server Error"));
        }
    });
    io.on("connection", async (socket) => {
        if (!socket.userId) {
            socket.disconnect(true);
            return;
        }
        const userId = socket.userId;
        const newSocketId = socket.id;
        onlineUsers.set(userId, newSocketId);
        io?.emit("online:users", Array.from(onlineUsers.keys()));
        socket.join(`user:${userId}`);
        //JOIN ALL CHAT ROOMS FOR THIS USER ON CONNECTION
        try {
            const userChats = await chat_model_1.default.find({
                participants: { $in: [userId] },
            }).select("_id");
            for (const chat of userChats) {
                socket.join(`chat:${chat._id.toString()}`);
                console.log(`User ${userId} auto-joined room chat:${chat._id}`);
            }
        }
        catch (error) {
            console.error("Error joining chat rooms:", error);
        }
        socket.on("chat:join", async (chatId, callback) => {
            try {
                await (0, chat_service_1.validateChatParticipant)(chatId, userId);
                socket.join(`chat:${chatId}`);
                console.log(`User ${userId} manually joined room chat:${chatId}`);
                callback?.();
            }
            catch (error) {
                callback?.("Error joining chat");
            }
        });
        socket.on("chat:leave", (chatId) => {
            if (chatId) {
                socket.leave(`chat:${chatId}`);
                console.log(`User ${userId} left room chat:${chatId}`);
            }
        });
        socket.on("disconnect", () => {
            if (onlineUsers.get(userId) === newSocketId) {
                if (userId)
                    onlineUsers.delete(userId);
                io?.emit("online:users", Array.from(onlineUsers.keys()));
                console.log("Socket disconnected", { userId, newSocketId });
            }
        });
        socket.on("typing:start", (data) => {
            console.log(`User ${userId} started typing in chat ${data.chatId}`);
            socket.to(`chat:${data.chatId}`).emit("typing:start", {
                chatId: data.chatId,
                userName: data.userName,
            });
        });
        socket.on("typing:stop", (data) => {
            console.log(`User ${userId} stopped typing in chat ${data.chatId}`);
            socket.to(`chat:${data.chatId}`).emit("typing:stop", {
                chatId: data.chatId,
            });
        });
    });
};
exports.initializeSocket = initializeSocket;
function getIO() {
    if (!io)
        throw new Error("Socket not initialized");
    return io;
}
const emitNewChatToParticipants = (participantIds = [], chat) => {
    const io = getIO();
    for (const participantId of participantIds) {
        io.to(`user:${participantId}`).emit("chat:new", chat);
    }
};
exports.emitNewChatToParticipants = emitNewChatToParticipants;
const emitNewMessageTochatRoom = (senderId, chatId, message) => {
    const io = getIO();
    const senderSocketId = onlineUsers.get(senderId?.toString());
    console.log(senderId, "senderId");
    console.log(senderSocketId, "sender socketid exist");
    console.log("All online users:", Object.fromEntries(onlineUsers));
    if (senderSocketId) {
        io.to(`chat:${chatId}`).except(senderSocketId).emit("message:new", message);
    }
    else {
        io.to(`chat:${chatId}`).emit("message:new", message);
    }
};
exports.emitNewMessageTochatRoom = emitNewMessageTochatRoom;
const emitLastMessageToParticipants = (participantIds, chatId, lastMessage) => {
    const io = getIO();
    const payload = { chatId, lastMessage };
    for (const participantId of participantIds) {
        io.to(`user:${participantId}`).emit("chat:update", payload);
    }
};
exports.emitLastMessageToParticipants = emitLastMessageToParticipants;
const emitUserAccountDeleted = (recipientId, deletedUserId) => {
    const io = getIO();
    io.to(`user:${recipientId}`).emit("user:account-deleted", { deletedUserId });
};
exports.emitUserAccountDeleted = emitUserAccountDeleted;
