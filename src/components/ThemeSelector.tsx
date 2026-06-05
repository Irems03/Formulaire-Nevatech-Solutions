/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';

export default function ThemeSelector() {
  const [themeSetting, setThemeSetting] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('nuvatech_theme_setting') as 'light' | 'dark' | 'system') || 'system';
  });

  useEffect(() => {
    const applyTheme = () => {
      let activeTheme: 'light' | 'dark' = 'dark';
      if (themeSetting === 'light') {
        activeTheme = 'light';
      } else if (themeSetting === 'dark') {
        activeTheme = 'dark';
      } else {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        activeTheme = isSystemDark ? 'dark' : 'light';
      }

      const root = document.documentElement;
      if (activeTheme === 'light') {
        root.classList.add('theme-light');
        root.classList.remove('theme-dark');
      } else {
        root.classList.add('theme-dark');
        root.classList.remove('theme-light');
      }
    };

    applyTheme();
    localStorage.setItem('nuvatech_theme_setting', themeSetting);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (localStorage.getItem('nuvatech_theme_setting') === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [themeSetting]);

  return (
    <div id="theme-selector-container" className="flex items-center gap-1 bg-[#141822]/80 border border-slate-800/80 p-1 rounded-xl text-xs w-full max-w-[240px] justify-between shadow-inner">
      <button
        onClick={() => setThemeSetting('light')}
        className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none ${
          themeSetting === 'light'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Mode Clair"
      >
        <Sun className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[10px] hidden sm:inline">Clair</span>
      </button>
      <button
        onClick={() => setThemeSetting('dark')}
        className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none ${
          themeSetting === 'dark'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Mode Sombre"
      >
        <Moon className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[10px] hidden sm:inline">Sombre</span>
      </button>
      <button
        onClick={() => setThemeSetting('system')}
        className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none ${
          themeSetting === 'system'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Thème Système Automatique"
      >
        <Laptop className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[10px] hidden sm:inline">Auto</span>
      </button>
    </div>
  );
}
