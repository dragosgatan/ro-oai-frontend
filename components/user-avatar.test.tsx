import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UserAvatar } from '@/components/user-avatar';

describe('UserAvatar', () => {
    it('renders initials without creating an image for missing and placeholder avatars', () => {
        const { container, rerender } = render(
            <UserAvatar firstName="Mark" lastName="Twain" avatar={null} />,
        );

        expect(screen.getByText('MT')).toBeInTheDocument();
        expect(container.querySelector('img')).toBeNull();

        rerender(<UserAvatar firstName="Mark" lastName="Twain" avatar="/placeholder.svg" />);
        expect(container.querySelector('img')).toBeNull();
    });

    it('creates no image elements for a large fallback-only list', () => {
        const { container } = render(
            <>
                {Array.from({ length: 100 }, (_, index) => (
                    <UserAvatar
                        key={index}
                        userId={`user-${index}`}
                        username={`participant-${index}`}
                    />
                ))}
            </>,
        );

        expect(container.querySelectorAll('[data-avatar-has-image="false"]')).toHaveLength(100);
        expect(container.querySelectorAll('img')).toHaveLength(0);
    });

    it('uses lazy, asynchronous, privacy-preserving image defaults', () => {
        const { container } = render(
            <UserAvatar
                avatar="https://images.example/avatar.png"
                firstName="Mark"
                lastName="Twain"
            />,
        );

        const image = container.querySelector('img');
        expect(image).toHaveAttribute('src', 'https://images.example/avatar.png');
        expect(image).toHaveAttribute('alt', '');
        expect(image).toHaveAttribute('loading', 'lazy');
        expect(image).toHaveAttribute('decoding', 'async');
        expect(image).toHaveAttribute('fetchpriority', 'auto');
        expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
        expect(image).toHaveAttribute('draggable', 'false');
        expect(screen.queryByText('MT')).toBeNull();
    });

    it('supports eager loading for an above-the-fold avatar', () => {
        const { container } = render(
            <UserAvatar
                avatar="https://images.example/avatar.png"
                username="participant"
                loading="eager"
            />,
        );

        expect(container.querySelector('img')).toHaveAttribute('loading', 'eager');
        expect(container.querySelector('img')).toHaveAttribute('fetchpriority', 'high');
    });

    it('falls back after an image error and attempts a changed source', () => {
        const { container, rerender } = render(
            <UserAvatar
                avatar="https://images.example/broken.png"
                firstName="Mark"
                lastName="Twain"
            />,
        );

        const brokenImage = container.querySelector('img');
        expect(brokenImage).not.toBeNull();
        fireEvent.error(brokenImage as HTMLImageElement);

        expect(container.querySelector('img')).toBeNull();
        expect(screen.getByText('MT')).toBeInTheDocument();

        rerender(
            <UserAvatar
                avatar="https://images.example/replacement.png"
                firstName="Mark"
                lastName="Twain"
            />,
        );

        expect(container.querySelector('img')).toHaveAttribute(
            'src',
            'https://images.example/replacement.png',
        );
        expect(screen.queryByText('MT')).toBeNull();
    });

    it('is decorative by default and can expose an explicit standalone label', () => {
        const { container, rerender } = render(<UserAvatar firstName="Mark" lastName="Twain" />);

        expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
        expect(screen.queryByRole('img')).toBeNull();

        rerender(
            <UserAvatar firstName="Mark" lastName="Twain" label="Profile picture for Mark Twain" />,
        );

        expect(
            screen.getByRole('img', { name: 'Profile picture for Mark Twain' }),
        ).toBeInTheDocument();
        expect(container.firstElementChild).not.toHaveAttribute('aria-hidden');
    });
});
