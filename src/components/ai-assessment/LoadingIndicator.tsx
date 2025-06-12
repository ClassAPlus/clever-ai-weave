
import { Bot } from "lucide-react";

export const LoadingIndicator = () => {
  return (
    <div className="flex justify-start">
      <div className="flex items-start space-x-2">
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
          <Bot size={16} />
        </div>
        <div className="bg-white border shadow-sm p-3 rounded-lg">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
