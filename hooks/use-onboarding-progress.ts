'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Onboarding progress for a specific competition
 */
export interface OnboardingProgress {
    competitionId: number;
    downloadComplete: boolean;
    installComplete: boolean;
    connectComplete: boolean;
    scanComplete: boolean;
    consentComplete: boolean;
    completedAt?: string;
}

/**
 * Step keys that can be updated
 */
export type OnboardingStepKey =
    | 'downloadComplete'
    | 'installComplete'
    | 'connectComplete'
    | 'scanComplete'
    | 'consentComplete';

/**
 * Storage format for onboarding data
 */
interface OnboardingStorageData {
    [competitionId: string]: {
        steps: {
            download: boolean;
            install: boolean;
            connect: boolean;
            scan: boolean;
            consent: boolean;
        };
        completedAt?: string;
        consentTimestamp?: string;
    };
}

const STORAGE_KEY = 'mlcompete-onboarding-progress';

/**
 * Get all onboarding data from local storage
 */
export function getStorageData(): OnboardingStorageData {
    if (typeof window === 'undefined') {
        return {};
    }
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
}

/**
 * Save onboarding data to local storage
 */
export function setStorageData(data: OnboardingStorageData): void {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // Silently fail if storage is not available
    }
}

/**
 * Convert storage format to OnboardingProgress
 */
export function storageToProgress(
    competitionId: number,
    storageEntry: OnboardingStorageData[string] | undefined,
): OnboardingProgress | null {
    if (!storageEntry) {
        return null;
    }
    return {
        competitionId,
        downloadComplete: storageEntry.steps.download,
        installComplete: storageEntry.steps.install,
        connectComplete: storageEntry.steps.connect,
        scanComplete: storageEntry.steps.scan,
        consentComplete: storageEntry.steps.consent,
        completedAt: storageEntry.completedAt,
    };
}

/**
 * Convert OnboardingProgress to storage format
 */
export function progressToStorage(progress: OnboardingProgress): OnboardingStorageData[string] {
    const completedAt = isOnboardingComplete(progress)
        ? progress.completedAt || new Date().toISOString()
        : undefined;

    return {
        steps: {
            download: progress.downloadComplete,
            install: progress.installComplete,
            connect: progress.connectComplete,
            scan: progress.scanComplete,
            consent: progress.consentComplete,
        },
        completedAt,
        consentTimestamp: progress.consentComplete ? new Date().toISOString() : undefined,
    };
}

/**
 * Check if all onboarding steps are complete
 */
export function isOnboardingComplete(progress: OnboardingProgress | null): boolean {
    if (!progress) {
        return false;
    }
    return (
        progress.downloadComplete &&
        progress.installComplete &&
        progress.connectComplete &&
        progress.scanComplete &&
        progress.consentComplete
    );
}

/**
 * Create an empty progress object for a competition
 */
export function createEmptyProgress(competitionId: number): OnboardingProgress {
    return {
        competitionId,
        downloadComplete: false,
        installComplete: false,
        connectComplete: false,
        scanComplete: false,
        consentComplete: false,
    };
}

/**
 * Hook for managing onboarding progress with local storage persistence
 *
 * Features:
 * - Persists progress to local storage
 * - Stores progress per competition ID (isolation)
 * - Provides updateProgress and resetProgress functions
 *
 * @param competitionId - The competition ID to track progress for
 * @returns Object with progress state and update functions
 */
export function useOnboardingProgress(competitionId: number): {
    progress: OnboardingProgress | null;
    updateProgress: (step: OnboardingStepKey, value: boolean) => void;
    isComplete: boolean;
    resetProgress: () => void;
} {
    const [progress, setProgress] = useState<OnboardingProgress | null>(null);

    // Load progress from storage on mount
    useEffect(() => {
        const storageData = getStorageData();
        const competitionData = storageData[competitionId.toString()];
        const loadedProgress = storageToProgress(competitionId, competitionData);
        setProgress(loadedProgress);
    }, [competitionId]);

    // Update a specific step
    const updateProgress = useCallback(
        (step: OnboardingStepKey, value: boolean) => {
            setProgress((prev) => {
                const current = prev || createEmptyProgress(competitionId);
                const updated: OnboardingProgress = {
                    ...current,
                    [step]: value,
                };

                // Set completedAt if all steps are now complete
                if (isOnboardingComplete(updated) && !updated.completedAt) {
                    updated.completedAt = new Date().toISOString();
                }

                // Persist to storage
                const storageData = getStorageData();
                storageData[competitionId.toString()] = progressToStorage(updated);
                setStorageData(storageData);

                return updated;
            });
        },
        [competitionId],
    );

    // Reset progress for this competition
    const resetProgress = useCallback(() => {
        const storageData = getStorageData();
        delete storageData[competitionId.toString()];
        setStorageData(storageData);
        setProgress(null);
    }, [competitionId]);

    return {
        progress,
        updateProgress,
        isComplete: isOnboardingComplete(progress),
        resetProgress,
    };
}
