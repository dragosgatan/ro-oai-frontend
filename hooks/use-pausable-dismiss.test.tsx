import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePausableDismiss } from './use-pausable-dismiss';

function DismissHarness({ onDismiss }: { onDismiss: () => void }) {
    const { dismiss, isExiting, pause, resume } = usePausableDismiss({
        duration: 1000,
        exitDuration: 0,
        onDismiss,
    });

    return (
        <button
            type="button"
            data-exiting={isExiting}
            onClick={dismiss}
            onMouseEnter={() => pause('hover')}
            onMouseLeave={() => resume('hover')}
            onFocus={() => pause('focus')}
            onBlur={() => resume('focus')}
        >
            Notification
        </button>
    );
}

function advanceTime(milliseconds: number) {
    act(() => {
        vi.advanceTimersByTime(milliseconds);
    });
}

describe('usePausableDismiss', () => {
    const originalVisibilityState = Object.getOwnPropertyDescriptor(
        Document.prototype,
        'visibilityState',
    );

    beforeEach(() => {
        vi.useFakeTimers();
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();

        if (originalVisibilityState) {
            Object.defineProperty(Document.prototype, 'visibilityState', originalVisibilityState);
        }

        Reflect.deleteProperty(document, 'visibilityState');
    });

    it('auto-dismisses exactly once', () => {
        const onDismiss = vi.fn();
        render(<DismissHarness onDismiss={onDismiss} />);

        advanceTime(1000);

        expect(onDismiss).toHaveBeenCalledOnce();

        advanceTime(5000);
        expect(onDismiss).toHaveBeenCalledOnce();
    });

    it('preserves the remaining countdown while hovered', () => {
        const onDismiss = vi.fn();
        render(<DismissHarness onDismiss={onDismiss} />);
        const notification = screen.getByRole('button');

        advanceTime(400);
        fireEvent.mouseEnter(notification);
        advanceTime(2000);
        expect(onDismiss).not.toHaveBeenCalled();

        fireEvent.mouseLeave(notification);
        advanceTime(599);
        expect(onDismiss).not.toHaveBeenCalled();

        advanceTime(1);
        expect(onDismiss).toHaveBeenCalledOnce();
    });

    it('pauses while a keyboard user has focus', () => {
        const onDismiss = vi.fn();
        render(<DismissHarness onDismiss={onDismiss} />);
        const notification = screen.getByRole('button');

        advanceTime(250);
        fireEvent.focus(notification);
        advanceTime(2000);
        expect(onDismiss).not.toHaveBeenCalled();

        fireEvent.blur(notification);
        advanceTime(750);
        expect(onDismiss).toHaveBeenCalledOnce();
    });

    it('does not expire while the document is hidden', () => {
        const onDismiss = vi.fn();
        render(<DismissHarness onDismiss={onDismiss} />);

        advanceTime(300);
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'hidden',
        });
        document.dispatchEvent(new Event('visibilitychange'));

        advanceTime(2000);
        expect(onDismiss).not.toHaveBeenCalled();

        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
        document.dispatchEvent(new Event('visibilitychange'));

        advanceTime(700);
        expect(onDismiss).toHaveBeenCalledOnce();
    });

    it('cancels the automatic timer after manual dismissal', () => {
        const onDismiss = vi.fn();
        render(<DismissHarness onDismiss={onDismiss} />);

        fireEvent.click(screen.getByRole('button'));
        advanceTime(0);
        expect(onDismiss).toHaveBeenCalledOnce();

        advanceTime(1000);
        expect(onDismiss).toHaveBeenCalledOnce();
    });
});
