'use client';

import * as React from 'react';
import { Link } from '@/i18n/routing';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export type ViewAllButtonProps = {
    href: string;
    className?: string;
};

/**
 * ViewAllButton Component
 *
 * A call-to-action button component that links to a full listing page.
 * Designed as a primary CTA with prominent styling and smooth interactions.
 *
 * Features:
 * - Link-based navigation using Next.js Link
 * - Primary button styling with gradient/solid color
 * - Hover scale effect and shadow
 * - Arrow icon for visual direction
 * - Full keyboard navigation support
 * - ARIA labels for screen readers
 * - Responsive touch target size (minimum 44x44 pixels)
 * - Smooth transitions and animations
 */
export function ViewAllButton({ href, className }: ViewAllButtonProps) {
    const t = useTranslations();

    return (
        <Button
            asChild
            variant="default"
            size="default"
            className={cn(
                'min-w-[200px] min-h-[44px] transition-all duration-200',
                'hover:scale-[1.02] hover:shadow-lg',
                'focus-visible:scale-[1.02] focus-visible:shadow-lg',
                'active:scale-[0.98]',
                className,
            )}
            aria-label={t('problems.viewAllAria')}
        >
            <Link href={href} className="flex items-center justify-center gap-2 w-full h-full">
                {t('problems.viewAll')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
        </Button>
    );
}
