
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
      <div className="flex items-end gap-3">
        <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/80 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-gray-300/80">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            inputMode="text"
            placeholder="Type your message..."
            className="w-full resize-none min-h-[2.5rem] max-h-32 px-4 py-3 border-0 focus:outline-none bg-transparent text-gray-900 placeholder:text-gray-500 font-medium rounded-2xl"
            rows={1}
            style={{ 
              overflow: 'hidden',
              lineHeight: '1.5'
            }}
          />
        </div>
        
        <Button
          onClick={handleSend}
          onMouseDown={e => e.preventDefault()}
          disabled={isSending || !text.trim()}
          size="icon"
          className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden flex-shrink-0"
        >
          {/* Enhanced shine animation */}
          <div className="absolute inset-0 -top-0 -left-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-shine"></div>
          
          <Send className="h-5 w-5 transition-transform duration-200 relative z-10" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
