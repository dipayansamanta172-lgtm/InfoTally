import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, Loader2, X } from 'lucide-react';
import { Button } from './Button';

export const AlertModal = ({
  isOpen,
  onClose,
  type = 'alert', // 'confirm' | 'success' | 'alert' | 'loading'
  title,
  message,
  bullets = [],
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  autoCloseMs,
}) => {
  // Auto-close handler for success or toast alerts
  useEffect(() => {
    if (isOpen && autoCloseMs && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseMs, onClose]);

  return (
    <AnimatePresence>
      {isOpen && message && String(message).trim() !== '' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans select-none">
          {/* Backdrop Blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={type !== 'loading' ? onClose : undefined}
            className="absolute inset-0 bg-[#0D0D0D]/30 dark:bg-[#000000]/60 backdrop-blur-[4px]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-sm bg-[#FFFFFF] dark:bg-[#161616] border border-primaryText/10 dark:border-[#557373]/25 rounded-[20px] p-6 shadow-xl text-left"
            role="dialog"
            aria-modal="true"
          >
            {/* Close Icon (for static alerts only) */}
            {type !== 'loading' && type !== 'confirm' && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-primaryText/40 hover:text-primaryText/70 dark:text-[#F2EFEA]/45 dark:hover:text-[#F2EFEA] transition-colors p-1 rounded-full cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Icon Indicators */}
            <div className="flex items-start gap-4">
              {type === 'success' && (
                <div className="w-10 h-10 rounded-full bg-[#DFE5F3]/60 dark:bg-softBlue/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-[#557373] dark:text-softBlue" />
                </div>
              )}
              {type === 'confirm' && (
                <div className="w-10 h-10 rounded-full bg-[#DFE5F3]/60 dark:bg-softBlue/10 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-[#557373] dark:text-softBlue" />
                </div>
              )}
              {type === 'alert' && (
                <div className="w-10 h-10 rounded-full bg-warmWhite dark:bg-softBlue/5 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[#557373] dark:text-softBlue" />
                </div>
              )}
              {type === 'loading' && (
                <div className="w-10 h-10 rounded-full bg-warmWhite dark:bg-softBlue/5 flex items-center justify-center shrink-0">
                  <Loader2 className="w-5 h-5 text-[#557373] dark:text-softBlue animate-spin" />
                </div>
              )}

              {/* Text Layout */}
              <div className="flex-1 flex flex-col gap-2.5">
                {title && (
                  <h3 className="text-base font-serif font-bold text-primaryText dark:text-[#F2EFEA] leading-tight">
                    {title}
                  </h3>
                )}
                {message && (
                  <p className="text-xs text-primaryText/60 dark:text-[#F2EFEA]/60 leading-relaxed font-normal whitespace-pre-wrap">
                    {message}
                  </p>
                )}

                {/* Bullet List for confirmation dialog details */}
                {bullets.length > 0 && (
                  <ul className="text-xs text-primaryText/50 dark:text-[#F2EFEA]/50 space-y-1.5 list-disc pl-4 font-normal mt-1">
                    {bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            {type !== 'loading' && (
              <div className="mt-6 pt-4 border-t border-primaryText/5 dark:border-[#557373]/15 flex items-center justify-end gap-2.5">
                {type === 'confirm' ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onClose}
                      className="px-4 py-2 border border-black/5 dark:border-[#557373]/20 text-xs font-semibold rounded-[8px] bg-warmWhite dark:bg-[#161616] text-primaryText dark:text-[#F2EFEA]"
                    >
                      {cancelText}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (onConfirm) onConfirm();
                        onClose();
                      }}
                      className="px-4 py-2 text-xs font-bold uppercase rounded-[8px]"
                    >
                      {confirmText}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onClose}
                    className="px-5 py-2 text-xs font-bold uppercase rounded-[8px]"
                  >
                    Done
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
