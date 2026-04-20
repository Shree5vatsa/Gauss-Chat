import { getOtherUserAndGroup } from "@/lib/helper";
import { PROTECTED_ROUTES } from "@/routes/routes";
import type { ChatType } from "@/types/chat.types";
import { ArrowLeft, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AvatarWithBadge from "../avatarWithBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { useState } from "react";
import { format } from "date-fns";

interface Props {
  chat: ChatType;
  currentUserId: string | null;
}

const ChatHeader = ({ chat, currentUserId }: Props) => {
  const navigate = useNavigate();

  // Get all data from helper
  const { name, subheading, avatar, isOnline, isGroup, isAI } =
    getOtherUserAndGroup(chat, currentUserId);

  console.log("ChatHeader Debug:", { isAI, name, avatar, chatId: chat._id });

  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Get all participant names (including current user)
  const participantNames = chat.participants.map((p) => p.name).join(", ");

  return (
    <>
      <div
        className="sticky top-0
        flex items-center justify-between
        border-b border-border
        bg-card/95 backdrop-blur-sm
        px-4 py-2 z-50
      "
      >
        {/* Left Section: Back Button + Avatar + Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(PROTECTED_ROUTES.CHAT)}
            className="lg:hidden p-1 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>

          <AvatarWithBadge
            name={name}
            src={avatar}
            isGroup={isGroup}
            isOnline={isOnline}
            isAI={isAI}
            size="w-10 h-10"
          />

          <div>
            <h5 className="font-semibold text-base line-clamp-1">{name}</h5>
            <p className="text-xs text-muted-foreground">{subheading}</p>
          </div>
        </div>

        {/* Right Section: Info Button */}
        <button
          onClick={() => setIsInfoOpen(true)}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <Info className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Chat Info Modal */}
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chat Info</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Chat Name/Group Name */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Name
              </h4>
              <p className="text-base">{name}</p>
            </div>

            {/* Participants */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                {isGroup ? "Members" : "Participant"}
              </h4>
              <p className="text-base">
                {isAI ? "You & AI Assistant" : participantNames}
              </p>
            </div>

            {/* Chat Type */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Type
              </h4>
              <p className="text-base">
                {isAI ? "AI Chat" : isGroup ? "Group Chat" : "Single Chat"}
              </p>
            </div>

            {/* Created Date */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Created
              </h4>
              <p className="text-base">
                {format(new Date(chat.createdAt), "PPP")}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setIsInfoOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatHeader;
