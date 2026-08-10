import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseStyle = "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-sans select-none";

  const variants = {
    default: "bg-softBlue text-primaryText dark:bg-softBlue/10 dark:text-softBlue",
    accent: "bg-mutedGreen/10 text-mutedGreen dark:bg-mutedGreen/20 dark:text-softBlue",
    outline: "border border-primaryText/10 dark:border-[#557373]/25 text-primaryText/70 dark:text-[#F2EFEA]/70",
  };

  return (
    <span
      className={`${baseStyle} ${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
