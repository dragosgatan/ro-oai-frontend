'use client';

/**
 * Trackable Accordion Component
 *
 * A wrapper around the Accordion component that automatically tracks accordion
 * toggle interactions via GTM.
 *
 * @example
 * ```tsx
 * <TrackableAccordion componentType="faq-accordion" type="single" collapsible>
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>Question 1</AccordionTrigger>
 *     <AccordionContent>Answer 1</AccordionContent>
 *   </AccordionItem>
 * </TrackableAccordion>
 * ```
 */

import * as React from 'react';
import { Accordion } from '@/components/ui/accordion';
import { useGTMTracker } from '@/hooks/use-gtm-tracker';

// Re-export all accordion components for convenience
export { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

// Single accordion props
interface AccordionSingleProps {
    type: 'single';
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    collapsible?: boolean;
    disabled?: boolean;
    dir?: 'ltr' | 'rtl';
    orientation?: 'horizontal' | 'vertical';
    children?: React.ReactNode;
    className?: string;
}

// Multiple accordion props
interface AccordionMultipleProps {
    type: 'multiple';
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    disabled?: boolean;
    dir?: 'ltr' | 'rtl';
    orientation?: 'horizontal' | 'vertical';
    children?: React.ReactNode;
    className?: string;
}

export interface TrackableAccordionSingleProps extends AccordionSingleProps {
    componentType: string;
    disableTracking?: boolean;
}

export interface TrackableAccordionMultipleProps extends AccordionMultipleProps {
    componentType: string;
    disableTracking?: boolean;
}

export type TrackableAccordionProps =
    | TrackableAccordionSingleProps
    | TrackableAccordionMultipleProps;

export function TrackableAccordion({
    children,
    componentType,
    disableTracking = false,
    ...props
}: TrackableAccordionProps) {
    const { trackUIInteraction } = useGTMTracker();

    if (props.type === 'single') {
        const { onValueChange, ...restProps } = props;

        const handleValueChange = (value: string) => {
            if (!disableTracking) {
                trackUIInteraction(componentType, value || 'collapsed');
            }
            onValueChange?.(value);
        };

        return (
            <Accordion {...restProps} onValueChange={handleValueChange}>
                {children}
            </Accordion>
        );
    }

    // Multiple type
    const { onValueChange, ...restProps } = props;

    const handleValueChange = (value: string[]) => {
        if (!disableTracking) {
            trackUIInteraction(componentType, value.join(',') || 'collapsed');
        }
        onValueChange?.(value);
    };

    return (
        <Accordion {...restProps} onValueChange={handleValueChange}>
            {children}
        </Accordion>
    );
}

/**
 * Hook for tracking accordion interactions manually
 * Useful when you can't wrap the accordion with TrackableAccordion
 */
export function useAccordionTracking(componentType: string) {
    const { trackUIInteraction } = useGTMTracker();

    const trackToggle = React.useCallback(
        (itemValue: string, isOpen: boolean) => {
            trackUIInteraction(componentType, isOpen ? itemValue : 'collapsed');
        },
        [componentType, trackUIInteraction],
    );

    return { trackToggle };
}
