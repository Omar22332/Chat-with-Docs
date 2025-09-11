/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import MessageItem from './MessageItem';
import { Send, Lightbulb, Trash2, AlertTriangle } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string) => void;
  isLoading: boolean;
  initialSuggestions: string[];
  onClearConversation: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  initialSuggestions,
  onClearConversation,
}) => {
  const [input, setInput] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to auto-resize the textarea based on its content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height to recalculate
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 200; // Max height in pixels
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    onSendMessage(suggestion);
  };

  const handleClearClick = () => {
    setIsConfirmingClear(true);
  };

  const handleConfirmClear = () => {
    onClearConversation();
    setIsConfirmingClear(false);
  };

  return (
    <div className="relative flex-1 flex flex-col p-4 overflow-hidden">
       {messages.length > 0 && !isLoading && (
          <button
              onClick={handleClearClick}
              className="absolute top-4 right-4 z-10 p-1.5 text-gray-500 dark:text-[#A8ABB4] hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Clear conversation"
          >
              <Trash2 size={20} />
          </button>
      )}
      <div className="flex-1 overflow-y-auto mb-4 pr-2">
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Lightbulb size={48} className="mb-4" />
            <h2 className="text-xl font-medium mb-2">Welcome!</h2>
            <p className="mb-4 text-center">Ask me anything about the documents in your knowledge base.</p>
            {initialSuggestions.length > 0 && (
                <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-2">
                    {initialSuggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="p-3 text-left bg-white dark:bg-[#26272B] border border-black/10 dark:border-white/10 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
          </div>
        ) : (
          messages.map(msg => <MessageItem key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up question..."
          className="flex-1 p-3 border rounded-lg bg-transparent dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          <Send size={20} />
        </button>
      </form>

      {/* Confirmation Modal */}
      {isConfirmingClear && (
        <div className="absolute inset-0 z-20 flex items-center justify-center modal-fade-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsConfirmingClear(false)}></div>
          <div className="relative z-30 bg-white dark:bg-[#26272B] p-6 rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full">
                <AlertTriangle className="text-red-500" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Clear Conversation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Are you sure you want to delete this conversation? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsConfirmingClear(false)}
                className="px-4 py-2 text-sm font-medium rounded-md border dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;