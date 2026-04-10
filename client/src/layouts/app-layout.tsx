import AppWrapper from "@/components/app-wrapper";
import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import ChatList from "@/components/chat/chat-list";

const AppLayout = () => {
  return (
    <AppWrapper>
      <div className="h-full flex">
        {/* Sidebar space already handled */}

        {/* Theme toggle button */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Chat List */}
        <div className="hidden lg:block w-[360px] border-r border-border bg-sidebar">
          <ChatList />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-background">
          <Outlet />
        </div>
      </div>
    </AppWrapper>
  );
};

export default AppLayout;
