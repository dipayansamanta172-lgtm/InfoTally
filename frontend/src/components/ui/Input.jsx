import React from 'react';

export const Input = React.forwardRef(({
  label,
  id,
  type = 'text',
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5 font-sans">
      {label && (
        <label
          htmlFor={id}
          className="text-[11px] font-bold text-mutedGreen tracking-wider uppercase select-none"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        type={type}
        className={`w-full bg-primaryBg dark:bg-darkCardBg border ${
          error 
            ? 'border-mutedGreen dark:border-softBlue focus-visible:outline-mutedGreen dark:focus-visible:outline-softBlue' 
            : 'border-primaryText/10 dark:border-[#557373]/25 focus-visible:outline-primaryText dark:focus-visible:outline-softBlue'
        } rounded px-3.5 py-2 text-sm text-primaryText dark:text-[#F2EFEA] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-0 placeholder-primaryText/30 dark:placeholder-[#F2EFEA]/30 transition-all duration-150 ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-mutedGreen dark:text-softBlue font-bold mt-0.5" role="alert">
          ⚠ {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
