import { Router } from "express";
import {
  createChatController,
  getUserChatController,
  getSingleChatController,
  resetUnreadCountController, 
} from "../controllers/chats.controller";
import { sendMessageController } from "../controllers/message.controller";
import { passportAuthenticateJwt } from "../config/passport.config";

const chatRoutes = Router()
  .use(passportAuthenticateJwt)
  .post("/create", createChatController)
  .post("/message/send", sendMessageController)
  .get("/all", getUserChatController)
  .get("/:id", getSingleChatController)
  .post("/:id/reset-unread", resetUnreadCountController); 

export default chatRoutes;
