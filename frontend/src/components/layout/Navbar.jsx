import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { navLinks } from '../constants/navigation';
import { Button } from '../ui/Button';
import { Sun, Moon } from 'lucide-react';

export const Navbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cascading class changes to the root HTML tag for Tailwind dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 border-b ${
        isScrolled
          ? 'bg-primaryBg/80 dark:bg-[#0D0D0D]/80 backdrop-blur-md border-primaryText/10 dark:border-[#557373]/25 py-3'
          : 'bg-primaryBg dark:bg-[#0D0D0D] border-transparent py-5'
      }`}
      role="banner"
    >
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex items-center justify-between">
        {/* InfoTally Logo */}
        <a
          href="#home"
          className="flex items-center gap-2 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-primaryText dark:focus-visible:outline-softBlue rounded p-1"
          aria-label="InfoTally homepage"
        >
          <div className="flex items-end gap-[3px] h-4 select-none">
            <span className="w-[3px] h-2.5 bg-primaryText dark:bg-[#F2EFEA] rounded-sm"></span>
            <span className="w-[3px] h-4 bg-primaryText dark:bg-[#F2EFEA] rounded-sm"></span>
            <span className="w-[3px] h-1.5 bg-primaryText dark:bg-[#F2EFEA] rounded-sm"></span>
          </div>
          <span className="font-serif font-bold text-lg text-primaryText dark:text-[#F2EFEA] tracking-tight">
            InfoTally
          </span>
        </a>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-semibold text-primaryText/60 dark:text-[#F2EFEA]/60 hover:text-primaryText dark:hover:text-[#F2EFEA] transition-colors font-sans focus-visible:outline focus-visible:outline-1 focus-visible:outline-primaryText dark:focus-visible:outline-softBlue rounded px-1"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Auth Buttons & Theme Toggle */}
        <div className="flex items-center gap-4">
          {/* Minimalist Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded text-primaryText/50 dark:text-[#F2EFEA]/50 hover:text-primaryText dark:hover:text-[#F2EFEA] hover:bg-warmWhite/20 dark:hover:bg-[#161616]/40 transition-all focus-visible:outline focus-visible:outline-1 focus-visible:outline-primaryText dark:focus-visible:outline-softBlue"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 stroke-[1.8]" />
            ) : (
              <Sun className="w-4 h-4 stroke-[1.8]" />
            )}
          </button>

          <Button
            variant="text"
            className="text-xs font-semibold text-primaryText/70 dark:text-[#F2EFEA]/70 hover:text-primaryText dark:hover:text-[#F2EFEA] focus-visible:outline-primaryText dark:focus-visible:outline-softBlue py-2 px-3"
            onClick={() => navigate('/sign-in')}
          >
            Sign In
          </Button>
          <Button
            variant="primary"
            className="text-xs font-semibold px-4 py-2 dark:bg-[#DFE5F3] dark:text-[#0D0D0D] dark:hover:opacity-90 focus-visible:outline-primaryText dark:focus-visible:outline-softBlue"
            onClick={() => navigate('/request-access')}
          >
            Request Access
          </Button>
        </div>
      </div>
    </header>
  );
};
