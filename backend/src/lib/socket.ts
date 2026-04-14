import { Server as HTTPServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { Env } from "../config/env.config";
import jwt from "jsonwebtoken";
import { validateChatParticipant } from "../services/chat.service";
import ChatModel from "../models/chat.model"; // ✅ ADD THIS

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let io: SocketServer | null = null;
const onlineUsers = new Map<string, string>();

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: Env.FRONTEND_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;
      if (!rawCookie) return next(new Error("Unauthorized"));

      const token = rawCookie?.split("=")?.[1]?.trim();
      if (!token) return next(new Error("Unauthorized"));

      const decodedToken = jwt.verify(token, Env.JWT_SECRET) as {
        userId: string;
      };
      if (!decodedToken) return next(new Error("Unauthorized"));

      socket.userId = decodedToken.userId;
      next();
    } catch (error) {
      next(new Error("Internal server Error"));
    }
  });

  io.on("connection", async (socket: AuthenticatedSocket) => {
    if (!socket.userId) {
      socket.disconnect(true);
      return;
    }
    const userId = socket.userId;
    const newSocketId = socket.id;

    onlineUsers.set(userId, newSocketId);
    io?.emit("online:users", Array.from(onlineUsers.keys()));
    socket.join(`user:${userId}`);

    // ✅ JOIN ALL CHAT ROOMS FOR THIS USER ON CONNECTION
    try {
      const userChats = await ChatModel.find({
        participants: { $in: [userId] },
      }).select("_id");

      for (const chat of userChats) {
        socket.join(`chat:${chat._id.toString()}`);
        console.log(`User ${userId} auto-joined room chat:${chat._id}`);
      }
    } catch (error) {
      console.error("Error joining chat rooms:", error);
    }

    socket.on(
      "chat:join",
      async (chatId: string, callback?: (err?: string) => void) => {
        try {
          await validateChatParticipant(chatId, userId);
          socket.join(`chat:${chatId}`);
          console.log(`User ${userId} manually joined room chat:${chatId}`);
          callback?.();
        } catch (error) {
          callback?.("Error joining chat");
        }
      },
    );

    socket.on("chat:leave", (chatId: string) => {
      if (chatId) {
        socket.leave(`chat:${chatId}`);
        console.log(`User ${userId} left room chat:${chatId}`);
      }
    });

    socket.on("disconnect", () => {
      if (onlineUsers.get(userId) === newSocketId) {
        if (userId) onlineUsers.delete(userId);
        io?.emit("online:users", Array.from(onlineUsers.keys()));
        console.log("Socket disconnected", { userId, newSocketId });
      }
    });

    socket.on("typing:start", (data: { chatId: string; userName: string }) => {
      console.log(`User ${userId} started typing in chat ${data.chatId}`);
      socket.to(`chat:${data.chatId}`).emit("typing:start", {
        chatId: data.chatId,
        userName: data.userName,
      });
    });

    socket.on("typing:stop", (data: { chatId: string }) => {
      console.log(`User ${userId} stopped typing in chat ${data.chatId}`);
      socket.to(`chat:${data.chatId}`).emit("typing:stop", {
        chatId: data.chatId,
      });
    });
  });
};

function getIO() {
  if (!io) throw new Error("Socket not initialized");
  return io;
}

export const emitNewChatToParticipants = (
  participantIds: string[] = [],
  chat: any,
) => {
  const io = getIO();
  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:new", chat);
  }
};

export const emitNewMessageTochatRoom = (
  senderId: string,
  chatId: string,
  message: any,
) => {
  const io = getIO();
  const senderSocketId = onlineUsers.get(senderId?.toString());

  console.log(senderId, "senderId");
  console.log(senderSocketId, "sender socketid exist");
  console.log("All online users:", Object.fromEntries(onlineUsers));

  if (senderSocketId) {
    io.to(`chat:${chatId}`).except(senderSocketId).emit("message:new", message);
  } else {
    io.to(`chat:${chatId}`).emit("message:new", message);
  }
};

export const emitLastMessageToParticipants = (
  participantIds: string[],
  chatId: string,
  lastMessage: any,
) => {
  const io = getIO();
  const payload = { chatId, lastMessage };

  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:update", payload);
  }
};
export const emitUserAccountDeleted = (
  recipientId: string,
  deletedUserId: string,
) => {
  const io = getIO();
  io.to(`user:${recipientId}`).emit("user:account-deleted", { deletedUserId });
};