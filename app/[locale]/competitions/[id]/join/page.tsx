import { JoinCompetition } from '@/components/join-competition';
import { fetchApi } from '@/lib/api';
import { BasicCompetitionUserResponse } from '@/lib/types';
import { AlertTriangle, Trophy } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import {
    PlatformEmptyState,
    PlatformPageHeader,
    PlatformPageShell,
} from '@/components/platform-page-shell';
import {
    getCompetitionOrganizerDataConsent,
    type CompetitionOrganizerDataConsent,
} from '@/lib/competition-hosting';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('competitions.list');

    return {
        title: `${t('title')} - MLCompete`,
        robots: { index: false, follow: false },
    };
}

export default async function CompetitionJoinPage({
    params: paramsPromise,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await paramsPromise;
    const t = await getTranslations('competitions.list');

    let competition: BasicCompetitionUserResponse;
    let organizerDataConsent: CompetitionOrganizerDataConsent | null = null;
    try {
        const [competitionResponse, consentResult] = await Promise.all([
            fetchApi(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/competitions/${encodeURIComponent(id)}/basic`,
            ),
            getCompetitionOrganizerDataConsent(id).catch(() => null),
        ]);
        if (!competitionResponse.ok) {
            throw new Error(`Competition request failed with status ${competitionResponse.status}`);
        }
        competition = (await competitionResponse.json()) as BasicCompetitionUserResponse;
        organizerDataConsent = consentResult;
    } catch (error) {
        console.error(`[Competitions] Failed to load join flow for competition ${id}:`, error);
        return (
            <PlatformPageShell>
                <PlatformPageHeader
                    eyebrow={t('title')}
                    icon={Trophy}
                    title={t('title')}
                    description={t('subtitle')}
                />
                <PlatformEmptyState className="mt-8" icon={AlertTriangle} title={t('error')} />
            </PlatformPageShell>
        );
    }

    return (
        <JoinCompetition competition={competition} organizerDataConsent={organizerDataConsent} />
    );
}
