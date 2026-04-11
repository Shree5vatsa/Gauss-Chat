import AppWrapper from "@/components/app-wrapper";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import ChatList from "@/components/chat/chat-list";
import { useResizablePanel } from "@/hooks/useResizablePanel";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [maxWidth, setMaxWidth] = useState(600);
  const [isChatListVisible, setIsChatListVisible] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Detect small screen (below 768px)
  useEffect(() => {
    const checkScreenSize = () => {
      const small = window.innerWidth < 768;
      setIsSmallScreen(small);
      if (small) {
        setIsChatListVisible(true);
      }
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Calculate half of screen width for desktop resize
  useEffect(() => {
    const updateMaxWidth = () => {
      const halfScreen = Math.floor(window.innerWidth / 2);
      setMaxWidth(halfScreen);
    };
    updateMaxWidth();
    window.addEventListener("resize", updateMaxWidth);
    return () => window.removeEventListener("resize", updateMaxWidth);
  }, []);

  const { width, isResizing, startResizing } = useResizablePanel({
    minWidth: 280,
    maxWidth: maxWidth,
    defaultWidth: Math.min(360, maxWidth),
    storageKey: "chat-list-width",
  });

  const toggleChatList = () => {
    setIsChatListVisible(!isChatListVisible);
  };

  const handleChatSelect = (chatId: string) => {
    if (isSmallScreen) {
      setIsChatListVisible(false);
    }
    navigate(`/chat/${chatId}`);
  };

  // Auto-hide chat list on small screens when navigating to a chat
  useEffect(() => {
    if (isSmallScreen && location.pathname.includes("/chat/")) {
      setIsChatListVisible(false);
    }
  }, [location, isSmallScreen]);

  return (
    <AppWrapper onToggleChatList={toggleChatList}>
      <div className="h-screen flex flex-row overflow-hidden relative">
        {/* Theme toggle button */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Chat List */}
        {isChatListVisible && (
          <div
            className={cn(
              "border-r border-border bg-sidebar h-full",
              // Medium/Large screens (>= 768px) - normal layout with resize
              !isSmallScreen && "relative",
              // Small screens (< 768px) - overlay
              isSmallScreen &&
                "fixed top-0 bottom-0 z-[99] w-[calc(100%-64px)]",
            )}
            style={!isSmallScreen ? { width: `${width}px` } : {}}
          >
            <ChatList onChatSelect={handleChatSelect} />

            {/* Resize Handle - Only on medium/large screens (NOT small) */}
            {!isSmallScreen && (
              <div
                className={cn(
                  "absolute top-0 -right-1 w-1.5 h-full cursor-ew-resize z-50",
                  "hover:bg-primary/50 transition-colors",
                  isResizing && "bg-primary",
                )}
                onMouseDown={startResizing}
              />
            )}
          </div>
        )}

        {/* Main Chat Area - Hidden on small screens when chat list is visible */}
        <div
          className={cn(
            "flex-1 flex flex-col bg-background min-w-0 h-full transition-all duration-300",
            isSmallScreen && isChatListVisible && "hidden",
          )}
        >
          <Outlet />
        </div>
      </div>
    </AppWrapper>
  );
};

export default AppLayout;
