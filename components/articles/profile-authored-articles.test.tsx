import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const articleMessages: Record<string, string> = {
    'profile.eyebrow': 'Published work',
    'profile.title': 'Articles by this contributor',
    'profile.count': '{count} articles',
    'profile.viewAll': 'View all articles by this contributor',
    'profile.listLabel': 'Published articles',
    'profile.writeArticle': 'Write an article',
    'profile.startWriting': 'Start writing',
    'profile.emptyOwnTitle': 'Your byline starts here',
    'profile.emptyOwnDescription': 'Share what you know.',
    'profile.journey.eyebrow': 'Writing journey',
    'profile.journey.title': 'Knowledge shared',
    'profile.journey.count': '{earned} of {total} writing milestones earned',
    'profile.journey.articlePath': 'Article path',
    'profile.journey.editorialPath': 'Editorial path',
    'profile.journey.nextMilestone': 'Next milestone',
    'profile.journey.highestMilestone': 'Highest milestone earned',
    'profile.journey.pathComplete': 'Path complete',
    'profile.journey.earned': 'Earned',
    'profile.journey.progress': '{current} of {target}',
    'profile.journey.viewAchievements': 'Explore all achievements',
    'kinds.general': 'Article',
    'kinds.problemEditorial': 'Problem editorial',
};

const achievementMessages: Record<string, string> = {
    'names.FIRST_ARTICLE': 'Published Voice',
    'names.ARTICLE_AUTHOR_5': 'Rising Author',
};

vi.mock('next-intl', () => ({
    useLocale: () => 'en',
    useTranslations: (namespace: string) => {
        const messages = namespace === 'achievements' ? achievementMessages : articleMessages;
        const translate = (key: string, values?: Record<string, string | number>) => {
            let message = messages[key] ?? key;
            Object.entries(values ?? {}).forEach(([name, value]) => {
                message = message.replace(`{${name}}`, String(value));
            });
            return message;
        };
        translate.has = (key: string) => key in messages;
        return translate;
    },
}));

vi.mock('@/i18n/routing', () => ({
    Link: ({
        href,
        locale,
        children,
        ...props
    }: React.ComponentProps<'a'> & { locale?: string }) => (
        <a href={String(href)} data-locale={locale} {...props}>
            {children}
        </a>
    ),
}));

import { ProfileAuthoredArticles } from '@/components/articles/profile-authored-articles';
import type { ArticleSummary } from '@/lib/articles';
import type { Achievement, AchievementProgress, UserAchievement } from '@/lib/types';

function article(id: number, kind: ArticleSummary['kind'] = 'GENERAL'): ArticleSummary {
    return {
        id,
        slug: `article-${id}`,
        language: 'ro',
        title: `Article ${id}`,
        excerpt: `A useful explanation for article ${id}.`,
        kind,
        publicationStatus: 'PUBLISHED',
        publishedAt: '2026-07-15T08:00:00Z',
        updatedAt: '2026-07-15T08:00:00Z',
        authors: [{ userId: 'author/one', username: 'writer' }],
        problem: kind === 'PROBLEM_EDITORIAL' ? { id: 289, title: 'Grid Search' } : null,
    };
}

function achievement(code: string, targetValue: number, id: number): Achievement {
    return {
        id,
        code,
        name: code,
        description: `${code} description`,
        category: 'ENGAGEMENT',
        rarity: 'COMMON',
        xpReward: 50,
        targetValue,
        isSecret: false,
        unlockedPercentage: 1,
    };
}

describe('ProfileAuthoredArticles', () => {
    it('keeps a visitor profile uncluttered when the member has no published articles', () => {
        const { container } = render(
            <ProfileAuthoredArticles articles={[]} totalCount={0} authorId="author-one" />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('gives the profile owner an instructive empty state and one primary action', () => {
        render(
            <ProfileAuthoredArticles
                articles={[]}
                totalCount={0}
                authorId="author-one"
                isOwnProfile
            />,
        );

        expect(
            screen.getByRole('heading', { name: 'Your byline starts here' }),
        ).toBeInTheDocument();
        const action = screen.getByRole('link', { name: 'Start writing' });
        expect(action).toHaveAttribute('href', '/writing/new');
        expect(screen.queryByRole('link', { name: 'Write an article' })).not.toBeInTheDocument();
    });

    it('lists published work and links to the complete author-filtered library', () => {
        render(
            <ProfileAuthoredArticles
                articles={[article(1), article(2, 'PROBLEM_EDITORIAL'), article(3)]}
                totalCount={8}
                authorId="author/one"
            />,
        );

        expect(screen.getAllByRole('listitem')).toHaveLength(3);
        expect(screen.getByRole('link', { name: /Article 1/ })).toHaveAttribute(
            'href',
            '/articles/article-1',
        );
        expect(screen.getByRole('link', { name: /Article 1/ })).toHaveAttribute(
            'data-locale',
            'ro',
        );
        expect(screen.getByText('Problem editorial')).toBeInTheDocument();
        expect(screen.getByText('#289')).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'View all articles by this contributor' }),
        ).toHaveAttribute('href', '/articles?authorId=author%2Fone');
    });

    it('shows the owner the next writing milestone with accessible progress', () => {
        const first = achievement('FIRST_ARTICLE', 1, 101);
        const next = achievement('ARTICLE_AUTHOR_5', 5, 102);
        const earned: UserAchievement = {
            id: 201,
            achievement: first,
            unlockedAt: new Date('2026-07-15T08:00:00Z'),
            isShowcased: false,
        };
        const progress: AchievementProgress = {
            achievementId: next.id,
            achievement: next,
            currentValue: 3,
            targetValue: 5,
            percentComplete: 60,
            lastUpdated: new Date('2026-07-15T08:00:00Z'),
        };

        render(
            <ProfileAuthoredArticles
                articles={[article(1)]}
                totalCount={3}
                authorId="author-one"
                isOwnProfile
                achievements={[first, next]}
                userAchievements={[earned]}
                achievementProgress={[progress]}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Knowledge shared' })).toBeInTheDocument();
        expect(screen.getByText('Rising Author')).toBeInTheDocument();
        expect(screen.getByText('Next milestone')).toBeInTheDocument();
        expect(
            screen.getByRole('progressbar', { name: 'Article path Rising Author' }),
        ).toHaveAttribute('aria-valuenow', '3');
        expect(screen.getByRole('link', { name: 'Write an article' })).toHaveAttribute(
            'href',
            '/writing/new',
        );
    });
});
