/**
 * Formats a competition rank for display with an appropriate medal for the
 * podium and a compact numeric label for every other place.
 */
export function formatRankBadge(rank: number): string {
    if (rank === 1) return '🥇 1st';
    if (rank === 2) return '🥈 2nd';
    if (rank === 3) return '🥉 3rd';
    return `#${rank}`;
}
