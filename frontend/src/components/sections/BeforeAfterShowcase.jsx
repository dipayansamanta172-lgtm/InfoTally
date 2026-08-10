import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Card } from '../ui/Card';
import { FileSpreadsheet, FormInput, ArrowRight, Layers, FileCheck } from 'lucide-react';

export const BeforeAfterShowcase = () => {
  const containerRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
    const handler = (e) => setReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Track scroll coordinates relative to section bounds
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Scattered items translate toward center folder
  // Excel File
  const excelX = useTransform(scrollYProgress, [0.25, 0.55], [-120, 0]);
  const excelY = useTransform(scrollYProgress, [0.25, 0.55], [-60, 0]);
  const excelOpacity = useTransform(scrollYProgress, [0.25, 0.45, 0.55], [0.7, 0.9, 0]);

  // Google Forms
  const formsX = useTransform(scrollYProgress, [0.25, 0.55], [-160, 0]);
  const formsY = useTransform(scrollYProgress, [0.25, 0.55], [40, 0]);
  const formsOpacity = useTransform(scrollYProgress, [0.25, 0.45, 0.55], [0.7, 0.9, 0]);

  // Microsoft Forms
  const msX = useTransform(scrollYProgress, [0.25, 0.55], [-80, 0]);
  const msY = useTransform(scrollYProgress, [0.25, 0.55], [90, 0]);
  const msOpacity = useTransform(scrollYProgress, [0.25, 0.45, 0.55], [0.7, 0.9, 0]);

  // Unified Container Card animation (scales up as items merge)
  const unifiedScale = useTransform(scrollYProgress, [0.5, 0.7], [0.92, 1.05]);
  const unifiedBorder = useTransform(scrollYProgress, [0.5, 0.7], ['rgba(85,115,115,0.1)', 'rgba(85,115,115,0.4)']);

  const withoutItems = [
    'Multiple disconnected Excel worksheets',
    'Google Forms submissions in detached tabs',
    'Microsoft Forms registers in isolated links',
    'Scattered databases with duplicate profiles',
    'Slow manual searching across multiple folders'
  ];

  const withItems = [
    'One unified institutional workspace',
    'One high-performance search across all metrics',
    'Structured student profiles & mapping lists',
    'Secure role-based permissions and audits',
    'Tactile, performant web interactions'
  ];

  // Animation variants for gradual reveal of cards as user scrolls into view
  const cardEntranceVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: (customDelay) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: customDelay }
    })
  };

  return (
    <section
      id="comparison"
      ref={containerRef}
      className="min-h-screen py-24 flex items-center bg-primaryBg dark:bg-[#0D0D0D] border-t border-primaryText/5 dark:border-[#557373]/20 font-sans relative select-none"
    >
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 xl:pl-44 w-full flex flex-col gap-12">
        {/* Title */}
        <div className="text-center md:text-left max-w-xl">
          <span className="text-[11px] font-bold text-mutedGreen tracking-widest uppercase block mb-3">
            THE TRANSFORMATION
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-primaryText dark:text-[#F2EFEA] leading-tight tracking-tight">
            Before vs After InfoTally
          </h2>
          <div className="w-12 h-[2px] bg-mutedGreen mt-4" />
        </div>

        {/* Showcase Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Side: Without InfoTally (Reveal first) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            variants={cardEntranceVariants}
            className="xl:col-span-4 flex flex-col justify-center bg-warmWhite/20 dark:bg-darkCardBg border border-primaryText/5 dark:border-[#557373]/25 rounded-lg p-6 sm:p-8"
          >
            <h3 className="text-sm font-bold text-primaryText/50 dark:text-[#F2EFEA]/50 uppercase tracking-wider mb-6 flex items-center gap-2">
              <span>Without InfoTally</span>
            </h3>
            <ul className="flex flex-col gap-4 text-left">
              {withoutItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primaryText/30 dark:bg-[#F2EFEA]/30 mt-2 shrink-0" />
                  <span className="text-[11.5px] leading-relaxed text-primaryText/60 dark:text-[#F2EFEA]/60 font-medium">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Center Graphic: Scrollytelling Merge (Reveal second) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0.15}
            variants={cardEntranceVariants}
            className="xl:col-span-4 min-h-[300px] bg-warmWhite/50 dark:bg-darkCardBg border border-primaryText/5 dark:border-[#557373]/25 rounded-lg p-6 flex flex-col items-center justify-center relative overflow-hidden"
          >
            {/* Visual convergence */}
            {reduceMotion ? (
              <div className="flex flex-col items-center gap-4">
                <FileSpreadsheet className="w-8 h-8 text-mutedGreen" />
                <ArrowRight className="w-4 h-4 text-primaryText/30 dark:text-[#F2EFEA]/30 rotate-90" />
                <div className="p-4 rounded border border-mutedGreen/30 bg-primaryBg dark:bg-[#0D0D0D]">
                  <FileCheck className="w-8 h-8 text-mutedGreen" />
                </div>
              </div>
            ) : (
              <div className="w-full h-64 relative flex items-center justify-center">
                {/* Scattered Inputs (moving towards center folder) */}
                <motion.div
                  style={{ x: excelX, y: excelY, opacity: excelOpacity }}
                  className="absolute p-3 rounded-full bg-softBlue dark:bg-[#0D0D0D] text-[#557373] dark:text-softBlue shadow-sm select-none"
                >
                  <FileSpreadsheet className="w-5 h-5 stroke-[2]" />
                </motion.div>

                <motion.div
                  style={{ x: formsX, y: formsY, opacity: formsOpacity }}
                  className="absolute p-3 rounded-full bg-softBlue dark:bg-[#0D0D0D] text-[#557373] dark:text-softBlue shadow-sm select-none"
                >
                  <FormInput className="w-5 h-5 stroke-[2]" />
                </motion.div>

                <motion.div
                  style={{ x: msX, y: msY, opacity: msOpacity }}
                  className="absolute p-3 rounded-full bg-softBlue dark:bg-[#0D0D0D] text-[#557373] dark:text-softBlue shadow-sm select-none"
                >
                  <Layers className="w-5 h-5 stroke-[2]" />
                </motion.div>

                {/* Central Folder Container */}
                <motion.div
                  style={{ scale: unifiedScale, borderColor: unifiedBorder }}
                  className="w-20 h-20 rounded-2xl bg-[#FFFFFF] dark:bg-[#0D0D0D] border flex items-center justify-center shadow-md relative z-10"
                >
                  <FileCheck className="w-8 h-8 text-mutedGreen" />
                </motion.div>
                
                <span className="absolute bottom-2 text-[9px] font-bold text-mutedGreen tracking-widest uppercase">
                  Scroll down to unify
                </span>
              </div>
            )}
          </motion.div>

          {/* Right Side: With InfoTally (Reveal third) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0.3}
            variants={cardEntranceVariants}
            className="xl:col-span-4 flex flex-col justify-center bg-softBlue/10 dark:bg-darkCardBg border border-mutedGreen/10 dark:border-[#557373]/25 rounded-lg p-6 sm:p-8"
          >
            <h3 className="text-sm font-bold text-mutedGreen uppercase tracking-wider mb-6 flex items-center gap-2">
              <span>With InfoTally</span>
            </h3>
            <ul className="flex flex-col gap-4 text-left">
              {withItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-mutedGreen mt-2 shrink-0" />
                  <span className="text-[11.5px] leading-relaxed text-primaryText/70 dark:text-[#F2EFEA]/80 font-semibold">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
