'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Building2, ChevronRight, MapPin, Search, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { CountryFlag } from '@/components/country-flag';
import { MembershipRequestDialog } from '@/components/membership-request-dialog';
import { PlatformEmptyState } from '@/components/platform-page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Link } from '@/i18n/routing';
import {
    createMembershipRequest,
    fetchApi,
    getCounties,
    getInstitutions,
    getMyMembershipRequests,
} from '@/lib/api';
import type { County, Institution, InstitutionType, MembershipRequest } from '@/lib/types';

const institutionTypes: InstitutionType[] = ['GIMNAZIU', 'LICEU', 'FACULTATE'];

function getInstitutionType(value: string | null): InstitutionType | 'ALL' {
    return institutionTypes.includes(value as InstitutionType) ? (value as InstitutionType) : 'ALL';
}

function getCountyId(value: string | null): number | 'ALL' {
    const countyId = Number(value);
    return Number.isInteger(countyId) && countyId > 0 ? countyId : 'ALL';
}

function getPage(value: string | null): number {
    const page = Number(value);
    return Number.isInteger(page) && page > 0 ? page - 1 : 0;
}

type ProfilePayload = {
    settings?: {
        institution?: {
            id?: number;
        };
    };
};

export function InstitutionListView() {
    const t = useTranslations();
    const { toast } = useToast();
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [counties, setCounties] = useState<County[]>([]);
    const [myRequests, setMyRequests] = useState<MembershipRequest[]>([]);
    const [userInstitutionId, setUserInstitutionId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [page, setPage] = useState(() => getPage(searchParams.get('page')));
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') ?? '');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
    const [selectedType, setSelectedType] = useState<InstitutionType | 'ALL'>(() =>
        getInstitutionType(searchParams.get('type')),
    );
    const [selectedCounty, setSelectedCounty] = useState<number | 'ALL'>(() =>
        getCountyId(searchParams.get('countyId')),
    );
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
    const requestIdRef = useRef(0);

    const updateUrl = useCallback(
        ({
            search = searchQuery,
            type = selectedType,
            county = selectedCounty,
            nextPage = page,
        }: {
            search?: string;
            type?: InstitutionType | 'ALL';
            county?: number | 'ALL';
            nextPage?: number;
        }) => {
            const params = new URLSearchParams(searchParams.toString());
            if (search.trim()) params.set('search', search);
            else params.delete('search');

            if (type !== 'ALL') params.set('type', type);
            else params.delete('type');

            if (county !== 'ALL') params.set('countyId', county.toString());
            else params.delete('countyId');

            if (nextPage > 0) params.set('page', (nextPage + 1).toString());
            else params.delete('page');

            const query = params.toString();
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        },
        [page, pathname, router, searchParams, searchQuery, selectedCounty, selectedType],
    );

    useEffect(() => {
        const nextSearch = searchParams.get('search') ?? '';
        const nextType = getInstitutionType(searchParams.get('type'));
        const nextCounty = getCountyId(searchParams.get('countyId'));
        const nextPage = getPage(searchParams.get('page'));

        setSearchQuery((current) => (current === nextSearch ? current : nextSearch));
        setSelectedType((current) => (current === nextType ? current : nextType));
        setSelectedCounty((current) => (current === nextCounty ? current : nextCounty));
        setPage((current) => (current === nextPage ? current : nextPage));
    }, [searchParams]);

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 300);
        return () => window.clearTimeout(timeout);
    }, [searchQuery]);

    useEffect(() => {
        const currentSearch = searchParams.get('search') ?? '';
        if (currentSearch === debouncedSearchQuery) return;
        updateUrl({ search: debouncedSearchQuery, nextPage: 0 });
    }, [debouncedSearchQuery, searchParams, updateUrl]);

    useEffect(() => {
        let active = true;

        getCounties()
            .then((data) => {
                if (active) setCounties(data);
            })
            .catch((error) => console.error('Failed to load counties:', error));

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        if (!session?.id) {
            setMyRequests([]);
            setUserInstitutionId(null);
            return () => {
                active = false;
            };
        }

        void Promise.allSettled([
            getMyMembershipRequests().then((data) => {
                if (active) setMyRequests(data);
            }),
            fetchApi(`${process.env.NEXT_PUBLIC_API_BASE_URL}/profile/${session.id}`).then(
                async (response) => {
                    if (!response.ok || !active) return;
                    const data = (await response.json()) as ProfilePayload;
                    setUserInstitutionId(data.settings?.institution?.id ?? null);
                },
            ),
        ]);

        return () => {
            active = false;
        };
    }, [session?.id]);

    useEffect(() => {
        let active = true;
        const requestId = ++requestIdRef.current;

        async function loadInstitutions() {
            setLoading(true);
            setLoadFailed(false);

            try {
                const filters: {
                    type?: InstitutionType;
                    countyId?: number;
                    search?: string;
                } = {};

                if (selectedType !== 'ALL') filters.type = selectedType;
                if (selectedCounty !== 'ALL') filters.countyId = selectedCounty;
                if (debouncedSearchQuery) filters.search = debouncedSearchQuery;

                const data = await getInstitutions(filters, page, 12);
                if (!active || requestId !== requestIdRef.current) return;

                setInstitutions(data.content ?? []);
                setTotalPages(data.totalPages ?? 0);
                setTotalElements(data.totalElements ?? 0);
            } catch (error) {
                if (!active || requestId !== requestIdRef.current) return;

                console.error('Failed to load institutions:', error);
                setLoadFailed(true);
                setInstitutions([]);
                setTotalPages(0);
                setTotalElements(0);
                toast({
                    title: t('institutions.error'),
                    description: t('institutions.loadError'),
                    variant: 'destructive',
                });
            } finally {
                if (active && requestId === requestIdRef.current) setLoading(false);
            }
        }

        void loadInstitutions();

        return () => {
            active = false;
        };
    }, [debouncedSearchQuery, page, reloadKey, selectedCounty, selectedType, t, toast]);

    const getInstitutionTypeLabel = (type: InstitutionType) => {
        const labels: Record<InstitutionType, string> = {
            GIMNAZIU: t('institutions.types.gimnaziu'),
            LICEU: t('institutions.types.liceu'),
            FACULTATE: t('institutions.types.facultate'),
        };
        return labels[type];
    };

    const getInstitutionAccent = (type: InstitutionType) => {
        const accents: Record<InstitutionType, string> = {
            GIMNAZIU: 'var(--platform-citron)',
            LICEU: 'var(--platform-violet)',
            FACULTATE: 'var(--platform-coral)',
        };
        return accents[type];
    };

    const getPendingRequest = (institutionId: number) =>
        myRequests.find(
            (request) => request.institution.id === institutionId && request.status === 'PENDING',
        );

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setPage(0);
    };

    const handleTypeChange = (value: string) => {
        const type = getInstitutionType(value);
        setSelectedType(type);
        setPage(0);
        updateUrl({ type, nextPage: 0 });
    };

    const handleCountyChange = (value: string) => {
        const county = getCountyId(value === 'ALL' ? null : value);
        setSelectedCounty(county);
        setPage(0);
        updateUrl({ county, nextPage: 0 });
    };

    const handlePageChange = (nextPage: number) => {
        setPage(nextPage);
        updateUrl({ nextPage });
    };

    const handleRequestJoin = (institution: Institution) => {
        setSelectedInstitution(institution);
        setDialogOpen(true);
    };

    const handleConfirmRequest = async () => {
        if (!selectedInstitution) return;

        try {
            const response = await createMembershipRequest(selectedInstitution.id);

            if (response.status === 'APPROVED') {
                setUserInstitutionId(selectedInstitution.id);
                toast({
                    title: t('institutions.requestApproved'),
                    description: t('institutions.requestApprovedDescription'),
                });
            } else {
                setMyRequests((requests) => [response, ...requests]);
                toast({
                    title: t('institutions.requestSent'),
                    description: t('institutions.requestSentDescription'),
                });
            }

            setDialogOpen(false);
            setReloadKey((key) => key + 1);
        } catch (error) {
            toast({
                title: t('institutions.requestError'),
                description:
                    error instanceof Error
                        ? error.message
                        : t('institutions.requestErrorDescription'),
                variant: 'destructive',
            });
        }
    };

    return (
        <section className="mt-8" aria-labelledby="institution-results-count">
            <div className="platform-toolbar grid gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[14rem_14rem_minmax(18rem,1fr)]">
                <div className="space-y-2">
                    <span
                        id="institution-type-filter-label"
                        className="block text-sm font-semibold text-[var(--platform-ink-muted-strong)]"
                    >
                        {t('institutions.filterByType')}
                    </span>
                    <Select value={selectedType} onValueChange={handleTypeChange}>
                        <SelectTrigger
                            aria-labelledby="institution-type-filter-label"
                            className="h-11 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink)] focus:ring-[var(--platform-violet)]"
                        >
                            <SelectValue placeholder={t('institutions.filterByType')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">{t('institutions.allTypes')}</SelectItem>
                            <SelectItem value="GIMNAZIU">
                                {t('institutions.types.gimnaziu')}
                            </SelectItem>
                            <SelectItem value="LICEU">{t('institutions.types.liceu')}</SelectItem>
                            <SelectItem value="FACULTATE">
                                {t('institutions.types.facultate')}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <span
                        id="institution-county-filter-label"
                        className="block text-sm font-semibold text-[var(--platform-ink-muted-strong)]"
                    >
                        {t('institutions.filterByCounty')}
                    </span>
                    <Select value={selectedCounty.toString()} onValueChange={handleCountyChange}>
                        <SelectTrigger
                            aria-labelledby="institution-county-filter-label"
                            className="h-11 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink)] focus:ring-[var(--platform-violet)]"
                        >
                            <SelectValue placeholder={t('institutions.filterByCounty')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">{t('institutions.allCounties')}</SelectItem>
                            {counties.map((county) => (
                                <SelectItem key={county.id} value={county.id.toString()}>
                                    {county.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="institution-search"
                        className="block text-sm font-semibold text-[var(--platform-ink-muted-strong)]"
                    >
                        {t('institutions.searchPlaceholder')}
                    </label>
                    <span className="relative block">
                        <Search
                            className="pointer-events-none absolute top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--platform-ink-muted)] [inset-inline-start:0.875rem]"
                            aria-hidden="true"
                        />
                        <Input
                            id="institution-search"
                            type="search"
                            placeholder={t('institutions.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(event) => handleSearch(event.target.value)}
                            className="h-11 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] ps-10 text-[var(--platform-ink)] focus-visible:scale-100 focus-visible:ring-[var(--platform-violet)]"
                        />
                    </span>
                </div>
            </div>

            <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-5">
                <p
                    id="institution-results-count"
                    className="font-semibold text-[var(--platform-ink-muted-strong)]"
                    aria-live="polite"
                >
                    {loadFailed
                        ? t('institutions.loadError')
                        : loading && institutions.length === 0
                          ? t('common.loading')
                          : t('institutions.resultsCount', { count: totalElements })}
                </p>
                {loading && institutions.length > 0 ? (
                    <span className="text-sm text-[var(--platform-ink-muted)]" role="status">
                        {t('common.loading')}
                    </span>
                ) : totalPages > 0 ? (
                    <span className="text-sm text-[var(--platform-ink-muted)]">
                        {t('common.pageOf', { current: page + 1, total: totalPages })}
                    </span>
                ) : null}
            </div>

            {loading && institutions.length === 0 ? (
                <InstitutionRowsSkeleton />
            ) : loadFailed ? (
                <PlatformEmptyState
                    icon={Building2}
                    title={t('institutions.error')}
                    description={t('institutions.loadError')}
                    action={
                        <Button
                            type="button"
                            className="h-11 rounded-none"
                            onClick={() => setReloadKey((key) => key + 1)}
                        >
                            {t('common.retry')}
                        </Button>
                    }
                />
            ) : institutions.length === 0 ? (
                <PlatformEmptyState
                    icon={Building2}
                    title={t('institutions.noResults')}
                    description={t('institutions.noResultsDescription')}
                />
            ) : (
                <ol
                    className="platform-panel divide-y divide-[var(--platform-line)]"
                    aria-busy={loading}
                >
                    {institutions.map((institution) => {
                        const pendingRequest = getPendingRequest(institution.id);
                        const isMember = userInstitutionId === institution.id;
                        const accent = getInstitutionAccent(institution.type);
                        const detailHref = `/institutions/${institution.id}`;

                        return (
                            <li
                                key={institution.id}
                                className="grid gap-5 px-4 py-5 transition-colors hover:bg-[var(--platform-paper-strong)] sm:px-6 lg:grid-cols-[minmax(0,1fr)_12rem_15rem] lg:items-center"
                            >
                                <div className="min-w-0">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <span
                                            className="mt-1.5 h-3 w-3 shrink-0 border border-[var(--platform-line-strong)]"
                                            style={{ backgroundColor: accent }}
                                            aria-hidden="true"
                                        />
                                        {institution.country ? (
                                            <CountryFlag
                                                countryCode={institution.country.code}
                                                countryName={institution.country.name}
                                                size="sm"
                                                className="mt-0.5 shrink-0"
                                            />
                                        ) : null}
                                        <div className="min-w-0">
                                            <Link
                                                href={detailHref}
                                                className="group inline-flex min-h-11 max-w-full items-center gap-2 py-1 font-semibold leading-snug text-[var(--platform-ink)] underline-offset-4 hover:text-[var(--platform-violet)] hover:underline"
                                            >
                                                <span className="min-w-0" dir="auto">
                                                    {institution.name}
                                                </span>
                                                <ChevronRight
                                                    className="h-4 w-4 shrink-0 rtl-flip"
                                                    aria-hidden="true"
                                                />
                                            </Link>
                                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--platform-ink-muted)]">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <MapPin
                                                        className="h-4 w-4"
                                                        aria-hidden="true"
                                                    />
                                                    <span dir="auto">
                                                        {institution.county.name}
                                                    </span>
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] text-[var(--platform-ink-muted-strong)]"
                                                    style={{ borderInlineStartColor: accent }}
                                                >
                                                    {getInstitutionTypeLabel(institution.type)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    {institution.description || institution.address ? (
                                        <div className="mt-3 space-y-1 ps-7 text-sm leading-6 text-[var(--platform-ink-muted)]">
                                            {institution.description ? (
                                                <p className="line-clamp-2" dir="auto">
                                                    {institution.description}
                                                </p>
                                            ) : null}
                                            {institution.address ? (
                                                <p className="line-clamp-1 text-xs" dir="auto">
                                                    {institution.address}
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="flex items-center gap-3 text-[var(--platform-ink-muted-strong)] lg:border-s lg:border-[var(--platform-line)] lg:ps-5">
                                    <span className="grid h-10 w-10 shrink-0 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)]">
                                        <Users className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                    <span className="text-sm font-semibold">
                                        {t('institutions.memberCount', {
                                            count: institution.memberCount,
                                        })}
                                    </span>
                                </div>

                                <div className="flex items-stretch gap-2 lg:justify-self-end">
                                    <Link
                                        href={detailHref}
                                        aria-label={t('accessibility.viewDetailsFor', {
                                            title: institution.name,
                                        })}
                                        className="hidden h-11 w-11 shrink-0 items-center justify-center border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink)] transition-colors hover:border-[var(--platform-violet)] hover:text-[var(--platform-violet)] lg:inline-flex"
                                    >
                                        <ChevronRight
                                            className="h-4 w-4 rtl-flip"
                                            aria-hidden="true"
                                        />
                                    </Link>

                                    {session ? (
                                        isMember ? (
                                            <Button
                                                variant="outline"
                                                className="h-auto min-h-11 flex-1 rounded-none whitespace-normal border-[var(--platform-line-strong)] px-3 py-2 text-center lg:w-48"
                                                disabled
                                            >
                                                {t('institutions.alreadyMember')}
                                            </Button>
                                        ) : pendingRequest ? (
                                            <Button
                                                variant="outline"
                                                className="h-auto min-h-11 flex-1 rounded-none whitespace-normal border-[var(--platform-line-strong)] px-3 py-2 text-center lg:w-48"
                                                disabled
                                            >
                                                {t('institutions.requestPending')}
                                            </Button>
                                        ) : (
                                            <Button
                                                className="h-auto min-h-11 flex-1 rounded-none whitespace-normal px-3 py-2 text-center lg:w-48"
                                                onClick={() => handleRequestJoin(institution)}
                                            >
                                                {t('institutions.requestToJoin')}
                                            </Button>
                                        )
                                    ) : null}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}

            {totalPages > 1 && !loadFailed ? (
                <nav
                    className="mt-8 flex flex-wrap items-center justify-center gap-3 border-t border-[var(--platform-line)] pt-6"
                    aria-label={t('common.pageOf', { current: page + 1, total: totalPages })}
                >
                    <Button
                        variant="outline"
                        className="h-11 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)]"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 0 || loading}
                    >
                        {t('common.previous')}
                    </Button>
                    <span
                        className="min-w-32 text-center text-sm font-semibold text-[var(--platform-ink-muted-strong)]"
                        aria-live="polite"
                    >
                        {t('common.pageOf', { current: page + 1, total: totalPages })}
                    </span>
                    <Button
                        variant="outline"
                        className="h-11 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)]"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages - 1 || loading}
                    >
                        {t('common.next')}
                    </Button>
                </nav>
            ) : null}

            <MembershipRequestDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                institution={selectedInstitution}
                onConfirm={handleConfirmRequest}
            />
        </section>
    );
}

function InstitutionRowsSkeleton() {
    return (
        <div className="platform-panel divide-y divide-[var(--platform-line)]" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
                    className="grid gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_12rem_15rem] lg:items-center"
                >
                    <div className="space-y-3">
                        <Skeleton className="h-5 w-3/4 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                        <Skeleton className="h-4 w-1/2 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                        <Skeleton className="h-3 w-2/3 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                    <Skeleton className="h-11 w-full rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                </div>
            ))}
        </div>
    );
}
