import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ArrowUpRight } from 'lucide-react';

export const CTA = () => {
  const navigate = useNavigate();

  return (
    <section
      id="cta"
      className="py-24 bg-primaryBg dark:bg-[#0D0D0D] border-t border-primaryText/5 dark:border-[#557373]/20 font-sans relative select-none"
    >
      {/* Container with grid margin offsets to prevent LeftNav overlaps */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 xl:pl-44 w-full">
        {/* Soft Blue CTA Banner */}
        <div className="bg-softBlue dark:bg-darkCardBg border dark:border-[#557373]/25 rounded-lg p-10 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-10 text-left">
          {/* Banner Text */}
          <div className="max-w-xl">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-primaryText dark:text-[#F2EFEA] leading-tight tracking-tight">
              Ready to simplify<br />
              academic data management?
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <Button
              variant="primary"
              size="lg"
              icon={ArrowUpRight}
              className="text-xs font-bold px-6 py-3.5 rounded"
              onClick={() => navigate('/request-access')}
            >
              Request Access
            </Button>
            <Button
              variant="secondary"
              size="lg"
              icon={ArrowUpRight}
              className="text-xs font-bold px-6 py-3.5 rounded bg-primaryBg dark:bg-darkCardBg border border-black/5 dark:border-[#557373]/25 dark:text-[#F2EFEA]"
              onClick={() => navigate('/sign-in')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
