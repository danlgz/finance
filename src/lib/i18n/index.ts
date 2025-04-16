import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

type Resources = {
  [key in 'en' | 'es']: {
    [key in 'common' | 'dashboard' | 'budgets' | 'households' | 'profile' | 'expenses']: Record<string, unknown>;
  };
};

const resources: Resources = {
  en: {
    common: {},
    dashboard: {},
    budgets: {},
    households: {},
    profile: {},
    expenses: {}
  },
  es: {
    common: {},
    dashboard: {},
    budgets: {},
    households: {},
    profile: {},
    expenses: {}
  }
};

// Cargar traducciones de archivos JSON
const loadTranslations = async () => {
  try {
    const translationModules = ['common', 'dashboard', 'budgets', 'households', 'profile', 'expenses'] as const;
    const languages = ['en', 'es'] as const;

    for (const lang of languages) {
      for (const translationModule of translationModules) {
        const response = await fetch(`/locales/${lang}/${translationModule}.json`);
        if (response.ok) {
          const data = await response.json();
          resources[lang][translationModule] = data;
        }
      }
    }
  } catch (error) {
    console.error('Error loading translations:', error);
  }
};

loadTranslations();

// Inicializar i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    // Para permitir acceso tanto a través de namespaces como directamente
    // Esto permite que t('common.dashboard') funcione y también profile.title
    ns: ['common', 'dashboard', 'budgets', 'households', 'profile', 'expenses'],
    defaultNS: 'common',
    
    interpolation: {
      escapeValue: false, // React ya escapa los valores
    },
    
    // Configuración para compatibilidad
    react: {
      useSuspense: false,
    },
    
    keySeparator: '.',
    nsSeparator: ':',
  });

export default i18n; 