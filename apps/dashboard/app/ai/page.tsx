'use client';

import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{
    type: string;
    id: string;
    content: string;
    relevance: number;
  }>;
  timestamp: Date;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your Retail Brain AI Assistant. Ask me anything about your customers, orders, or business insights!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/v1/assistant/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: input,
        }),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer || 'I apologize, but I couldn\'t process that query.',
        citations: data.citations || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Query failed:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof Error 
          ? `Sorry, I encountered an error: ${error.message}. Please try again.`
          : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="p-6 bg-gray-900 min-h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2">AI Assistant</h1>
        <p className="text-sm text-gray-400">Ask questions about your customers and business</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-2xl rounded-2xl px-6 py-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-white border border-gray-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">
                  {message.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="flex-1">
                  <p className="text-white whitespace-pre-wrap">
                    {message.content}
                  </p>
                  
                  {/* Citations */}
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <p className="text-xs font-semibold text-gray-400 mb-2">
                        Sources:
                      </p>
                      <div className="space-y-2">
                        {message.citations.map((citation, i) => (
                          <div
                            key={i}
                            className="text-xs bg-gray-700 rounded p-2 border border-gray-600"
                          >
                            <div className="font-medium text-gray-300">
                              {citation.type.toUpperCase()} (Relevance: {(citation.relevance * 100).toFixed(0)}%)
                            </div>
                            <div className="text-gray-400 mt-1">
                              {citation.content.substring(0, 100)}...
                            </div>
                            <div className="text-gray-500 mt-1">
                              ID: {citation.id.substring(0, 8)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs mt-2 text-gray-400">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🤖</div>
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 bg-gray-800 border-t border-gray-700 rounded-lg p-4">
        {/* Suggested Questions */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setInput('How many customers do we have?')}
            className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-gray-300 transition-colors"
          >
            How many customers?
          </button>
          <button
            onClick={() => setInput('Show me high-value customers')}
            className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-gray-300 transition-colors"
          >
            Top customers
          </button>
          <button
            onClick={() => setInput('What are the total orders?')}
            className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-gray-300 transition-colors"
          >
            Total orders
          </button>
        </div>

        {/* Input Box */}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything about your customers..."
            className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none text-white placeholder-gray-400"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <span>Send</span>
            <span>🚀</span>
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2 text-center">
          Powered by Retail Brain AI · Answers based on your data only
        </p>
      </div>
    </div>
  );
}
