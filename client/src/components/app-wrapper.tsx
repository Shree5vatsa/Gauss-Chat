import React from "react";
import Sidebar from "./sideBar";

interface Props {
  children: React.ReactNode;
}

const AppWrapper = ({ children }: Props) => {
    return <div className = "h-full">
      {/* Toolbar */}
      <Sidebar />
        <main className="lg:pl-10 h-full" >{children}</main>
  </div>;
};

export default AppWrapper;
