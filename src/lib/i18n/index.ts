import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar los recursos de traducción
import enCommon from './locales/en.json';
import esCommon from './locales/es.json';

const resources = {
  en: {
    translation: enCommon,
    common: enCommon.common,
    dashboard: enCommon.dashboard,
    budgets: enCommon.budgets,
    households: enCommon.households,
    profile: enCommon.profile,
    expenses: {} // Se cargará dinámicamente
  },
  es: {
    translation: esCommon,
    common: esCommon.common,
    dashboard: esCommon.dashboard,
    budgets: esCommon.budgets,
    households: esCommon.households,
    profile: esCommon.profile,
    expenses: {} // Se cargará dinámicamente
  }
};

// Cargar traducciones de archivos JSON
try {
  fetch('/locales/en/expenses.json')
    .then(response => response.json())
    .then(data => {
      resources.en.expenses = data;
    });
    
  fetch('/locales/es/expenses.json')
    .then(response => response.json())
    .then(data => {
      resources.es.expenses = data;
    });
} catch (error) {
  console.error('Error cargando traducciones:', error);
}

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
    ns: ['translation', 'common', 'dashboard', 'budgets', 'households', 'profile', 'expenses'],
    defaultNS: 'translation',
    
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