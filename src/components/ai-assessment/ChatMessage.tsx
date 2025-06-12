
import { Bot, User } from "lucide-react";
import { Message } from "./types";

interface ChatMessageProps {
  message: Message;
  index: number;
}

export const ChatMessage = ({ message, index }: ChatMessageProps) => {
  return (
    <div
      key={index}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`flex items-start space-x-2 max-w-[80%] ${
          message.role === 'user'
            ? 'flex-row-reverse space-x-reverse'
            : 'flex-row'
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            message.role === 'user'
              ? 'bg-purple-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
        </div>
        <div
          className={`p-3 rounded-lg ${
            message.role === 'user'
              ? 'bg-purple-600 text-white'
              : 'bg-white border shadow-sm'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  );
};
