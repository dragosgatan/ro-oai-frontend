'use client';

import * as React from 'react';
import { Check, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.ComponentProps<'input'> {
    error?: boolean;
    success?: boolean;
    loading?: boolean;
    floatingLabel?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, success, loading, floatingLabel, ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false);
        const [hasValue, setHasValue] = React.useState(false);
        const [shake, setShake] = React.useState(false);

        React.useEffect(() => {
            if (error) {
                setShake(true);
                const timer = setTimeout(() => setShake(false), 500);
                return () => clearTimeout(timer);
            }
        }, [error]);

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            props.onFocus?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
            setHasValue(!!e.target.value);
            props.onBlur?.(e);
        };

        const showFloatingLabel = floatingLabel && (isFocused || hasValue || props.value);

        return (
            <div className="relative w-full">
                <input
                    type={type}
                    className={cn(
                        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground transition-all duration-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:scale-[1.01]',
                        'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                        error && 'border-destructive focus-visible:ring-destructive',
                        success && 'border-success focus-visible:ring-success',
                        shake && 'animate-shake',
                        floatingLabel && 'pt-6 pb-2',
                        className,
                    )}
                    ref={ref}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />
                {floatingLabel && (
                    <label
                        className={cn(
                            'absolute left-3 transition-all duration-200 pointer-events-none',
                            showFloatingLabel
                                ? 'top-1.5 text-xs text-muted-foreground'
                                : 'top-2.5 text-sm text-muted-foreground',
                            error && 'text-destructive',
                            success && 'text-success',
                        )}
                    >
                        {floatingLabel}
                    </label>
                )}
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                )}
                {success && !loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Check className="h-4 w-4 text-success animate-scale-in" />
                    </div>
                )}
            </div>
        );
    },
);
Input.displayName = 'Input';

export { Input };
