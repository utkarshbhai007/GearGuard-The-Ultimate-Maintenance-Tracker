import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AIAssistantContextType {
  isChatboxOpen: boolean;
  toggleChatbox: () => void;
  openChatbox: () => void;
  closeChatbox: () => void;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (context === undefined) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  }
  return context;
};

interface AIAssistantProviderProps {
  children: ReactNode;
}

export const AIAssistantProvider: React.FC<AIAssistantProviderProps> = ({ children }) => {
  const [isChatboxOpen, setIsChatboxOpen] = useState(false);

  const toggleChatbox = () => {
    setIsChatboxOpen(prev => !prev);
  };

  const openChatbox = () => {
    setIsChatboxOpen(true);
  };

  const closeChatbox = () => {
    setIsChatboxOpen(false);
  };

  const value = {
    isChatboxOpen,
    toggleChatbox,
    openChatbox,
    closeChatbox,
  };

  return (
    <AIAssistantContext.Provider value={value}>
      {children}
    </AIAssistantContext.Provider>
  );
};

export default AIAssistantContext;