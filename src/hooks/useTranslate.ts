import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { I18nContext } from '@/components/providers/i18n-provider';

export function useTranslate() {
  const { t } = useTranslation();
  const { language, changeLanguage } = useContext(I18nContext);
  
  // Función para traducir textos con variables
  const translate = (key: string, options?: Record<string, string | number>) => {
    return t(key, options);
  };
  
  return {
    t: translate,
    language,
    changeLanguage,
  };
} 