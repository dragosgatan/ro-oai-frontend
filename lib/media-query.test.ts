import { describe, expect, it, vi } from 'vitest';

import { subscribeToMediaQuery } from './media-query';

describe('subscribeToMediaQuery', () => {
    const listener = vi.fn();

    it('uses the EventTarget API when it is available', () => {
        const mediaQuery = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
        } as unknown as MediaQueryList;

        const unsubscribe = subscribeToMediaQuery(mediaQuery, listener);

        expect(mediaQuery.addEventListener).toHaveBeenCalledWith('change', listener);
        expect(mediaQuery.addListener).not.toHaveBeenCalled();

        unsubscribe();
        expect(mediaQuery.removeEventListener).toHaveBeenCalledWith('change', listener);
    });

    it('falls back to the legacy Safari listener API', () => {
        const addListener = vi.fn();
        const removeListener = vi.fn();
        const mediaQuery = {
            addEventListener: undefined,
            removeEventListener: undefined,
            addListener,
            removeListener,
        } as unknown as MediaQueryList;

        const unsubscribe = subscribeToMediaQuery(mediaQuery, listener);

        expect(addListener).toHaveBeenCalledWith(listener);

        unsubscribe();
        expect(removeListener).toHaveBeenCalledWith(listener);
    });
});
