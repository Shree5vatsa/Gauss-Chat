"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.sendMessageSchema = zod_1.default.object({
    chatId: zod_1.default.string().trim().min(1),
    content: zod_1.default.string().trim().optional(),
    image: zod_1.default.string().trim().optional(),
    replyToId: zod_1.default.string().trim().optional(),
})
    .refine((data) => data.content || data.image, {
    message: "Message must have at least text or image",
    path: ["content", "image"],
});
