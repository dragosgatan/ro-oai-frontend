import type { Problem, CompetitionFilterOption, AttemptedStatus } from '@/lib/types';
import type { Metadata } from 'next';
import type { Category } from '@/components/problem-filter-panel';
import type { Difficulty } from '@/hooks/use-problem-filters';
import { ProblemsPageClient } from '@/components/problems-page-client';
import { fetchApi } from '@/lib/api';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AlertTriangle, Lightbulb, ListChecks, RotateCcw } from 'lucide-react';
import {
    PlatformEmptyState,
    PlatformPageHeader,
    PlatformPageShell,
} from '@/components/platform-page-shell';
import { Link } from '@/i18n/routing';
import { getServerLocale } from '@/lib/i18n-server';
import { generateProblemsListMetadata } from '@/lib/seo/page-metadata';

// Types mirroring the home page
type PageProps = {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

type PageResponse<T> = {
    content: T[];
    page: {
        size: number;
        number: number;
        totalElements: number;
        totalPages: number;
    };
};

type CategoryResponse = {
    id: number;
    name: string;
    description: string | null;
    problemCount: number;
};

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getServerLocale();
    return generateProblemsListMetadata(locale);
}

/**
 * Parse search params to extract filter values
 */
function parseSearchParams(
    searchParams: { [key: string]: string | string[] | undefined } | undefined,
) {
    const requestedPage = Number(
        Array.isArray(searchParams?.page) ? searchParams?.page[0] : searchParams?.page,
    );
    const page =
        Number.isFinite(requestedPage) && requestedPage >= 0 ? Math.floor(requestedPage) : 0;

    const requestedSize = Number(
        Array.isArray(searchParams?.size) ? searchParams?.size[0] : searchParams?.size,
    );
    const size =
        Number.isFinite(requestedSize) && requestedSize >= 1 && requestedSize <= 50
            ? Math.floor(requestedSize)
            : 9;

    const search = Array.isArray(searchParams?.search)
        ? searchParams?.search[0]
        : searchParams?.search || '';

    // Parse difficulty array
    const difficultyParam = searchParams?.difficulty;
    const difficulty: Difficulty[] = [];
    if (difficultyParam) {
        const difficultyArray = Array.isArray(difficultyParam)
            ? difficultyParam
            : [difficultyParam];
        difficultyArray.forEach((d) => {
            if (d === 'Easy' || d === 'Medium' || d === 'Hard') {
                difficulty.push(d);
            }
        });
    }

    // Parse categoryIds array
    const categoryIdsParam = searchParams?.categoryIds;
    const categoryIds: number[] = [];
    if (categoryIdsParam) {
        const categoryIdsArray = Array.isArray(categoryIdsParam)
            ? categoryIdsParam
            : [categoryIdsParam];
        categoryIdsArray.forEach((id) => {
            const parsed = parseInt(id, 10);
            if (!isNaN(parsed) && parsed > 0) {
                categoryIds.push(parsed);
            }
        });
    }

    // Parse competitionIds array
    const competitionIdsParam = searchParams?.competitionIds;
    const competitionIds: number[] = [];
    if (competitionIdsParam) {
        const competitionIdsArray = Array.isArray(competitionIdsParam)
            ? competitionIdsParam
            : [competitionIdsParam];
        competitionIdsArray.forEach((id) => {
            const parsed = parseInt(id, 10);
            if (!isNaN(parsed) && parsed > 0) {
                competitionIds.push(parsed);
            }
        });
    }

    // Parse attemptedStatus
    const attemptedStatusParam = Array.isArray(searchParams?.attemptedStatus)
        ? searchParams?.attemptedStatus[0]
        : searchParams?.attemptedStatus;
    const attemptedStatus: AttemptedStatus =
        attemptedStatusParam === 'attempted' || attemptedStatusParam === 'unattempted'
            ? attemptedStatusParam
            : null;

    return { page, size, search, difficulty, categoryIds, competitionIds, attemptedStatus };
}

/**
 * Build API URL with filter parameters
 */
function buildProblemsApiUrl(
    baseUrl: string,
    page: number,
    size: number,
    search: string,
    difficulty: Difficulty[],
    categoryIds: number[],
    competitionIds: number[],
    attemptedStatus: AttemptedStatus,
): URL {
    const url = new URL(`${baseUrl}/problems`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('size', String(size));

    if (search.trim()) {
        url.searchParams.set('search', search.trim());
    }

    difficulty.forEach((d) => {
        url.searchParams.append('difficulty', d);
    });

    categoryIds.forEach((id) => {
        url.searchParams.append('categoryIds', id.toString());
    });

    competitionIds.forEach((id) => {
        url.searchParams.append('competitionIds', id.toString());
    });

    if (attemptedStatus) {
        url.searchParams.set('attemptedStatus', attemptedStatus);
    }

    return url;
}

/**
 * Calculate category counts from categories
 */
function calculateCategoryCounts(categories: Category[]): Record<number, number> {
    const counts: Record<number, number> = {};
    categories.forEach((category) => {
        counts[category.id] = category.problemCount;
    });
    return counts;
}

export default async function ProblemsPage({ searchParams }: PageProps) {
    const t = await getTranslations('problems');
    const tCommon = await getTranslations('common');
    const resolvedSearchParams = await searchParams;
    const { page, size, search, difficulty, categoryIds, competitionIds, attemptedStatus } =
        parseSearchParams(resolvedSearchParams);

    // Check if user is authenticated using next-auth
    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session;

    // Fetch problems with filters
    const problemsUrl = buildProblemsApiUrl(
        process.env.NEXT_PUBLIC_API_BASE_URL!,
        page,
        size,
        search,
        difficulty,
        categoryIds,
        competitionIds,
        attemptedStatus,
    );

    // Fetch categories
    const categoriesUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories`;

    // Fetch filter counts (difficulty counts)
    const filterCountsUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/problems/filter-counts`;

    // Fetch competitions for filter
    const competitionsUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/problems/filter-competitions`;

    const renderErrorPage = () => (
        <PlatformPageShell>
            <PlatformPageHeader
                eyebrow={t('availableProblems')}
                icon={ListChecks}
                title={t('title')}
                description={t('subtitle')}
            />
            <PlatformEmptyState
                className="mt-10"
                icon={AlertTriangle}
                title={t('errorLoading')}
                action={
                    <Link
                        href="/problems"
                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] bg-[var(--platform-violet)] px-4 py-2 text-sm font-bold text-white shadow-[4px_4px_0_var(--platform-line)] transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--platform-coral)] focus-visible:ring-offset-2 active:translate-y-px dark:text-[var(--platform-on-accent)]"
                    >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        {tCommon('retry')}
                    </Link>
                }
            />
        </PlatformPageShell>
    );

    // The problem list is task-critical. Optional filter metadata degrades independently.
    const responses = await Promise.allSettled([
        fetchApi(problemsUrl.toString()),
        fetchApi(categoriesUrl),
        fetchApi(filterCountsUrl),
        fetchApi(competitionsUrl),
    ]);

    const [problemsResult, categoriesResult, filterCountsResult, competitionsResult] = responses;
    const problemsRes = problemsResult.status === 'fulfilled' ? problemsResult.value : null;
    const categoriesRes = categoriesResult.status === 'fulfilled' ? categoriesResult.value : null;
    const filterCountsRes =
        filterCountsResult.status === 'fulfilled' ? filterCountsResult.value : null;
    const competitionsRes =
        competitionsResult.status === 'fulfilled' ? competitionsResult.value : null;

    // Handle errors
    if (!problemsRes?.ok) {
        return renderErrorPage();
    }

    const problemsJson = (await problemsRes.json()) as PageResponse<Problem>;
    const problems = problemsJson.content;
    const totalPages = problemsJson.page.totalPages;
    const totalElements = problemsJson.page.totalElements;
    const currentPage = problemsJson.page.number;

    // Parse categories (may fail if endpoint doesn't exist yet)
    let categories: Category[] = [];
    if (categoriesRes?.ok) {
        try {
            const categoriesJson = (await categoriesRes.json()) as CategoryResponse[];
            categories = categoriesJson.map((cat) => ({
                id: cat.id,
                name: cat.name,
                description: cat.description,
                problemCount: cat.problemCount,
            }));
        } catch {
            // Categories endpoint may not be available yet
            categories = [];
        }
    }

    // Get difficulty counts from API
    let difficultyCounts: Record<Difficulty, number> = { Easy: 0, Medium: 0, Hard: 0 };
    if (filterCountsRes?.ok) {
        try {
            const filterCountsJson = (await filterCountsRes.json()) as {
                difficultyCounts: Record<string, number>;
            };
            // Map the API response to our expected format (EASY -> Easy, etc.)
            difficultyCounts = {
                Easy: filterCountsJson.difficultyCounts?.EASY ?? 0,
                Medium: filterCountsJson.difficultyCounts?.MEDIUM ?? 0,
                Hard: filterCountsJson.difficultyCounts?.HARD ?? 0,
            };
        } catch {
            // Filter counts endpoint may not be available yet
            difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
        }
    }

    // Calculate category counts from categories
    const categoryCounts = calculateCategoryCounts(categories);

    // Parse competitions (may fail if endpoint doesn't exist yet)
    let competitions: CompetitionFilterOption[] = [];
    if (competitionsRes?.ok) {
        try {
            const competitionsJson = (await competitionsRes.json()) as CompetitionFilterOption[];
            competitions = competitionsJson ?? [];
        } catch {
            // Competitions endpoint may not be available yet
            competitions = [];
        }
    }

    // Calculate competition counts from the problemCount field
    const competitionCounts: Record<number, number> = {};
    competitions.forEach((competition) => {
        competitionCounts[competition.id] = competition.problemCount ?? 0;
    });

    return (
        <PlatformPageShell>
            <PlatformPageHeader
                eyebrow={t('availableProblems')}
                icon={ListChecks}
                title={t('title')}
                description={t('subtitle')}
                aside={
                    <Link
                        href="/problem-proposals/new"
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-[var(--platform-line-strong)] bg-[var(--platform-citron)] px-5 py-3 text-sm font-bold text-[var(--platform-on-accent)] shadow-[4px_4px_0_var(--platform-violet)] outline-none transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-[var(--platform-coral)] focus-visible:ring-offset-2 sm:w-auto"
                    >
                        <Lightbulb className="h-4 w-4" aria-hidden="true" />
                        {t('contribution.headerAction')}
                    </Link>
                }
            />
            <ProblemsPageClient
                initialProblems={problems}
                categories={categories}
                competitions={competitions}
                totalElements={totalElements}
                totalPages={totalPages}
                currentPage={currentPage}
                size={size}
                difficultyCounts={difficultyCounts}
                categoryCounts={categoryCounts}
                competitionCounts={competitionCounts}
                isAuthenticated={isAuthenticated}
            />
        </PlatformPageShell>
    );
}
