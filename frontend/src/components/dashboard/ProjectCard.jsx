import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Folder } from 'lucide-react';

export const ProjectCard = ({
  project,
  isActive,
  onClick,
  className = '',
}) => {
  const { name, recordsCount, lastUpdated } = project;

  return (
    <Card
      onClick={onClick}
      className={`p-4 cursor-pointer text-left select-none transition-all duration-150 ${
        isActive
          ? 'border-mutedGreen/50 bg-warmWhite/40 dark:bg-[#0D0D0D] ring-1 ring-mutedGreen/10'
          : 'hover:border-primaryText/15 dark:hover:border-warmWhite/15 hover:bg-warmWhite/20 dark:hover:bg-warmWhite/5'
      } ${className}`}
      role="button"
      aria-pressed={isActive}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center justify-center p-1.5 rounded bg-softBlue dark:bg-[#0D0D0D] text-mutedGreen dark:text-softBlue">
          <Folder className="w-4 h-4 stroke-[2]" />
        </div>
        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
          {recordsCount} Records
        </Badge>
      </div>

      <div className="mt-4">
        <h4 className="font-sans font-bold text-[13px] text-primaryText dark:text-[#F2EFEA] tracking-tight">
          {name}
        </h4>
        <p className="font-sans text-[10px] text-primaryText/45 dark:text-[#F2EFEA]/45 mt-0.5">
          {lastUpdated}
        </p>
      </div>
    </Card>
  );
};
