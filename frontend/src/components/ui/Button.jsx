import React from 'react';

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  ...props
}, ref) => {
  const baseStyle = "font-sans font-semibold text-sm transition-all duration-200 inline-flex items-center justify-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 select-none cursor-pointer";

  // Strict visual styles matching approved locked light/dark mode color rules
  const variants = {
    primary: "bg-primaryText text-primaryBg dark:bg-softBlue dark:text-[#0D0D0D] hover:opacity-95 dark:hover:opacity-90 focus-visible:outline-primaryText dark:focus-visible:outline-softBlue rounded",
    secondary: "bg-warmWhite text-primaryText dark:bg-darkCardBg dark:text-[#F2EFEA] hover:bg-softBlue dark:hover:bg-[#0D0D0D] focus-visible:outline-softBlue dark:focus-visible:outline-warmWhite rounded border border-black/5 dark:border-[#557373]/25",
    accent: "bg-softBlue text-primaryText dark:bg-darkCardBg dark:text-[#F2EFEA] hover:bg-opacity-80 focus-visible:outline-softBlue rounded",
    outline: "border border-primaryText/15 dark:border-[#557373]/25 text-primaryText dark:text-[#F2EFEA] hover:bg-warmWhite dark:hover:bg-darkCardBg focus-visible:outline-primaryText rounded",
    text: "text-primaryText dark:text-[#F2EFEA] hover:underline hover:opacity-80 focus-visible:outline-primaryText",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button
      ref={ref}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
      {Icon && <Icon className="w-3.5 h-3.5 stroke-[2]" />}
    </button>
  );
});

Button.displayName = 'Button';
