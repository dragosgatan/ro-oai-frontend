'use client';

import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface OptimisticActionOptions<T, R> {
    /**
     * The action to perform (e.g., API call)
     */
    action: (data: T) => Promise<R>;

    /**
     * Optimistic update function - called immediately before action
     */
    onOptimisticUpdate?: (data: T) => void;

    /**
     * Rollback function - called if action fails
     */
    onRollback?: (data: T) => void;

    /**
     * Success callback - called after successful action
     */
    onSuccess?: (result: R, data: T) => void;

    /**
     * Error callback - called if action fails
     */
    onError?: (error: Error, data: T) => void;

    /**
     * Success message to display in toast
     */
    successMessage?: string;

    /**
     * Error message to display in toast
     */
    errorMessage?: string;

    /**
     * Whether to show toast notifications
     */
    showToast?: boolean;
}

interface OptimisticActionState {
    isLoading: boolean;
    isOptimistic: boolean;
    error: Error | null;
}

/**
 * Hook for handling optimistic UI updates with automatic rollback on failure
 *
 * @example
 * ```tsx
 * const { execute, isLoading, isOptimistic } = useOptimisticAction({
 *   action: async (data) => api.updateProfile(data),
 *   onOptimisticUpdate: (data) => setProfile(data),
 *   onRollback: (data) => setProfile(originalProfile),
 *   successMessage: 'Profile updated!',
 *   errorMessage: 'Failed to update profile',
 * });
 *
 * await execute(newProfileData);
 * ```
 */
export function useOptimisticAction<T = any, R = any>(options: OptimisticActionOptions<T, R>) {
    const [state, setState] = useState<OptimisticActionState>({
        isLoading: false,
        isOptimistic: false,
        error: null,
    });

    const execute = useCallback(
        async (data: T): Promise<R | null> => {
            try {
                // Set optimistic state
                setState({
                    isLoading: true,
                    isOptimistic: true,
                    error: null,
                });

                // Apply optimistic update immediately
                options.onOptimisticUpdate?.(data);

                // Perform the actual action
                const result = await options.action(data);

                // Success - update state
                setState({
                    isLoading: false,
                    isOptimistic: false,
                    error: null,
                });

                // Call success callback
                options.onSuccess?.(result, data);

                // Show success toast
                if (options.showToast !== false && options.successMessage) {
                    toast({
                        title: 'Success',
                        description: options.successMessage,
                        variant: 'default',
                    });
                }

                return result;
            } catch (error) {
                const err = error instanceof Error ? error : new Error('An error occurred');

                // Rollback optimistic update
                options.onRollback?.(data);

                // Update state with error
                setState({
                    isLoading: false,
                    isOptimistic: false,
                    error: err,
                });

                // Call error callback
                options.onError?.(err, data);

                // Show error toast
                if (options.showToast !== false) {
                    toast({
                        title: 'Error',
                        description: options.errorMessage || err.message,
                        variant: 'destructive',
                    });
                }

                return null;
            }
        },
        [options],
    );

    return {
        execute,
        ...state,
    };
}
