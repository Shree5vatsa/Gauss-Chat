import mongoose, { Document, Schema } from "mongoose";

export interface ChatDocument extends Document {
  participants: mongoose.Types.ObjectId[];
  isGroup: boolean;
  isAiChat: boolean;
  groupName?: string;
  admin?: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId | null;
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<ChatDocument>(
  {
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      required: true,
      validate: {
        validator: function (value: mongoose.Types.ObjectId[]) {
          return value.length >= 2;
        },
        message: "Chat must have at least two participants",
      },
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    isAiChat: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      trim: true,
      required: function (this: ChatDocument) {
        return this.isGroup;
      },
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function (this: ChatDocument) {
        return this.isGroup;
      },
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true },
);

chatSchema.index({ participants: 1, updatedAt: -1 });

const ChatModel = mongoose.model<ChatDocument>("Chat", chatSchema);

export default ChatModel;
