/**
 * Tracking Components and Hooks
 *
 * This module provides trackable wrapper components and hooks for
 * automatically tracking user interactions via Google Tag Manager.
 *
 * Components:
 * - TrackableLink: Tracks navigation clicks
 * - TrackableButton: Tracks button clicks
 * - TrackableForm: Tracks form submissions
 * - TrackableDialog: Tracks modal open/close
 * - TrackableTabs: Tracks tab changes
 * - TrackableAccordion: Tracks accordion toggles
 * - TrackableContent: Tracks content views on scroll
 *
 * Hooks:
 * - useFormTracking: Manual form submission tracking
 * - useModalTracking: Manual modal interaction tracking
 * - useTabTracking: Manual tab change tracking
 * - useAccordionTracking: Manual accordion toggle tracking
 * - useContentViewTracking: Scroll-triggered content view tracking
 * - useCopyTracking: Content copy tracking
 * - useDownloadTracking: File download tracking
 * - useSearchTracking: Search query tracking
 * - useFilterTracking: Filter application tracking
 * - useSearchAndFilterTracking: Combined search and filter tracking
 * - useDebouncedSearchTracking: Debounced search tracking
 */

// Navigation tracking
export { TrackableLink, type TrackableLinkProps } from './trackable-link';

// Button tracking
export { TrackableButton, type TrackableButtonProps } from './trackable-button';

// Form tracking
export { TrackableForm, useFormTracking, type TrackableFormProps } from './trackable-form';

// Dialog/Modal tracking
export {
    TrackableDialog,
    useModalTracking,
    type TrackableDialogProps,
    // Re-exported dialog components
    DialogPortal,
    DialogOverlay,
    DialogClose,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from './trackable-dialog';

// Tabs tracking
export {
    TrackableTabs,
    useTabTracking,
    type TrackableTabsProps,
    // Re-exported tabs components
    TabsList,
    TabsTrigger,
    TabsContent,
} from './trackable-tabs';

// Accordion tracking
export {
    TrackableAccordion,
    useAccordionTracking,
    type TrackableAccordionProps,
    // Re-exported accordion components
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from './trackable-accordion';

// Content tracking
export {
    useContentViewTracking,
    useCopyTracking,
    useDownloadTracking,
    TrackableContent,
    type TrackableContentProps,
} from './use-content-tracking';

// Search and filter tracking
export {
    useSearchTracking,
    useFilterTracking,
    useSearchAndFilterTracking,
    useDebouncedSearchTracking,
} from './use-search-tracking';
