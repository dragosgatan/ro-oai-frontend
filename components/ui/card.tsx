'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hover?: boolean;
    gradientBorder?: boolean;
    animated?: boolean;
    highlighted?: boolean;
    innerClassName?: string;
    href?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    (
        {
            className,
            innerClassName = '',
            hover = false,
            gradientBorder = false,
            animated = false,
            highlighted = false,
            href = undefined,
            ...props
        },
        ref,
    ) => {
        let BaseComponentType: React.ElementType = href ? 'a' : 'div';
        if (animated) {
            BaseComponentType = href ? motion.a : motion.div;
        }

        const cardClasses = cn(
            'rounded-xl text-card-foreground shadow-sm transition-all duration-300',
            // Only apply default border and bg when not highlighted
            !highlighted && 'border bg-card',
            hover && !highlighted && 'hover:scale-[1.02] hover:shadow-lg cursor-pointer',
            !highlighted &&
                gradientBorder &&
                'relative border-transparent bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 p-[1px]',
            href && 'block',
            className,
        );

        const innerClasses = cn(
            (gradientBorder || highlighted) && 'rounded-[20px] bg-card h-full w-full',
            innerClassName,
        );

        // Highlighted card - Style 5: Mystic Mist with inline styles + CSS animation
        if (highlighted) {
            const { children, ...restProps } = props;

            return (
                <>
                    <style jsx global>{`
                        @keyframes mist-float-card {
                            0%,
                            100% {
                                transform: translateY(0) scale(1);
                                opacity: 0.5;
                            }
                            50% {
                                transform: translateY(-5px) scale(1.02);
                                opacity: 0.8;
                            }
                        }
                        .highlighted-card-wrapper {
                            position: relative;
                            border-radius: 12px;
                            padding: 2px;
                            background: linear-gradient(
                                135deg,
                                #667eea 0%,
                                #764ba2 50%,
                                #f093fb 100%
                            );
                        }
                        .highlighted-card-wrapper::before {
                            content: '';
                            position: absolute;
                            inset: -8px;
                            border-radius: 16px;
                            background: linear-gradient(
                                135deg,
                                #667eea 0%,
                                #764ba2 50%,
                                #f093fb 100%
                            );
                            filter: blur(20px);
                            opacity: 0.5;
                            z-index: -1;
                            animation: mist-float-card 4s ease-in-out infinite;
                        }
                        .highlighted-card-wrapper::after {
                            content: '';
                            position: absolute;
                            inset: -4px;
                            border-radius: 16px;
                            background: linear-gradient(
                                225deg,
                                #f093fb 0%,
                                #764ba2 50%,
                                #667eea 100%
                            );
                            filter: blur(10px);
                            opacity: 0.3;
                            z-index: -1;
                            animation: mist-float-card 4s ease-in-out infinite reverse;
                        }
                        .highlighted-card-inner-content {
                            background: hsl(var(--card));
                            border-radius: 10px;
                            height: 100%;
                            width: 100%;
                            position: relative;
                            z-index: 1;
                        }
                    `}</style>
                    <BaseComponentType
                        href={href}
                        ref={ref}
                        className={cn(
                            'highlighted-card-wrapper text-card-foreground',
                            hover && 'cursor-pointer',
                            className,
                        )}
                        {...restProps}
                    >
                        <div className={cn('highlighted-card-inner-content', innerClassName)}>
                            {children}
                        </div>
                    </BaseComponentType>
                </>
            );
        }

        // Non-highlighted card
        if (animated) {
            return (
                <BaseComponentType
                    href={href}
                    ref={ref}
                    className={cardClasses}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    {...props}
                >
                    {gradientBorder ? (
                        <div className={innerClasses}>{props.children}</div>
                    ) : (
                        props.children
                    )}
                </BaseComponentType>
            );
        }

        return (
            <BaseComponentType href={href} ref={ref} className={cardClasses} {...props}>
                {gradientBorder ? (
                    <div className={innerClasses}>{props.children}</div>
                ) : (
                    props.children
                )}
            </BaseComponentType>
        );
    },
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
    ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
            {...props}
        />
    ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
    ),
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
    ),
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
    ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
