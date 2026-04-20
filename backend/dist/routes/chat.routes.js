"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chats_controller_1 = require("../controllers/chats.controller");
const message_controller_1 = require("../controllers/message.controller");
const passport_config_1 = require("../config/passport.config");
const chatRoutes = (0, express_1.Router)()
    .use(passport_config_1.passportAuthenticateJwt)
    .post("/create", chats_controller_1.createChatController)
    .post("/message/send", message_controller_1.sendMessageController)
    .get("/all", chats_controller_1.getUserChatController)
    .get("/:id", chats_controller_1.getSingleChatController)
    .post("/:id/reset-unread", chats_controller_1.resetUnreadCountController);
exports.default = chatRoutes;
