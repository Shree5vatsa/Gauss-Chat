import { Router } from "express";


import { createChatController, getSingleChatController, getUserChatController } from "../controllers/chats.controller";
import { sendMessageController } from "../controllers/message.controller";
import { passportAuthenticateJwt } from "../config/passport.config";

const chatRoutes = Router().use(passportAuthenticateJwt)

    .post("/create", createChatController)
    .post("/message/send", sendMessageController)
    .post("message/get", getSingleChatController)
    .get("/all", getUserChatController)
    .get("/:id", getSingleChatController);


export default chatRoutes;
