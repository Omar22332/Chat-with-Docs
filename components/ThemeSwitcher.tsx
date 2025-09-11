/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Sun, Moon } from 'lucide-react';

type Theme = 'light' | 'dark';

interface ThemeSwitcherProps {
  theme: Theme;
  onToggleTheme: () => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, onToggleTheme }) => {
  return (
    <button
      onClick={onToggleTheme}
      className="p-1.5 text-gray-500 dark:text-[#A8ABB4] hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
};

export default ThemeSwitcher;
