import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showText?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showText = false,
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  return (
    <div className={cn('w-full', className)} {...props}>
      {(label || showText) && (
        <div className="flex justify-between items-center mb-1.5 text-xs text-naija-muted">
          {label && <span>{label}</span>}
          {showText && <span className="font-semibold text-gray-200">{percentage}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
        className="h-2 w-full overflow-hidden rounded-full bg-naija-card border border-naija-border/60"
      >
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
