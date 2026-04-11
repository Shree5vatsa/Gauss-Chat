import { Menu } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface HamburgerButtonProps {
  onClick: () => void;
  className?: string;
}

const HamburgerButton = ({ onClick, className }: HamburgerButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "rounded-full hover:bg-primary-foreground/10 transition-all duration-300",
        className,
      )}
      title="Toggle chat list"
    >
      <Menu className="h-5 w-5 text-primary-foreground" />
    </Button>
  );
};

export default HamburgerButton;
