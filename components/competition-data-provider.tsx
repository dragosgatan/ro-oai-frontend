'use client';

import React, { createContext, useContext } from 'react';
import type { CurrentCompetitionState } from '@/lib/current-competition';

export type CompetitionData = CurrentCompetitionState & {
    authenticated: boolean;
};

const CompetitionDataContext = createContext<CompetitionData | undefined>(undefined);

export function ProtectedDataProvider({
    value,
    children,
}: {
    value: CompetitionData;
    children: React.ReactNode;
}) {
    return (
        <CompetitionDataContext.Provider value={value}>{children}</CompetitionDataContext.Provider>
    );
}

export function useCompetitionData(): CompetitionData {
    const ctx = useContext(CompetitionDataContext);
    // Return a safe empty object when provider is missing to avoid crashes.
    return (
        ctx ?? {
            isAnyCompetitionOngoing: false,
            isProfileConfirmed: false,
            participantName: null,
            avatar: null,
            username: null,
            authenticated: false,
        }
    );
}
