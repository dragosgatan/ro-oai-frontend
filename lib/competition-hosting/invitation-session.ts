export const COMPETITION_INVITATION_PREVIEW_COOKIE = 'competition_invitation_preview';
export const COMPETITION_INVITATION_REDEEM_COOKIE = 'competition_invitation_redeem';
export const COMPETITION_INVITATION_COOKIE_MAX_AGE_SECONDS = 30 * 60;

export function isCompetitionInvitationHandle(value: string): boolean {
    return /^[a-f0-9]{32}$/.test(value);
}

export async function getCompetitionInvitationHandle(token: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    return Array.from(new Uint8Array(digest).slice(0, 16))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

export function competitionInvitationPreviewCookiePath(locale: string, handle: string): string {
    return `/${locale}/competition-invitations/continue/${handle}`;
}

export function competitionInvitationRedeemCookiePath(handle: string): string {
    return `/api/competition-invitations/${handle}`;
}
