import { useAuth } from "@/hooks/useAuth";
import { isUserOnline } from "@/lib/helper";
import Logo from "./logo";
import { PROTECTED_ROUTES } from "@/routes/routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/drop-down-menu";
import AvatarWithBadge from "./avatarWithBadge";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const isOnline = isUserOnline(user?._id);

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-16 bg-primary border-r border-border shadow-sm transition-all duration-300">
      <div className="flex flex-col items-center justify-between h-full py-5">
        {/* Top Section - Logo */}
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="relative group cursor-pointer mt-2">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-500"></div>
            <Logo
              url={PROTECTED_ROUTES.CHAT}
              imgClass="size-16 object-contain drop-shadow-sm group-hover:drop-shadow-xl group-hover:scale-105 transition-all duration-300 relative z-10"
              textClass="text-foreground"
              showText={false}
            />
          </div>
        </div>

        {/* Bottom Section - Avatar */}
        <div className="flex flex-col items-center gap-6 w-full mb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                role="button"
                className="group relative cursor-pointer outline-none"
              >
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative ring-2 ring-transparent group-hover:ring-primary/40 group-hover:ring-offset-2 group-hover:ring-offset-background rounded-full transition-all duration-300">
                  <AvatarWithBadge
                    name={user?.name || "unKnown"}
                    src={user?.avatar || ""}
                    isOnline={isOnline}
                    className="shadow-sm border border-border/40 group-hover:border-primary/50 transition-colors !bg-background"
                    size="w-10 h-10"
                  />
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 rounded-xl border border-border/50 shadow-2xl bg-background/95 backdrop-blur-xl z-[99999] p-1.5"
              align="end"
              side="right"
              sideOffset={18}
            >
              <DropdownMenuLabel className="font-medium text-muted-foreground text-xs uppercase tracking-wider px-2 py-1.5">
                Account Settings
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={logout}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-md transition-colors mt-1"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
