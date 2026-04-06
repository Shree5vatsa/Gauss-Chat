import { useAuth } from "@/hooks/useAuth";
import { isUserOnline } from "@/lib/helper";
import Logo from "./logo";
import { PROTECTED_ROUTES } from '@/routes/routes';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from './ui/drop-down-menu';
import AvatarWithBadge from "./avatarWithBadge";

const Sidebar = () => {

    const { user, logout } = useAuth();

    const isOnline = isUserOnline(user?._id);
    
    return (
      <aside
        className="
  top-0 fixed inset-y-0
  w-11 left-0 z-[9999]
  h-svh bg-primary/85 shadow-sm"
      >
        <div
          className="
       w-full h-full px-1 pt-1 pb-6 flex flex-col
       items-center justify-between"
        >
          <Logo
            url={PROTECTED_ROUTES.CHAT}
            imgClass="size-7"
            textClass="text-white"
            showText={false}
          />

          <div
            className="
         flex flex-col items-center gap-3
        "
          >
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div role="button">
                  {/* {Avatar} */}
                  <AvatarWithBadge
                    name={user?.name || "unKnown"}
                    src={user?.avatar || ""}
                    isOnline={isOnline}
                    className="!bg-white"
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
        </div>
      </aside>
    );
}

export default Sidebar;