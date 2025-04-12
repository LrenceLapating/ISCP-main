import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define available languages
export type Language = 'English' | 'Filipino';

// English translations
const englishTranslations = {
  // Common labels
  dashboard: 'Dashboard',
  courses: 'Courses',
  assignments: 'Assignments',
  grades: 'Grades',
  messages: 'Messages',
  settings: 'Settings',
  materials: 'Materials',
  students: 'Students',
  logout: 'Logout',
  
  // Settings page
  profileSettings: 'Profile Settings',
  securitySettings: 'Security Settings',
  notificationSettings: 'Notification Settings',
  appearanceSettings: 'Appearance Settings',
  privacySettings: 'Privacy Settings',
  
  // Appearance settings
  theme: 'Theme',
  themeDescription: 'Choose between light and dark mode',
  dark: 'Dark',
  light: 'Light',
  language: 'Language',
  languageDescription: 'Select your preferred language',
  
  // Privacy settings
  profileVisibility: 'Profile Visibility',
  profileVisibilityDescription: 'Control who can see your profile information',
  public: 'Public',
  private: 'Private',
  onlineStatus: 'Show Online Status',
  onlineStatusDescription: 'Let others see when you\'re online',
  lastSeen: 'Show Last Seen',
  lastSeenDescription: 'Let others see when you were last active',
  
  // Buttons
  save: 'Save Settings',
  saving: 'Saving...',
  cancel: 'Cancel',
  submit: 'Submit',
};

// Filipino translations
const filipinoTranslations = {
  // Common labels
  dashboard: 'Dashboard',
  courses: 'Mga Kurso',
  assignments: 'Mga Takdang-aralin',
  grades: 'Mga Marka',
  messages: 'Mga Mensahe',
  settings: 'Mga Setting',
  materials: 'Mga Materyales',
  students: 'Mga Estudyante',
  logout: 'Mag-logout',
  
  // Settings page
  profileSettings: 'Mga Setting ng Profile',
  securitySettings: 'Mga Setting ng Seguridad',
  notificationSettings: 'Mga Setting ng Notipikasyon',
  appearanceSettings: 'Mga Setting ng Hitsura',
  privacySettings: 'Mga Setting ng Pribasidad',
  
  // Appearance settings
  theme: 'Tema',
  themeDescription: 'Pumili sa pagitan ng light at dark mode',
  dark: 'Madilim',
  light: 'Maliwanag',
  language: 'Wika',
  languageDescription: 'Piliin ang gusto mong wika',
  
  // Privacy settings
  profileVisibility: 'Visibility ng Profile',
  profileVisibilityDescription: 'Kontrolin kung sino ang makakakita ng iyong profile',
  public: 'Pampubliko',
  private: 'Pribado',
  onlineStatus: 'Ipakita ang Online Status',
  onlineStatusDescription: 'Hayaan ang iba na makita kung kailan ka online',
  lastSeen: 'Ipakita ang Huling Aktibo',
  lastSeenDescription: 'Hayaan ang iba na makita kung kailan ka huling aktibo',
  
  // Buttons
  save: 'I-save ang Mga Setting',
  saving: 'Nag-sasave...',
  cancel: 'Kanselahin',
  submit: 'Isumite',
};

// Combine all translations
const translations = {
  English: englishTranslations,
  Filipino: filipinoTranslations,
};

type TranslationKeys = keyof typeof englishTranslations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Initialize language from localStorage or default to 'English'
  const [language, setLanguageState] = useState<Language>(
    () => (localStorage.getItem('language') as Language) || 'English'
  );

  // Get translation for a key
  const t = (key: TranslationKeys): string => {
    return translations[language][key] || translations.English[key] || key;
  };

  // Update language
  const setLanguage = (lang: Language) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
  };

  // Update language in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}; 