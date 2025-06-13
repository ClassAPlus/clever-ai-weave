
import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';

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
        className="flex-1 resize-none h-12 px-3 py-2 border rounded-lg focus:outline-none"
        rows={1}
        style={{ overflow: 'hidden' }}
      />
      <button
        onClick={handleSend}
        onMouseDown={e => e.preventDefault()}         // prevent focus loss
        disabled={isSending || !text.trim()}
        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
};

export default MessageInput;
