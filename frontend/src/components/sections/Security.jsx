import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, useSpring } from 'framer-motion';
import { Card } from '../ui/Card';
import { securityCopy } from '../constants/security';
import * as LucideIcons from 'lucide-react';
import { ArrowRight } from 'lucide-react';

// Generates valid, strictly increasing monotonic ranges between 0.0 and 1.0 to prevent Framer Motion offset errors
const getMonotonicRange = (idx, total) => {
  const stepWidth = 1 / total;
  const center = (idx + 0.5) * stepWidth;
  
  let p0 = center - 1.5 * stepWidth;
  let p1 = center - stepWidth;
  let p2 = center;
  let p3 = center + stepWidth;
  let p4 = center + 1.5 * stepWidth;
  
  // Shift window horizontally if bounds overflow [0, 1]
  if (p0 < 0) {
    const shift = -p0;
    p0 += shift;
    p1 += shift;
    p2 += shift;
    p3 += shift;
    p4 += shift;
  } else if (p4 > 1) {
    const shift = p4 - 1;
    p0 -= shift;
    p1 -= shift;
    p2 -= shift;
    p3 -= shift;
    p4 -= shift;
  }
  
  // Enforce mathematical monotonicity
  p0 = Math.max(0, p0);
  p1 = Math.max(p0 + 0.001, p1);
  p2 = Math.max(p1 + 0.001, p2);
  p3 = Math.max(p2 + 0.001, p3);
  p4 = Math.min(1.0, Math.max(p3 + 0.001, p4));
  
  return [p0, p1, p2, p3, p4];
};

export const Security = () => {
  const { sectionLabel, mainHeading, items } = securityCopy;
  const containerRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);

  // Track scroll progress of the entire 180vh section container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth scroll coordinates to damp sudden scroll jumps and prevent security deck teleportation
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 26,
    mass: 1,
    restDelta: 0.001
  });

  const totalItems = items.length;

  // Track active index based on scroll progress to drive navigation dots
  useMotionValueEvent(smoothProgress, 'change', (latest) => {
    const index = Math.floor(latest * totalItems);
    const clampedIndex = Math.max(0, Math.min(totalItems - 1, index));
    setActiveStep(clampedIndex);
  });

  // Staggered stacked-deck transitions for each security pillar card using smoothed progress
  const cardOpacities = items.map((_, idx) => {
    const range = getMonotonicRange(idx, totalItems);
    // Exit quickly: fade previous card to 0 before next card peaks to avoid double text reading
    return useTransform(smoothProgress, range, [0, 0.15, 1, 0, 0]);
  });

  const cardYs = items.map((_, idx) => {
    const range = getMonotonicRange(idx, totalItems);
    // Stacked underneath offset at positive 16px, center at 0, exiting up offset at negative 16px
    return useTransform(smoothProgress, range, [40, 16, 0, -16, -40]);
  });

  const cardScales = items.map((_, idx) => {
    const range = getMonotonicRange(idx, totalItems);
    // Scale up from 0.92 (underneath) -> 1.0 (focus) -> 1.06 (above)
    return useTransform(smoothProgress, range, [0.86, 0.92, 1, 1.06, 1.12]);
  });

  const cardZIndices = items.map((_, idx) => {
    const range = getMonotonicRange(idx, totalItems);
    const center = range[2];
    const leftBound = range[1];
    const rightBound = range[3];

    // Active card has highest priority (20), stacked below has 10, exited has 5
    return useTransform(
      smoothProgress,
      [leftBound, center, rightBound],
      [10, 20, 5]
    );
  });

  return (
    <section
      ref={containerRef}
      id="security"
      className="relative h-[180vh] bg-primaryBg dark:bg-[#0D0D0D] border-t border-primaryText/5 dark:border-[#557373]/20 select-none font-sans"
    >
      {/* Sticky Viewport Wrapper */}
      <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
        
        {/* Main Grid Container with margin offsets */}
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 xl:pl-44 w-full grid grid-cols-1 xl:grid-cols-12 gap-16 items-center">
          
          {/* Left Side Content - Fixed */}
          <div className="xl:col-span-4 text-left">
            <span className="text-[11px] font-bold text-mutedGreen tracking-widest uppercase block mb-3">
              {sectionLabel}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-serif font-bold text-primaryText dark:text-[#F2EFEA] leading-[1.15] tracking-tight whitespace-pre-line">
              {mainHeading}
            </h2>
            <div className="w-12 h-[2px] bg-mutedGreen mt-6" />
          </div>

          {/* Right Side Demonstration Area */}
          <div className="xl:col-span-8 w-full flex flex-col gap-6 items-center">
            
            {/* Staggered progress row indicator */}
            <div className="flex items-center gap-3 md:gap-5 flex-wrap justify-start w-full max-w-xl mb-4 z-20 relative select-none">
              {items.map((item, idx) => {
                const isActive = activeStep === idx;
                const isNeighbor = Math.abs(activeStep - idx) === 1;

                return (
                  <React.Fragment key={item.id}>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-serif text-xs font-bold transition-all duration-300 ${
                        isActive
                          ? 'bg-mutedGreen text-primaryBg dark:bg-softBlue dark:text-[#0D0D0D] ring-4 ring-mutedGreen/10 scale-110'
                          : 'bg-warmWhite dark:bg-darkCardBg text-primaryText/40 dark:text-[#F2EFEA]/45 border border-black/5 dark:border-[#557373]/20'
                      } ${
                        isActive 
                          ? 'opacity-100' 
                          : isNeighbor 
                            ? 'opacity-40' 
                            : 'opacity-25'
                      }`}
                    >
                      0{idx + 1}
                    </div>

                    {idx < items.length - 1 && (
                      <ArrowRight
                        className={`w-3.5 h-3.5 stroke-[1.5] transition-opacity duration-300 ${
                          isActive || (activeStep > idx)
                            ? 'text-primaryText/40 dark:text-[#F2EFEA]/45 opacity-60'
                            : 'text-primaryText/15 dark:text-[#F2EFEA]/15 opacity-25'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Stacked deck scrollytelling cards container */}
            <div className="w-full relative h-[380px] flex items-center justify-center overflow-hidden">
              {items.map((item, idx) => {
                const IconComponent = LucideIcons[item.iconName] || LucideIcons.Shield;
                const opacity = cardOpacities[idx];
                const y = cardYs[idx];
                const scale = cardScales[idx];
                const zIndex = cardZIndices[idx];

                return (
                  <motion.div
                    key={item.id}
                    style={{ opacity, y, scale, zIndex }}
                    className="absolute w-full max-w-xl text-left"
                  >
                    <Card className="p-8 bg-primaryBg dark:bg-[#0D0D0D] border border-primaryText/10 dark:border-[#557373]/30 shadow-lg flex flex-col gap-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded bg-softBlue dark:bg-darkCardBg text-mutedGreen dark:text-softBlue w-fit border border-black/5 dark:border-[#557373]/25">
                          <IconComponent className="w-6 h-6 stroke-[1.8]" />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono font-bold text-mutedGreen tracking-wider uppercase">
                            Security Pillar
                          </span>
                          <h3 className="text-sm font-bold text-primaryText dark:text-[#F2EFEA] tracking-tight">
                            {item.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-[11.5px] leading-relaxed text-primaryText/60 dark:text-[#F2EFEA]/60">
                        {item.description}
                      </p>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
