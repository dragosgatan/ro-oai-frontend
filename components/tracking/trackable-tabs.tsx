'use client';

/**
 * Trackable Tabs Component
 *
 * A wrapper around the Tabs component that automatically tracks tab changes
 * via GTM for analytics purposes.
 *
 * @example
 * ```tsx
 * <TrackableTabs componentType="problem-tabs" defaultValue="description">
 *   <TabsList>
 *     <TabsTrigger value="description">Description</TabsTrigger>
 *     <TabsTrigger value="editorial">Editorial</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="description">...</TabsContent>
 *   <TabsContent value="editorial">...</TabsContent>
 * </TrackableTabs>
 * ```
 */

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Tabs } from '@/components/ui/tabs';
import { useGTMTracker } from '@/hooks/use-gtm-tracker';

type TabsProps = React.ComponentProps<typeof TabsPrimitive.Root>;

// Re-export all tabs components for convenience
export { TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export interface TrackableTabsProps extends TabsProps {
    /** Required component type identifier */
    componentType: string;
    /** Whether to disable tracking */
    disableTracking?: boolean;
}

export function TrackableTabs({
    children,
    componentType,
    disableTracking = false,
    value,
    defaultValue,
    onValueChange,
    ...props
}: TrackableTabsProps) {
    const { trackUIInteraction } = useGTMTracker();

    const handleValueChange = (newValue: string) => {
        if (!disableTracking) {
            trackUIInteraction(componentType, newValue);
        }

        // Call original onValueChange if provided
        onValueChange?.(newValue);
    };

    return (
        <Tabs
            value={value}
            defaultValue={defaultValue}
            onValueChange={handleValueChange}
            {...props}
        >
            {children}
        </Tabs>
    );
}

/**
 * Hook for tracking tab changes manually
 * Useful when you can't wrap the tabs with TrackableTabs
 */
export function useTabTracking(componentType: string) {
    const { trackUIInteraction } = useGTMTracker();

    const trackTabChange = React.useCallback(
        (tabValue: string) => {
            trackUIInteraction(componentType, tabValue);
        },
        [componentType, trackUIInteraction],
    );

    return { trackTabChange };
}
