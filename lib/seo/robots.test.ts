import { describe, expect, it } from 'vitest';

import { generateRobotsConfig, isPathDisallowed } from '@/lib/seo/robots';

describe('article crawler policy', () => {
    it('keeps public article details and pagination crawlable', () => {
        expect(isPathDisallowed('/ro/articles/an-editorial')).toBe(false);
        expect(isPathDisallowed('/articles/an-editorial')).toBe(false);
        expect(isPathDisallowed('/ro/articles?page=2')).toBe(false);
        expect(isPathDisallowed('/articles?page=3')).toBe(false);
    });

    it('lets crawlers read noindex directives on filters while keeping writing private', () => {
        expect(isPathDisallowed('/ro/articles?page=2&authorId=user-1')).toBe(false);
        expect(isPathDisallowed('/ro/articles?problemId=42')).toBe(false);
        expect(isPathDisallowed('/ro/writing/42')).toBe(true);
    });

    it('allows crawlable social images used by Article structured data', () => {
        const imagePath = '/api/og?type=generic&title=Editorial';
        expect(isPathDisallowed(imagePath)).toBe(false);

        const config = generateRobotsConfig();
        for (const userAgent of ['*', 'Googlebot', 'Bingbot']) {
            const rule = config.rules.find((candidate) => candidate.userAgent === userAgent);
            expect(rule?.allow).toContain('/api/og?*$');
            expect(rule?.allow).toContain('/*/articles?*$');
        }
    });

    it('advertises the sitemap index to crawlers', () => {
        expect(generateRobotsConfig().sitemap).toEqual([expect.stringMatching(/\/sitemap\.xml$/)]);
    });

    it('keeps organizer and competition invitation workspaces private', () => {
        expect(isPathDisallowed('/ro/my-competitions/42/participants')).toBe(true);
        expect(isPathDisallowed('/my-competitions/new')).toBe(true);
        expect(isPathDisallowed('/ro/competition-invitations/accept')).toBe(true);
        expect(isPathDisallowed('/competition-invitations/continue/safe-handle')).toBe(true);
        expect(isPathDisallowed('/ro/competitions/42')).toBe(false);
    });
});
