import Logo from "./logo";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";

interface Props {
  title?: string;
  description?: string;
}

const EmptyState = ({
  title = "No chat selected",
  description = "Pick a chat or start a new one...",
}: Props) => {
  return (
    <Empty className="w-full h-full flex-1 flex items-center justify-center bg-muted/20">
      <EmptyHeader className="flex flex-col items-center justify-center text-center">
        <EmptyMedia
          variant="icon"
          className="mb-4 !bg-transparent !shadow-none"
        >
          <Logo
            showText={false}
            imgClass="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36"
          />
        </EmptyMedia>
        <EmptyTitle className="text-lg font-semibold">{title}</EmptyTitle>
        <EmptyDescription className="text-sm text-muted-foreground mt-1">
          {description}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};

export default EmptyState;
