'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 overflow-hidden active:scale-95 cursor-pointer',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground hover:bg-primary/90',
                destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                outline:
                    'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-md px-3',
                lg: 'h-11 rounded-md px-8',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            size,
            asChild = false,
            loading = false,
            children,
            onClick,
            disabled,
            ...props
        },
        ref,
    ) => {
        const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; id: number }>>(
            [],
        );
        const rippleIdRef = React.useRef(0);

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (loading || disabled) return;

            // Create ripple effect
            const button = e.currentTarget;
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const newRipple = { x, y, id: rippleIdRef.current++ };
            setRipples((prev) => [...prev, newRipple]);

            // Remove ripple after animation
            setTimeout(() => {
                setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
            }, 600);

            // Call original onClick
            onClick?.(e);
        };

        if (asChild) {
            return (
                <Slot
                    className={cn(buttonVariants({ variant, size, className }))}
                    ref={ref}
                    {...props}
                >
                    {children}
                </Slot>
            );
        }

        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                onClick={handleClick}
                disabled={disabled || loading}
                {...props}
            >
                {ripples.map((ripple) => (
                    <span
                        key={ripple.id}
                        className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
                        style={{
                            left: ripple.x,
                            top: ripple.y,
                            width: 0,
                            height: 0,
                        }}
                    />
                ))}
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
