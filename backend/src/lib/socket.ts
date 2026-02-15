import {Server as HTTPServer } from "http";
import {Server as SocketServer,Socket} from "socket.io";
import { Env } from "../config/env.config";
import jwt from "jsonwebtoken";
import { validateChatParticipant } from "../services/chat.service";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let io: SocketServer | null = null;

const onlineUsers = new Map<string,string>();

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: Env.FRONTEND_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  //Runs on WebSocket connection attempts.
    io.use(async (socket:AuthenticatedSocket, next) => {
        try {
            const rawCookie = socket.handshake.headers.cookie;
            
            if (!rawCookie) return next(new Error("Unauthorized"));

            const token = rawCookie?.split("=")?.[1]?.trim();
            if (!token) return next(new Error("Unauthorized"));

            const decodedToken = jwt.verify(token, Env.JWT_SECRET) as {
                userId: string;
            };

            if(!decodedToken)return next(new Error("Unauthorized"));

            socket.userId = decodedToken.userId;
            next();
        } catch (error) {
            next(new Error("Internal server Error"));
      }
    });
    
    //event listener
    io.on("connection", (socket: AuthenticatedSocket) => {
       
        if (!socket.userId) {
            socket.disconnect(true);
            return;
        }
        const userId = socket.userId;
        const newSocketId = socket.id;

        //register socket for user
        onlineUsers.set(userId, newSocketId);
        
        //broadcast online users to all socket
        io?.emit("online:users", Array.from(onlineUsers.keys()));

        //create personal room for user
        socket.join(`user:${userId}`);

        socket.on(
          "chat:join",
          async (chatId: string, callback?: (err?: string) => void) => {
            try {
              await validateChatParticipant(chatId, userId);
              socket.join(`chat:${chatId}`);
              console.log(`User ${userId} join room chat:${chatId}`);

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

                console.log("Socket disconnected",{userId,newSocketId});
           } 
        });

    });
}; 