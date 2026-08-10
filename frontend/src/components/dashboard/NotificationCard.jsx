import React from 'react';
import { User, CheckCircle, Key } from 'lucide-react';

export const NotificationCard = ({
  notification,
  className = '',
}) => {
  const { message, time, type } = notification;

  const icons = {
    share: <User className="w-3.5 h-3.5 text-mutedGreen" />,
    success: <CheckCircle className="w-3.5 h-3.5 text-mutedGreen" />,
    security: <Key className="w-3.5 h-3.5 text-darkOlive dark:text-softBlue" />,
  };

  const backgrounds = {
    share: 'bg-softBlue dark:bg-[#0D0D0D]',
    success: 'bg-[#557373]/10 dark:bg-mutedGreen/20',
    security: 'bg-warmWhite dark:bg-[#0D0D0D]',
  };

  return (
    <div className={`flex items-center gap-3 py-2 px-1 text-left font-sans ${className}`}>
      <div className={`p-2 rounded-full ${backgrounds[type] || 'bg-softBlue dark:bg-[#0D0D0D]'} shrink-0 select-none`}>
        {icons[type] || <User className="w-3.5 h-3.5 text-primaryText dark:text-[#F2EFEA]" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-primaryText dark:text-[#F2EFEA] truncate">{message}</p>
        <span className="text-[9px] text-primaryText/45 dark:text-[#F2EFEA]/45 block mt-0.5">{time}</span>
      </div>
    </div>
  );
};
