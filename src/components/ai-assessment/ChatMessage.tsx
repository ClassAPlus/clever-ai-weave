
import { Bot, User } from "lucide-react";
import { Message } from "./types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatMessageProps {
  message: Message;
  index: number;
}

export const ChatMessage = ({ message, index }: ChatMessageProps) => {
  const { isHebrew } = useLanguage();
  const isMobile = useIsMobile();

  return (
    <div
      key={index}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
    >
      <div
        className={`flex items-start space-x-3 ${
          isMobile ? 'max-w-[95%]' : 'max-w-[85%]'
        } ${
          message.role === 'user'
            ? 'flex-row-reverse space-x-reverse'
            : 'flex-row'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 ${
            message.role === 'user'
              ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white border-purple-300'
              : 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white border-blue-300'
          }`}
        >
          {message.role === 'user' ? <User size={18} /> : <Bot size={18} />}
        </div>
        <div
          className={`p-4 rounded-2xl shadow-md border backdrop-blur-sm relative ${
            message.role === 'user'
              ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white border-purple-300 rounded-tr-md'
              : 'bg-white/90 border-gray-200 text-gray-800 rounded-tl-md'
          }`}
        >
          {/* Message tail */}
          <div
            className={`absolute w-0 h-0 ${
              message.role === 'user'
                ? 'right-0 top-4 border-l-[8px] border-l-purple-600 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent translate-x-full'
                : 'left-0 top-4 border-r-[8px] border-r-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent -translate-x-full'
            }`}
          ></div>
          
          <p className={`text-sm leading-relaxed whitespace-pre-wrap font-medium ${
            isHebrew ? 'text-right' : 'text-left'
          }`}>
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
};
