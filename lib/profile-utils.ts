/**
 * Profile URL utilities
 *
 * Provides functions for generating URL-friendly profile slugs and URLs.
 */

/**
 * Convert a username to a URL-friendly slug.
 * - Converts to lowercase
 * - Replaces spaces and underscores with dashes
 * - Removes special characters (keeps only letters, numbers, dashes)
 * - Normalizes unicode characters (removes accents)
 * - Collapses multiple dashes into one
 * - Trims leading/trailing dashes
 *
 * @param username the original username
 * @returns URL-friendly slug
 */
export function toProfileSlug(username: string | null | undefined): string {
    if (!username || username.trim() === '') {
        return '';
    }

    // Normalize unicode (remove accents like ă -> a, ș -> s)
    let slug = username.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Convert to lowercase
    slug = slug.toLowerCase();

    // Replace spaces and underscores with dashes
    slug = slug.replace(/[\s_]+/g, '-');

    // Remove all non-alphanumeric characters except dashes
    slug = slug.replace(/[^a-z0-9-]/g, '');

    // Collapse multiple dashes into one
    slug = slug.replace(/-+/g, '-');

    // Trim leading and trailing dashes
    slug = slug.replace(/^-+|-+$/g, '');

    return slug;
}

/**
 * Check if a username is SEO-friendly (i.e., it equals its own slug).
 * A username is SEO-friendly if converting it to a slug doesn't change it
 * (other than lowercasing).
 *
 * @param username the username to check
 * @returns true if the username is SEO-friendly
 */
export function isUsernameSlugFriendly(username: string | null | undefined): boolean {
    if (!username || username.trim() === '') {
        return false;
    }
    const slug = toProfileSlug(username);
    return slug === username.toLowerCase();
}

/**
 * Get validation message for a non-SEO-friendly username.
 *
 * @param username the username to check
 * @returns validation message or null if username is valid
 */
export function getUsernameSlugValidationMessage(
    username: string | null | undefined,
): string | null {
    if (!username || username.trim() === '') {
        return null;
    }

    const slug = toProfileSlug(username);
    if (slug === username.toLowerCase()) {
        return null; // Username is SEO-friendly
    }

    // Provide specific feedback
    if (username.includes('_')) {
        return `Username contains underscores. Consider using "${slug}" instead for better SEO.`;
    }
    if (/[._]$/.test(username)) {
        return `Username ends with a special character. Consider using "${slug}" instead.`;
    }
    if (/^[._]/.test(username)) {
        return `Username starts with a special character. Consider using "${slug}" instead.`;
    }

    return `Username "${username}" will appear as "${slug}" in URLs. Consider using "${slug}" directly.`;
}

/**
 * Generate a profile URL for a user.
 * Uses the username directly (URL-encoded) if available, otherwise falls back to userId.
 * The backend handles matching usernames case-insensitively and by slug.
 *
 * @param userId the user's ID (UUID)
 * @param username the user's username (optional)
 * @returns the profile URL path (e.g., "/profile/Radu_" or "/profile/uuid")
 */
export function getProfileUrl(userId: string, username?: string | null): string {
    // If username is available, use it directly (URL-encoded for safety)
    // The backend will match it exactly or by case-insensitive comparison
    if (username && username.trim() !== '') {
        // encodeURIComponent handles special characters safely
        return `/profile/${encodeURIComponent(username.trim())}`;
    }

    // Fall back to userId
    return `/profile/${userId}`;
}

/**
 * Generate a profile URL with a specific tab.
 *
 * @param userId the user's ID (UUID)
 * @param username the user's username (optional)
 * @param tab the tab to open (e.g., "submissions", "achievements")
 * @returns the profile URL path with tab query parameter
 */
export function getProfileUrlWithTab(
    userId: string,
    username?: string | null,
    tab?: string,
): string {
    const baseUrl = getProfileUrl(userId, username);
    if (tab) {
        return `${baseUrl}?tab=${tab}`;
    }
    return baseUrl;
}
