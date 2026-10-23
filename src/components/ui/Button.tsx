import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 select-none cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-naija-ink',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-500 text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 border border-brand-400/30',
        secondary:
          'bg-naija-card text-white hover:bg-naija-border border border-naija-border/80 shadow-sm',
        outline:
          'bg-transparent text-white border border-naija-border hover:bg-naija-card hover:border-gray-500',
        ghost:
          'bg-transparent text-gray-300 hover:text-white hover:bg-naija-card/60',
        accent:
          'bg-amber-400 text-naija-ink font-semibold hover:bg-amber-300 shadow-md shadow-amber-400/20',
        danger:
          'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
      },
      size: {
        default: 'h-11 min-h-[44px] px-5 py-2.5 text-base',
        sm: 'h-11 min-h-[44px] px-3.5 py-1.5 text-sm sm:h-9 sm:min-h-[36px]',
        lg: 'h-14 min-h-[48px] px-8 py-3.5 text-lg font-semibold',
        icon: 'h-11 w-11 min-h-[44px] min-w-[44px] p-0',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
