import React, { useState, useRef, useEffect } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { aiAssistantAPI } from '../../utils/api';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface AIAssistantChatboxProps {
  isOpen: boolean;
  onToggle: () => void;
}

const AIAssistantChatbox: React.FC<AIAssistantChatboxProps> = ({ isOpen, onToggle }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your GearGuard AI Assistant. I can help you with equipment maintenance, troubleshooting, safety protocols, and system guidance. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chatbox opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: 'Thinking...',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await aiAssistantAPI.sendMessage(inputMessage.trim());
      
      if (response.success) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === loadingMessage.id 
              ? { ...msg, content: response.response, isLoading: false }
              : msg
          )
        );
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error: any) {
      console.error('AI Assistant Error:', error);
      setError(error.response?.data?.error || 'Failed to get AI response. Please try again.');
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { 
                ...msg, 
                content: 'Sorry, I encountered an error. Please try again later.', 
                isLoading: false 
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        type: 'ai',
        content: 'Hello! I\'m your GearGuard AI Assistant. I can help you with equipment maintenance, troubleshooting, safety protocols, and system guidance. How can I assist you today?',
        timestamp: new Date()
      }
    ]);
    setError(null);
  };

  const quickActions = [
    { label: 'Equipment Troubleshooting', message: 'Help me troubleshoot equipment issues' },
    { label: 'Maintenance Schedule', message: 'How should I plan maintenance schedules?' },
    { label: 'Safety Protocols', message: 'What safety protocols should I follow?' },
    { label: 'System Help', message: 'How do I use the GearGuard system?' }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 z-50 group"
        title="Open AI Assistant"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          <SparklesIcon className="h-3 w-3" />
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-full">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="text-xs opacity-90">GearGuard Helper</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearChat}
            className="text-white/80 hover:text-white p-1 rounded transition-colors"
            title="Clear Chat"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={onToggle}
            className="text-white/80 hover:text-white p-1 rounded transition-colors"
            title="Close Chat"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              {message.isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">AI is thinking...</span>
                </div>
              ) : (
                <div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length === 1 && (
        <div className="p-4 bg-white border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2 flex items-center">
            <InformationCircleIcon className="h-4 w-4 mr-1" />
            Quick actions:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(action.message)}
                className="text-xs p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about maintenance..."
            className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          AI responses may not always be accurate. Verify important information.
        </p>
      </div>
    </div>
  );
};

export default AIAssistantChatbox;