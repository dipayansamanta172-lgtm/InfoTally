import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertModal } from '../ui/AlertModal';

export const StudentCard = ({
  student,
  isExpanded,
  onToggle,
  className = '',
}) => {
  const { id, name, lastUpdated, fields = [], extendedFields = [] } = student;

  // Custom Alert configuration state
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  const triggerAlert = (title, message) => {
    setAlertConfig({
      isOpen: true,
      title,
      message
    });
  };

  return (
    <Card
      className={`p-5 text-left border relative overflow-hidden transition-all duration-150 ${
        isExpanded
          ? 'border-mutedGreen/40 bg-primaryBg dark:bg-darkCardBg shadow-[0_4px_12px_rgba(13,13,13,0.03)] ring-1 ring-mutedGreen/5'
          : 'hover:border-primaryText/15 dark:hover:border-warmWhite/15 hover:shadow-[0_2px_6px_rgba(13,13,13,0.01)]'
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[9px] font-mono font-semibold bg-warmWhite dark:bg-[#0D0D0D] text-[#557373] dark:text-softBlue px-2 py-0.5 rounded border border-black/5 dark:border-[#557373]/25 select-none">
            {id}
          </span>
          <h4 className="font-sans font-bold text-sm text-primaryText dark:text-[#F2EFEA] mt-1.5 leading-snug">
            {name}
          </h4>
          <p className="text-[9px] text-primaryText/45 dark:text-[#F2EFEA]/45 font-sans mt-0.5">
            {lastUpdated}
          </p>
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="text-primaryText/30 dark:text-warmWhite/30 hover:text-primaryText dark:hover:text-warmWhite p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-primaryText dark:focus-visible:outline-softBlue"
          aria-label={isExpanded ? 'Collapse student records' : 'Expand student records'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <ChevronDown className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>
      </div>

      {/* Dynamic Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-4">
        {fields.map((field, idx) => (
          <div key={idx} className="flex flex-col text-left font-sans">
            <span className="text-[9px] text-mutedGreen dark:text-softBlue font-bold uppercase tracking-wider select-none">
              {field.label}
            </span>
            <span className="text-xs text-primaryText dark:text-[#F2EFEA] font-medium mt-0.5 truncate">
              {field.value}
            </span>
          </div>
        ))}
      </div>

      {/* Expanded Fields Details */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-primaryText/5 dark:border-[#557373]/20 mt-4 pt-4 flex flex-col gap-3">
              {extendedFields && extendedFields.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  {extendedFields.map((field, idx) => (
                    <div key={idx} className="flex flex-col text-left font-sans">
                      <span className="text-[9px] text-mutedGreen dark:text-softBlue font-bold uppercase tracking-wider select-none">
                        {field.label}
                      </span>
                      <span className="text-xs text-primaryText dark:text-[#F2EFEA] font-semibold mt-0.5">
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Call-to-action button */}
              <div className="mt-2 flex justify-start">
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-mutedGreen hover:bg-opacity-90 dark:bg-softBlue dark:text-deepBlack text-[#FFFFFF] font-bold text-[9px] tracking-wider uppercase py-1.5 px-3.5 rounded"
                  onClick={() => triggerAlert('Student Profile Dossier', `Showing comprehensive academic files and survey records for ${name}.`)}
                >
                  View All Details
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Reusable Alert Modal Portal */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        type="success"
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </Card>
  );
};
