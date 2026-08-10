import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { featuresCopy } from '../constants/features';
import { hoverCardVariants } from '../../animations/cardVariants';
import * as LucideIcons from 'lucide-react';

export const Features = () => {
  const { sectionLabel, mainHeading, items } = featuresCopy;

  const listContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const cardEntranceVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section
      id="features"
      className="min-h-screen py-24 flex items-center bg-primaryBg dark:bg-[#0D0D0D] border-t border-primaryText/5 dark:border-[#557373]/20 font-sans relative select-none"
    >
      {/* Container with grid margin offsets to prevent LeftNav overlaps */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 xl:pl-44 w-full grid grid-cols-1 xl:grid-cols-12 gap-16 items-start">
        {/* Left Header Panel (Entrance animation) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="xl:col-span-4 text-left"
        >
          <span className="text-[11px] font-bold text-mutedGreen tracking-widest uppercase block mb-3">
            {sectionLabel}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-serif font-bold text-primaryText dark:text-[#F2EFEA] leading-[1.15] tracking-tight whitespace-pre-line">
            {mainHeading}
          </h2>
          <div className="w-12 h-[2px] bg-mutedGreen mt-6" />
        </motion.div>

        {/* Right Feature Cards List (Staggered layered entrance) */}
        <motion.div
          variants={listContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {items.map((item) => {
            const IconComponent = LucideIcons[item.iconName] || LucideIcons.HelpCircle;

            return (
              <motion.div
                key={item.id}
                variants={cardEntranceVariants}
                className="h-full"
              >
                {/* Scale animation on hover */}
                <motion.div
                  initial="initial"
                  whileHover="hover"
                  variants={hoverCardVariants}
                  className="h-full"
                >
                  <Card className="p-6 h-full flex flex-col items-start text-left justify-between hover:shadow-[0_4px_16px_rgba(13,13,13,0.02)]">
                    <div>
                      {/* Minimalist Icon */}
                      <div className="p-3 rounded bg-softBlue dark:bg-[#0D0D0D] text-mutedGreen dark:text-softBlue mb-6 select-none w-fit border border-black/5 dark:border-[#557373]/20">
                        <IconComponent className="w-5 h-5 stroke-[1.8]" />
                      </div>

                      <h3 className="text-sm font-bold text-primaryText dark:text-[#F2EFEA] mb-2 tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-[11.5px] leading-relaxed text-primaryText/60 dark:text-[#F2EFEA]/60">
                        {item.description}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
