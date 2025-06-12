
import { Message } from "./types";
import { ChatMessage } from "./ChatMessage";
import { LoadingIndicator } from "./LoadingIndicator";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export const ChatMessages = ({ messages, isLoading }: ChatMessagesProps) => {
  return (
    <div className="flex-1 overflow-y-auto space-y-6 p-6 bg-gradient-to-b from-transparent to-gray-50/50 rounded-xl mb-4 backdrop-blur-sm relative z-10">
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,_theme(colors.purple.500)_1px,_transparent_0)] bg-[length:20px_20px]"></div>
      
      {messages.map((message, index) => (
        <ChatMessage key={index} message={message} index={index} />
      ))}
      {isLoading && <LoadingIndicator />}
    </div>
  );
};
