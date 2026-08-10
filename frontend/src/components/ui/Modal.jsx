import React from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          {/* Backdrop (solid translucent shade) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0d0d0d]/30 dark:bg-[#000000]/60 backdrop-blur-[2px]"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`relative z-10 w-full max-w-md bg-primaryBg dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 rounded p-6 shadow-lg ${className}`}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-primaryText/5 dark:border-[#557373]/20">
              {title && (
                <h3 className="text-sm font-bold text-primaryText dark:text-[#F2EFEA] tracking-wide uppercase">
                  {title}
                </h3>
              )}
              <button
                onClick={onClose}
                className="text-primaryText/40 hover:text-primaryText/80 dark:text-[#F2EFEA]/45 dark:hover:text-[#F2EFEA] transition-colors p-1 rounded focus-visible:outline focus-visible:outline-1 focus-visible:outline-primaryText dark:focus-visible:outline-softBlue"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Body */}
            <div className="text-primaryText dark:text-[#F2EFEA]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
