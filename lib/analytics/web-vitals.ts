/**
 * Core Web Vitals Tracking
 *
 * Utilities for tracking Core Web Vitals metrics (LCP, FID, CLS, TTFB, INP)
 * and sending them to analytics providers with additional context like device
 * type and connection speed.
 *
 * Core Web Vitals are key metrics that measure user experience:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity (deprecated, replaced by INP)
 * - INP (Interaction to Next Paint): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 * - TTFB (Time to First Byte): Server response time
 *
 * @example
 * ```typescript
 * import { initWebVitalsTracking } from '@/lib/analytics/web-vitals';
 *
 * // Initialize in your app
 * initWebVitalsTracking();
 * ```
 */

import { analytics } from './tracker';
import type { AnalyticsEvent } from './types';

// ============================================================================
// Types
// ============================================================================

/**
 * Web Vitals metric data
 * Based on the web-vitals library types
 */
export interface WebVitalsMetric {
    id: string;
    name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    navigationType:
        | 'navigate'
        | 'reload'
        | 'back-forward'
        | 'back-forward-cache'
        | 'prerender'
        | 'restore';
    entries: PerformanceEntry[];
}

/**
 * Device information for context
 */
export interface DeviceInfo {
    type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
    memory?: number; // GB
    cores?: number;
    platform?: string;
}

/**
 * Connection information for context
 */
export interface ConnectionInfo {
    effectiveType?: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
    downlink?: number; // Mbps
    rtt?: number; // ms
    saveData?: boolean;
}

/**
 * Web Vitals event properties
 */
export interface WebVitalsEventProperties {
    metricName: string;
    value: number;
    rating: string;
    delta: number;
    navigationType: string;
    deviceType: string;
    deviceMemory?: number;
    deviceCores?: number;
    connectionType?: string;
    connectionDownlink?: number;
    connectionRtt?: number;
    connectionSaveData?: boolean;
    url: string;
    timestamp: string;
}

// ============================================================================
// Device Detection
// ============================================================================

/**
 * Get device information
 */
export function getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return { type: 'unknown' };
    }

    // Detect device type based on user agent and screen size
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.screen.width;

    let type: DeviceInfo['type'] = 'desktop';

    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
        type = 'mobile';
    } else if (
        /tablet|ipad|playbook|silk/i.test(userAgent) ||
        (screenWidth >= 768 && screenWidth < 1024)
    ) {
        type = 'tablet';
    } else if (screenWidth >= 1024) {
        type = 'desktop';
    }

    // Get device memory (if available)
    const memory = (navigator as any).deviceMemory;

    // Get CPU cores (if available)
    const cores = (navigator as any).hardwareConcurrency;

    // Get platform
    const platform = navigator.platform;

    return {
        type,
        memory,
        cores,
        platform,
    };
}

/**
 * Get connection information
 */
export function getConnectionInfo(): ConnectionInfo {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return {};
    }

    const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

    if (!connection) {
        return {};
    }

    return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
    };
}

// ============================================================================
// Metric Rating
// ============================================================================

/**
 * Get rating thresholds for each metric
 * Based on Google's Core Web Vitals thresholds
 */
const METRIC_THRESHOLDS = {
    LCP: { good: 2500, poor: 4000 }, // ms
    FID: { good: 100, poor: 300 }, // ms
    INP: { good: 200, poor: 500 }, // ms
    CLS: { good: 0.1, poor: 0.25 }, // score
    TTFB: { good: 800, poor: 1800 }, // ms
    FCP: { good: 1800, poor: 3000 }, // ms
} as const;

/**
 * Calculate metric rating
 */
export function getMetricRating(
    name: WebVitalsMetric['name'],
    value: number,
): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = METRIC_THRESHOLDS[name];

    if (!thresholds) {
        return 'good';
    }

    if (value <= thresholds.good) {
        return 'good';
    }

    if (value <= thresholds.poor) {
        return 'needs-improvement';
    }

    return 'poor';
}

// ============================================================================
// Web Vitals Tracking
// ============================================================================

/**
 * Track a web vitals metric
 */
export function trackWebVital(metric: WebVitalsMetric): void {
    try {
        // Get device and connection info
        const deviceInfo = getDeviceInfo();
        const connectionInfo = getConnectionInfo();

        // Build event properties
        const properties: WebVitalsEventProperties = {
            metricName: metric.name,
            value: Math.round(metric.value),
            rating: metric.rating,
            delta: Math.round(metric.delta),
            navigationType: metric.navigationType,
            deviceType: deviceInfo.type,
            url: typeof window !== 'undefined' ? window.location.pathname : '',
            timestamp: new Date().toISOString(),
        };

        // Add device info if available
        if (deviceInfo.memory !== undefined) {
            properties.deviceMemory = deviceInfo.memory;
        }
        if (deviceInfo.cores !== undefined) {
            properties.deviceCores = deviceInfo.cores;
        }

        // Add connection info if available
        if (connectionInfo.effectiveType) {
            properties.connectionType = connectionInfo.effectiveType;
        }
        if (connectionInfo.downlink !== undefined) {
            properties.connectionDownlink = connectionInfo.downlink;
        }
        if (connectionInfo.rtt !== undefined) {
            properties.connectionRtt = connectionInfo.rtt;
        }
        if (connectionInfo.saveData !== undefined) {
            properties.connectionSaveData = connectionInfo.saveData;
        }

        // Track the event
        const event: AnalyticsEvent = {
            name: 'web_vitals',
            properties,
            timestamp: new Date(),
        };

        analytics.trackEvent(event);

        // Log in development
        if (process.env.NODE_ENV === 'development') {
            console.debug(
                `[Web Vitals] ${metric.name}: ${Math.round(metric.value)} (${metric.rating})`,
                properties,
            );
        }
    } catch (error) {
        console.error('[Web Vitals] Failed to track metric:', error);
    }
}

/**
 * Track LCP (Largest Contentful Paint)
 */
export function trackLCP(metric: WebVitalsMetric): void {
    trackWebVital(metric);
}

/**
 * Track FID (First Input Delay)
 * Note: FID is deprecated in favor of INP
 */
export function trackFID(metric: WebVitalsMetric): void {
    trackWebVital(metric);
}

/**
 * Track INP (Interaction to Next Paint)
 */
export function trackINP(metric: WebVitalsMetric): void {
    trackWebVital(metric);
}

/**
 * Track CLS (Cumulative Layout Shift)
 */
export function trackCLS(metric: WebVitalsMetric): void {
    trackWebVital(metric);
}

/**
 * Track TTFB (Time to First Byte)
 */
export function trackTTFB(metric: WebVitalsMetric): void {
    trackWebVital(metric);
}

/**
 * Track FCP (First Contentful Paint)
 */
export function trackFCP(metric: WebVitalsMetric): void {
    trackWebVital(metric);
}

// ============================================================================
// Web Vitals Initialization
// ============================================================================

/**
 * Initialize web vitals tracking using the web-vitals library
 * This should be called in the app initialization
 */
export function initWebVitalsTracking(): void {
    if (typeof window === 'undefined') {
        return;
    }

    // Dynamically import web-vitals library
    // This keeps the bundle size small by only loading when needed
    import('web-vitals')
        .then(({ onCLS, onLCP, onTTFB, onINP, onFCP }) => {
            // Track Core Web Vitals
            // Note: FID is deprecated and replaced by INP
            onCLS(trackCLS);
            onLCP(trackLCP);
            onTTFB(trackTTFB);
            onINP(trackINP);
            onFCP(trackFCP);

            if (process.env.NODE_ENV === 'development') {
                console.debug('[Web Vitals] Tracking initialized');
            }
        })
        .catch((error) => {
            console.error('[Web Vitals] Failed to initialize tracking:', error);
        });
}

// ============================================================================
// Manual Performance Measurement
// ============================================================================

/**
 * Manually measure and track a custom performance metric
 */
export function trackCustomMetric(
    name: string,
    value: number,
    unit: 'ms' | 'score' | 'bytes' = 'ms',
): void {
    try {
        const deviceInfo = getDeviceInfo();
        const connectionInfo = getConnectionInfo();

        const event: AnalyticsEvent = {
            name: 'custom_performance',
            properties: {
                metricName: name,
                value: Math.round(value),
                unit,
                deviceType: deviceInfo.type,
                connectionType: connectionInfo.effectiveType,
                url: typeof window !== 'undefined' ? window.location.pathname : '',
                timestamp: new Date().toISOString(),
            },
            timestamp: new Date(),
        };

        analytics.trackEvent(event);

        if (process.env.NODE_ENV === 'development') {
            console.log(`[Custom Metric] ${name}: ${Math.round(value)}${unit}`);
        }
    } catch (error) {
        console.error('[Web Vitals] Failed to track custom metric:', error);
    }
}

/**
 * Get current web vitals summary
 * Useful for debugging and monitoring
 */
export async function getWebVitalsSummary(): Promise<Record<string, number>> {
    if (typeof window === 'undefined') {
        return {};
    }

    try {
        const { onCLS, onLCP, onTTFB, onINP, onFCP } = await import('web-vitals');

        const metrics: Record<string, number> = {};

        // Collect metrics
        // Note: FID is deprecated and replaced by INP
        await Promise.all([
            new Promise<void>((resolve) => {
                onCLS((metric: WebVitalsMetric) => {
                    metrics.CLS = metric.value;
                    resolve();
                });
            }),
            new Promise<void>((resolve) => {
                onLCP((metric: WebVitalsMetric) => {
                    metrics.LCP = metric.value;
                    resolve();
                });
            }),
            new Promise<void>((resolve) => {
                onTTFB((metric: WebVitalsMetric) => {
                    metrics.TTFB = metric.value;
                    resolve();
                });
            }),
            new Promise<void>((resolve) => {
                onINP((metric: WebVitalsMetric) => {
                    metrics.INP = metric.value;
                    resolve();
                });
            }),
            new Promise<void>((resolve) => {
                onFCP((metric: WebVitalsMetric) => {
                    metrics.FCP = metric.value;
                    resolve();
                });
            }),
        ]);

        return metrics;
    } catch (error) {
        console.error('[Web Vitals] Failed to get summary:', error);
        return {};
    }
}

// ============================================================================
// Export
// ============================================================================

export default {
    initWebVitalsTracking,
    trackWebVital,
    trackLCP,
    trackFID,
    trackINP,
    trackCLS,
    trackTTFB,
    trackFCP,
    trackCustomMetric,
    getWebVitalsSummary,
    getDeviceInfo,
    getConnectionInfo,
    getMetricRating,
};
