
import React, { createContext, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
    // Check URL parameters on component mount
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang');
    if (lang === 'he') {
      setIsHebrew(true);
    }
  }, []);

  const toggleLanguage = () => {
    const newValue = !isHebrew;
    setIsHebrew(newValue);
    
    // Update URL when language changes
    const url = new URL(window.location.href);
    if (newValue) {
      url.searchParams.set('lang', 'he');
    } else {
      url.searchParams.delete('lang');
    }
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <LanguageContext.Provider value={{ isHebrew, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
