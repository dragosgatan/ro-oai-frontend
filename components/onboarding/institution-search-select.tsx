'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
    AlertCircle,
    Building2,
    Check,
    Loader2,
    MapPin,
    RefreshCw,
    Search,
    Users,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getInstitutions, getCounties, createMembershipRequest } from '@/lib/api';
import type { Institution, InstitutionType, County } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

interface InstitutionSearchSelectProps {
    onInstitutionSelected: (approved: boolean) => void;
}

export function InstitutionSearchSelect({ onInstitutionSelected }: InstitutionSearchSelectProps) {
    const t = useTranslations();
    const { toast } = useToast();

    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [counties, setCounties] = useState<County[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [countiesError, setCountiesError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [selectedInstitutionId, setSelectedInstitutionId] = useState<number | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<InstitutionType | 'ALL'>('ALL');
    const [selectedCounty, setSelectedCounty] = useState<number | 'ALL'>('ALL');

    const debouncedSearch = useDebounce(searchQuery, 300);

    const loadCounties = useCallback(async () => {
        setCountiesError(null);
        try {
            const data = await getCounties();
            setCounties(data);
        } catch {
            setCounties([]);
            setCountiesError(t('settings.errorLoadingCountries'));
        }
    }, [t]);

    const loadInstitutions = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const filters: {
                type?: InstitutionType;
                countyId?: number;
                search?: string;
            } = {};
            if (selectedType !== 'ALL') filters.type = selectedType;
            if (selectedCounty !== 'ALL') filters.countyId = selectedCounty;
            if (debouncedSearch) filters.search = debouncedSearch;

            const data = await getInstitutions(filters, 0, 3); // Load first 3 results
            setInstitutions(data.content || []);
        } catch {
            setInstitutions([]);
            setLoadError(t('institutions.loadError'));
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, selectedCounty, selectedType, t]);

    useEffect(() => {
        void loadCounties();
    }, [loadCounties]);

    useEffect(() => {
        void loadInstitutions();
    }, [loadInstitutions]);

    const handleSelectInstitution = async (institutionId: number) => {
        if (submitting) return; // Prevent double submission

        setSubmitting(true);
        try {
            const response = await createMembershipRequest(institutionId);

            if (response.status === 'APPROVED') {
                toast({
                    title: t('institutions.requestApproved'),
                    description: t('institutions.requestApprovedDescription'),
                });
            } else {
                toast({
                    title: t('institutions.requestSent'),
                    description: t('institutions.requestSentDescription'),
                });
            }

            const approved = response.status === 'APPROVED';

            // Keep the wizard open so profile and institution completion remain consistent.
            setTimeout(() => {
                onInstitutionSelected(approved);
            }, 800);
        } catch (error: unknown) {
            toast({
                title: t('institutions.requestError'),
                description:
                    error instanceof Error
                        ? error.message
                        : t('institutions.requestErrorDescription'),
                variant: 'destructive',
            });
            setSubmitting(false); // Only reset on error
        }
        // Don't reset submitting on success - keep button disabled
    };

    const getInstitutionTypeLabel = (type: InstitutionType) => {
        const labels: Record<InstitutionType, string> = {
            GIMNAZIU: t('institutions.types.gimnaziu'),
            LICEU: t('institutions.types.liceu'),
            FACULTATE: t('institutions.types.facultate'),
        };
        return labels[type];
    };

    const getInstitutionTypeColor = (type: InstitutionType) => {
        const colors: Record<InstitutionType, string> = {
            GIMNAZIU: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            LICEU: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            FACULTATE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        };
        return colors[type];
    };

    return (
        <div className="flex min-h-0 flex-col">
            {/* Filters - Fixed at top */}
            <div className="flex-shrink-0 space-y-3 mb-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <Select
                        value={selectedType}
                        onValueChange={(value) => setSelectedType(value as InstitutionType | 'ALL')}
                    >
                        <SelectTrigger className="min-h-11 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink)]">
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

                    <Select
                        value={selectedCounty.toString()}
                        onValueChange={(value) =>
                            setSelectedCounty(value === 'ALL' ? 'ALL' : parseInt(value))
                        }
                    >
                        <SelectTrigger className="min-h-11 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink)]">
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

                {countiesError ? (
                    <div
                        className="flex flex-col gap-3 border-s-4 border-[var(--platform-coral)] bg-[var(--platform-paper-strong)] p-3 sm:flex-row sm:items-center sm:justify-between"
                        role="alert"
                    >
                        <span className="flex items-start gap-2 text-sm text-[var(--platform-ink)]">
                            <AlertCircle
                                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--platform-coral)]"
                                aria-hidden="true"
                            />
                            {countiesError}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => void loadCounties()}
                            className="min-h-11 rounded-none border-[var(--platform-line-strong)] bg-transparent text-[var(--platform-ink)] shadow-none"
                        >
                            <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
                            {t('common.retry')}
                        </Button>
                    </div>
                ) : null}

                {/* Search */}
                <div className="relative">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t('institutions.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] ps-10 text-[var(--platform-ink)] shadow-none focus-visible:scale-100 focus-visible:ring-0"
                    />
                </div>
            </div>

            {/* Results - Scrollable area that takes remaining space */}
            <Card className="flex min-h-0 flex-1 flex-col rounded-none border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] shadow-none">
                <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto overscroll-contain min-h-[200px]">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : loadError ? (
                            <div
                                className="flex flex-col items-center justify-center px-4 py-10 text-center"
                                role="alert"
                            >
                                <AlertCircle
                                    className="mb-3 h-8 w-8 text-[var(--platform-coral)]"
                                    aria-hidden="true"
                                />
                                <p className="text-sm font-bold text-[var(--platform-ink)]">
                                    {loadError}
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => void loadInstitutions()}
                                    className="mt-4 min-h-11 rounded-none border-[var(--platform-line-strong)] bg-transparent text-[var(--platform-ink)] shadow-none"
                                >
                                    <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
                                    {t('common.retry')}
                                </Button>
                            </div>
                        ) : institutions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-sm font-medium text-center">
                                    {t('institutions.noResults')}
                                </p>
                                <p className="text-xs text-muted-foreground text-center mt-1">
                                    {t('institutions.noResultsDescription')}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {institutions.map((institution) => (
                                    <button
                                        key={institution.id}
                                        onClick={() => setSelectedInstitutionId(institution.id)}
                                        disabled={submitting}
                                        className={`min-h-16 w-full p-4 text-start transition-colors hover:bg-[var(--platform-paper-strong)] ${
                                            selectedInstitutionId === institution.id
                                                ? 'bg-[var(--platform-paper-strong)]'
                                                : ''
                                        } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-2 mb-1">
                                                    <h4 className="font-medium text-sm line-clamp-2 flex-1">
                                                        {institution.name}
                                                    </h4>
                                                    {selectedInstitutionId === institution.id && (
                                                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                                    <MapPin className="h-3 w-3" />
                                                    {institution.county.name}
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge
                                                        className={`${getInstitutionTypeColor(
                                                            institution.type,
                                                        )} text-xs`}
                                                    >
                                                        {getInstitutionTypeLabel(institution.type)}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {institution.memberCount}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Action button - Below the card */}
            {selectedInstitutionId && (
                <div className="flex-shrink-0 mt-3">
                    <Button
                        onClick={() => handleSelectInstitution(selectedInstitutionId)}
                        disabled={submitting}
                        className="min-h-11 w-full rounded-none bg-[var(--platform-violet)] text-white shadow-none hover:bg-[var(--platform-violet-strong)] dark:text-[var(--platform-on-accent)]"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('institutions.submitting')}
                            </>
                        ) : (
                            t('institutions.requestToJoin')
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
