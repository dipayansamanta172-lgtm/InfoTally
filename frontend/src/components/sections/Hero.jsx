import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { DashboardPreview } from '../dashboard/DashboardPreview';
import { ArrowUpRight } from 'lucide-react';
import { textEntranceVariants, dashboardEntranceVariants } from '../../animations/heroVariants';

export const Hero = () => {
  return (
    <section
      id="home"
      className="min-h-screen pt-36 pb-24 flex items-center bg-primaryBg dark:bg-[#0D0D0D] font-sans relative overflow-hidden select-none"
    >
      {/* Container with grid margin offsets to prevent LeftNav overlaps */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 xl:pl-44 w-full grid grid-cols-1 xl:grid-cols-12 gap-16 items-center">
        
        {/* Left Copy Container with increased whitespace/spacing */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="xl:col-span-5 flex flex-col text-left gap-8 xl:pr-6"
        >
          {/* Main Headline */}
          <motion.h1
            custom={0}
            variants={textEntranceVariants}
            className="text-4xl sm:text-5xl lg:text-[56px] font-serif font-bold text-primaryText dark:text-[#F2EFEA] leading-[1.08] tracking-tight whitespace-pre-line"
          >
            Organize.<br />
            Search.<br />
            Manage.<br />
            <span className="text-mutedGreen italic font-normal">Academic Data.</span>
          </motion.h1>

          {/* Subheading text with larger breathing room margin */}
          <motion.p
            custom={1}
            variants={textEntranceVariants}
            className="text-sm sm:text-base text-primaryText/60 dark:text-[#F2EFEA]/60 max-w-lg leading-relaxed font-normal mt-2"
          >
            InfoTally helps educators collect, organize, and manage student information from Microsoft Forms, Google Forms, and Excel — all in one secure workspace.
          </motion.p>

          {/* Button actions with spacing */}
          <motion.div
            custom={2}
            variants={textEntranceVariants}
            className="flex items-center gap-4 mt-4"
          >
            <Button
              variant="primary"
              size="lg"
              icon={ArrowUpRight}
              className="text-xs font-bold px-6 py-3.5 rounded"
              onClick={() => window.location.href = '#cta'}
            >
              Request Access
            </Button>
            <Button
              variant="secondary"
              size="lg"
              icon={ArrowUpRight}
              className="text-xs font-bold px-6 py-3.5 rounded border border-black/5 dark:border-[#557373]/25"
              onClick={() => window.location.href = '#cta'}
            >
              Sign In
            </Button>
          </motion.div>
        </motion.div>

        {/* Right Dashboard Preview widget */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={dashboardEntranceVariants}
          className="xl:col-span-7 w-full flex justify-center"
        >
          <div className="w-full xl:max-w-none max-w-4xl">
            <DashboardPreview className="border border-primaryText/10 dark:border-[#557373]/25 shadow-[0_8px_30px_rgba(13,13,13,0.04)]" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
