import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, useSpring } from 'framer-motion';
import { workflowCopy } from '../constants/workflow';
import { Card } from '../ui/Card';
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

export const Workflow = () => {
  const { sectionLabel, mainHeading, steps } = workflowCopy;
  const containerRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);

  // Track scroll progress of the entire 220vh section container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth scroll coordinates to damp sudden scroll jumps and prevent card teleportation
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 26,
    mass: 1,
    restDelta: 0.001
  });

  const totalSteps = steps.length;

  // Track active index based on scroll progress to drive navigation dots
  useMotionValueEvent(smoothProgress, 'change', (latest) => {
    const index = Math.floor(latest * totalSteps);
    const clampedIndex = Math.max(0, Math.min(totalSteps - 1, index));
    setActiveStep(clampedIndex);
  });

  // Generate vertical sliding and fading context mappings using smoothed progress
  const stepOpacities = steps.map((_, idx) => {
    const range = getMonotonicRange(idx, totalSteps);
    // Lower surrounding step opacity to 0.20 to keep attention on active step
    return useTransform(smoothProgress, range, [0, 0.20, 1, 0.20, 0]);
  });

  const stepYs = steps.map((_, idx) => {
    const range = getMonotonicRange(idx, totalSteps);
    // Increase offset to 230px to guarantee physical separation between stacked card blocks
    return useTransform(smoothProgress, range, [310, 230, 0, -230, -310]);
  });

  const stepScales = steps.map((_, idx) => {
    const range = getMonotonicRange(idx, totalSteps);
    return useTransform(smoothProgress, range, [0.85, 0.92, 1, 0.92, 0.85]);
  });

  // Strict visual bubble styling matching light/dark color mappings
  const getStepBubbleClasses = (idx) => {
    const mappings = [
      'bg-softBlue text-primaryText dark:bg-softBlue/10 dark:text-softBlue border border-black/5 dark:border-[#557373]/25',
      'bg-mutedGreen text-primaryBg dark:bg-mutedGreen dark:text-[#F2EFEA]',
      'bg-primaryText text-primaryBg dark:bg-softBlue dark:text-deepBlack',
      'bg-warmWhite text-primaryText dark:bg-softBlue/10 dark:text-softBlue border border-black/5 dark:border-[#557373]/25',
      'bg-primaryText text-primaryBg dark:bg-softBlue dark:text-deepBlack'
    ];
    return mappings[idx] || '';
  };

  return (
    <section
      ref={containerRef}
      id="workflow"
      className="relative h-[220vh] bg-primaryBg dark:bg-[#0D0D0D] border-t border-primaryText/5 dark:border-[#557373]/20 select-none font-sans"
    >
      {/* Sticky Viewport Wrapper */}
      <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
        
        {/* Main Grid Container with margin offsets */}
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 xl:pl-44 w-full grid grid-cols-1 xl:grid-cols-12 gap-16 items-center">
          
          {/* Left Side Content - Remains completely fixed */}
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
              {steps.map((step, idx) => {
                const isActive = activeStep === idx;
                const isNeighbor = Math.abs(activeStep - idx) === 1;

                return (
                  <React.Fragment key={step.number}>
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
                      {step.number}
                    </div>

                    {idx < steps.length - 1 && (
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

            {/* Vertically animated step cards container */}
            <div className="w-full relative h-[440px] flex items-center justify-center overflow-hidden">
              {steps.map((step, idx) => {
                const opacity = stepOpacities[idx];
                const y = stepYs[idx];
                const scale = stepScales[idx];

                return (
                  <motion.div
                    key={step.number}
                    style={{ opacity, y, scale }}
                    className="absolute w-full max-w-xl text-left"
                  >
                    <Card className="p-8 bg-primaryBg dark:bg-[#0D0D0D] border border-primaryText/10 dark:border-[#557373]/30 shadow-lg flex flex-col gap-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-serif text-sm font-bold ${getStepBubbleClasses(idx)}`}>
                          {step.number}
                        </div>
                        <div>
                          <span className="text-[9px] font-mono font-bold text-mutedGreen tracking-wider uppercase">
                            Step Focus
                          </span>
                          <h3 className="text-sm font-bold text-primaryText dark:text-[#F2EFEA] tracking-tight">
                            {step.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-[11.5px] leading-relaxed text-primaryText/60 dark:text-[#F2EFEA]/60">
                        {step.description}
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
