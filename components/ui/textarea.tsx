'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export interface TextareaProps extends React.ComponentProps<'textarea'> {
    error?: boolean;
    success?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, success, ...props }, ref) => {
        const [shake, setShake] = React.useState(false);

        React.useEffect(() => {
            if (error) {
                setShake(true);
                const timer = setTimeout(() => setShake(false), 500);
                return () => clearTimeout(timer);
            }
        }, [error]);

        return (
            <textarea
                className={cn(
                    'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:scale-[1.01]',
                    'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                    error && 'border-destructive focus-visible:ring-destructive',
                    success && 'border-success focus-visible:ring-success',
                    shake && 'animate-shake',
                    className,
                )}
                ref={ref}
                {...props}
            />
        );
    },
);
Textarea.displayName = 'Textarea';

export { Textarea };
