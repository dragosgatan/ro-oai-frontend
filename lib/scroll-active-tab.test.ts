import { describe, expect, it, vi } from 'vitest';
import { scrollActiveTabIntoView } from './scroll-active-tab';

function rect(left: number, right: number): DOMRect {
    return {
        bottom: 48,
        height: 48,
        left,
        right,
        top: 0,
        width: right - left,
        x: left,
        y: 0,
        toJSON: () => ({}),
    };
}

describe('scrollActiveTabIntoView', () => {
    it('moves an offscreen active tab into the nearest visible position', () => {
        const strip = document.createElement('div');
        const trigger = document.createElement('button');
        const scrollIntoView = vi.fn();
        strip.getBoundingClientRect = () => rect(0, 390);
        trigger.getBoundingClientRect = () => rect(520, 620);
        trigger.scrollIntoView = scrollIntoView;

        expect(scrollActiveTabIntoView(strip, trigger, 'smooth')).toBe(true);
        expect(scrollIntoView).toHaveBeenCalledWith({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
        });
    });

    it('does not disturb the strip when the active tab is already visible', () => {
        const strip = document.createElement('div');
        const trigger = document.createElement('button');
        const scrollIntoView = vi.fn();
        strip.getBoundingClientRect = () => rect(0, 390);
        trigger.getBoundingClientRect = () => rect(120, 240);
        trigger.scrollIntoView = scrollIntoView;

        expect(scrollActiveTabIntoView(strip, trigger, 'auto')).toBe(false);
        expect(scrollIntoView).not.toHaveBeenCalled();
    });
});
