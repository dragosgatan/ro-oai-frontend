'use client';

import {
    createContext,
    useCallback,
    useContext,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';

import {
    COLOR_MODE_STORAGE_KEY,
    INTERFACE_THEME_STORAGE_KEY,
    normalizeAppearance,
    readStoredAnonymousAppearance,
    resolveColorMode,
    type AppearancePreferences,
    type AppearancePreferencesUpdate,
    type ColorMode,
    type InterfaceTheme,
    type ResolvedColorMode,
} from '@/lib/appearance';
import { updateAppearancePreferences } from '@/lib/appearance-api';

export type AppearanceSyncStatus = 'idle' | 'saving' | 'saved' | 'error';

type AppearanceContextValue = AppearancePreferences & {
    resolvedColorMode: ResolvedColorMode;
    syncStatus: AppearanceSyncStatus;
    setInterfaceTheme: (theme: InterfaceTheme) => Promise<boolean>;
    setColorMode: (mode: ColorMode) => Promise<boolean>;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function systemPrefersDark(): boolean {
    return (
        typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    );
}

function applyAppearance(preferences: AppearancePreferences): ResolvedColorMode {
    const resolvedColorMode = resolveColorMode(preferences.colorMode, systemPrefersDark());

    if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.dataset.interfaceTheme = preferences.uiTheme;
        root.dataset.colorMode = preferences.colorMode;
        root.classList.toggle('dark', resolvedColorMode === 'dark');
        root.style.colorScheme = resolvedColorMode;
    }

    return resolvedColorMode;
}

function initialClientPreferences(
    serverPreferences: AppearancePreferences,
    authenticated: boolean,
): AppearancePreferences {
    if (authenticated || typeof window === 'undefined')
        return normalizeAppearance(serverPreferences);

    try {
        return readStoredAnonymousAppearance(window.localStorage);
    } catch {
        return normalizeAppearance(serverPreferences);
    }
}

type AppearanceProviderProps = {
    children: ReactNode;
    initialPreferences: AppearancePreferences;
    authenticated: boolean;
};

export function AppearanceProvider({
    children,
    initialPreferences,
    authenticated,
}: AppearanceProviderProps) {
    const [preferences, setPreferencesState] = useState<AppearancePreferences>(() =>
        initialClientPreferences(initialPreferences, authenticated),
    );
    const preferencesRef = useRef(preferences);
    const confirmedPreferencesRef = useRef(preferences);
    const [resolvedColorMode, setResolvedColorMode] = useState<ResolvedColorMode>(() =>
        resolveColorMode(preferences.colorMode, systemPrefersDark()),
    );
    const [syncStatus, setSyncStatus] = useState<AppearanceSyncStatus>('idle');
    const mutationSequenceRef = useRef(0);
    const requestQueueRef = useRef<Promise<void>>(Promise.resolve());

    const setPreferences = useCallback((next: AppearancePreferences) => {
        const normalized = normalizeAppearance(next);
        preferencesRef.current = normalized;
        setPreferencesState(normalized);
        setResolvedColorMode(applyAppearance(normalized));
    }, []);

    useLayoutEffect(() => {
        setResolvedColorMode(applyAppearance(preferencesRef.current));
    }, []);

    useLayoutEffect(() => {
        if (preferences.colorMode !== 'system') return;

        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => setResolvedColorMode(applyAppearance(preferencesRef.current));
        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, [preferences.colorMode]);

    const updatePreferences = useCallback(
        (patch: AppearancePreferencesUpdate): Promise<boolean> => {
            const optimistic = normalizeAppearance({ ...preferencesRef.current, ...patch });
            setPreferences(optimistic);
            const mutationId = ++mutationSequenceRef.current;

            if (!authenticated) {
                try {
                    window.localStorage.setItem(INTERFACE_THEME_STORAGE_KEY, optimistic.uiTheme);
                    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, optimistic.colorMode);
                } catch {
                    // The preference still applies for this tab when storage is unavailable.
                }
                confirmedPreferencesRef.current = optimistic;
                setSyncStatus('saved');
                return Promise.resolve(true);
            }

            setSyncStatus('saving');

            const request = requestQueueRef.current
                .catch(() => undefined)
                .then(async () => {
                    try {
                        const confirmed = await updateAppearancePreferences(patch);
                        confirmedPreferencesRef.current = confirmed;
                        if (mutationId === mutationSequenceRef.current) {
                            setPreferences(confirmed);
                            setSyncStatus('saved');
                        }
                        return true;
                    } catch {
                        if (mutationId === mutationSequenceRef.current) {
                            setPreferences(confirmedPreferencesRef.current);
                            setSyncStatus('error');
                        }
                        return false;
                    }
                });

            requestQueueRef.current = request.then(() => undefined);
            return request;
        },
        [authenticated, setPreferences],
    );

    const setInterfaceTheme = useCallback(
        (uiTheme: InterfaceTheme) => updatePreferences({ uiTheme }),
        [updatePreferences],
    );
    const setColorMode = useCallback(
        (colorMode: ColorMode) => updatePreferences({ colorMode }),
        [updatePreferences],
    );

    const value = useMemo<AppearanceContextValue>(
        () => ({
            ...preferences,
            resolvedColorMode,
            syncStatus,
            setInterfaceTheme,
            setColorMode,
        }),
        [preferences, resolvedColorMode, setColorMode, setInterfaceTheme, syncStatus],
    );

    return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
    const context = useContext(AppearanceContext);
    if (!context) throw new Error('useAppearance must be used within AppearanceProvider');
    return context;
}
