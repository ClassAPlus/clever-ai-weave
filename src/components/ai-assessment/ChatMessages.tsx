
import { Message } from "./types";
import { ChatMessage } from "./ChatMessage";
import { LoadingIndicator } from "./LoadingIndicator";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export const ChatMessages = ({ messages, isLoading }: ChatMessagesProps) => {
  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg mb-4">
      {messages.map((message, index) => (
        <ChatMessage key={index} message={message} index={index} />
      ))}
      {isLoading && <LoadingIndicator />}
    </div>
  );
};
