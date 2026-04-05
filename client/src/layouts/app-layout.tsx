import AppWrapper from "@/components/app-wrapper";
import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";

const AppLayout = () => {
  return (
    <AppWrapper>
      <div className="h-full relative">
        {/* Theme toggle button */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <Outlet />
      </div>
    </AppWrapper>
  );
};

export default AppLayout;
