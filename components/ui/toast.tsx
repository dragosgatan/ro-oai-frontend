'use client';

import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Viewport>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Viewport
        ref={ref}
        className={cn(
            'fixed inset-x-0 bottom-0 z-[1400] flex max-h-screen w-full flex-col gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:start-auto sm:end-0 sm:max-w-[26rem]',
            className,
        )}
        {...props}
    />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
    'group pointer-events-auto relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-3 overflow-hidden rounded-sm border-2 p-4 pe-14 shadow-[5px_5px_0_oklch(0.79_0.04_289)] transition-[transform,opacity] duration-200 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full dark:shadow-[5px_5px_0_oklch(0.34_0.055_287)]',
    {
        variants: {
            variant: {
                default:
                    'border-[oklch(0.62_0.06_287)] bg-[oklch(0.978_0.014_292)] text-[oklch(0.22_0.055_282)] dark:border-[oklch(0.5_0.07_287)] dark:bg-[oklch(0.18_0.038_286)] dark:text-[oklch(0.94_0.016_292)]',
                destructive:
                    'destructive border-[oklch(0.62_0.16_32)] bg-[oklch(0.96_0.025_32)] text-[oklch(0.3_0.11_32)] dark:border-[oklch(0.72_0.17_32)] dark:bg-[oklch(0.22_0.045_32)] dark:text-[oklch(0.9_0.055_32)]',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

const Toast = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
    return (
        <ToastPrimitives.Root
            ref={ref}
            className={cn(toastVariants({ variant }), className)}
            {...props}
        />
    );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Action>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Action
        ref={ref}
        className={cn(
            'inline-flex min-h-11 shrink-0 items-center justify-center rounded-sm border border-[oklch(0.62_0.06_287)] bg-transparent px-3 text-sm font-bold transition-colors hover:border-[oklch(0.43_0.235_291)] hover:bg-[oklch(0.952_0.026_292)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.72_0.18_32)] disabled:pointer-events-none disabled:opacity-50 dark:border-[oklch(0.5_0.07_287)] dark:hover:border-[oklch(0.72_0.19_292)] dark:hover:bg-[oklch(0.215_0.046_286)] group-[.destructive]:border-current group-[.destructive]:hover:bg-[oklch(0.9_0.055_32)] group-[.destructive]:hover:text-[oklch(0.3_0.11_32)] dark:group-[.destructive]:hover:bg-[oklch(0.3_0.08_32)] dark:group-[.destructive]:hover:text-[oklch(0.94_0.025_32)]',
            className,
        )}
        {...props}
    />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Close>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Close
        ref={ref}
        className={cn(
            'absolute end-1 top-1 grid h-11 w-11 place-items-center rounded-sm text-current opacity-65 transition-[opacity,background-color] hover:bg-[oklch(0.952_0.026_292)] hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-[oklch(0.72_0.18_32)] dark:hover:bg-[oklch(0.215_0.046_286)] group-[.destructive]:hover:bg-[oklch(0.9_0.055_32)] dark:group-[.destructive]:hover:bg-[oklch(0.3_0.08_32)]',
            className,
        )}
        toast-close=""
        {...props}
    >
        <X className="h-4 w-4" aria-hidden="true" />
    </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Title>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Title
        ref={ref}
        className={cn('text-sm font-bold tracking-[-0.01em]', className)}
        {...props}
    />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Description>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Description
        ref={ref}
        className={cn('text-sm leading-5 opacity-80', className)}
        {...props}
    />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
    type ToastProps,
    type ToastActionElement,
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastDescription,
    ToastClose,
    ToastAction,
};
