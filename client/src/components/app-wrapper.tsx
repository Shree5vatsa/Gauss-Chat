import React from "react";
import Sidebar from "./sideBar";

interface Props {
  children: React.ReactNode;
  onToggleChatList?: () => void;
}

const AppWrapper = ({ children, onToggleChatList }: Props) => {
  return (
    <div className="h-full flex">
      <Sidebar onToggleChatList={onToggleChatList} />
      <main className="flex-1 ml-16 h-full overflow-auto">{children}</main>
    </div>
  );
};

export default AppWrapper;
