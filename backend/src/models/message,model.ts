import mongoose, { Document, Schema } from "mongoose";

export interface MessageDocument extends Document{
    chatId: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    content?: string;
    image?: string;
    replyTo?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<MessageDocument>({
    chatId: {
        type: Schema.Types.ObjectId,
        ref: "Chat",
        required: true,
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
        trim: true,
    },
    image: {
        type: String,
    },
    replyTo: {
        type: Schema.Types.ObjectId,
        ref: "Message",
        default: null,
    }
},
    { timestamps: true }
);

//ensure that message has at least text or image
messageSchema.pre("validate", function (next) {
    if (!this.content && !this.image) {
        next(new Error("Message must have at least text or image"));
    }
    next();
});


messageSchema.index({ chatId: 1, createdAt: 1 });

const MessageModel = mongoose.model<MessageDocument>("Message", messageSchema);

export default MessageModel;