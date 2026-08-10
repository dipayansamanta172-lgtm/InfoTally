import React from 'react';
import { footerLinks } from '../constants/navigation';

export const Footer = () => {
  return (
    <footer
      className="bg-primaryBg dark:bg-[#0D0D0D] border-t border-primaryText/10 dark:border-[#557373]/20 py-12 font-sans select-none"
      role="contentinfo"
    >
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-8 text-left">
        {/* Left Side: Brand and Copyright */}
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-[3px] h-3.5 select-none">
              <span className="w-[3px] h-2.5 bg-primaryText dark:bg-[#F2EFEA] rounded-sm"></span>
              <span className="w-[3px] h-4 bg-primaryText dark:bg-[#F2EFEA] rounded-sm"></span>
              <span className="w-[3px] h-1.5 bg-primaryText dark:bg-[#F2EFEA] rounded-sm"></span>
            </div>
            <span className="font-serif font-bold text-sm text-primaryText dark:text-[#F2EFEA] tracking-tight">
              InfoTally
            </span>
          </div>
          <span className="text-[10px] text-primaryText/40 dark:text-[#F2EFEA]/45">
            © 2026 InfoTally. All rights reserved.
          </span>
        </div>

        {/* Center Side: Core Sections */}
        <nav className="flex items-center gap-6 flex-wrap justify-center" aria-label="Footer Primary">
          {footerLinks.primary.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[10px] font-bold text-primaryText/50 dark:text-[#F2EFEA]/50 hover:text-primaryText dark:hover:text-[#F2EFEA] uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-darkOlive dark:focus-visible:outline-softBlue rounded px-1"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Side: Policy Links */}
        <nav className="flex items-center gap-6" aria-label="Footer Secondary">
          {footerLinks.secondary.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[10px] font-semibold text-primaryText/50 dark:text-[#F2EFEA]/50 hover:text-primaryText dark:hover:text-[#F2EFEA] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-darkOlive dark:focus-visible:outline-softBlue rounded px-1"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
};
