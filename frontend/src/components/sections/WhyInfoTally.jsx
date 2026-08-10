import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, useSpring } from 'framer-motion';
import { Card } from '../ui/Card';
import { ShieldCheck, AlertCircle, FileSpreadsheet, FormInput, Database, Layers, ArrowRight } from 'lucide-react';

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

export const WhyInfoTally = () => {
  const containerRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);

  const timelineSteps = [
    {
      id: 'problems',
      title: 'Scattered Logs',
      subtitle: 'Manual workflows',
      description: 'Educators lose time copy-pasting grades between different sheets.',
      icon: AlertCircle,
      color: 'text-mutedGreen dark:text-softBlue'
    },
    {
      id: 'forms',
      title: 'Form Inputs',
      subtitle: 'Isolated surveys',
      description: 'Microsoft & Google Forms entries are kept locked in individual accounts.',
      icon: FormInput,
      color: 'text-mutedGreen dark:text-softBlue'
    },
    {
      id: 'spreadsheets',
      title: 'Excel Worksheets',
      subtitle: 'Outdated duplicates',
      description: 'Spreadsheets are modified locally, leading to sync conflicts.',
      icon: FileSpreadsheet,
      color: 'text-mutedGreen dark:text-softBlue'
    },
    {
      id: 'scattered',
      title: 'Scattered Data',
      subtitle: 'Isolated records',
      description: 'Department records remain offline, causing security risks.',
      icon: Layers,
      color: 'text-mutedGreen dark:text-softBlue'
    },
    {
      id: 'infotally',
      title: 'InfoTally Unify',
      subtitle: 'Central Hub',
      description: 'Unifies form entries and Excel uploads into single-workspace containers.',
      icon: Database,
      color: 'text-mutedGreen dark:text-softBlue'
    },
    {
      id: 'organized',
      title: 'All Structured',
      subtitle: 'Academic Clarity',
      description: 'Search instantly, audit role updates, and track profiles dynamically.',
      icon: ShieldCheck,
      color: 'text-primaryText dark:text-softBlue'
    }
  ];

  // Track scroll progress of the entire 220vh section container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth scroll coordinates to damp sudden scroll jumps and prevent timeline card jumps
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 26,
    mass: 1,
    restDelta: 0.001
  });

  const totalSteps = timelineSteps.length;

  // Track active index based on scroll progress to drive navigation dots
  useMotionValueEvent(smoothProgress, 'change', (latest) => {
    const index = Math.floor(latest * totalSteps);
    const clampedIndex = Math.max(0, Math.min(totalSteps - 1, index));
    setActiveStep(clampedIndex);
  });

  // Staggered horizontal transforms for each timeline step card (slides right-to-left) using monotonic offsets
  const stepOpacities = timelineSteps.map((_, idx) => {
    const range = getMonotonicRange(idx, totalSteps);
    // Lower surrounding card opacity to 0.20 to keep attention on active card
    return useTransform(smoothProgress, range, [0, 0.20, 1, 0.20, 0]);
  });

  const stepXs = timelineSteps.map((_, idx) => {
    const range = getMonotonicRange(idx, totalSteps);
    // Increase X offset to 370px to guarantee physical separation between cards
    return useTransform(smoothProgress, range, [510, 370, 0, -370, -510]);
  });

  const stepScales = timelineSteps.map((_, idx) => {
    const range = getMonotonicRange(idx, totalSteps);
    return useTransform(smoothProgress, range, [0.85, 0.92, 1, 0.92, 0.85]);
  });

  return (
    <section
      ref={containerRef}
      id="timeline"
      className="relative h-[220vh] bg-primaryBg dark:bg-[#0D0D0D] border-t border-primaryText/5 dark:border-[#557373]/20 select-none font-sans"
    >
      {/* Sticky Viewport Wrapper */}
      <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
        
        {/* Main Grid Container with margin offsets */}
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 xl:pl-44 w-full grid grid-cols-1 xl:grid-cols-12 gap-16 items-center">
          
          {/* Left Side Content - Fixed */}
          <div className="xl:col-span-4 text-left">
            <span className="text-[11px] font-bold text-mutedGreen tracking-widest uppercase block mb-3">
              WHY INFOTALLY?
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-serif font-bold text-primaryText dark:text-[#F2EFEA] leading-tight tracking-tight">
              Resolving the Academic Data Crisis
            </h2>
            <div className="w-12 h-[2px] bg-mutedGreen mt-4" />
          </div>

          {/* Right Side Demonstration Area */}
          <div className="xl:col-span-8 w-full flex flex-col gap-6 items-center">
            
            {/* Staggered progress row indicator */}
            <div className="flex items-center gap-3 md:gap-5 flex-wrap justify-start w-full max-w-xl mb-4 z-20 relative select-none">
              {timelineSteps.map((step, idx) => {
                const isActive = activeStep === idx;
                const isNeighbor = Math.abs(activeStep - idx) === 1;

                return (
                  <React.Fragment key={step.id}>
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

                    {idx < timelineSteps.length - 1 && (
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

            {/* Horizontal timeline step cards container */}
            <div className="w-full relative h-[440px] flex items-center justify-center overflow-hidden">
              {timelineSteps.map((step, idx) => {
                const IconComp = step.icon;
                const opacity = stepOpacities[idx];
                const x = stepXs[idx];
                const scale = stepScales[idx];

                return (
                  <motion.div
                    key={step.id}
                    style={{ opacity, x, scale }}
                    className="absolute w-full max-w-xl text-left"
                  >
                    <Card className="p-8 bg-primaryBg dark:bg-[#0D0D0D] border border-primaryText/10 dark:border-[#557373]/30 shadow-lg flex flex-col gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-warmWhite dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 flex items-center justify-center shadow-sm shrink-0">
                          <IconComp className={`w-5 h-5 ${step.color}`} />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono font-bold text-primaryText/40 dark:text-[#F2EFEA]/45 block">
                            Phase 0{idx + 1}
                          </span>
                          <h3 className="text-sm font-bold text-primaryText dark:text-[#F2EFEA] tracking-tight">
                            {step.title}
                          </h3>
                          <span className="text-[9.5px] font-medium text-mutedGreen block mt-0.5">
                            {step.subtitle}
                          </span>
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
