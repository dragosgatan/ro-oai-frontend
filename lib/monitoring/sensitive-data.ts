const ARTICLE_INVITATION_PATHS = [
    /\/writing\/invitations\/(?:(?:continue\/)[^/?#&\s]+|(?!continue(?:[/?#]|$))[^/?#&\s]+)/i,
    // The public preview endpoint carries the bearer token at the API root.
    // Keep the boundary explicit so admin invitation UUID routes retain useful
    // telemetry (`/admin/article-invitations/...` is not a bearer-token URL).
    /(?:^|[\s"'`(=])\/article-invitations\/[^/?#&\s]+/i,
    /https?:\/\/[^/?#&\s]+\/article-invitations\/[^/?#&\s]+/i,
    // Redemption is recipient-authenticated, but the path segment remains the
    // same bearer token and must never enter a breadcrumb, span, or error event.
    /\/me\/article-invitations\/[^/?#&\s]+\/redeem(?:[/?#&\s]|$)/i,
    // Competition invitations use the same fragment-to-cookie exchange. Keep
    // legacy raw-token paths and handle-scoped continuation routes out of logs.
    // The exchange endpoint receives the bearer token in its POST body, so the
    // entire request is sensitive even though the URL itself has no token.
    /\/api\/competition-invitations\/exchange(?:[/?#&\s]|$)/i,
    /\/competition-invitations\/accept(?:[?#][^\s]*[?&#]?token=[^&#\s]+)/i,
    /\/competition-invitations\/(?:continue\/)?(?!accept(?:[/?#]|$)|preview(?:[/?#]|$))[^/?#&\s]+/i,
    /\/api\/competition-invitations\/[^/?#&\s]+\/redeem(?:[/?#&\s]|$)/i,
    // Organizer search terms may contain a username, real name, or user ID.
    // Drop the complete request URL rather than retaining its query string.
    /\/me\/hosted-competitions\/[^/?#&\s]+\/users\/search(?:[/?#&\s]|$)/i,
];

export const REDACTED_INVITATION_VALUE = '[redacted invitation URL]';

function decodedVariants(value: string): string[] {
    const variants = [value];
    let current = value;
    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            const decoded = decodeURIComponent(current);
            if (decoded === current) break;
            variants.push(decoded);
            current = decoded;
        } catch {
            break;
        }
    }
    return variants;
}

export function containsArticleInvitationSecret(value: string | null | undefined): boolean {
    return (
        typeof value === 'string' &&
        decodedVariants(value).some((item) =>
            ARTICLE_INVITATION_PATHS.some((pattern) => pattern.test(item)),
        )
    );
}

export function shouldSuppressInvitationAnalytics(
    pathname: string | null | undefined,
    fullUrl?: string | null,
): boolean {
    const isCompetitionInvitationLanding =
        typeof pathname === 'string' &&
        decodedVariants(pathname).some((value) =>
            /\/competition-invitations\/accept(?:[/?#]|$)/i.test(value),
        );
    return (
        isCompetitionInvitationLanding ||
        containsArticleInvitationSecret(pathname) ||
        containsArticleInvitationSecret(fullUrl)
    );
}

export function scrubSensitiveValues<T>(value: T): T {
    const seen = new WeakMap<object, unknown>();

    const scrub = (candidate: unknown): unknown => {
        if (typeof candidate === 'string') {
            return containsArticleInvitationSecret(candidate)
                ? REDACTED_INVITATION_VALUE
                : candidate;
        }
        if (candidate === null || typeof candidate !== 'object' || candidate instanceof Date) {
            return candidate;
        }
        const existing = seen.get(candidate);
        if (existing) return existing;
        if (Array.isArray(candidate)) {
            const copy: unknown[] = [];
            seen.set(candidate, copy);
            candidate.forEach((item) => copy.push(scrub(item)));
            return copy;
        }
        const copy: Record<string, unknown> = {};
        seen.set(candidate, copy);
        Object.entries(candidate).forEach(([key, item]) => {
            copy[key] = scrub(item);
        });
        return copy;
    };

    return scrub(value) as T;
}

export function scrubOrDropSensitiveEvent<T extends { request?: { url?: string } }>(
    event: T,
): T | null {
    return containsArticleInvitationSecret(event.request?.url) ? null : scrubSensitiveValues(event);
}
