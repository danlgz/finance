'use client';

import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useContext } from 'react';
import { ThemeContext } from './providers/theme-provider';

export function ThemeToggle() {
  const { isDark, forceDark, forceLight } = useContext(ThemeContext);

  const toggleTheme = () => {
    if (isDark) {
      forceLight();
    } else {
      forceDark();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
} 