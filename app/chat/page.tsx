"use client";

import { JSX, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { 
  Send, 
  StopCircle, 
  User, 
  Bot, 
  Sparkles,
  Loader2,
  AlertCircle
} from "lucide-react";

// Move CleanMessage outside the component
const CleanMessage = ({ text }: { text: string }) => {
  // Function to remove ALL markdown formatting
  const cleanMarkdown = (markdown: string): string => {
    return markdown
      // Remove bold **text**
      .replace(/\*\*(.*?)\*\*/g, '$1')
      // Remove italic *text* or _text_
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // Remove headers #, ##, ###, ####
      .replace(/^#{1,4}\s+/gm, '')
      // Remove code blocks ```
      .replace(/```[\s\S]*?```/g, (match) => {
        // Keep the content inside code blocks but remove ```
        return match.replace(/```[\w]*\n?/g, '').replace(/\n```/g, '');
      })
      // Remove inline code `
      .replace(/`([^`]+)`/g, '$1')
      // Remove strikethrough ~~text~~
      .replace(/~~(.*?)~~/g, '$1')
      // Remove blockquote >
      .replace(/^>\s+/gm, '')
      // Remove horizontal rules ---
      .replace(/^---+\s*$/gm, '')
      // Remove tables |---|
      .replace(/^\|[-:\s|]+\|?\s*$/gm, '')
      // Clean up table cells | cell |
      .replace(/\|\s*/g, '').replace(/\s*\|/g, '')
      // Remove excessive newlines (more than 2)
      .replace(/\n{3,}/g, '\n\n');
  };

  const cleanText = cleanMarkdown(text);

  // Format the clean text with proper spacing and structure
  const formatText = (content: string) => {
    const lines = content.split('\n');
    let inList = false;
    let listItems: string[] = [];
    const elements: JSX.Element[] = [];
    let lineIndex = 0;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      if (!trimmed) {
        if (inList && listItems.length > 0) {
          // Render accumulated list items
          elements.push(
            <ul key={`list-${lineIndex}`} className="space-y-2 my-3 pl-5">
              {listItems.map((item, i) => (
                <li key={`${lineIndex}-item-${i}`} className="flex items-start">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        elements.push(<div key={`spacer-${lineIndex}`} className="h-4" />);
        lineIndex++;
        return;
      }

      // Detect list items (starts with •, -, *, or number.)
      if (/^(•|\-|\*|\d+\.)\s+/.test(trimmed) || /^[○●▪▫]\s/.test(trimmed)) {
        inList = true;
        const item = trimmed.replace(/^(•|\-|\*|\d+\.|[○●▪▫])\s+/, '');
        listItems.push(item);
        lineIndex++;
        return;
      }

      // If we were in a list and now we're not, render the list
      if (inList && listItems.length > 0) {
        inList = false;
        elements.push(
          <ul key={`list-${lineIndex}`} className="space-y-2 my-3 pl-5">
            {listItems.map((item, i) => (
              <li key={`${lineIndex}-item-${i}`} className="flex items-start">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }

      // Regular text (looks like a title if it's short and ends with colon)
      if (trimmed.length < 50 && (trimmed.endsWith(':') || !trimmed.includes('.'))) {
        elements.push(
          <h3 
            key={`heading-${lineIndex}`} 
            className="text-lg font-semibold text-gray-800 dark:text-gray-100 my-4"
          >
            {trimmed}
          </h3>
        );
        lineIndex++;
        return;
      }

      // Regular paragraph
      elements.push(
        <p 
          key={`para-${lineIndex}`} 
          className="my-3 text-gray-700 dark:text-gray-300 leading-relaxed"
        >
          {trimmed}
        </p>
      );
      lineIndex++;
    });

    // Don't forget to render any remaining list items
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-final-${lineIndex}`} className="space-y-2 my-3 pl-5">
          {listItems.map((item, i) => (
            <li key={`final-item-${i}`} className="flex items-start">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }

    return elements;
  };

  return <div className="space-y-1">{formatText(cleanText)}</div>;
};

export default function ChatPage() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error, stop } = useChat();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-500 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Deepsok AI Assistant</h1>
              <p className="text-purple-100 mt-1">Your friendly assistant for Great Paperless Events</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-purple-100">
            <div className={`h-2 w-2 rounded-full ${status === "ready" ? "bg-green-400 animate-pulse" : status === "submitted" || status === "streaming" ? "bg-yellow-400 animate-pulse" : "bg-red-400"}`} />
            <span className="capitalize">{status}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 rounded-r-lg shadow-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-700 dark:text-red-300">Error</h3>
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages Container */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 mb-40">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-6">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-700! dark:text-gray-200! mb-3">
                Welcome to Deepsok! 👋
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                I'm here to help you create beautiful digital invitations for your events. Ask me anything about Great Paperless Events!
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                  <h4 className="font-semibold text-blue-700! dark:text-blue-300! mb-1">Event Creation</h4>
                  <p className="text-sm text-blue-600! dark:text-blue-400!">How do I create a wedding invitation?</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                  <h4 className="font-semibold text-green-700! dark:text-green-300! mb-1">Design Tips</h4>
                  <p className="text-sm text-green-600! dark:text-green-400!">What are some Khmer design ideas?</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                    message.role === "user" 
                      ? "bg-gradient-to-br from-blue-500 to-cyan-500" 
                      : "bg-gradient-to-br from-purple-500 to-pink-500"
                  }`}>
                    {message.role === "user" ? (
                      <User className="h-5 w-5 text-white" />
                    ) : (
                      <Bot className="h-5 w-5 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-tr-none"
                      : "bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 border border-gray-100 dark:border-gray-700 rounded-tl-none"
                  }`}>
                    {/* Role label */}
                    <div className={`text-xs font-semibold mb-2 ${
                      message.role === "user" ? "text-blue-100" : "text-purple-600 dark:text-purple-400"
                    }`}>
                      {message.role === "user" ? "You" : "Deepsok"}
                    </div>
                    
                    {/* Message parts - ONLY apply CleanMessage to AI messages */}
                    {message.parts.map((part, index) => {
                      switch (part.type) {
                        case "text":
                          if (message.role === "assistant") {
                            // AI message - use CleanMessage
                            return (
                              <div
                                key={`${message.id}-${index}`}
                                className="text-gray-700 dark:text-gray-200"
                              >
                                <CleanMessage text={part.text} />
                              </div>
                            );
                          } else {
                            // User message - display plain text
                            return (
                              <div
                                key={`${message.id}-${index}`}
                                className="text-white"
                              >
                                {part.text}
                              </div>
                            );
                          }
                        default:
                          return null;
                      }
                    })}
                    
                    {/* Timestamp (simulated) */}
                    <div className={`text-xs mt-3 ${
                      message.role === "user" ? "text-blue-200" : "text-gray-400"
                    }`}>
                      Just now
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading Indicator */}
          {(status === "submitted" || status === "streaming") && (
            <div className="flex items-center gap-4 mt-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                  <span className="text-gray-600 dark:text-gray-300">Deepsok is thinking...</span>
                </div>
                <div className="flex gap-1 mt-3">
                  <div className="h-2 w-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form - Fixed at bottom */}
        <form
          onSubmit={handleSubmit}
          className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 via-white/95 to-white/90 dark:from-gray-900/95 dark:via-gray-900/95 dark:to-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-2xl"
        >
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  className="w-full p-4 pl-12! pr-4! bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 border-2 border-purple-200 dark:border-purple-900 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about event creation, design tips, or anything else..."
                  disabled={status !== "ready"}
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              
              {status === "submitted" || status === "streaming" ? (
                <button
                  type="button"
                  onClick={stop}
                  className="px-6 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:from-red-600 hover:to-orange-600 active:scale-95 transition-all duration-200 flex items-center gap-2"
                >
                  <StopCircle className="h-5 w-5" />
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-600 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-pink-500 flex items-center gap-2"
                  disabled={!input.trim() || status !== "ready"}
                >
                  <Send className="h-5 w-5" />
                  Send
                </button>
              )}
            </div>
            
            {/* Quick suggestions */}
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  setInput("How do I create a wedding invitation?");
                }}
                className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:scale-105 transition-transform"
              >
                Wedding invites
              </button>
              <button
                type="button"
                onClick={() => {
                  setInput("What are some Khmer design ideas?");
                }}
                className="px-3 py-1.5 text-sm bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 rounded-full hover:scale-105 transition-transform"
              >
                Khmer designs
              </button>
              <button
                type="button"
                onClick={() => {
                  setInput("How do I share my event with guests?");
                }}
                className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:scale-105 transition-transform"
              >
                Sharing options
              </button>
              <button
                type="button"
                onClick={() => {
                  setInput("Tell me about privacy settings");
                }}
                className="px-3 py-1.5 text-sm bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 text-orange-700 dark:text-orange-300 rounded-full hover:scale-105 transition-transform"
              >
                Privacy settings
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}