export type UserIdentity = {
    userId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    username?: string | null;
    email?: string | null;
    fallbackInitials?: string | null;
};

export const USER_AVATAR_TONES = ['violet', 'coral', 'citron', 'sky', 'teal', 'rose'] as const;

export type UserAvatarTone = (typeof USER_AVATAR_TONES)[number];

const PLACEHOLDER_AVATAR_PATHS = new Set([
    '/placeholder.svg',
    '/placeholder-user.jpg',
    '/placeholder.jpg',
]);

const graphemeSegmenter =
    typeof Intl.Segmenter === 'function'
        ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        : null;

function normalizeIdentityValue(value: string | null | undefined): string | undefined {
    const normalized = value?.normalize('NFC').trim().replace(/\s+/g, ' ');
    return normalized || undefined;
}

function graphemes(value: string): string[] {
    if (graphemeSegmenter) {
        return Array.from(graphemeSegmenter.segment(value), ({ segment }) => segment);
    }

    return Array.from(value);
}

function firstGrapheme(value: string | undefined): string | undefined {
    if (!value) return undefined;
    return graphemes(value)[0];
}

function uppercaseInitial(value: string | undefined): string | undefined {
    if (!value) return undefined;
    const uppercase = value.toUpperCase().normalize('NFC');
    return firstGrapheme(uppercase);
}

function initialsFromDisplayName(value: string | undefined): string[] {
    if (!value) return [];
    const words = value.split(' ').filter(Boolean);
    if (words.length === 0) return [];

    const first = uppercaseInitial(firstGrapheme(words[0]));
    const last =
        words.length > 1 ? uppercaseInitial(firstGrapheme(words[words.length - 1])) : undefined;

    return [first, last].filter((initial): initial is string => Boolean(initial));
}

function firstMeaningfulGrapheme(value: string | undefined): string | undefined {
    if (!value) return undefined;
    const withoutCommonUsernamePrefixes = value.replace(/^[\s._@-]+/, '');
    return firstGrapheme(withoutCommonUsernamePrefixes || value);
}

function explicitInitials(value: string | undefined): string[] {
    if (!value) return [];
    return graphemes(value)
        .filter((segment) => segment.trim().length > 0)
        .slice(0, 2)
        .map((segment) => uppercaseInitial(segment))
        .filter((initial): initial is string => Boolean(initial));
}

/**
 * Returns the clearest public-facing name available for a user.
 *
 * Explicit first and last name fields win over a preformatted display name so
 * all consumers use the same canonical spacing and Unicode normalization.
 */
export function getUserDisplayName(identity: UserIdentity): string {
    const firstName = normalizeIdentityValue(identity.firstName);
    const lastName = normalizeIdentityValue(identity.lastName);
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    return (
        fullName ||
        normalizeIdentityValue(identity.displayName) ||
        normalizeIdentityValue(identity.username) ||
        normalizeIdentityValue(identity.email) ||
        'User'
    );
}

/**
 * Builds at most two Unicode-safe initials without requiring an image request.
 */
export function getUserInitials(identity: UserIdentity): string {
    const providedInitials = explicitInitials(normalizeIdentityValue(identity.fallbackInitials));
    if (providedInitials.length > 0) return providedInitials.join('');

    const firstName = normalizeIdentityValue(identity.firstName);
    const lastName = normalizeIdentityValue(identity.lastName);
    if (firstName || lastName) {
        const nameInitials = [
            uppercaseInitial(firstGrapheme(firstName)),
            uppercaseInitial(firstGrapheme(lastName)),
        ].filter((initial): initial is string => Boolean(initial));

        if (nameInitials.length > 0) return nameInitials.join('');
    }

    const displayNameInitials = initialsFromDisplayName(
        normalizeIdentityValue(identity.displayName),
    );
    if (displayNameInitials.length > 0) return displayNameInitials.join('');

    const usernameInitial = uppercaseInitial(
        firstMeaningfulGrapheme(normalizeIdentityValue(identity.username)),
    );
    if (usernameInitial) return usernameInitial;

    const emailInitial = uppercaseInitial(
        firstMeaningfulGrapheme(normalizeIdentityValue(identity.email)),
    );
    return emailInitial || '?';
}

/**
 * Filters legacy placeholders and unsafe schemes before an avatar reaches the
 * browser. Relative paths and normal HTTP(S), blob, and image data URLs remain
 * supported for existing platform integrations.
 */
export function getUsableAvatarUrl(avatar: string | null | undefined): string | undefined {
    const normalized = normalizeIdentityValue(avatar);
    if (!normalized) return undefined;

    const comparablePath = normalized.split(/[?#]/, 1)[0].toLowerCase();
    if (
        PLACEHOLDER_AVATAR_PATHS.has(comparablePath) ||
        comparablePath === 'null' ||
        comparablePath === 'undefined'
    ) {
        return undefined;
    }

    const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(normalized)?.[1]?.toLowerCase();
    if (!scheme) return normalized;
    if (scheme === 'http' || scheme === 'https' || scheme === 'blob') return normalized;
    if (scheme === 'data' && /^data:image\//i.test(normalized)) return normalized;

    return undefined;
}

/**
 * Selects a stable visual tone without random values or a server lookup.
 */
export function getUserAvatarTone(identity: UserIdentity): UserAvatarTone {
    const key =
        normalizeIdentityValue(identity.userId) ||
        normalizeIdentityValue(identity.username) ||
        normalizeIdentityValue(identity.displayName) ||
        normalizeIdentityValue(identity.email) ||
        getUserInitials(identity);

    let hash = 2166136261;
    for (const character of key) {
        hash ^= character.codePointAt(0) ?? 0;
        hash = Math.imul(hash, 16777619);
    }

    return USER_AVATAR_TONES[(hash >>> 0) % USER_AVATAR_TONES.length];
}
