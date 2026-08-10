import React from 'react';
import { Search } from 'lucide-react';

export const SearchBar = ({
  placeholder = 'Search anything...',
  value,
  onChange,
  className = '',
  ...props
}) => {
  return (
    <div className={`relative flex items-center w-full font-sans ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-primaryBg dark:bg-darkCardBg border border-primaryText/10 dark:border-[#557373]/25 rounded px-3 py-1.5 pl-9 text-xs text-primaryText dark:text-[#F2EFEA] focus-visible:outline focus-visible:outline-1 focus-visible:outline-primaryText dark:focus-visible:outline-softBlue placeholder-primaryText/35 dark:placeholder-[#F2EFEA]/35 transition-all duration-150"
        {...props}
      />
      <Search className="absolute left-3 w-3.5 h-3.5 text-primaryText/35 dark:text-[#F2EFEA]/35 pointer-events-none stroke-[2]" />
    </div>
  );
};
