
import { Bot } from "lucide-react";

export const LoadingIndicator = () => {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-lg border-2 border-blue-300">
          <Bot size={18} />
        </div>
        <div className="bg-white/90 border border-gray-200 shadow-md p-4 rounded-2xl rounded-tl-md backdrop-blur-sm relative">
          {/* Message tail */}
          <div className="absolute left-0 top-4 border-r-[8px] border-r-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent -translate-x-full"></div>
          
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
