/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, MessageSender } from '../types';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Link as LinkIcon, Copy, Check, AlertTriangle } from 'lucide-react';
import remarkGfm from 'remark-gfm';
import hljs from 'highlight.js';

// Custom component for rendering <pre> blocks with a copy button and syntax highlighting
const PreBlock = ({ children }: any) => {
    const [isCopied, setIsCopied] = useState(false);
    const preRef = useRef<HTMLPreElement>(null);
    
    // Fallback for non-standard children which can happen with inline code
    if (!children || typeof children !== 'object' || !('props' in children)) {
        return <pre className="p-4 rounded-md overflow-x-auto">{children}</pre>;
    }

    // This effect handles syntax highlighting after the component has rendered
    useEffect(() => {
        if (preRef.current) {
            const codeBlock = preRef.current.querySelector('code');
            if (codeBlock) {
                hljs.highlightElement(codeBlock);
            }
        }
    }, [children]); // Re-run the effect when the code content changes

    const codeElement = children as React.ReactElement;
    // Fix: Cast `codeElement.props` to a type with a `children` property to resolve TypeScript error where `props` was of type `unknown`.
    const codeString = String((codeElement.props as { children: React.ReactNode }).children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(codeString).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    return (
        <div className="relative group my-2 text-sm rounded-md">
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 z-10 p-1.5 text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-all"
                aria-label="Copy code to clipboard"
            >
                {isCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
            {/* The ref is attached here. The `children` prop is the original <code> block which will be highlighted by the effect. */}
            <pre ref={preRef} className="p-4 rounded-md overflow-x-auto">{children}</pre>
        </div>
    );
};

// Fix: Define the props interface for the MessageItem component.
interface MessageItemProps {
    message: ChatMessage;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isModel = message.sender === MessageSender.MODEL;

  if (message.isError) {
    return (
      <div className="flex items-start gap-4 py-4">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-red-500">
          <AlertTriangle size={20} className="text-white" />
        </div>
        <div className="p-4 rounded-lg max-w-4xl w-full bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100">
          <p className="font-semibold text-sm mb-1">An error occurred</p>
          <p className="text-sm">{message.text}</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // If the message is loading and has no text yet, show pulsing dots.
    if (message.isLoading && !message.text) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
        </div>
      );
    }

    // Render the markdown content. If still loading, append a blinking cursor.
    return (
      <>
        <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
                pre: PreBlock,
            }}
        >
            {message.text}
        </ReactMarkdown>
        {message.isLoading && <span className="blinking-cursor">▍</span>}
      </>
    );
  };

  return (
    <div className={`flex items-start gap-4 py-4`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isModel ? 'bg-blue-500' : 'bg-gray-500'}`}>
        {isModel ? <Bot size={20} className="text-white" /> : <User size={20} className="text-white" />}
      </div>
      <div className={`p-4 rounded-lg max-w-4xl w-full ${isModel ? 'bg-white dark:bg-[#26272B]' : 'bg-blue-500 text-white'}`}>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {renderContent()}
        </div>
        {isModel && message.urlContext && message.urlContext.length > 0 && !message.isLoading && (
          <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
              <LinkIcon size={14} />
              Sources
            </h4>
            <ol className="list-decimal list-inside text-xs space-y-1 pl-2">
              {message.urlContext.map((ctx, index) => (
                <li key={index} className="truncate">
                  <a
                    href={ctx.retrievedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                    title={ctx.retrievedUrl}
                  >
                    {new URL(ctx.retrievedUrl).hostname}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;