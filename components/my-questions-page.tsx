'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ChevronLeft, ChevronRight, LogIn, MessageSquare } from 'lucide-react';

import { QuestionCard } from '@/components/question-card';
import { PlatformEmptyState } from '@/components/platform-page-shell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getComments, getUserComments, fetchApi } from '@/lib/api';
import { getProblemContent } from '@/lib/problem-translations';
import type {
    Comment,
    CommentStatus,
    CommentThread,
    PaginatedCommentsResponse,
    Problem,
} from '@/lib/types';
import { useLocale } from '@/hooks/use-locale';

type QuestionWithAnswer = {
    question: Comment;
    answer: Comment | null;
};

const PAGE_SIZE = 10;
const VALID_TABS: CommentStatus[] = ['all', 'answered', 'unanswered'];

function parseTab(value: string | null): CommentStatus {
    return VALID_TABS.includes(value as CommentStatus) ? (value as CommentStatus) : 'all';
}

export function MyQuestionsPage() {
    const t = useTranslations('myQuestions');
    const tAll = useTranslations();
    const { status } = useSession();
    const { locale } = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const requestGeneration = useRef(0);

    const [activeTab, setActiveTab] = useState<CommentStatus>(() =>
        parseTab(searchParams.get('status')),
    );
    const [questionsWithAnswers, setQuestionsWithAnswers] = useState<QuestionWithAnswer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [problemTitles, setProblemTitles] = useState<Record<number, string>>({});
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const nextTab = parseTab(searchParams.get('status'));
        setActiveTab((current) => (current === nextTab ? current : nextTab));
    }, [searchParams]);

    const loadQuestions = useCallback(async () => {
        if (status !== 'authenticated') {
            setLoading(status === 'loading');
            return;
        }

        const generation = ++requestGeneration.current;
        setLoading(true);
        setError(null);

        try {
            const response: PaginatedCommentsResponse = await getUserComments(
                activeTab,
                page,
                PAGE_SIZE,
            );

            const uniqueProblemIds = [...new Set(response.content.map((item) => item.problemId))];
            const answeredProblemIds = [
                ...new Set(
                    response.content
                        .filter((item) => item.answeredBy)
                        .map((item) => item.problemId),
                ),
            ];

            const [threadEntries, titleEntries] = await Promise.all([
                Promise.all(
                    answeredProblemIds.map(async (problemId) => {
                        try {
                            return [problemId, await getComments(problemId)] as const;
                        } catch {
                            return [problemId, [] as CommentThread[]] as const;
                        }
                    }),
                ),
                Promise.all(
                    uniqueProblemIds.map(async (problemId) => {
                        try {
                            const problemResponse = await fetchApi(
                                `${process.env.NEXT_PUBLIC_API_BASE_URL}/problems/${problemId}`,
                            );
                            if (!problemResponse.ok) throw new Error('Problem unavailable');
                            const problem = (await problemResponse.json()) as Problem;
                            return [problemId, getProblemContent(problem, locale).title] as const;
                        } catch {
                            return [problemId, `#${problemId}`] as const;
                        }
                    }),
                ),
            ]);

            if (generation !== requestGeneration.current) return;

            const threadsByProblem = new Map(threadEntries);
            const nextQuestions = response.content.map((question) => {
                const thread = threadsByProblem
                    .get(question.problemId)
                    ?.find((item) => item.question.id === question.id);
                return { question, answer: thread?.answer ?? null };
            });

            setQuestionsWithAnswers(nextQuestions);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
            setProblemTitles((current) => ({ ...current, ...Object.fromEntries(titleEntries) }));
        } catch (loadError) {
            if (generation !== requestGeneration.current) return;
            setQuestionsWithAnswers([]);
            setTotalPages(0);
            setTotalElements(0);
            setError(loadError instanceof Error ? loadError.message : tAll('common.error'));
        } finally {
            if (generation === requestGeneration.current) setLoading(false);
        }
    }, [activeTab, locale, page, reloadKey, status, tAll]);

    useEffect(() => {
        void loadQuestions();
        return () => {
            requestGeneration.current += 1;
        };
    }, [loadQuestions]);

    const handleTabChange = (value: string) => {
        const nextTab = parseTab(value);
        setActiveTab(nextTab);
        setPage(0);
        const params = new URLSearchParams(searchParams.toString());
        if (nextTab === 'all') params.delete('status');
        else params.set('status', nextTab);
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    const renderLoadingState = () => (
        <div className="platform-panel divide-y divide-[var(--platform-line)]" aria-busy="true">
            {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-3 px-4 py-5 sm:px-6">
                    <Skeleton className="h-4 w-32 rounded-none bg-[var(--platform-line)]" />
                    <Skeleton className="h-5 w-3/4 rounded-none bg-[var(--platform-line)]" />
                    <Skeleton className="h-16 w-full rounded-none bg-[var(--platform-line)]" />
                </div>
            ))}
        </div>
    );

    const renderContent = () => {
        if (loading) return renderLoadingState();
        if (error) {
            return (
                <PlatformEmptyState
                    icon={AlertTriangle}
                    title={tAll('common.error')}
                    description={error}
                    action={
                        <Button
                            type="button"
                            className="min-h-11 rounded-none"
                            onClick={() => setReloadKey((key) => key + 1)}
                        >
                            {tAll('common.retry')}
                        </Button>
                    }
                />
            );
        }
        if (questionsWithAnswers.length === 0) {
            return (
                <PlatformEmptyState
                    icon={MessageSquare}
                    title={t('noQuestions')}
                    description={
                        activeTab === 'answered'
                            ? t('noQuestionsAnswered')
                            : activeTab === 'unanswered'
                              ? t('noQuestionsUnanswered')
                              : t('noQuestionsAll')
                    }
                />
            );
        }

        return (
            <div className="platform-panel divide-y divide-[var(--platform-line)]">
                {questionsWithAnswers.map(({ question, answer }) => (
                    <QuestionCard
                        key={question.id}
                        question={question}
                        answer={answer}
                        problemTitle={problemTitles[question.problemId]}
                    />
                ))}
            </div>
        );
    };

    if (status === 'unauthenticated') {
        return (
            <PlatformEmptyState
                className="mt-8"
                icon={LogIn}
                title={tAll('navigation.login')}
                description={t('description')}
                action={
                    <Button
                        type="button"
                        className="min-h-11 rounded-none"
                        onClick={() =>
                            signIn('keycloak', {
                                callbackUrl: window.location.href,
                            })
                        }
                    >
                        {tAll('navigation.login')}
                    </Button>
                }
            />
        );
    }

    return (
        <div className="mt-8 space-y-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="overflow-x-auto border-b border-[var(--platform-line-strong)]">
                    <TabsList className="flex h-auto min-w-max flex-row justify-start rounded-none bg-transparent p-0">
                        {VALID_TABS.map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab}
                                className="min-h-11 rounded-none border border-b-0 border-transparent px-4 data-[state=active]:border-[var(--platform-line-strong)] data-[state=active]:bg-[var(--platform-citron)] data-[state=active]:text-[var(--platform-on-accent)]"
                            >
                                {t(`tabs.${tab}`)}
                                {tab === activeTab ? (
                                    <span className="ms-2 tabular-nums">{totalElements}</span>
                                ) : null}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {VALID_TABS.map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-6">
                        {renderContent()}
                    </TabsContent>
                ))}
            </Tabs>

            {!loading && !error && totalPages > 1 ? (
                <nav
                    className="flex flex-col gap-4 border-t border-[var(--platform-line)] pt-5 sm:flex-row sm:items-center sm:justify-between"
                    aria-label={t('title')}
                >
                    <p className="text-sm tabular-nums text-[var(--platform-ink-muted)]">
                        {t('page')} {page + 1} {t('of')} {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPage((current) => Math.max(0, current - 1))}
                            disabled={page === 0}
                            className="min-h-11 flex-1 rounded-none sm:flex-none"
                        >
                            <ChevronLeft className="me-1 h-4 w-4 rtl-flip" aria-hidden="true" />
                            {t('previous')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setPage((current) => Math.min(totalPages - 1, current + 1))
                            }
                            disabled={page >= totalPages - 1}
                            className="min-h-11 flex-1 rounded-none sm:flex-none"
                        >
                            {t('next')}
                            <ChevronRight className="ms-1 h-4 w-4 rtl-flip" aria-hidden="true" />
                        </Button>
                    </div>
                </nav>
            ) : null}
        </div>
    );
}
