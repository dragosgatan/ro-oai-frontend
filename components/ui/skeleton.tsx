import { cn } from '@/lib/utils';

function Skeleton({
    className,
    shimmer = false,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { shimmer?: boolean }) {
    return (
        <div
            className={cn(
                'rounded-md bg-muted',
                shimmer
                    ? 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent motion-reduce:before:animate-none'
                    : 'animate-pulse motion-reduce:animate-none',
                className,
            )}
            {...props}
        />
    );
}

export { Skeleton };
