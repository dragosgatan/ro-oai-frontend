/**
 * Onboarding Progress Property-Based Tests
 *
 * Tests for the useOnboardingProgress hook's storage functionality.
 *
 * **Feature: anti-cheat-onboarding-gate**
 *
 * Property 9: Onboarding Persistence Round-Trip
 * Property 10: Per-Competition Isolation
 */

import { describe, expect, beforeEach } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import {
    OnboardingProgress,
    OnboardingStepKey,
    getStorageData,
    setStorageData,
    storageToProgress,
    progressToStorage,
    isOnboardingComplete,
    createEmptyProgress,
} from '../use-onboarding-progress';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
});

// Arbitrary for generating valid competition IDs
const competitionIdArbitrary = fc.integer({ min: 1, max: 100000 });

// Arbitrary for generating boolean step values
const stepValueArbitrary = fc.boolean();

// Use integer timestamps to avoid invalid date values
const validDateArbitrary = fc
    .integer({
        min: new Date('2020-01-01').getTime(),
        max: new Date('2030-12-31').getTime(),
    })
    .map((timestamp) => new Date(timestamp));

// Arbitrary for generating complete OnboardingProgress
const onboardingProgressArbitrary = (competitionId: number): fc.Arbitrary<OnboardingProgress> =>
    fc.record({
        competitionId: fc.constant(competitionId),
        downloadComplete: stepValueArbitrary,
        installComplete: stepValueArbitrary,
        connectComplete: stepValueArbitrary,
        scanComplete: stepValueArbitrary,
        consentComplete: stepValueArbitrary,
        completedAt: fc.option(
            validDateArbitrary.map((d) => d.toISOString()),
            { nil: undefined },
        ),
    });

// Arbitrary for generating OnboardingProgress with a specific competition ID
const progressWithIdArbitrary = competitionIdArbitrary.chain((id) =>
    onboardingProgressArbitrary(id),
);

describe('Onboarding Progress Property-Based Tests', () => {
    beforeEach(() => {
        localStorageMock.clear();
    });

    describe('Property 9: Onboarding Persistence Round-Trip', () => {
        /**
         * **Property 9: Onboarding Persistence Round-Trip**
         * *For any* onboarding progress saved to storage, reloading the page and reading
         * the progress SHALL return an equivalent state with all completed steps preserved.
         *
         * **Validates: Requirements 7.2**
         */
        test.prop([progressWithIdArbitrary], { numRuns: 100 })(
            'saving then loading progress should preserve all step completion states',
            (progress) => {
                // Save progress to storage
                const storageData = getStorageData();
                storageData[progress.competitionId.toString()] = progressToStorage(progress);
                setStorageData(storageData);

                // Load progress from storage (simulating page reload)
                const loadedStorageData = getStorageData();
                const loadedEntry = loadedStorageData[progress.competitionId.toString()];
                const loadedProgress = storageToProgress(progress.competitionId, loadedEntry);

                // Verify all step states are preserved
                expect(loadedProgress).not.toBeNull();
                expect(loadedProgress!.competitionId).toBe(progress.competitionId);
                expect(loadedProgress!.downloadComplete).toBe(progress.downloadComplete);
                expect(loadedProgress!.installComplete).toBe(progress.installComplete);
                expect(loadedProgress!.connectComplete).toBe(progress.connectComplete);
                expect(loadedProgress!.scanComplete).toBe(progress.scanComplete);
                expect(loadedProgress!.consentComplete).toBe(progress.consentComplete);
            },
        );

        test.prop([progressWithIdArbitrary], { numRuns: 100 })(
            'isOnboardingComplete should be consistent after round-trip',
            (progress) => {
                const originalComplete = isOnboardingComplete(progress);

                // Save and reload
                const storageData = getStorageData();
                storageData[progress.competitionId.toString()] = progressToStorage(progress);
                setStorageData(storageData);

                const loadedStorageData = getStorageData();
                const loadedEntry = loadedStorageData[progress.competitionId.toString()];
                const loadedProgress = storageToProgress(progress.competitionId, loadedEntry);

                const loadedComplete = isOnboardingComplete(loadedProgress);

                expect(loadedComplete).toBe(originalComplete);
            },
        );

        test.prop([competitionIdArbitrary], { numRuns: 100 })(
            'empty progress should round-trip correctly',
            (competitionId) => {
                const emptyProgress = createEmptyProgress(competitionId);

                // Save and reload
                const storageData = getStorageData();
                storageData[competitionId.toString()] = progressToStorage(emptyProgress);
                setStorageData(storageData);

                const loadedStorageData = getStorageData();
                const loadedEntry = loadedStorageData[competitionId.toString()];
                const loadedProgress = storageToProgress(competitionId, loadedEntry);

                expect(loadedProgress).not.toBeNull();
                expect(loadedProgress!.downloadComplete).toBe(false);
                expect(loadedProgress!.installComplete).toBe(false);
                expect(loadedProgress!.connectComplete).toBe(false);
                expect(loadedProgress!.scanComplete).toBe(false);
                expect(loadedProgress!.consentComplete).toBe(false);
                expect(isOnboardingComplete(loadedProgress)).toBe(false);
            },
        );

        test.prop([competitionIdArbitrary], { numRuns: 100 })(
            'fully complete progress should round-trip with completedAt timestamp',
            (competitionId) => {
                const completeProgress: OnboardingProgress = {
                    competitionId,
                    downloadComplete: true,
                    installComplete: true,
                    connectComplete: true,
                    scanComplete: true,
                    consentComplete: true,
                };

                // Save and reload
                const storageData = getStorageData();
                storageData[competitionId.toString()] = progressToStorage(completeProgress);
                setStorageData(storageData);

                const loadedStorageData = getStorageData();
                const loadedEntry = loadedStorageData[competitionId.toString()];
                const loadedProgress = storageToProgress(competitionId, loadedEntry);

                expect(loadedProgress).not.toBeNull();
                expect(isOnboardingComplete(loadedProgress)).toBe(true);
                expect(loadedProgress!.completedAt).toBeDefined();
            },
        );
    });

    describe('Property 10: Per-Competition Isolation', () => {
        /**
         * **Property 10: Per-Competition Isolation**
         * *For any* two different competitions A and B, completing onboarding for
         * competition A SHALL NOT affect the onboarding state for competition B.
         *
         * **Validates: Requirements 7.3**
         */
        test.prop(
            [
                competitionIdArbitrary,
                competitionIdArbitrary.filter((id) => id !== 1), // Ensure different IDs
                progressWithIdArbitrary,
            ],
            { numRuns: 100 },
        )(
            'updating progress for one competition should not affect another',
            (compIdA, compIdB, progressTemplate) => {
                // Ensure we have two different competition IDs
                const actualCompIdB = compIdA === compIdB ? compIdB + 1 : compIdB;

                // Create progress for competition A
                const progressA: OnboardingProgress = {
                    ...progressTemplate,
                    competitionId: compIdA,
                };

                // Create different progress for competition B
                const progressB: OnboardingProgress = {
                    competitionId: actualCompIdB,
                    downloadComplete: !progressTemplate.downloadComplete,
                    installComplete: !progressTemplate.installComplete,
                    connectComplete: !progressTemplate.connectComplete,
                    scanComplete: !progressTemplate.scanComplete,
                    consentComplete: !progressTemplate.consentComplete,
                };

                // Save both to storage
                const storageData = getStorageData();
                storageData[compIdA.toString()] = progressToStorage(progressA);
                storageData[actualCompIdB.toString()] = progressToStorage(progressB);
                setStorageData(storageData);

                // Load and verify isolation
                const loadedStorageData = getStorageData();

                const loadedA = storageToProgress(compIdA, loadedStorageData[compIdA.toString()]);
                const loadedB = storageToProgress(
                    actualCompIdB,
                    loadedStorageData[actualCompIdB.toString()],
                );

                // Verify A's state is preserved
                expect(loadedA!.downloadComplete).toBe(progressA.downloadComplete);
                expect(loadedA!.installComplete).toBe(progressA.installComplete);
                expect(loadedA!.connectComplete).toBe(progressA.connectComplete);
                expect(loadedA!.scanComplete).toBe(progressA.scanComplete);
                expect(loadedA!.consentComplete).toBe(progressA.consentComplete);

                // Verify B's state is preserved and different from A
                expect(loadedB!.downloadComplete).toBe(progressB.downloadComplete);
                expect(loadedB!.installComplete).toBe(progressB.installComplete);
                expect(loadedB!.connectComplete).toBe(progressB.connectComplete);
                expect(loadedB!.scanComplete).toBe(progressB.scanComplete);
                expect(loadedB!.consentComplete).toBe(progressB.consentComplete);
            },
        );

        test.prop([competitionIdArbitrary, competitionIdArbitrary], { numRuns: 100 })(
            'deleting progress for one competition should not affect another',
            (compIdA, compIdB) => {
                // Ensure different IDs
                const actualCompIdB = compIdA === compIdB ? compIdB + 1 : compIdB;

                // Create and save progress for both competitions
                const progressA = createEmptyProgress(compIdA);
                progressA.downloadComplete = true;
                progressA.installComplete = true;

                const progressB = createEmptyProgress(actualCompIdB);
                progressB.downloadComplete = true;
                progressB.scanComplete = true;

                let storageData = getStorageData();
                storageData[compIdA.toString()] = progressToStorage(progressA);
                storageData[actualCompIdB.toString()] = progressToStorage(progressB);
                setStorageData(storageData);

                // Delete progress for competition A
                storageData = getStorageData();
                delete storageData[compIdA.toString()];
                setStorageData(storageData);

                // Verify B's state is still preserved
                const loadedStorageData = getStorageData();
                const loadedA = storageToProgress(compIdA, loadedStorageData[compIdA.toString()]);
                const loadedB = storageToProgress(
                    actualCompIdB,
                    loadedStorageData[actualCompIdB.toString()],
                );

                expect(loadedA).toBeNull();
                expect(loadedB).not.toBeNull();
                expect(loadedB!.downloadComplete).toBe(true);
                expect(loadedB!.scanComplete).toBe(true);
            },
        );

        test.prop([fc.array(competitionIdArbitrary, { minLength: 2, maxLength: 10 })], {
            numRuns: 100,
        })('multiple competitions should maintain independent states', (competitionIds) => {
            // Ensure unique IDs
            const uniqueIds = [...new Set(competitionIds)];
            if (uniqueIds.length < 2) {
                uniqueIds.push(uniqueIds[0] + 1);
            }

            // Create progress for each competition with different states
            const progressMap = new Map<number, OnboardingProgress>();
            uniqueIds.forEach((id, index) => {
                const progress = createEmptyProgress(id);
                // Set different steps complete based on index
                progress.downloadComplete = index % 2 === 0;
                progress.installComplete = index % 3 === 0;
                progress.connectComplete = index % 4 === 0;
                progress.scanComplete = index % 5 === 0;
                progress.consentComplete = index === uniqueIds.length - 1;
                progressMap.set(id, progress);
            });

            // Save all to storage
            const storageData = getStorageData();
            progressMap.forEach((progress, id) => {
                storageData[id.toString()] = progressToStorage(progress);
            });
            setStorageData(storageData);

            // Verify each competition's state is independent
            const loadedStorageData = getStorageData();
            progressMap.forEach((originalProgress, id) => {
                const loaded = storageToProgress(id, loadedStorageData[id.toString()]);
                expect(loaded).not.toBeNull();
                expect(loaded!.downloadComplete).toBe(originalProgress.downloadComplete);
                expect(loaded!.installComplete).toBe(originalProgress.installComplete);
                expect(loaded!.connectComplete).toBe(originalProgress.connectComplete);
                expect(loaded!.scanComplete).toBe(originalProgress.scanComplete);
                expect(loaded!.consentComplete).toBe(originalProgress.consentComplete);
            });
        });
    });

    describe('Helper Function Properties', () => {
        test.prop([progressWithIdArbitrary], { numRuns: 100 })(
            'isOnboardingComplete should return true only when all steps are complete',
            (progress) => {
                const allComplete =
                    progress.downloadComplete &&
                    progress.installComplete &&
                    progress.connectComplete &&
                    progress.scanComplete &&
                    progress.consentComplete;

                expect(isOnboardingComplete(progress)).toBe(allComplete);
            },
        );

        test.prop([competitionIdArbitrary], { numRuns: 100 })(
            'createEmptyProgress should create progress with all steps false',
            (competitionId) => {
                const empty = createEmptyProgress(competitionId);

                expect(empty.competitionId).toBe(competitionId);
                expect(empty.downloadComplete).toBe(false);
                expect(empty.installComplete).toBe(false);
                expect(empty.connectComplete).toBe(false);
                expect(empty.scanComplete).toBe(false);
                expect(empty.consentComplete).toBe(false);
                expect(isOnboardingComplete(empty)).toBe(false);
            },
        );

        test.prop([fc.constant(null)], { numRuns: 1 })(
            'isOnboardingComplete should return false for null progress',
            () => {
                expect(isOnboardingComplete(null)).toBe(false);
            },
        );

        test.prop([competitionIdArbitrary], { numRuns: 100 })(
            'storageToProgress should return null for undefined storage entry',
            (competitionId) => {
                const result = storageToProgress(competitionId, undefined);
                expect(result).toBeNull();
            },
        );
    });
});
