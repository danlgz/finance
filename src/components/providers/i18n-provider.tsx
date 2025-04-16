'use client';

import { createContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import '../../lib/i18n'; // Importa la configuración de i18n

interface I18nContextType {
  language: string;
  changeLanguage: (lang: string) => Promise<void>;
}

export const I18nContext = createContext<I18nContextType>({
  language: 'en',
  changeLanguage: async () => {},
});

export default function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { i18n } = useTranslation(['common', 'dashboard', 'budgets', 'households', 'profile', 'expenses']);
  const { data: session, update: updateSession } = useSession();
  const [language, setLanguage] = useState<string>(i18n.language || 'en');
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar i18n al cargar el componente
  useEffect(() => {
    const initializeI18n = async () => {
      try {
        // Establecer idioma predeterminado si no está definido
        if (!i18n.language || i18n.language === 'dev') {
          await i18n.changeLanguage('en');
          setLanguage('en');
        }

        // Si hay un usuario autenticado, intenta obtener su idioma
        if (session?.user?.id) {
          const response = await fetch('/api/user');
          if (response.ok) {
            const data = await response.json();
            if (data.language && data.language !== i18n.language) {
              await i18n.changeLanguage(data.language);
              setLanguage(data.language);
            }
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing i18n:', error);
        setIsLoading(false);
      }
    };

    initializeI18n();
  }, [i18n, session?.user?.id]);

  // Función para cambiar el idioma y actualizar la preferencia del usuario
  const changeLanguage = async (lang: string) => {
    try {
      // Cambiar el idioma en i18n
      await i18n.changeLanguage(lang);
      setLanguage(lang);

      // Si hay un usuario autenticado, actualizar su preferencia en el servidor
      if (session?.user?.id) {
        const response = await fetch('/api/user/language', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ language: lang }),
        });

        if (response.ok) {
          // Actualizar la sesión local
          await updateSession({
            user: {
              ...session.user,
              language: lang,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <I18nContext.Provider value={{ language, changeLanguage }}>
      {children}
    </I18nContext.Provider>
  );
} 