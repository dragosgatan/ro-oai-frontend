import type { CountyRanking } from './types';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value !== 'string' || value.trim() === '') {
        return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function toNonNegativeNumber(value: unknown): number | null {
    const parsed = toFiniteNumber(value);
    return parsed !== null && parsed >= 0 ? parsed : null;
}

function toPositiveInteger(value: unknown): number | null {
    const parsed = toFiniteNumber(value);
    return parsed !== null && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function toNonEmptyString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function getRankingRows(payload: unknown): unknown[] | null {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (!isRecord(payload)) {
        return null;
    }

    if (Array.isArray(payload.content)) {
        return payload.content;
    }

    if (Array.isArray(payload.results)) {
        return payload.results;
    }

    return null;
}

function normalizeCountyRanking(value: unknown, index: number): CountyRanking | null {
    if (!isRecord(value)) {
        return null;
    }

    const nestedCounty = isRecord(value.county) ? value.county : null;
    const countyId = toPositiveInteger(nestedCounty?.id ?? value.countyId);
    const countyName = toNonEmptyString(nestedCounty?.name ?? value.countyName);
    const countyCode = toNonEmptyString(nestedCounty?.code ?? value.countyCode) ?? '';
    const totalUsers = toNonNegativeNumber(value.totalUsers);
    const institutionCount = toNonNegativeNumber(value.institutionCount ?? value.totalInstitutions);

    if (
        countyId === null ||
        countyName === null ||
        totalUsers === null ||
        institutionCount === null
    ) {
        return null;
    }

    const suppliedAverage = toNonNegativeNumber(value.averageUsersPerInstitution);
    const calculatedAverage = institutionCount > 0 ? totalUsers / institutionCount : 0;

    return {
        rank: toPositiveInteger(value.rank) ?? index + 1,
        county: {
            id: countyId,
            name: countyName,
            code: countyCode,
        },
        totalUsers,
        institutionCount,
        averageUsersPerInstitution: suppliedAverage ?? calculatedAverage,
    };
}

/**
 * Converts both the current flat county-ranking API response and the legacy nested
 * response into the stable shape consumed by the UI.
 *
 * A genuinely empty response stays empty. A non-empty response with no usable rows
 * is treated as an API contract error so the page can offer a retry instead of
 * presenting corrupt data as an empty leaderboard.
 */
export function normalizeCountyRankingsPayload(payload: unknown): CountyRanking[] {
    const rows = getRankingRows(payload);

    if (rows === null) {
        throw new Error('Invalid county rankings response');
    }

    const seenCountyIds = new Set<number>();
    const rankings = rows
        .map(normalizeCountyRanking)
        .filter((ranking): ranking is CountyRanking => {
            if (ranking === null || seenCountyIds.has(ranking.county.id)) {
                return false;
            }

            seenCountyIds.add(ranking.county.id);
            return true;
        })
        .sort((first, second) => first.rank - second.rank);

    if (rows.length > 0 && rankings.length === 0) {
        throw new Error('Invalid county rankings response');
    }

    return rankings;
}
