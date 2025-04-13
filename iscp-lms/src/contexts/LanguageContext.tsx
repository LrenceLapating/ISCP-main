import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define available languages
export type Language = 'English' | 'Filipino' | 'Waray' | 'Arabic' | 'Greek';

// Map of campus to available languages
export const campusLanguageMap: Record<string, Language[]> = {
  'Main Campus: Undisclosed location, Philippines': ['English', 'Filipino'],
  'Biringan Campus': ['English', 'Waray'],
  'Sun and Moon Campus': ['English', 'Arabic'],
  'Galactic Campus': ['English'],
  'Atlantis Campus': ['English', 'Greek'],
  'default': ['English', 'Filipino'] // Fallback for any campus not listed
};

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
  
  // Additional translations
  student: 'Student',
  manageSettings: 'Manage your account settings and preferences',
  personalInfo: 'Personal Information',
  changePassword: 'Change Password',
  passwordSecurity: 'Password & Security',
  notificationPreferences: 'Notification Preferences',
  appearance: 'Appearance',
  dangerZone: 'Danger Zone',
  dangerWarning: 'These actions are permanent and cannot be undone. Please proceed with caution.',
  deleteAccount: 'Delete Account',
  saveChanges: 'Save Changes',
  updatePassword: 'Update Password',
  savePreferences: 'Save Preferences'
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
  
  // Additional translations
  student: 'Estudyante',
  manageSettings: 'Pamahalaan ang iyong mga setting at kagustuhan ng account',
  personalInfo: 'Personal na Impormasyon',
  changePassword: 'Palitan ang Password',
  passwordSecurity: 'Password at Seguridad',
  notificationPreferences: 'Mga Kagustuhan sa Notipikasyon',
  appearance: 'Hitsura',
  dangerZone: 'Mapanganib na Zone',
  dangerWarning: 'Ang mga aksyong ito ay permanente at hindi maaaring ibalik. Mangyaring mag-ingat.',
  deleteAccount: 'Burahin ang Account',
  saveChanges: 'I-save ang mga Pagbabago',
  updatePassword: 'I-update ang Password',
  savePreferences: 'I-save ang mga Kagustuhan'
};

// Waray translations 
const warayTranslations = {
  // Common labels
  dashboard: 'Dashboard',
  courses: 'Mga Kurso',
  assignments: 'Mga Buruhatun',
  grades: 'Mga Grado',
  messages: 'Mga Mensahe',
  settings: 'Mga Setting',
  materials: 'Mga Materyal',
  students: 'Mga Estudyante',
  logout: 'Logout',
  
  // Settings page
  profileSettings: 'Mga Setting han Profile',
  securitySettings: 'Mga Setting han Seguridad',
  notificationSettings: 'Mga Setting han Notipikasyon',
  appearanceSettings: 'Mga Setting han Hitsura',
  privacySettings: 'Mga Setting han Pribasidad',
  
  // Appearance settings
  theme: 'Tema',
  themeDescription: 'Pili ha butnga han light ngan dark mode',
  dark: 'Madulom',
  light: 'Malamrag',
  language: 'Yinaknan',
  languageDescription: 'Pilia an imo karuyag nga yinaknan',
  
  // Privacy settings
  profileVisibility: 'Nakikita nga Profile',
  profileVisibilityDescription: 'Kontrola kon hin-o an makakakita han imo profile',
  public: 'Publiko',
  private: 'Pribado',
  onlineStatus: 'Ipakita an Online Status',
  onlineStatusDescription: 'Tugoti an iba nga makita kon san-o ka online',
  lastSeen: 'Ipakita an Katapusan nga Aktibo',
  lastSeenDescription: 'Tugoti an iba nga makita kon san-o ka katapusan nga aktibo',
  
  // Buttons
  save: 'I-save an Mga Setting',
  saving: 'Nagsasave...',
  cancel: 'Kanselaron',
  submit: 'Isumite',
  
  // Additional translations
  student: 'Estudyante',
  manageSettings: 'Pagdumara han imo account settings ngan preferences',
  personalInfo: 'Personal nga Impormasyon',
  changePassword: 'Pagbag-o han Password',
  passwordSecurity: 'Password ngan Seguridad',
  notificationPreferences: 'Mga Karuyag nga Notipikasyon',
  appearance: 'Hitsura',
  dangerZone: 'Delikado nga Lugar',
  dangerWarning: 'Ini nga mga aksiyon permanente ngan diri na maibabalik. Alayon pagmatngon.',
  deleteAccount: 'Pagrara han Account',
  saveChanges: 'I-save an mga Pagbag-o',
  updatePassword: 'I-update an Password',
  savePreferences: 'I-save an mga Karuyag'
};

// Arabic translations
const arabicTranslations = {
  // Common labels
  dashboard: 'لوحة التحكم',
  courses: 'الدورات',
  assignments: 'الواجبات',
  grades: 'الدرجات',
  messages: 'الرسائل',
  settings: 'الإعدادات',
  materials: 'المواد',
  students: 'الطلاب',
  logout: 'تسجيل الخروج',
  
  // Settings page
  profileSettings: 'إعدادات الملف الشخصي',
  securitySettings: 'إعدادات الأمان',
  notificationSettings: 'إعدادات الإشعارات',
  appearanceSettings: 'إعدادات المظهر',
  privacySettings: 'إعدادات الخصوصية',
  
  // Appearance settings
  theme: 'السمة',
  themeDescription: 'اختر بين الوضع الفاتح والداكن',
  dark: 'داكن',
  light: 'فاتح',
  language: 'اللغة',
  languageDescription: 'اختر لغتك المفضلة',
  
  // Privacy settings
  profileVisibility: 'رؤية الملف الشخصي',
  profileVisibilityDescription: 'التحكم في من يمكنه رؤية معلومات ملفك الشخصي',
  public: 'عام',
  private: 'خاص',
  onlineStatus: 'إظهار حالة الاتصال',
  onlineStatusDescription: 'السماح للآخرين برؤية متى تكون متصلاً',
  lastSeen: 'إظهار آخر ظهور',
  lastSeenDescription: 'السماح للآخرين برؤية آخر نشاط لك',
  
  // Buttons
  save: 'حفظ الإعدادات',
  saving: 'جاري الحفظ...',
  cancel: 'إلغاء',
  submit: 'إرسال',
  
  // Additional translations
  student: 'طالب',
  manageSettings: 'إدارة إعدادات حسابك وتفضيلاتك',
  personalInfo: 'المعلومات الشخصية',
  changePassword: 'تغيير كلمة المرور',
  passwordSecurity: 'كلمة المرور والأمان',
  notificationPreferences: 'تفضيلات الإشعارات',
  appearance: 'المظهر',
  dangerZone: 'منطقة الخطر',
  dangerWarning: 'هذه الإجراءات دائمة ولا يمكن التراجع عنها. يرجى المتابعة بحذر.',
  deleteAccount: 'حذف الحساب',
  saveChanges: 'حفظ التغييرات',
  updatePassword: 'تحديث كلمة المرور',
  savePreferences: 'حفظ التفضيلات'
};

// Greek translations
const greekTranslations = {
  // Common labels
  dashboard: 'Πίνακας Ελέγχου',
  courses: 'Μαθήματα',
  assignments: 'Εργασίες',
  grades: 'Βαθμοί',
  messages: 'Μηνύματα',
  settings: 'Ρυθμίσεις',
  materials: 'Υλικά',
  students: 'Φοιτητές',
  logout: 'Αποσύνδεση',
  
  // Settings page
  profileSettings: 'Ρυθμίσεις Προφίλ',
  securitySettings: 'Ρυθμίσεις Ασφαλείας',
  notificationSettings: 'Ρυθμίσεις Ειδοποιήσεων',
  appearanceSettings: 'Ρυθμίσεις Εμφάνισης',
  privacySettings: 'Ρυθμίσεις Απορρήτου',
  
  // Appearance settings
  theme: 'Θέμα',
  themeDescription: 'Επιλέξτε μεταξύ φωτεινού και σκοτεινού θέματος',
  dark: 'Σκούρο',
  light: 'Φωτεινό',
  language: 'Γλώσσα',
  languageDescription: 'Επιλέξτε την προτιμώμενη γλώσσα',
  
  // Privacy settings
  profileVisibility: 'Ορατότητα Προφίλ',
  profileVisibilityDescription: 'Ελέγξτε ποιος μπορεί να δει τις πληροφορίες του προφίλ σας',
  public: 'Δημόσιο',
  private: 'Ιδιωτικό',
  onlineStatus: 'Εμφάνιση Κατάστασης Σύνδεσης',
  onlineStatusDescription: 'Επιτρέψτε στους άλλους να βλέπουν πότε είστε συνδεδεμένοι',
  lastSeen: 'Εμφάνιση Τελευταίας Εμφάνισης',
  lastSeenDescription: 'Επιτρέψτε στους άλλους να βλέπουν πότε ήσασταν τελευταία φορά ενεργοί',
  
  // Buttons
  save: 'Αποθήκευση Ρυθμίσεων',
  saving: 'Αποθήκευση...',
  cancel: 'Ακύρωση',
  submit: 'Υποβολή',
  
  // Additional translations
  student: 'Φοιτητής',
  manageSettings: 'Διαχειριστείτε τις ρυθμίσεις του λογαριασμού σας και τις προτιμήσεις σας',
  personalInfo: 'Προσωπικές Πληροφορίες',
  changePassword: 'Αλλαγή Κωδικού',
  passwordSecurity: 'Κωδικός & Ασφάλεια',
  notificationPreferences: 'Προτιμήσεις Ειδοποιήσεων',
  appearance: 'Εμφάνιση',
  dangerZone: 'Ζώνη Κινδύνου',
  dangerWarning: 'Αυτές οι ενέργειες είναι μόνιμες και δεν μπορούν να αναιρεθούν. Παρακαλώ προχωρήστε με προσοχή.',
  deleteAccount: 'Διαγραφή Λογαριασμού',
  saveChanges: 'Αποθήκευση Αλλαγών',
  updatePassword: 'Ενημέρωση Κωδικού',
  savePreferences: 'Αποθήκευση Προτιμήσεων'
};

// Combine all translations
const translations = {
  English: englishTranslations,
  Filipino: filipinoTranslations,
  Waray: warayTranslations,
  Arabic: arabicTranslations,
  Greek: greekTranslations,
};

type TranslationKeys = keyof typeof englishTranslations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys) => string;
  getAvailableLanguages: (campus?: string) => Language[];
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

  // Get available languages based on campus
  const getAvailableLanguages = (campus?: string): Language[] => {
    if (!campus) return campusLanguageMap.default;
    return campusLanguageMap[campus] || campusLanguageMap.default;
  };

  // Update language in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getAvailableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}; 