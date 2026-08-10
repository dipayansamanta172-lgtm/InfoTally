import React, { useRef } from 'react';
import { useScroll, useSpring } from 'framer-motion';
import { DashboardPreview } from '../dashboard/DashboardPreview';

export const Preview = () => {
  const sectionRef = useRef(null);

  // Track scroll coordinates of the entire 180vh dashboard preview container
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Smooth scroll coordinates to damp sudden scroll jumps and prevent dashboard transitions teleportation
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 26,
    mass: 1,
    restDelta: 0.001
  });

  return (
    <section
      id="preview"
      ref={sectionRef}
      className="relative h-[180vh] bg-primaryBg dark:bg-[#0D0D0D] border-t border-primaryText/5 dark:border-[#557373]/20 select-none font-sans"
    >
      {/* Sticky Viewport Wrapper */}
      <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
        
        {/* Main Grid Container with margin offsets to clear LeftNav */}
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 xl:pl-44 w-full grid grid-cols-1 xl:grid-cols-12 gap-16 items-center">
          
          {/* Left Side Content - Fixed */}
          <div className="xl:col-span-4 text-left flex flex-col gap-5 pr-4">
            <span className="text-[11px] font-bold text-mutedGreen tracking-widest uppercase block">
              PRODUCT DEMO
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-serif font-bold text-primaryText dark:text-[#F2EFEA] leading-[1.15] tracking-tight">
              Built for educators.<br />
              Designed for clarity.
            </h2>
            <p className="text-sm text-primaryText/60 dark:text-[#F2EFEA]/60 leading-relaxed font-normal mt-2 max-w-sm">
              Watch as InfoTally dynamically links spreadsheets, connects forms, syncs student records, runs typed filters, and expands profiles—all driven dynamically by your scrolling.
            </p>
          </div>

          {/* Right Side Demonstration Area - Scroll-progress dashboard */}
          <div className="xl:col-span-8 w-full flex justify-center">
            <div className="w-full xl:max-w-none max-w-5xl">
              <DashboardPreview 
                scrollProgress={smoothProgress} 
                className="border border-mutedGreen/15 dark:border-[#557373]/20 shadow-[0_8px_30px_rgba(13,13,13,0.03)]" 
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
