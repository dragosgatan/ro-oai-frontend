export const ARTICLE_INVITATION_PREVIEW_COOKIE = 'article_invitation_preview';

export const ARTICLE_INVITATION_REDEEM_COOKIE = 'article_invitation_redeem';

export const ARTICLE_INVITATION_COOKIE_MAX_AGE_SECONDS = 30 * 60;

export function isArticleInvitationHandle(value: string): boolean {
    return /^[a-f0-9]{32}$/.test(value);
}

export async function getArticleInvitationHandle(token: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    return Array.from(new Uint8Array(digest).slice(0, 16))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

export function articleInvitationPreviewCookiePath(locale: string, handle: string): string {
    return `/${locale}/writing/invitations/continue/${handle}`;
}

export function articleInvitationRedeemCookiePath(handle: string): string {
    return `/api/article-invitations/${handle}`;
}
