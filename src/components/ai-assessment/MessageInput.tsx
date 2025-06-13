
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
    <div className="flex items-center p-2 border-t bg-white" style={{ position: 'relative' }}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        inputMode="text"
        placeholder="Type your message..."
        className="flex-1 resize-none h-12 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        rows={1}
        style={{ overflow: 'hidden' }}
      />
      <Button
        onClick={handleSend}
        onMouseDown={e => e.preventDefault()}
        disabled={isSending || !text.trim()}
        size="icon"
        className="ml-2 h-12 w-12 rounded-lg bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group relative overflow-hidden"
      >
        {/* Animated background on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Shine animation */}
        <div className="absolute inset-0 -top-0 -left-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-shine"></div>
        
        <Send className="h-4 w-4 group-hover:scale-110 transition-transform duration-200 relative z-10" />
      </Button>
    </div>
  );
};

export default MessageInput;
