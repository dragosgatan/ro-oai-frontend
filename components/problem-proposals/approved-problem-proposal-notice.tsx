'use client';

import { CheckCircle2, Clock3 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ApprovedProblemProposalNotice({
    title,
    description,
}: {
    title?: string;
    description?: string;
} = {}) {
    const t = useTranslations('problemProposals');

    return (
        <div
            className="flex items-start gap-3 border border-[var(--platform-violet)] bg-[color-mix(in_oklch,var(--platform-violet)_8%,var(--platform-paper))] p-4"
            role="status"
            aria-live="polite"
        >
            <span className="relative mt-0.5 shrink-0 text-[var(--platform-violet-strong)] dark:text-[var(--platform-violet)]">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                <Clock3
                    className="absolute -bottom-1 -right-1 h-3 w-3 bg-[var(--platform-paper)]"
                    aria-hidden="true"
                />
            </span>
            <div>
                <p className="text-sm font-bold text-[var(--platform-ink)]">
                    {title ?? t('review.acceptedTitle')}
                </p>
                <p className="mt-1 max-w-[68ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                    {description ?? t('review.publicationPending')}
                </p>
            </div>
        </div>
    );
}
