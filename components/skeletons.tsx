import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Skeleton component for Problem Cards
 * Used in problem list pages during loading
 */
export function ProblemCardSkeleton({ className }: { className?: string }) {
    return (
        <Card className={cn('flex flex-col', className)}>
            <CardHeader className="p-6 pb-4">
                <div className="flex justify-between items-start gap-3 mb-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </CardHeader>
            <CardContent className="flex-grow px-6 pb-4">
                <Skeleton className="h-4 w-32" />
            </CardContent>
            <CardFooter className="flex flex-col gap-4 p-6 pt-0">
                <div className="flex justify-between w-full gap-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-10 w-full rounded-md" />
            </CardFooter>
        </Card>
    );
}

/**
 * Skeleton component for Leaderboard Rows
 * Used in leaderboard tables during loading
 */
export function LeaderboardRowSkeleton() {
    return (
        <div className="flex items-center gap-3 p-4 border-b border-border/50">
            <Skeleton className="h-8 w-12 rounded-md flex-shrink-0" />
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16 rounded-md" />
        </div>
    );
}

/**
 * Skeleton component for Leaderboard Podium Cards
 * Used for top 3 positions during loading
 */
export function LeaderboardPodiumSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {[0, 1, 2].map((index) => (
                <Card
                    key={index}
                    className={cn(
                        'text-center border-2',
                        index === 0 && 'sm:order-2 sm:scale-105',
                        index === 1 && 'sm:order-1',
                        index === 2 && 'sm:order-3',
                    )}
                >
                    <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex justify-center mb-2">
                            <Skeleton className="h-10 w-10 rounded-full" />
                        </div>
                        <Skeleton
                            className={cn(
                                'mx-auto rounded-full',
                                index === 0 ? 'h-20 w-20' : 'h-16 w-16',
                            )}
                        />
                        <Skeleton className="h-6 w-32 mx-auto mt-3" />
                        <Skeleton className="h-5 w-16 mx-auto mt-2 rounded-full" />
                    </CardHeader>
                    <CardContent className="space-y-2 pb-6">
                        <Skeleton
                            className={cn('mx-auto', index === 0 ? 'h-8 w-24' : 'h-7 w-20')}
                        />
                        <Skeleton className="h-4 w-20 mx-auto" />
                        <div className="flex justify-between pt-2 border-t border-border/50">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/**
 * Skeleton component for Profile Stats Cards
 * Used in profile pages during loading
 */
export function ProfileStatsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((index) => (
                <Card key={index} className="border-2">
                    <CardContent className="p-4 sm:p-6 text-center">
                        <div className="flex justify-center mb-2">
                            <Skeleton className="h-9 w-9 rounded-full" />
                        </div>
                        <Skeleton className="h-8 w-16 mx-auto mb-1" />
                        <Skeleton className="h-4 w-24 mx-auto" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/**
 * Skeleton component for Profile Header
 * Used in profile pages during loading
 */
export function ProfileHeaderSkeleton() {
    return (
        <Card>
            <CardHeader className="text-center">
                <Skeleton className="h-32 w-32 rounded-full mx-auto" />
                <Skeleton className="h-8 w-48 mx-auto mt-4" />
                <Skeleton className="h-5 w-24 mx-auto mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    {[0, 1, 2, 3].map((index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 flex-shrink-0" />
                            <Skeleton className="h-4 flex-1" />
                        </div>
                    ))}
                </div>
                <div>
                    <Skeleton className="h-5 w-20 mb-2" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Skeleton component for Submission Table Rows
 * Used in submission history tables during loading
 */
export function SubmissionRowSkeleton() {
    return (
        <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
            </div>
            <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>
        </div>
    );
}

/**
 * Enhanced Skeleton with shimmer effect
 * Provides a more polished loading animation
 */
export function ShimmerSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-md bg-muted',
                'before:absolute before:inset-0',
                'before:-translate-x-full',
                'before:animate-shimmer',
                'before:bg-gradient-to-r',
                'before:from-transparent before:via-white/10 before:to-transparent',
                className,
            )}
        />
    );
}

/**
 * Skeleton component for Institution Podium Cards
 * Used for top 3 institutions during loading
 */
export function InstitutionPodiumSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 lg:gap-6 max-w-5xl mx-auto px-2 sm:px-0">
            {[0, 1, 2].map((index) => (
                <Card
                    key={index}
                    className={cn(
                        'text-center border-2 animate-pulse',
                        index === 0 && 'sm:order-2 sm:scale-105',
                        index === 1 && 'sm:order-1',
                        index === 2 && 'sm:order-3',
                    )}
                >
                    <CardHeader className="pb-3 sm:pb-4 md:pb-5 px-3 sm:px-4 md:px-6 pt-4 sm:pt-5 md:pt-6">
                        {/* Icon skeleton */}
                        <div className="flex justify-center mb-2">
                            <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-full" />
                        </div>
                        {/* Institution name skeleton */}
                        <Skeleton
                            className={cn(
                                'mx-auto mt-3',
                                index === 0 ? 'h-6 w-40 sm:w-48' : 'h-5 w-32 sm:w-40',
                            )}
                        />
                        {/* Rank badge skeleton */}
                        <div className="flex justify-center mt-2">
                            <Skeleton className="h-6 w-12 rounded-full" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pb-4 sm:pb-5 md:pb-6 px-3 sm:px-4 md:px-6">
                        {/* County and type skeleton */}
                        <Skeleton className="h-4 w-32 mx-auto" />
                        {/* Member count skeleton */}
                        <Skeleton
                            className={cn(
                                'mx-auto',
                                index === 0 ? 'h-8 w-16 sm:h-9 sm:w-20' : 'h-7 w-14 sm:h-8 sm:w-16',
                            )}
                        />
                        {/* Members label skeleton */}
                        <Skeleton className="h-3 w-16 mx-auto" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/**
 * Skeleton component for Institution Table Rows
 * Used in institution rankings table during loading
 */
export function InstitutionTableRowSkeleton() {
    return (
        <div className="flex items-center gap-3 sm:gap-4 py-3 px-4 border-b border-border/50 animate-pulse">
            {/* Rank skeleton */}
            <Skeleton className="h-6 w-12 sm:w-16 rounded-md flex-shrink-0" />
            {/* Institution name skeleton */}
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40 sm:w-48" />
                {/* County on mobile */}
                <Skeleton className="h-3 w-24 sm:hidden" />
            </div>
            {/* County skeleton (hidden on mobile) */}
            <Skeleton className="h-4 w-24 hidden sm:block" />
            {/* Type badge skeleton */}
            <Skeleton className="h-5 w-20 rounded-full" />
            {/* Member count skeleton */}
            <Skeleton className="h-4 w-12 sm:w-16" />
        </div>
    );
}
