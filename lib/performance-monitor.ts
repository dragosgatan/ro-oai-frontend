/**
 * Performance monitoring utilities
 * Helps track and optimize application performance
 */

/**
 * Measure component render time
 * @param componentName - Name of the component
 * @param callback - Function to measure
 */
export function measureRenderTime<T>(componentName: string, callback: () => T): T {
    if (typeof window === 'undefined' || !window.performance) {
        return callback();
    }

    const startMark = `${componentName}-start`;
    const endMark = `${componentName}-end`;
    const measureName = `${componentName}-render`;

    performance.mark(startMark);
    const result = callback();
    performance.mark(endMark);

    try {
        performance.measure(measureName, startMark, endMark);
        const measure = performance.getEntriesByName(measureName)[0];

        if (process.env.NODE_ENV === 'development') {
            console.debug(
                `[Performance] ${componentName} rendered in ${measure.duration.toFixed(2)}ms`,
            );
        }

        // Clean up marks and measures
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(measureName);
    } catch {
        // Silently fail if performance API is not available
    }

    return result;
}

/**
 * Report Web Vitals to console (development) or analytics (production)
 * @param metric - Web Vitals metric
 */
export function reportWebVitals(metric: {
    id: string;
    name: string;
    value: number;
    label: 'web-vital' | 'custom';
}) {
    if (process.env.NODE_ENV === 'development') {
        console.debug(`[Web Vitals] ${metric.name}:`, metric.value);
    }

    // In production, send to analytics
    // Example: sendToAnalytics(metric);
}

/**
 * Check if animations should be enabled based on performance
 * @returns True if animations should be enabled
 */
export function shouldEnableAnimations(): boolean {
    if (typeof window === 'undefined') return true;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return false;

    // Check device memory (if available)
    const deviceMemory = (navigator as any).deviceMemory;
    if (deviceMemory && deviceMemory < 4) {
        // Low memory device, disable complex animations
        return false;
    }

    // Check connection speed (if available)
    const connection = (navigator as any).connection;
    if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
            // Slow connection, disable animations
            return false;
        }
    }

    return true;
}

/**
 * Get performance metrics
 * @returns Performance metrics object
 */
export function getPerformanceMetrics() {
    if (typeof window === 'undefined' || !window.performance) {
        return null;
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    const fcp = paint.find((entry) => entry.name === 'first-contentful-paint');
    const lcp = performance.getEntriesByType('largest-contentful-paint').pop();

    return {
        // Navigation timing
        dns: navigation ? navigation.domainLookupEnd - navigation.domainLookupStart : 0,
        tcp: navigation ? navigation.connectEnd - navigation.connectStart : 0,
        ttfb: navigation ? navigation.responseStart - navigation.requestStart : 0,
        download: navigation ? navigation.responseEnd - navigation.responseStart : 0,
        domInteractive: navigation ? navigation.domInteractive - navigation.fetchStart : 0,
        domComplete: navigation ? navigation.domComplete - navigation.fetchStart : 0,
        loadComplete: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,

        // Paint timing
        fcp: fcp ? fcp.startTime : 0,
        lcp: lcp ? (lcp as any).startTime : 0,
    };
}

/**
 * Log performance metrics to console (development only)
 */
export function logPerformanceMetrics() {
    if (process.env.NODE_ENV !== 'development') return;

    const metrics = getPerformanceMetrics();
    if (!metrics) return;

    console.group('[Performance Metrics]');
    console.debug('DNS Lookup:', `${metrics.dns.toFixed(2)}ms`);
    console.debug('TCP Connection:', `${metrics.tcp.toFixed(2)}ms`);
    console.log('Time to First Byte:', `${metrics.ttfb.toFixed(2)}ms`);
    console.log('Download:', `${metrics.download.toFixed(2)}ms`);
    console.log('DOM Interactive:', `${metrics.domInteractive.toFixed(2)}ms`);
    console.log('DOM Complete:', `${metrics.domComplete.toFixed(2)}ms`);
    console.log('Load Complete:', `${metrics.loadComplete.toFixed(2)}ms`);
    console.log('First Contentful Paint:', `${metrics.fcp.toFixed(2)}ms`);
    console.log('Largest Contentful Paint:', `${metrics.lcp.toFixed(2)}ms`);
    console.groupEnd();
}

/**
 * Monitor long tasks (tasks that block the main thread for > 50ms)
 */
export function monitorLongTasks() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
        return;
    }

    try {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn(`[Long Task] Duration: ${entry.duration.toFixed(2)}ms`, entry);
                }
            }
        });

        observer.observe({ entryTypes: ['longtask'] });
    } catch {
        // Long task API not supported
    }
}

/**
 * Monitor layout shifts (CLS - Cumulative Layout Shift)
 */
export function monitorLayoutShifts() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
        return;
    }

    let clsValue = 0;

    try {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!(entry as any).hadRecentInput) {
                    clsValue += (entry as any).value;

                    if (process.env.NODE_ENV === 'development') {
                        console.log(`[Layout Shift] CLS: ${clsValue.toFixed(4)}`);
                    }
                }
            }
        });

        observer.observe({ entryTypes: ['layout-shift'] });
    } catch {
        // Layout shift API not supported
    }
}

/**
 * Initialize performance monitoring
 * Call this in your app initialization
 */
export function initPerformanceMonitoring() {
    if (typeof window === 'undefined') return;

    // Log metrics after page load
    window.addEventListener('load', () => {
        setTimeout(() => {
            logPerformanceMetrics();
        }, 0);
    });

    // Monitor long tasks and layout shifts
    if (process.env.NODE_ENV === 'development') {
        monitorLongTasks();
        monitorLayoutShifts();
    }
}
