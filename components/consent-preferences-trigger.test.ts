import { describe, expect, it, vi } from 'vitest';

import {
    CONSENT_PREFERENCES_EVENT,
    openConsentPreferences,
} from '@/components/consent-preferences-trigger';

describe('consent preferences trigger API', () => {
    it('dispatches the shared reopen event', () => {
        const listener = vi.fn();
        window.addEventListener(CONSENT_PREFERENCES_EVENT, listener);

        openConsentPreferences();

        expect(listener).toHaveBeenCalledTimes(1);
        window.removeEventListener(CONSENT_PREFERENCES_EVENT, listener);
    });
});
