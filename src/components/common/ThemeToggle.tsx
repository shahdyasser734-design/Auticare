import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/useTheme';

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-full transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      aria-label="Toggle dark mode"
    >
      <div className="relative w-5 h-5">
        <Sun
          className={`absolute inset-0 w-full h-full transition-all duration-300 transform ${
            isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
          }`}
        />
        <Moon
          className={`absolute inset-0 w-full h-full transition-all duration-300 transform ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
          }`}
        />
      </div>
    </button>
  );
};
