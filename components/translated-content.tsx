'use client';

import { ReactNode, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from '@/hooks/use-locale';
import { languageSwitchVariants } from '@/lib/animations';

interface TranslatedContentProps {
    children: ReactNode;
    className?: string;
    /**
     * Whether to animate content changes on language switch
     * @default true
     */
    animate?: boolean;
}

/**
 * Wrapper component for translated content with smooth transitions
 * Optimizes re-renders with React.memo and provides fade animations
 *
 * Usage:
 * ```tsx
 * <TranslatedContent>
 *   <h1>{t('title')}</h1>
 *   <p>{t('description')}</p>
 * </TranslatedContent>
 * ```
 */
export const TranslatedContent = memo(function TranslatedContent({
    children,
    className,
    animate = true,
}: TranslatedContentProps) {
    const { locale } = useLocale();

    if (!animate) {
        return <div className={className}>{children}</div>;
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={locale}
                variants={languageSwitchVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={className}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
});
