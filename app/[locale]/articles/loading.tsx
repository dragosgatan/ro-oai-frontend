import { Skeleton } from '@/components/ui/skeleton';
import { PlatformPageShell } from '@/components/platform-page-shell';

export default function ArticlesLoading() {
    return (
        <PlatformPageShell aria-busy="true">
            <div className="grid gap-8 lg:grid-cols-[1fr_16rem]">
                <div>
                    <Skeleton className="h-4 w-36 rounded-none" />
                    <Skeleton className="mt-6 h-14 max-w-2xl rounded-none" />
                    <Skeleton className="mt-4 h-16 max-w-xl rounded-none" />
                </div>
                <Skeleton className="h-20 rounded-none" />
            </div>
            <div className="mt-12 grid border border-[var(--platform-line-strong)] lg:grid-cols-2">
                <Skeleton className="h-72 rounded-none lg:h-[28rem]" />
                <div className="space-y-5 p-8">
                    <Skeleton className="h-5 w-40 rounded-none" />
                    <Skeleton className="h-20 w-full rounded-none" />
                    <Skeleton className="h-24 w-full rounded-none" />
                </div>
            </div>
        </PlatformPageShell>
    );
}
