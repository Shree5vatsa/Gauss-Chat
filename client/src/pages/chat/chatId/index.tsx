import EmptyState from "@/components/empty-state";
import { useParams } from "react-router-dom";

const SingleChat = () => {
  const { chatId } = useParams();

  if (!chatId) {
    return <EmptyState />;
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Your actual chat component will go here */}
      <div className="h-full w-full flex justify-center items-center">
        Chat ID: {chatId}
      </div>
    </div>
  );
};

export default SingleChat;
