import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { headers } from 'next/headers';
import {
    ProtectedDataProvider,
    type CompetitionData,
} from '@/components/competition-data-provider';
import { getCurrentCompetitionState } from '@/lib/current-competition';
import * as Sentry from '@sentry/nextjs';
import {
    buildLocalePath,
    getProtectedRouteContext,
    isCompetitionRestrictedRoute,
    isProfileConfirmationRoute,
    isProtectedGateAllowlisted,
} from '@/lib/protected-routing';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
    const headersList = await headers();
    const headerUrl = headersList.get('x-url') || '';
    const { locale: currentLocale, routePath } = getProtectedRouteContext(headerUrl);

    // Check session first - this is fast and doesn't require API call
    const session = await getSession();

    if (session) {
        Sentry.setUser({
            id: session.id,
            email: session.user?.email || undefined,
        });
    }

    // For unauthenticated users on confirm page, redirect to login immediately
    const isOnConfirmPage = isProfileConfirmationRoute(routePath);
    if (!session && isOnConfirmPage) {
        redirect(buildLocalePath('/login', currentLocale));
    }

    let contextValue: CompetitionData = {
        isAnyCompetitionOngoing: false,
        isProfileConfirmed: false,
        participantName: null,
        avatar: null,
        username: null,
        authenticated: false,
    };

    if (isProtectedGateAllowlisted(routePath)) {
        return <ProtectedDataProvider value={contextValue}>{children}</ProtectedDataProvider>;
    }

    const data = await getCurrentCompetitionState();

    // Profile confirmation gating - do this check early before rendering anything
    if (session) {
        if (isOnConfirmPage) {
            // If already confirmed, don't allow access to confirm page
            if (data.isProfileConfirmed) {
                redirect(buildLocalePath('/', currentLocale));
            }
        } else {
            // For any other protected route, require profile confirmation
            if (!data.isProfileConfirmed) {
                redirect(buildLocalePath('/profile/confirm', currentLocale));
            }
        }
    }

    if (data.isAnyCompetitionOngoing) {
        if (isCompetitionRestrictedRoute(routePath)) {
            redirect(buildLocalePath('/competitions', currentLocale));
        }
    }

    // If no competition or checks pass, render the protected area
    return (
        <ProtectedDataProvider value={{ ...data, authenticated: !!session }}>
            {children}
        </ProtectedDataProvider>
    );
}
