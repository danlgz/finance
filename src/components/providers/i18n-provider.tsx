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
  const { i18n } = useTranslation();
  const { data: session, update: updateSession } = useSession();
  const [language, setLanguage] = useState<string>(i18n.language || 'en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar i18n al cargar el componente
  useEffect(() => {
    if (!isInitialized) {
      // Establecer idioma predeterminado si no está definido
      if (!i18n.language || i18n.language === 'dev') {
        i18n.changeLanguage('en').then(() => {
          setLanguage('en');
          setIsInitialized(true);
        });
      } else {
        setIsInitialized(true);
      }
    }
  }, [i18n, isInitialized]);

  // Detectar el idioma del usuario cuando se carga el componente
  useEffect(() => {
    if (!isInitialized) return;

    const fetchUserLanguage = async () => {
      try {
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
      } catch (error) {
        console.error('Error fetching user language:', error);
      }
    };

    fetchUserLanguage();
  }, [session?.user?.id, i18n, isInitialized]);

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

  if (!isInitialized) {
    return null; // No renderizar hasta que i18n esté inicializado
  }

  return (
    <I18nContext.Provider value={{ language, changeLanguage }}>
      {children}
    </I18nContext.Provider>
  );
} 