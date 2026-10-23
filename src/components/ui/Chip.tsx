import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const chipVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-full text-xs transition-colors border select-none',
  {
    variants: {
      variant: {
        default: 'bg-naija-card text-gray-200 border-naija-border',
        brand: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
        yellow: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
        purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        teal: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
        coral: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        outline: 'bg-transparent text-gray-300 border-naija-border',
      },
      size: {
        sm: 'h-6 px-2.5 text-[11px]',
        default: 'h-7 px-3 text-xs',
        interactive: 'h-11 min-h-[44px] px-4 text-sm cursor-pointer hover:bg-naija-border active:scale-95',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {}

export function Chip({ className, variant, size, ...props }: ChipProps) {
  return <span className={cn(chipVariants({ variant, size, className }))} {...props} />;
}
