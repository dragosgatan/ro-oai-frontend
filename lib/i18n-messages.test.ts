import { describe, expect, it } from 'vitest';

import { MESSAGE_FALLBACK_LOCALE, mergeMessageFallback } from '@/lib/i18n-messages';

describe('message fallback', () => {
    it('uses English as the explicit fallback locale', () => {
        expect(MESSAGE_FALLBACK_LOCALE).toBe('en');
    });

    it('fills nested missing keys without replacing translated values or arrays', () => {
        const result = mergeMessageFallback(
            {
                navigation: { problems: 'Probleme' },
                steps: ['unu'],
            },
            {
                navigation: { problems: 'Problems', competitions: 'Competitions' },
                steps: ['one', 'two'],
                common: { retry: 'Retry' },
            },
        );

        expect(result).toEqual({
            navigation: { problems: 'Probleme', competitions: 'Competitions' },
            steps: ['unu'],
            common: { retry: 'Retry' },
        });
    });
});
