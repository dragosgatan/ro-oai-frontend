import { PlatformPageShell } from '@/components/platform-page-shell';
import { Skeleton } from '@/components/ui/skeleton';

export default function CompetitionsLoading() {
    return (
        <PlatformPageShell contentClassName="space-y-8 md:space-y-10" aria-busy="true">
            <div className="border-b border-[var(--platform-line-strong)] pb-8 md:pb-12">
                <Skeleton className="h-4 w-36 rounded-none bg-[var(--platform-paper-strong)] motion-reduce:animate-none" />
                <Skeleton className="mt-5 h-14 w-full max-w-2xl rounded-none bg-[var(--platform-paper-strong)] motion-reduce:animate-none sm:h-20" />
                <Skeleton className="mt-5 h-5 w-full max-w-xl rounded-none bg-[var(--platform-paper-strong)] motion-reduce:animate-none" />
            </div>

            <div className="border-t border-[var(--platform-line-strong)]">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className="grid min-h-40 grid-cols-[2.25rem_minmax(0,1fr)] gap-4 border-b border-[var(--platform-line)] px-4 py-6 sm:grid-cols-[3.25rem_minmax(0,1fr)_2.75rem] sm:gap-5 sm:px-6"
                    >
                        <Skeleton className="h-4 w-7 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                        <div>
                            <div className="flex gap-2">
                                <Skeleton className="h-7 w-20 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                                <Skeleton className="h-7 w-24 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                            </div>
                            <Skeleton className="mt-4 h-7 w-full max-w-lg rounded-none bg-[var(--platform-paper-strong)] motion-reduce:animate-none" />
                            <Skeleton className="mt-3 h-4 w-full max-w-2xl rounded-none bg-[var(--platform-paper-strong)] motion-reduce:animate-none" />
                            <Skeleton className="mt-5 h-4 w-56 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                        </div>
                        <Skeleton className="hidden h-11 w-11 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none sm:block" />
                    </div>
                ))}
            </div>
        </PlatformPageShell>
    );
}
