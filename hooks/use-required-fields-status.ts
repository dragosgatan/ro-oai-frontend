import { useState, useEffect, useCallback } from 'react';
import { getRequiredFieldsStatus } from '@/lib/api';
import { RequiredFieldsStatusResponse } from '@/lib/types';

export interface UseRequiredFieldsStatusOptions {
    enabled?: boolean;
}

export interface UseRequiredFieldsStatusResult {
    status: RequiredFieldsStatusResponse | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage the status of required fields for a competition.
 */
export function useRequiredFieldsStatus(
    competitionId: number,
    options: UseRequiredFieldsStatusOptions = { enabled: true },
): UseRequiredFieldsStatusResult {
    const [status, setStatus] = useState<RequiredFieldsStatusResponse | null>(null);
    const [isLoading, setIsLoading] = useState(options.enabled ?? true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        if (!options.enabled) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await getRequiredFieldsStatus(competitionId);
            setStatus(data);
        } catch (err) {
            setError(
                err instanceof Error ? err : new Error('Failed to fetch required fields status'),
            );
        } finally {
            setIsLoading(false);
        }
    }, [competitionId, options.enabled]);

    useEffect(() => {
        if (options.enabled) {
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, [fetchData, options.enabled]);

    return {
        status,
        isLoading,
        error,
        refetch: fetchData,
    };
}
