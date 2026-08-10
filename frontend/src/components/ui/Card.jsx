import React from 'react';

export const Card = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-primaryBg dark:bg-[#161616] border border-primaryText/5 dark:border-[#557373]/25 rounded shadow-[0_1px_3px_rgba(13,13,13,0.02)] transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
