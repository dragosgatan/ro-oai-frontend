'use client';

import { useOptimistic, useTransition } from 'react';
import { toast } from '@/hooks/use-toast';

interface OptimisticMutationOptions<T, R> {
    /**
     * The current state value
     */
    currentState: T;

    /**
     * The mutation function to perform (e.g., API call)
     */
    mutationFn: (data: R) => Promise<T>;

    /**
     * Function to compute the optimistic state
     */
    optimisticFn: (currentState: T, data: R) => T;

    /**
     * Success message to display in toast
     */
    successMessage?: string;

    /**
     * Error message to display in toast
     */
    errorMessage?: string;

    /**
     * Success callback
     */
    onSuccess?: (result: T) => void;

    /**
     * Error callback
     */
    onError?: (error: Error) => void;
}

/**
 * Hook for optimistic mutations using React 19's useOptimistic
 * Automatically handles rollback on failure and provides visual feedback
 *
 * @example
 * ```tsx
 * const [likes, setLikes] = useState(10);
 *
 * const { optimisticState, mutate, isPending } = useOptimisticMutation({
 *   currentState: likes,
 *   mutationFn: async (increment) => {
 *     const response = await api.updateLikes(increment);
 *     return response.likes;
 *   },
 *   optimisticFn: (current, increment) => current + increment,
 *   successMessage: 'Liked!',
 * });
 *
 * // Use optimisticState for display
 * <div>Likes: {optimisticState}</div>
 * <button onClick={() => mutate(1)}>Like</button>
 * ```
 */
export function useOptimisticMutation<T, R = any>({
    currentState,
    mutationFn,
    optimisticFn,
    successMessage,
    errorMessage,
    onSuccess,
    onError,
}: OptimisticMutationOptions<T, R>) {
    const [optimisticState, setOptimisticState] = useOptimistic(currentState, optimisticFn);
    const [isPending, startTransition] = useTransition();

    const mutate = async (data: R) => {
        // Start optimistic update
        startTransition(() => {
            setOptimisticState(data);
        });

        try {
            // Perform actual mutation
            const result = await mutationFn(data);

            // Success callback
            onSuccess?.(result);

            // Show success toast
            if (successMessage) {
                toast({
                    title: 'Success',
                    description: successMessage,
                    variant: 'default',
                });
            }

            return result;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('An error occurred');

            // Error callback
            onError?.(err);

            // Show error toast
            toast({
                title: 'Error',
                description: errorMessage || err.message,
                variant: 'destructive',
            });

            // The optimistic state will automatically rollback
            // because we're not updating the actual state
            throw err;
        }
    };

    return {
        optimisticState,
        mutate,
        isPending,
    };
}
