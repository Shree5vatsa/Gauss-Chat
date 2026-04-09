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
    <aside className="fixed inset-y-0 left-0 z-50 w-16 bg-primary/85 shadow-sm">
      <div className="flex flex-col items-center justify-between h-full py-5">
        {/* Logo - Made larger */}
        <Logo
          url={PROTECTED_ROUTES.CHAT}
          imgClass="size-17" 
          textClass="text-white"
          showText={false}
        />

        {/* Avatar - Made larger */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div role="button" className="cursor-pointer">
              <AvatarWithBadge
                name={user?.name || "unKnown"}
                src={user?.avatar || ""}
                isOnline={isOnline}
                className="!bg-white"
                size="w-10 h-10" 
              />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-48 rounded-lg z-[99999]"
            align="end"
          >
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};

export default Sidebar;
