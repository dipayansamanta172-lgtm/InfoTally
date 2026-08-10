import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { sections } from '../constants/navigation';
import { useScrollSpy } from '../hooks/useScrollSpy';

export const LeftNav = () => {
  const sectionIds = sections.map((s) => s.id);
  
  // Custom scrollspy offset set to center of viewport (window.innerHeight / 2)
  const activeSectionId = useScrollSpy(sectionIds, typeof window !== 'undefined' ? window.innerHeight / 2 : 300);

  // Track window scroll progress for the active growing vertical line
  const { scrollYProgress } = useScroll();
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <nav
      className="fixed left-6 lg:left-12 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col gap-5 select-none font-sans"
      aria-label="Progress sidebar"
    >
      {/* Decorative vertical line connector */}
      <div className="absolute left-[5px] top-2 bottom-2 w-[1px] bg-primaryText/10 dark:bg-warmWhite/15 pointer-events-none">
        {/* Animated growing progress line */}
        <motion.div
          style={{ height: lineHeight }}
          className="w-full bg-mutedGreen origin-top"
        />
      </div>

      {sections.map((section) => {
        const isActive = activeSectionId === section.id;
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="flex items-center gap-4 group focus-visible:outline focus-visible:outline-1 focus-visible:outline-darkOlive dark:focus-visible:outline-softBlue rounded py-1 px-0.5 text-left"
            aria-current={isActive ? 'true' : undefined}
          >
            {/* Scroll Indicator Dot */}
            <span
              className={`w-[11px] h-[11px] rounded-full border-2 bg-primaryBg dark:bg-[#0D0D0D] transition-all duration-300 relative z-10 ${
                isActive
                  ? 'border-mutedGreen bg-mutedGreen scale-110'
                  : 'border-primaryText/25 dark:border-warmWhite/30 group-hover:border-primaryText/60 dark:group-hover:border-warmWhite/60'
              }`}
            />

            {/* Scroll Label */}
            <div className="flex flex-col">
              <span
                className={`text-[8px] font-mono leading-none transition-colors duration-200 uppercase tracking-widest ${
                  isActive
                    ? 'text-mutedGreen font-bold'
                    : 'text-primaryText/30 dark:text-[#F2EFEA]/30 group-hover:text-primaryText/60 dark:group-hover:text-[#F2EFEA]/60'
                }`}
              >
                {section.number}
              </span>
              <span
                className={`text-[10px] font-bold mt-0.5 tracking-tight transition-colors duration-200 ${
                  isActive
                    ? 'text-primaryText dark:text-[#F2EFEA] font-bold'
                    : 'text-primaryText/30 dark:text-[#F2EFEA]/30 group-hover:text-primaryText/60 dark:group-hover:text-[#F2EFEA]/60'
                }`}
              >
                {section.label}
              </span>
            </div>
          </a>
        );
      })}
    </nav>
  );
};
