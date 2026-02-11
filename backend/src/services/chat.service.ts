import { userInfo } from "os";
import ChatModel from "../models/chat.model";
import userModel from "../models/user.model";
import { BadRequestException, NotFoundException } from "../utils/app-Error";
import MessageModel from "../models/message,model";



export const createChatService = async(
    userId: string,
    body: {
        participantId?: string;
        isGroup?: boolean;
        participants?: string[];
        groupName?: string;
        groupAvatar?: string;
        //careful
    }
) => {
    const { participantId, isGroup, participants, groupName, groupAvatar } = body;

    let chat;
    let allParticipantIds: string[] = [];
    
    //yedi group chat ho bhane 
    if (isGroup && participants?.length && groupName) {
        allParticipantIds = [userId, ...participants];

        chat = await ChatModel.create({
            participants: allParticipantIds,
            isGroup: true,
            groupName,
            createdBy: userId,
            groupAvatar,
        });
    }
    //yedi individual chat ho bhane
    else if (participantId) {
        const otherUser = await userModel.findById(participantId);
        if (!otherUser) {
            throw new NotFoundException("User not found");
        }
        allParticipantIds = [userId, participantId];

        const existingChat = await ChatModel.findOne({
            participants: {
                $all: allParticipantIds,
                $size: 2,
            }
        }).populate("participants", "name avatar");
        
        if (existingChat) return existingChat;
        
        chat = await ChatModel.create({
            participants: allParticipantIds,
            isGroup: false,
            createdBy: userId,
        });
    }
    return chat;
}

export const getUserChatService = async (
    userId: string,
) => {
    const chats = await ChatModel.find({
        participants: { $in: [userId] },
    })
        .populate("participants", "name avatar")
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: "name avatar"
            }
        }).sort({ updatedAt: -1 });
    
    return chats;
    //yesto array bancha
    // [
    //   {
    //     _id: "...",
    //     participants: [{ name, avatar }, ...],
    //     lastMessage: {
    //       text: "...",
    //       sender: { name, avatar }
    //     },
    //     updatedAt: "2026-01-10T..."
    //   },
    //   ...
    // ]
};

export const getSingleChatService = async (chatId: string, userId: string) => {
    const chat = await ChatModel.findOne({
        _id: chatId,
        participants: {
            $in: [userId],
        },
    }).populate("participants", "name avatar");

    if (!chat) throw new BadRequestException("Chat not found or you are not authorized");
    
    const messages = await MessageModel.find({ chatId })
        .populate("sender", "name avatar")
        .populate(
            {
                path: "replyTo",
                select: "Content Image Sender",
                populate: {
                    path: "sender",
                    select: "name avatar",
                },
            }
        ).sort({ createdAt: 1 });

    return {
        chat,
        messages,
    };
}

