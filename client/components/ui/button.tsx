import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        default: 'bg-sky-500 text-slate-950 font-semibold shadow-md shadow-sky-500/20 hover:bg-sky-400 hover:shadow-sky-400/30 hover:-translate-y-0.5',
        outline: 'border border-sky-500/30 bg-slate-900/60 text-sky-300 shadow-sm backdrop-blur-md hover:bg-sky-500/15 hover:border-sky-400/60 hover:text-white hover:-translate-y-0.5',
        destructive: 'bg-rose-600 text-white font-semibold shadow-sm hover:bg-rose-500 hover:shadow-rose-500/30 hover:-translate-y-0.5',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
