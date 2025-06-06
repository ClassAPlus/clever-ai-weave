
import React, { createContext, useContext, useState } from 'react';

interface LanguageContextType {
  isHebrew: boolean;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHebrew, setIsHebrew] = useState(false);

  const toggleLanguage = () => {
    setIsHebrew(!isHebrew);
  };

  return (
    <LanguageContext.Provider value={{ isHebrew, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
