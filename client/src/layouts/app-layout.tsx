import AppWrapper from "@/components/app-wrapper";
import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import ChatList from "@/components/chat/chat-list";
import { useResizablePanel } from "@/hooks/useResizablePanel";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const AppLayout = () => {
  const [maxWidth, setMaxWidth] = useState(600);

  // Calculate half of screen width
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
    maxWidth: maxWidth, // Dynamic half screen
    defaultWidth: Math.min(360, maxWidth),
    storageKey: "chat-list-width",
  });

  return (
    <AppWrapper>
      <div className="h-screen flex flex-row overflow-hidden">
        {/* Theme toggle button */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Chat List - Resizable */}
        <div
          className="hidden lg:block border-r border-border bg-sidebar relative h-full"
          style={{ width: `${width}px` }}
        >
          <ChatList />

          {/* Resize Handle */}
          <div
            className={cn(
              "absolute top-0 -right-1 w-1.5 h-full cursor-ew-resize z-50",
              "hover:bg-primary/50 transition-colors",
              isResizing && "bg-primary",
            )}
            onMouseDown={startResizing}
          />
        </div>

        {/* Main Chat Area - Takes remaining space */}
        <div className="flex-1 flex flex-col bg-background min-w-0 h-full">
          <Outlet />
        </div>
      </div>
    </AppWrapper>
  );
};

export default AppLayout;
