import { BookOpenText, Braces, Network } from 'lucide-react';

import type { ArticleKind } from '@/lib/articles';
import { cn } from '@/lib/utils';

type ArticleKindVisualProps = {
    kind: ArticleKind;
    problemId?: number | null;
    className?: string;
    compact?: boolean;
};

/** A semantic, image-free visual language for article types. */
export function ArticleKindVisual({
    kind,
    problemId,
    className,
    compact = false,
}: ArticleKindVisualProps) {
    const editorial = kind === 'PROBLEM_EDITORIAL';
    const Icon = editorial ? Braces : BookOpenText;

    return (
        <div
            className={cn(
                'relative isolate overflow-hidden border border-[var(--platform-line-strong)]',
                editorial
                    ? 'bg-[var(--platform-violet)] text-[oklch(0.98_0.01_292)] dark:text-[var(--platform-on-accent)]'
                    : 'bg-[var(--platform-paper-strong)] text-[var(--platform-ink)]',
                compact ? 'h-28' : 'min-h-64',
                className,
            )}
            aria-hidden="true"
        >
            <svg
                viewBox="0 0 640 320"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full opacity-60"
                fill="none"
            >
                <path
                    d="M0 64H640M0 160H640M0 256H640M96 0V320M256 0V320M416 0V320M576 0V320"
                    stroke="currentColor"
                    strokeOpacity="0.16"
                />
                {editorial ? (
                    <path
                        d="M36 246C111 216 139 94 219 128C299 162 332 252 417 184C489 126 515 42 612 74"
                        stroke="var(--platform-citron)"
                        strokeWidth="7"
                        strokeLinecap="round"
                    />
                ) : (
                    <>
                        <circle cx="130" cy="88" r="13" fill="var(--platform-coral)" />
                        <circle cx="323" cy="225" r="13" fill="var(--platform-violet)" />
                        <circle cx="526" cy="106" r="13" fill="var(--platform-citron)" />
                        <path
                            d="M130 88L323 225L526 106"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeOpacity="0.45"
                        />
                    </>
                )}
            </svg>

            <span
                className={cn(
                    'absolute start-4 top-4 grid place-items-center border',
                    editorial
                        ? 'border-white/50 bg-[var(--platform-citron)] text-[var(--platform-on-accent)]'
                        : 'border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-violet)]',
                    compact ? 'h-10 w-10' : 'h-14 w-14',
                )}
            >
                <Icon className={compact ? 'h-4 w-4' : 'h-6 w-6'} />
            </span>

            {editorial && problemId != null ? (
                <span className="absolute bottom-4 end-4 font-mono text-sm font-bold tabular-nums">
                    #{problemId}
                </span>
            ) : (
                <Network
                    className={cn(
                        'absolute bottom-4 end-4 text-[var(--platform-violet)]',
                        compact ? 'h-5 w-5' : 'h-8 w-8',
                    )}
                />
            )}
        </div>
    );
}
