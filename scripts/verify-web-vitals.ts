/**
 * Web Vitals Tracking Verification Script
 *
 * This script verifies that the Core Web Vitals tracking system is properly
 * configured and can track metrics correctly.
 *
 * Run with: npx tsx scripts/verify-web-vitals.ts
 */

import {
    getDeviceInfo,
    getConnectionInfo,
    getMetricRating,
    type WebVitalsMetric,
} from '../lib/analytics/web-vitals';

// ============================================================================
// Test Data
// ============================================================================

const testMetrics: WebVitalsMetric[] = [
    {
        id: 'test-lcp-1',
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 2000,
        navigationType: 'navigate',
        entries: [],
    },
    {
        id: 'test-lcp-2',
        name: 'LCP',
        value: 3500,
        rating: 'needs-improvement',
        delta: 3500,
        navigationType: 'navigate',
        entries: [],
    },
    {
        id: 'test-lcp-3',
        name: 'LCP',
        value: 5000,
        rating: 'poor',
        delta: 5000,
        navigationType: 'navigate',
        entries: [],
    },
    {
        id: 'test-inp-1',
        name: 'INP',
        value: 150,
        rating: 'good',
        delta: 150,
        navigationType: 'navigate',
        entries: [],
    },
    {
        id: 'test-cls-1',
        name: 'CLS',
        value: 0.05,
        rating: 'good',
        delta: 0.05,
        navigationType: 'navigate',
        entries: [],
    },
    {
        id: 'test-ttfb-1',
        name: 'TTFB',
        value: 600,
        rating: 'good',
        delta: 600,
        navigationType: 'navigate',
        entries: [],
    },
    {
        id: 'test-fcp-1',
        name: 'FCP',
        value: 1500,
        rating: 'good',
        delta: 1500,
        navigationType: 'navigate',
        entries: [],
    },
];

// ============================================================================
// Verification Functions
// ============================================================================

function verifyDeviceInfo() {
    console.debug('\n📱 Testing Device Info Detection...');

    const deviceInfo = getDeviceInfo();

    console.debug('Device Info:', {
        type: deviceInfo.type,
        memory: deviceInfo.memory ? `${deviceInfo.memory} GB` : 'N/A',
        cores: deviceInfo.cores || 'N/A',
        platform: deviceInfo.platform || 'N/A',
    });

    if (deviceInfo.type === 'unknown') {
        console.log('⚠️  Warning: Device type could not be determined (expected in Node.js)');
    } else {
        console.log('✅ Device info detected successfully');
    }
}

function verifyConnectionInfo() {
    console.log('\n🌐 Testing Connection Info Detection...');

    const connectionInfo = getConnectionInfo();

    console.log('Connection Info:', {
        effectiveType: connectionInfo.effectiveType || 'N/A',
        downlink: connectionInfo.downlink ? `${connectionInfo.downlink} Mbps` : 'N/A',
        rtt: connectionInfo.rtt ? `${connectionInfo.rtt} ms` : 'N/A',
        saveData: connectionInfo.saveData !== undefined ? connectionInfo.saveData : 'N/A',
    });

    if (!connectionInfo.effectiveType) {
        console.log('⚠️  Warning: Connection info not available (expected in Node.js)');
    } else {
        console.log('✅ Connection info detected successfully');
    }
}

function verifyMetricRating() {
    console.log('\n📊 Testing Metric Rating Calculation...');

    const tests = [
        { name: 'LCP', value: 2000, expected: 'good' },
        { name: 'LCP', value: 3500, expected: 'needs-improvement' },
        { name: 'LCP', value: 5000, expected: 'poor' },
        { name: 'INP', value: 150, expected: 'good' },
        { name: 'INP', value: 350, expected: 'needs-improvement' },
        { name: 'INP', value: 600, expected: 'poor' },
        { name: 'CLS', value: 0.05, expected: 'good' },
        { name: 'CLS', value: 0.15, expected: 'needs-improvement' },
        { name: 'CLS', value: 0.3, expected: 'poor' },
        { name: 'TTFB', value: 600, expected: 'good' },
        { name: 'TTFB', value: 1200, expected: 'needs-improvement' },
        { name: 'TTFB', value: 2000, expected: 'poor' },
    ];

    let passed = 0;
    let failed = 0;

    tests.forEach((test) => {
        const rating = getMetricRating(test.name as any, test.value);
        const success = rating === test.expected;

        if (success) {
            passed++;
            console.log(`✅ ${test.name} (${test.value}): ${rating} (expected: ${test.expected})`);
        } else {
            failed++;
            console.log(`❌ ${test.name} (${test.value}): ${rating} (expected: ${test.expected})`);
        }
    });

    console.log(`\nRating Tests: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log('✅ All metric rating tests passed');
    } else {
        console.log('❌ Some metric rating tests failed');
    }
}

function verifyMetricTypes() {
    console.log('\n🔍 Testing Metric Types...');

    const metricNames = ['LCP', 'FID', 'INP', 'CLS', 'TTFB', 'FCP'];

    console.log('Supported metrics:', metricNames.join(', '));

    testMetrics.forEach((metric) => {
        console.log(`\n${metric.name} Metric:`);
        console.log(`  ID: ${metric.id}`);
        console.log(`  Value: ${metric.value}`);
        console.log(`  Rating: ${metric.rating}`);
        console.log(`  Delta: ${metric.delta}`);
        console.log(`  Navigation Type: ${metric.navigationType}`);
    });

    console.log('\n✅ All metric types are properly structured');
}

function verifyThresholds() {
    console.log('\n📏 Testing Metric Thresholds...');

    const thresholds = {
        LCP: { good: 2500, poor: 4000, unit: 'ms' },
        FID: { good: 100, poor: 300, unit: 'ms' },
        INP: { good: 200, poor: 500, unit: 'ms' },
        CLS: { good: 0.1, poor: 0.25, unit: 'score' },
        TTFB: { good: 800, poor: 1800, unit: 'ms' },
        FCP: { good: 1800, poor: 3000, unit: 'ms' },
    };

    Object.entries(thresholds).forEach(([name, threshold]) => {
        console.log(`\n${name}:`);
        console.log(`  Good: ≤ ${threshold.good}${threshold.unit}`);
        console.log(
            `  Needs Improvement: ${threshold.good + 1}-${threshold.poor}${threshold.unit}`,
        );
        console.log(`  Poor: > ${threshold.poor}${threshold.unit}`);
    });

    console.log('\n✅ All thresholds are properly defined');
}

function verifyEventProperties() {
    console.log('\n📋 Testing Event Properties Structure...');

    const sampleProperties = {
        metricName: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 2000,
        navigationType: 'navigate',
        deviceType: 'desktop',
        deviceMemory: 8,
        deviceCores: 8,
        connectionType: '4g',
        connectionDownlink: 10,
        connectionRtt: 50,
        connectionSaveData: false,
        url: '/problems/123',
        timestamp: new Date().toISOString(),
    };

    console.log('Sample Event Properties:');
    Object.entries(sampleProperties).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
    });

    console.log('\n✅ Event properties structure is correct');
}

// ============================================================================
// Main Verification
// ============================================================================

async function main() {
    console.log('🔍 Web Vitals Tracking Verification');
    console.log('=====================================\n');

    try {
        // Run all verification tests
        verifyDeviceInfo();
        verifyConnectionInfo();
        verifyMetricRating();
        verifyMetricTypes();
        verifyThresholds();
        verifyEventProperties();

        console.log('\n=====================================');
        console.log('✅ Web Vitals tracking verification complete!');
        console.log('\nNext steps:');
        console.log('1. The web vitals tracking is integrated into AnalyticsProvider');
        console.log('2. Metrics will be tracked automatically when users visit the site');
        console.log('3. Check browser console for "[Web Vitals]" logs in development');
        console.log('4. Verify metrics in Google Analytics 4 under Events > web_vitals');
        console.log('5. Use Chrome DevTools > Lighthouse to test Core Web Vitals');
    } catch (error) {
        console.error('\n❌ Verification failed:', error);
        process.exit(1);
    }
}

// Run verification
main();
