/**
 * Analytics Event Definitions
 *
 * Centralized event names and helper functions for tracking user interactions
 * across the MLCompete platform.
 */

import type { AnalyticsEvent } from './types';

// ============================================================================
// Event Names
// ============================================================================

/**
 * Standard analytics event names
 * Following Google Analytics 4 recommended event naming conventions
 */
export const AnalyticsEvents = {
    // Authentication Events
    SIGN_UP: 'sign_up',
    LOGIN: 'login',
    LOGOUT: 'logout',

    // Problem Interaction Events
    PROBLEM_VIEW: 'problem_view',
    PROBLEM_ATTEMPT: 'problem_attempt',
    PROBLEM_START: 'problem_start',
    SOLUTION_SUBMIT: 'solution_submit',
    SOLUTION_SUCCESS: 'solution_success',
    SOLUTION_FAILURE: 'solution_failure',
    EDITORIAL_VIEW: 'editorial_view',
    QUESTION_ASK: 'question_ask',
    COMMENTS_VIEW: 'comments_view',

    // Social Interaction Events
    COMMENT_POST: 'comment_post',
    COMMENT_LIKE: 'comment_like',
    COMMENT_REPLY: 'comment_reply',

    // Profile Events
    PROFILE_VIEW: 'profile_view',
    PROFILE_UPDATE: 'profile_update',
    AVATAR_UPLOAD: 'avatar_upload',
    AVATAR_CHANGE: 'avatar_change',
    INSTITUTION_MEMBERSHIP: 'institution_membership',
    ACHIEVEMENTS_VIEW: 'achievements_view',
    SHOWCASE_UPDATE: 'showcase_update',

    // Navigation Events
    NAVIGATION_CLICK: 'navigation_click',
    BUTTON_CLICK: 'button_click',
    LEADERBOARD_VIEW: 'leaderboard_view',
    ROADMAP_VIEW: 'roadmap_view',
    PROBLEMS_LIST_VIEW: 'problems_list_view',

    // UI Interaction Events
    MODAL_OPEN: 'modal_open',
    MODAL_CLOSE: 'modal_close',
    MODAL_INTERACTION: 'modal_interaction',
    TAB_CHANGE: 'tab_change',
    ACCORDION_TOGGLE: 'accordion_toggle',
    UI_INTERACTION: 'ui_interaction',
    FORM_SUBMIT: 'form_submit',

    // Content Events
    CONTENT_VIEW: 'content_view',
    CONTENT_COPY: 'content_copy',
    FILE_DOWNLOAD: 'file_download',

    // Settings Events
    LANGUAGE_CHANGE: 'language_change',
    THEME_CHANGE: 'theme_change',
    SETTINGS_UPDATE: 'settings_update',

    // Engagement Events
    SCROLL_DEPTH: 'scroll_depth',
    TIME_ON_PAGE: 'time_on_page',
    EXTERNAL_LINK_CLICK: 'external_link_click',
    SEARCH: 'search',
    FILTER_APPLY: 'filter_apply',

    // Competition Events
    COMPETITION_VIEW: 'competition_view',
    COMPETITION_JOIN: 'competition_join',
    COMPETITION_LEAVE: 'competition_leave',
    COMPETITION_LEADERBOARD_VIEW: 'competition_leaderboard_view',
    COMPETITION_SUBMISSION: 'competition_submission',
    COMPETITION_SHARE: 'competition_share',

    // Leaderboard Events
    LEADERBOARD_TAB_CHANGE: 'leaderboard_tab_change',
    LEADERBOARD_PROFILE_CLICK: 'leaderboard_profile_click',
    LEADERBOARD_FILTER: 'leaderboard_filter',
    LEADERBOARD_PAGINATE: 'leaderboard_paginate',

    // Onboarding Events
    ONBOARDING_START: 'onboarding_start',
    ONBOARDING_STEP_COMPLETE: 'onboarding_step_complete',
    ONBOARDING_COMPLETE: 'onboarding_complete',
    ONBOARDING_ABANDON: 'onboarding_abandon',

    // Error Events
    ERROR_OCCURRED: 'error_occurred',
    API_ERROR: 'api_error',
    PAGE_NOT_FOUND: 'page_not_found',
    VALIDATION_ERROR: 'validation_error',
    SLOW_PAGE_LOAD: 'slow_page_load',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

// ============================================================================
// Event Property Interfaces
// ============================================================================

/**
 * Authentication event properties
 */
export interface AuthEventProperties {
    method?: 'email' | 'oauth' | 'github' | 'google';
    provider?: string;
}

/**
 * Problem interaction event properties
 */
export interface ProblemEventProperties {
    problemId: string;
    problemTitle?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    category?: string;
    language?: string;
}

/**
 * Solution submission event properties
 */
export interface SolutionEventProperties extends ProblemEventProperties {
    submissionId?: string;
    score?: number;
    executionTime?: number;
    success?: boolean;
}

/**
 * Social interaction event properties
 */
export interface SocialEventProperties {
    contentType: 'comment' | 'problem' | 'profile';
    contentId: string;
    action: 'post' | 'like' | 'reply' | 'delete';
}

/**
 * Navigation event properties
 */
export interface NavigationEventProperties {
    from?: string;
    to: string;
    section?: string;
}

/**
 * Settings change event properties
 */
export interface SettingsEventProperties {
    setting: string;
    oldValue?: string;
    newValue: string;
}

/**
 * Engagement event properties
 */
export interface EngagementEventProperties {
    depth?: number;
    duration?: number;
    url?: string;
    query?: string;
}

/**
 * Error event properties
 */
export interface ErrorEventProperties {
    errorType: string;
    errorMessage: string;
    errorStack?: string;
    component?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    endpoint?: string;
    statusCode?: number;
    field?: string;
}

// ============================================================================
// New Event Property Interfaces (GTM Tracking)
// ============================================================================

/**
 * Base GTM event properties included in all events
 */
export interface BaseGTMEventProperties {
    timestamp: string;
    pagePath: string;
    pageTitle?: string;
    isAuthenticated: boolean;
    userId?: string;
    locale?: string;
}

/**
 * Navigation click event properties
 */
export interface NavigationClickEventProperties {
    navigationSource: string;
    navigationDestination: string;
    navigationLabel?: string;
    navigationContext?: string;
}

/**
 * Button click event properties
 */
export interface ButtonClickEventProperties {
    buttonId: string;
    buttonContext?: string;
}

/**
 * Form submit event properties
 */
export interface FormSubmitEventProperties {
    formType: string;
    success: boolean;
}

/**
 * Modal interaction event properties
 */
export interface ModalInteractionEventProperties {
    modalType: string;
    action: 'open' | 'close';
}

/**
 * UI interaction event properties
 */
export interface UIInteractionEventProperties {
    componentType: string;
    value: string;
}

/**
 * Content view event properties
 */
export interface ContentViewEventProperties {
    sectionId: string;
}

/**
 * Content copy event properties
 */
export interface ContentCopyEventProperties {
    contentType: string;
}

/**
 * File download event properties
 */
export interface FileDownloadEventProperties {
    fileType: string;
    fileName: string;
}

/**
 * Search event properties
 */
export interface SearchEventProperties {
    query: string;
    resultCount: number;
}

/**
 * Filter apply event properties
 */
export interface FilterApplyEventProperties {
    filterType: string;
    filterValue: string;
}

/**
 * Competition event properties
 */
export interface CompetitionEventProperties {
    competitionId: string;
    competitionName?: string;
    competitionStatus?: 'UPCOMING' | 'ACTIVE' | 'ENDED';
    shareMethod?: string;
    problemId?: string;
}

/**
 * Problem event properties (extended)
 */
export interface ProblemTrackingEventProperties {
    problemId: string;
    problemTitle?: string;
    problemDifficulty?: string;
    competitionId?: string;
    submissionId?: string;
    score?: number;
}

/**
 * Profile event properties (extended)
 */
export interface ProfileTrackingEventProperties {
    profileOwnerId: string;
    viewerRelationship?: 'self' | 'other';
    changedField?: string;
    actionType?: 'join' | 'leave';
}

/**
 * Leaderboard event properties
 */
export interface LeaderboardEventProperties {
    leaderboardType: string;
    selectedTab?: string;
    filterCriteria?: Record<string, string>;
    pageNumber?: number;
}

/**
 * Onboarding event properties
 */
export interface OnboardingEventProperties {
    stepNumber?: number;
    stepName?: string;
    totalSteps?: number;
}

/**
 * Performance event properties
 */
export interface PerformanceEventProperties {
    loadTime?: number;
    attemptedUrl?: string;
}

// ============================================================================
// Event Builder Functions
// ============================================================================

/**
 * Create an authentication event
 */
export function createAuthEvent(
    eventName:
        | typeof AnalyticsEvents.SIGN_UP
        | typeof AnalyticsEvents.LOGIN
        | typeof AnalyticsEvents.LOGOUT,
    properties?: AuthEventProperties,
): AnalyticsEvent {
    return {
        name: eventName,
        properties,
        timestamp: new Date(),
    };
}

/**
 * Create a problem interaction event
 */
export function createProblemEvent(
    eventName: AnalyticsEventName,
    properties: ProblemEventProperties,
): AnalyticsEvent {
    return {
        name: eventName,
        properties,
        timestamp: new Date(),
    };
}

/**
 * Create a solution submission event
 */
export function createSolutionEvent(
    eventName:
        | typeof AnalyticsEvents.SOLUTION_SUBMIT
        | typeof AnalyticsEvents.SOLUTION_SUCCESS
        | typeof AnalyticsEvents.SOLUTION_FAILURE,
    properties: SolutionEventProperties,
): AnalyticsEvent {
    return {
        name: eventName,
        properties,
        timestamp: new Date(),
    };
}

/**
 * Create a social interaction event
 */
export function createSocialEvent(
    eventName: AnalyticsEventName,
    properties: SocialEventProperties,
): AnalyticsEvent {
    return {
        name: eventName,
        properties,
        timestamp: new Date(),
    };
}

/**
 * Create a navigation event
 */
export function createNavigationEvent(
    eventName: AnalyticsEventName,
    properties: NavigationEventProperties,
): AnalyticsEvent {
    return {
        name: eventName,
        properties,
        timestamp: new Date(),
    };
}

/**
 * Create a settings change event
 */
export function createSettingsEvent(
    eventName: AnalyticsEventName,
    properties: SettingsEventProperties,
): AnalyticsEvent {
    return {
        name: eventName,
        properties,
        timestamp: new Date(),
    };
}

/**
 * Create an engagement event
 */
export function createEngagementEvent(
    eventName: AnalyticsEventName,
    properties: EngagementEventProperties,
): AnalyticsEvent {
    return {
        name: eventName,
        properties,
        timestamp: new Date(),
    };
}

/**
 * Create an error event
 */
export function createErrorEvent(properties: ErrorEventProperties): AnalyticsEvent {
    return {
        name: AnalyticsEvents.ERROR_OCCURRED,
        properties,
        timestamp: new Date(),
    };
}

// ============================================================================
// Event Validation
// ============================================================================

/**
 * Validate event name
 */
export function isValidEventName(name: string): name is AnalyticsEventName {
    return Object.values(AnalyticsEvents).includes(name as AnalyticsEventName);
}

/**
 * Validate event structure
 */
export function isValidEvent(event: any): event is AnalyticsEvent {
    return (
        typeof event === 'object' &&
        event !== null &&
        typeof event.name === 'string' &&
        event.name.length > 0 &&
        (event.properties === undefined || typeof event.properties === 'object') &&
        (event.timestamp === undefined || event.timestamp instanceof Date)
    );
}

/**
 * Sanitize event properties to remove PII
 * Recursively sanitizes nested objects and arrays
 */
export function sanitizeEventProperties(properties: Record<string, any>): Record<string, any> {
    // PII fields that should be removed
    const piiFields = [
        'email',
        'password',
        'phone',
        'phoneNumber',
        'phone_number',
        'address',
        'streetAddress',
        'street_address',
        'ssn',
        'socialSecurityNumber',
        'social_security_number',
        'creditCard',
        'credit_card',
        'creditCardNumber',
        'credit_card_number',
        'cardNumber',
        'card_number',
        'cvv',
        'cvc',
        'expiryDate',
        'expiry_date',
        'dateOfBirth',
        'date_of_birth',
        'dob',
        'birthDate',
        'birth_date',
        'firstName',
        'first_name',
        'lastName',
        'last_name',
        'fullName',
        'full_name',
        'name',
        'ipAddress',
        'ip_address',
        'ip',
        'passport',
        'passportNumber',
        'passport_number',
        'driverLicense',
        'driver_license',
        'licenseNumber',
        'license_number',
        'bankAccount',
        'bank_account',
        'accountNumber',
        'account_number',
        'routingNumber',
        'routing_number',
    ];

    return sanitizeObject(properties, piiFields);
}

/**
 * Recursively sanitize an object, removing PII fields
 */
function sanitizeObject(obj: Record<string, any>, piiFields: string[]): Record<string, any> {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj !== 'object') {
        return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map((item) => {
            if (typeof item === 'object' && item !== null) {
                return sanitizeObject(item, piiFields);
            }
            return item;
        });
    }

    // Handle objects
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
        // Skip PII fields (case-insensitive check)
        const lowerKey = key.toLowerCase();
        if (piiFields.some((field) => field.toLowerCase() === lowerKey)) {
            continue;
        }

        // Recursively sanitize nested objects
        if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value, piiFields);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Check if an object contains any PII fields
 */
export function containsPII(obj: Record<string, any>): boolean {
    const piiFields = [
        'email',
        'password',
        'phone',
        'phoneNumber',
        'phone_number',
        'address',
        'ssn',
        'creditCard',
        'credit_card',
    ];

    return checkForPII(obj, piiFields);
}

/**
 * Recursively check for PII in an object
 */
function checkForPII(obj: Record<string, any>, piiFields: string[]): boolean {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
        return false;
    }

    if (Array.isArray(obj)) {
        return obj.some((item) => {
            if (typeof item === 'object' && item !== null) {
                return checkForPII(item, piiFields);
            }
            return false;
        });
    }

    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (piiFields.some((field) => field.toLowerCase() === lowerKey)) {
            return true;
        }

        if (typeof value === 'object' && value !== null) {
            if (checkForPII(value, piiFields)) {
                return true;
            }
        }
    }

    return false;
}
