
import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSend: (message: string) => Promise<void>;
  isSending: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, isSending }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initial autofocus
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Send handler
  const handleSend = async () => {
    const msg = text.trim();
    if (!msg || isSending) return;
    // clear the input *after* grabbing the value
    setText('');
    try {
      await onSend(msg);
    } finally {
      // ensure the keyboard stays open by re-focusing
      // a small delay helps on some iOS browsers
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  // Enter = send (no Shift)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative">
      {/* Enhanced background with gradient and glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-100/30 via-pink-100/30 to-blue-100/30 rounded-3xl blur-sm"></div>
      
      <div className="relative flex items-center gap-4 p-5 bg-gradient-to-r from-white via-gray-50/90 to-white rounded-3xl border-2 border-gradient-to-r from-purple-200/50 via-pink-200/50 to-blue-200/50 shadow-xl backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group">
        {/* Subtle animated border glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
        
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            inputMode="text"
            placeholder="Type your message..."
            className="w-full resize-none min-h-[2.5rem] max-h-32 px-5 py-4 border-2 border-gray-200/60 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200/40 focus:border-purple-300/60 transition-all duration-300 bg-white/80 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 shadow-inner hover:border-purple-200/80 hover:shadow-md font-medium"
            rows={1}
            style={{ 
              overflow: 'hidden',
              lineHeight: '1.5'
            }}
          />
          
          {/* Subtle inner glow for textarea */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-50/20 to-pink-50/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <Button
          onClick={handleSend}
          onMouseDown={e => e.preventDefault()}
          disabled={isSending || !text.trim()}
          size="icon"
          className="relative h-14 w-14 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 group/button overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border-2 border-white/20"
        >
          {/* Animated background on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/button:opacity-100 transition-opacity duration-300"></div>
          
          {/* Enhanced shine animation */}
          <div className="absolute inset-0 -top-0 -left-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-shine"></div>
          
          {/* Pulsing ring effect */}
          <div className="absolute inset-0 rounded-2xl ring-4 ring-purple-400/0 group-hover/button:ring-purple-400/30 transition-all duration-300"></div>
          
          <Send className="h-5 w-5 group-hover/button:scale-110 transition-transform duration-200 relative z-10 drop-shadow-sm" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
