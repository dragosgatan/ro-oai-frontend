'use client';

import * as React from 'react';

import { Avatar } from '@/components/ui/avatar';
import {
    getUsableAvatarUrl,
    getUserAvatarTone,
    getUserInitials,
    type UserIdentity,
    type UserAvatarTone,
} from '@/lib/user-identity';
import { cn } from '@/lib/utils';

const toneClassNames: Record<UserAvatarTone, string> = {
    violet: 'bg-[oklch(0.91_0.055_292)] text-[oklch(0.34_0.19_291)] dark:bg-[oklch(0.29_0.08_291)] dark:text-[oklch(0.88_0.07_292)]',
    coral: 'bg-[oklch(0.92_0.055_35)] text-[oklch(0.37_0.13_32)] dark:bg-[oklch(0.3_0.07_32)] dark:text-[oklch(0.89_0.07_35)]',
    citron: 'bg-[oklch(0.93_0.08_116)] text-[oklch(0.34_0.08_116)] dark:bg-[oklch(0.29_0.055_116)] dark:text-[oklch(0.9_0.09_116)]',
    sky: 'bg-[oklch(0.92_0.05_230)] text-[oklch(0.34_0.12_240)] dark:bg-[oklch(0.29_0.065_240)] dark:text-[oklch(0.88_0.065_230)]',
    teal: 'bg-[oklch(0.92_0.055_175)] text-[oklch(0.32_0.09_175)] dark:bg-[oklch(0.28_0.055_175)] dark:text-[oklch(0.88_0.065_175)]',
    rose: 'bg-[oklch(0.92_0.05_350)] text-[oklch(0.36_0.13_350)] dark:bg-[oklch(0.29_0.07_350)] dark:text-[oklch(0.89_0.065_350)]',
};

type AvatarRootProps = Omit<
    React.ComponentPropsWithoutRef<typeof Avatar>,
    'aria-hidden' | 'aria-label' | 'children' | 'className' | 'role'
>;

export type UserAvatarProps = AvatarRootProps &
    UserIdentity & {
        avatar?: string | null;
        className?: string;
        imageClassName?: string;
        fallbackClassName?: string;
        loading?: 'eager' | 'lazy';
        /**
         * Avatars are decorative by default because they normally accompany a
         * visible name. Provide a localized label only for a standalone avatar.
         */
        label?: string;
    };

export const UserAvatar = React.forwardRef<React.ElementRef<typeof Avatar>, UserAvatarProps>(
    (
        {
            avatar,
            userId,
            firstName,
            lastName,
            displayName,
            username,
            email,
            fallbackInitials,
            className,
            imageClassName,
            fallbackClassName,
            loading = 'lazy',
            label,
            ...rootProps
        },
        ref,
    ) => {
        const identity = {
            userId,
            firstName,
            lastName,
            displayName,
            username,
            email,
            fallbackInitials,
        };
        const initials = getUserInitials(identity);
        const tone = getUserAvatarTone(identity);
        const usableAvatar = getUsableAvatarUrl(avatar);
        const [failedAvatar, setFailedAvatar] = React.useState<string | null>(null);
        const shouldRenderImage = Boolean(usableAvatar && failedAvatar !== usableAvatar);
        const accessibleLabel = label?.trim() || undefined;

        return (
            <Avatar
                {...rootProps}
                ref={ref}
                role={accessibleLabel ? 'img' : undefined}
                aria-label={accessibleLabel}
                aria-hidden={accessibleLabel ? undefined : true}
                data-avatar-tone={tone}
                data-avatar-has-image={shouldRenderImage ? 'true' : 'false'}
                className={cn(
                    'isolate bg-[var(--platform-paper-strong)] font-semibold uppercase',
                    className,
                )}
            >
                {!shouldRenderImage ? (
                    <span
                        aria-hidden="true"
                        className={cn(
                            'absolute inset-0 flex items-center justify-center leading-none',
                            toneClassNames[tone],
                            fallbackClassName,
                        )}
                    >
                        {initials}
                    </span>
                ) : null}
                {shouldRenderImage ? (
                    <img
                        key={usableAvatar}
                        src={usableAvatar}
                        alt=""
                        loading={loading}
                        decoding="async"
                        fetchPriority={loading === 'eager' ? 'high' : 'auto'}
                        referrerPolicy="no-referrer"
                        draggable={false}
                        className={cn(
                            'absolute inset-0 h-full w-full object-cover',
                            imageClassName,
                        )}
                        onLoad={() => setFailedAvatar(null)}
                        onError={() => setFailedAvatar(usableAvatar ?? null)}
                    />
                ) : null}
            </Avatar>
        );
    },
);

UserAvatar.displayName = 'UserAvatar';
