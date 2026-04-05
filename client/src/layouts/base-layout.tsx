import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";

const BaseLayout = () => {
  return (
    <div className="flex flex-col w-full h-auto">
      {/* Theme toggle button */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full h-full flex items-center">
        <div className="w-full mx-auto h-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default BaseLayout;
