import { Search } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import NewChatPopover from "./newchat-popover";
import { cn } from "@/lib/utils";

// ============================================
// Filter Chip Component (Modular, self-contained)
// ============================================
interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}

const FilterChip = ({ active, onClick, children, count }: FilterChipProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-medium",
        "transition-all duration-200 ease-in-out",
        "flex items-center gap-1.5 whitespace-nowrap",
        "cursor-pointer select-none",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted hover:bg-muted/80 text-muted-foreground",
      )}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
            active ? "bg-primary-foreground/20" : "bg-muted-foreground/20",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
};

// ============================================
// Main ChatListHeader Component
// ============================================
interface ChatListHeaderProps {
  onSearch: (val: string) => void;
  // Filter props
  filterType: "all" | "individuals" | "groups" | "unread";
  onFilterChange: (filter: "all" | "individuals" | "groups" | "unread") => void;
  // Count props for badges
  totalCount: number;
  individualsCount: number;
  groupsCount: number;
  unreadCount: number;
}

const ChatListHeader = ({
  onSearch,
  filterType,
  onFilterChange,
  totalCount,
  individualsCount,
  groupsCount,
  unreadCount,
}: ChatListHeaderProps) => {
  return (
    <div className="px-3 py-3 border-b border-border">
      {/* Header with Title and New Chat Button */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Chats</h1>
        <NewChatPopover />
      </div>

      {/* Search Bar */}
      <div className="mb-3">
        <InputGroup className="bg-background text-sm">
          <InputGroupInput
            placeholder="Search chats..."
            onChange={(e) => onSearch(e.target.value)}
          />
          <InputGroupAddon>
            <Search className="h-4 w-4 text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* Filter Chips Section */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <FilterChip
          active={filterType === "all"}
          onClick={() => onFilterChange("all")}
          count={totalCount}
        >
          💬 All
        </FilterChip>

        <FilterChip
          active={filterType === "individuals"}
          onClick={() => onFilterChange("individuals")}
          count={individualsCount}
        >
          👤 Individuals
        </FilterChip>

        <FilterChip
          active={filterType === "groups"}
          onClick={() => onFilterChange("groups")}
          count={groupsCount}
        >
          👥 Groups
        </FilterChip>

        <FilterChip
          active={filterType === "unread"}
          onClick={() => onFilterChange("unread")}
          count={unreadCount}
        >
          🔴 Unread
        </FilterChip>
      </div>
    </div>
  );
};

export default ChatListHeader;
