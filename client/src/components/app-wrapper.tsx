import React from "react";
import Sidebar from "./sideBar";

interface Props {
  children: React.ReactNode;
}

const AppWrapper = ({ children }: Props) => {
  return (
    <div className="h-full flex">
      <Sidebar />
      <main className="flex-1 lg:ml-16 h-full overflow-auto">{children}</main>
    </div>
  );
};

export default AppWrapper;
