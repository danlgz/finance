'use client';

import React, { createContext, useEffect, useState } from 'react';

export const ThemeContext = createContext({
  isDark: false,
  forceDark: () => {},
  forceLight: () => {},
});

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDark, setIsDark] = useState(false);

  // Force dark mode for testing
  useEffect(() => {
    document.documentElement.classList.add('dark');
    setIsDark(true);
    
    // Comment this section for now to test dark mode
    // // Add listener for system theme changes
    // const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    // 
    // // Initial theme detection
    // if (mediaQuery.matches) {
    //   document.documentElement.classList.add('dark');
    //   setIsDark(true);
    // } else {
    //   document.documentElement.classList.remove('dark');
    //   setIsDark(false);
    // }
    // 
    // // Listen for changes
    // const handleChange = (e: MediaQueryListEvent) => {
    //   if (e.matches) {
    //     document.documentElement.classList.add('dark');
    //     setIsDark(true);
    //   } else {
    //     document.documentElement.classList.remove('dark');
    //     setIsDark(false);
    //   }
    // };
    // 
    // mediaQuery.addEventListener('change', handleChange);
    // 
    // // Cleanup
    // return () => {
    //   mediaQuery.removeEventListener('change', handleChange);
    // };
  }, []);

  const forceDark = () => {
    document.documentElement.classList.add('dark');
    setIsDark(true);
  };

  const forceLight = () => {
    document.documentElement.classList.remove('dark');
    setIsDark(false);
  };

  return (
    <ThemeContext.Provider value={{ isDark, forceDark, forceLight }}>
      {children}
    </ThemeContext.Provider>
  );
} 