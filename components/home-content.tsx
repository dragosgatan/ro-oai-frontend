import { getTranslations } from 'next-intl/server';

import type { CompetitionUserListResponse, Locale } from '@/lib/types';
import { getProblemContent } from '@/lib/problem-translations';
import { formatProblemAuthorNames } from '@/lib/problem-authors';
import {
    getCompetitionContent,
    type TranslatableCompetition,
} from '@/lib/competition-translations';
import { getCompetitionStatus } from '@/lib/competition-utils';
import {
    getHomepageCompetitionPreview,
    getNextCompetitionBoundary,
    getOngoingCompetitions,
    shouldUseHomepageCompetitionMode,
    type HomepageProblem,
} from '@/lib/homepage';
import { cn } from '@/lib/utils';
import { HeroSection, type HeroSpotlight } from '@/components/hero-section';
import { HomeJourney } from '@/components/home-journey';
import { CompetitionModeBanner } from '@/components/competition-mode-banner';
import {
    HomeCompetitionsSection,
    type HomeCompetitionItem,
} from '@/components/home-competitions-section';
import { HomeProblemsSection, type HomeProblemItem } from '@/components/home-problems-section';
import { HomeArticlesSection } from '@/components/home-articles-section';
import { LearningMaterialsCTA } from '@/components/learning-materials-cta';
import { HomeBoundaryRefresh } from '@/components/home-boundary-refresh';
import { platformDisplay, platformSans } from '@/lib/platform-fonts';
import type { ArticleSummary } from '@/lib/articles';

type HomeContentProps = {
    locale: Locale;
    problems: HomepageProblem[];
    competitions: CompetitionUserListResponse[];
    totalProblems: number;
    totalCompetitions: number;
    problemsUnavailable: boolean;
    competitionsUnavailable: boolean;
    authoritativeCompetitionMode: boolean;
    articles: ArticleSummary[];
    articlesUnavailable: boolean;
};

export async function HomeContent({
    locale,
    problems,
    competitions,
    totalProblems,
    totalCompetitions,
    problemsUnavailable,
    competitionsUnavailable,
    authoritativeCompetitionMode,
    articles,
    articlesUnavailable,
}: HomeContentProps) {
    const t = await getTranslations();
    const now = new Date();
    const serverNow = now.toISOString();
    const ongoingCompetitions = getOngoingCompetitions(competitions, now);
    const primaryOngoingCompetition =
        ongoingCompetitions.find((competition) => competition.joined) ?? ongoingCompetitions[0];
    // A valid public event controls the rich live UI. If the catalog is unavailable,
    // fall back to the authoritative gate so restricted links are never exposed.
    // When the catalog succeeds, hidden fixtures cannot take over the homepage.
    const isCompetitionMode = shouldUseHomepageCompetitionMode({
        publicOngoingCount: ongoingCompetitions.length,
        authoritativeCompetitionMode,
        competitionCatalogUnavailable: competitionsUnavailable,
    });
    const featuredProblem = isCompetitionMode
        ? undefined
        : (problems.find((problem) => problem.lastAttemptedScore !== null) ?? problems[0]);
    const previewProblems = featuredProblem
        ? problems.filter((problem) => problem.id !== featuredProblem.id).slice(0, 4)
        : problems.slice(0, 4);
    const previewCompetitions = getHomepageCompetitionPreview(
        competitions.filter((competition) => competition.id !== primaryOngoingCompetition?.id),
        now,
        3,
    );
    const nextBoundary = getNextCompetitionBoundary(competitions, now);

    const featuredProblemContent = featuredProblem
        ? getProblemContent(featuredProblem, locale)
        : null;
    const featuredCompetitionContent = primaryOngoingCompetition
        ? getCompetitionContent(
              primaryOngoingCompetition as unknown as TranslatableCompetition,
              locale,
          )
        : null;

    let spotlight: HeroSpotlight | null = null;

    if (featuredProblem && featuredProblemContent) {
        const difficulty = featuredProblem.difficulty.toLowerCase();
        spotlight = {
            problemId: featuredProblem.id,
            href: `/problems/${featuredProblem.id}`,
            overline: `${t('problems.problem')} #${featuredProblem.id}`,
            title: featuredProblemContent.title,
            description: featuredProblemContent.shortDescription,
            status: t(`difficulty.${difficulty}`),
            metaLabel: t('problems.author'),
            metaValue: formatProblemAuthorNames(featuredProblem, locale),
            previewImage: featuredProblem.previewImage,
            tone:
                difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard'
                    ? difficulty
                    : 'neutral',
        };
    }

    const homeCompetitions: HomeCompetitionItem[] = previewCompetitions.map((competition) => {
        const content = getCompetitionContent(
            competition as unknown as TranslatableCompetition,
            locale,
        );
        const status = getCompetitionStatus(competition.startTime, competition.endTime, now);
        const homeStatus =
            status === 'in_progress' ? 'ongoing' : status === 'finished' ? 'ended' : 'future';

        return {
            id: competition.id,
            name: content.name,
            description: content.shortDescription,
            startTime: competition.startTime,
            endTime: competition.endTime,
            joined: competition.joined,
            status: homeStatus,
            statusLabel: t(`competitions.status.${homeStatus}`),
        };
    });

    const numberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    const homeProblems: HomeProblemItem[] = previewProblems.map((problem) => {
        const content = getProblemContent(problem, locale);
        const difficulty = problem.difficulty.toLowerCase();

        return {
            id: problem.id,
            title: content.title,
            description: content.shortDescription,
            difficulty,
            difficultyLabel: t(`difficulty.${difficulty}`),
            author: formatProblemAuthorNames(problem, locale),
            previewImage: problem.previewImage,
            score:
                problem.lastAttemptedScore === null
                    ? null
                    : numberFormatter.format(problem.lastAttemptedScore),
        };
    });

    const primaryHref = primaryOngoingCompetition
        ? `/competitions/${primaryOngoingCompetition.id}`
        : isCompetitionMode
          ? '/competitions'
          : '/problems';
    const primaryLabel = primaryOngoingCompetition
        ? primaryOngoingCompetition.joined
            ? t('competitions.list.view')
            : t('competitions.details.join')
        : isCompetitionMode
          ? t('competitions.home.viewAll')
          : t('hero.ctaExplore');
    const secondaryHref = isCompetitionMode
        ? primaryOngoingCompetition
            ? '/competitions'
            : null
        : '/roadmap';
    const secondaryLabel = isCompetitionMode
        ? primaryOngoingCompetition
            ? t('competitions.home.viewAll')
            : null
        : t('learningMaterials.ctaButton');

    return (
        <div
            className={cn(
                'home-page-shell',
                platformSans.variable,
                platformDisplay.variable,
                platformSans.className,
            )}
        >
            <HomeBoundaryRefresh nextBoundary={nextBoundary} serverNow={serverNow} />

            <HeroSection
                ariaLabel={t('accessibility.heroSection')}
                eyebrow={t('hero.platformTitle')}
                title={t('hero.title')}
                subtitle={t('hero.subtitle')}
                primaryLabel={primaryLabel}
                primaryHref={primaryHref}
                secondaryLabel={secondaryLabel}
                secondaryHref={secondaryHref}
                locale={locale}
                totalProblems={totalProblems}
                totalCompetitions={totalCompetitions}
                problemsLabel={t('problems.availableProblems')}
                competitionsLabel={t('navigation.competitions')}
                spotlight={spotlight}
            />

            {primaryOngoingCompetition && featuredCompetitionContent && (
                <CompetitionModeBanner
                    serverNow={serverNow}
                    competition={{
                        id: primaryOngoingCompetition.id,
                        name: featuredCompetitionContent.name,
                        description: featuredCompetitionContent.shortDescription,
                        endTime: primaryOngoingCompetition.endTime,
                        joined: primaryOngoingCompetition.joined,
                    }}
                />
            )}

            {!isCompetitionMode && (
                <HomeJourney
                    ariaLabel={t('hero.platformTitle')}
                    locale={locale}
                    steps={[
                        {
                            href: '/roadmap',
                            title: t('roadmap.title'),
                            description: t('roadmap.description'),
                        },
                        {
                            href: '/problems',
                            title: t('problems.latestProblems'),
                            description: t('problems.latestSubtitle'),
                        },
                        {
                            href: '/competitions',
                            title: t('competitions.list.title'),
                            description: t('competitions.list.subtitle'),
                        },
                    ]}
                />
            )}

            <HomeCompetitionsSection
                locale={locale}
                competitions={homeCompetitions}
                title={t('competitions.home.title')}
                subtitle={t('competitions.home.subtitle')}
                viewAllLabel={t('competitions.home.viewAll')}
                joinedLabel={t('competitions.status.joined')}
                emptyMessage={t('competitions.list.none')}
                unavailable={competitionsUnavailable}
                errorMessage={t('competitions.list.error')}
            />

            {!isCompetitionMode && (
                <HomeProblemsSection
                    locale={locale}
                    problems={homeProblems}
                    title={t('problems.latestProblems')}
                    subtitle={t('problems.latestSubtitle')}
                    viewAllLabel={t('problems.viewAll')}
                    authorLabel={t('problems.author')}
                    scoreLabel={t('problems.yourBest')}
                    problemLabel={t('problems.problem')}
                    unavailable={problemsUnavailable}
                    errorMessage={t('problems.errorLoading')}
                />
            )}

            <HomeArticlesSection
                locale={locale}
                articles={articles}
                unavailable={articlesUnavailable}
                eyebrow={t('articles.home.eyebrow')}
                title={t('articles.home.title')}
                description={t('articles.home.description')}
                readLabel={t('articles.readArticle')}
                viewAllLabel={t('articles.home.viewAll')}
                authorsLabel={t('articles.authors')}
                authorFallback={t('articles.authorFallback')}
                editorialLabel={t('articles.kinds.problemEditorial')}
                generalLabel={t('articles.kinds.general')}
                emptyTitle={t('articles.home.emptyTitle')}
                emptyDescription={t('articles.home.emptyDescription')}
                unavailableTitle={t('articles.error.title')}
                unavailableDescription={t('articles.error.description')}
                contributeEyebrow={t('articles.home.contributeEyebrow')}
                contributeTitle={t('articles.home.contributeTitle')}
                contributeDescription={t('articles.home.contributeDescription')}
                writeLabel={t('articles.home.writeArticle')}
                proposeLabel={t('problems.proposeProblem')}
                reviewNote={t('articles.home.reviewNote')}
            />

            {!isCompetitionMode && (
                <LearningMaterialsCTA
                    locale={locale}
                    eyebrow={t('learningMaterials.feature1Title')}
                    title={t('roadmap.title')}
                    description={t('learningMaterials.description')}
                    ctaLabel={t('learningMaterials.ctaButton')}
                    steps={[
                        {
                            title: t('learningMaterials.feature1Title'),
                            description: t('learningMaterials.feature1Description'),
                        },
                        {
                            title: t('learningMaterials.feature2Title'),
                            description: t('learningMaterials.feature2Description'),
                        },
                        {
                            title: t('competitions.list.title'),
                            description: t('competitions.home.subtitle'),
                        },
                    ]}
                />
            )}
        </div>
    );
}

export function HomePageLoading() {
    return (
        <div
            className={cn(
                'home-page-shell',
                platformSans.variable,
                platformDisplay.variable,
                platformSans.className,
            )}
            aria-busy="true"
        >
            <div className="home-grid-paper bg-[var(--home-paper)]">
                <div className="mx-auto grid min-h-[42rem] max-w-[90rem] items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-2 xl:px-12">
                    <div className="animate-pulse motion-reduce:animate-none">
                        <div className="h-4 w-48 bg-[var(--home-line)]" />
                        <div className="mt-8 h-20 w-full max-w-xl bg-[var(--home-line)] sm:h-28" />
                        <div className="mt-5 h-20 w-full max-w-2xl bg-[var(--home-line)]" />
                        <div className="mt-8 h-12 w-52 bg-[var(--home-violet)] opacity-30" />
                    </div>
                    <div className="min-h-[28rem] animate-pulse bg-[var(--home-violet)] opacity-25 motion-reduce:animate-none" />
                </div>
            </div>
        </div>
    );
}
