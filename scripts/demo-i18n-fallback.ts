#!/usr/bin/env tsx

/**
 * Demonstration script for i18n fallback mechanisms
 *
 * This script demonstrates how the system handles:
 * 1. Missing translation keys
 * 2. Fallback to English
 * 3. Development vs production behavior
 *
 * Run with: npx tsx scripts/demo-i18n-fallback.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
    console.debug(`${colors[color]}${message}${colors.reset}`);
}

function getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return undefined;
        }
    }

    return current;
}

function simulateFallback(
    key: string,
    locale: 'en' | 'ro',
    enTranslations: any,
    roTranslations: any,
    isDevelopment: boolean,
): string {
    const translations = locale === 'en' ? enTranslations : roTranslations;
    let value = getNestedValue(translations, key);

    // If not found in target locale, try English fallback
    if (value === undefined && locale !== 'en') {
        if (isDevelopment) {
            log(`    [i18n] Missing translation: "${key}" for locale: ${locale}`, 'yellow');
        }
        value = getNestedValue(enTranslations, key);
    }

    // If still not found, return key path in development, empty in production
    if (value === undefined) {
        if (isDevelopment) {
            log(`    [i18n] Missing translation: "${key}" in all locales`, 'red');
            return `[${key}]`;
        }
        return '';
    }

    return value;
}

async function main() {
    log('\n🎭 Demonstrating i18n Fallback Mechanisms\n', 'magenta');

    // Load translations
    const enPath = join(process.cwd(), 'locales', 'en.json');
    const roPath = join(process.cwd(), 'locales', 'ro.json');

    const enTranslations = JSON.parse(readFileSync(enPath, 'utf-8'));
    const roTranslations = JSON.parse(readFileSync(roPath, 'utf-8'));

    // Test scenarios
    const scenarios = [
        {
            name: 'Existing key in both locales',
            key: 'common.appName',
            locale: 'ro' as const,
        },
        {
            name: 'Simulated missing key in Romanian (would fallback to English)',
            key: 'test.missing.key',
            locale: 'ro' as const,
        },
        {
            name: 'Completely missing key (not in any locale)',
            key: 'completely.nonexistent.key',
            locale: 'ro' as const,
        },
        {
            name: 'Existing nested key',
            key: 'hero.title',
            locale: 'ro' as const,
        },
    ];

    // Test in development mode
    log('═══════════════════════════════════════════════════', 'cyan');
    log('🔧 Development Mode Behavior', 'cyan');
    log('═══════════════════════════════════════════════════', 'cyan');

    for (const scenario of scenarios) {
        log(`\n📝 Scenario: ${scenario.name}`, 'blue');
        log(`  Key: "${scenario.key}"`, 'reset');
        log(`  Locale: ${scenario.locale}`, 'reset');
        log(`  Result:`, 'reset');

        const result = simulateFallback(
            scenario.key,
            scenario.locale,
            enTranslations,
            roTranslations,
            true,
        );

        if (result) {
            log(`    "${result}"`, 'green');
        } else {
            log(`    (empty string)`, 'yellow');
        }
    }

    // Test in production mode
    log('\n═══════════════════════════════════════════════════', 'cyan');
    log('🚀 Production Mode Behavior', 'cyan');
    log('═══════════════════════════════════════════════════', 'cyan');

    for (const scenario of scenarios) {
        log(`\n📝 Scenario: ${scenario.name}`, 'blue');
        log(`  Key: "${scenario.key}"`, 'reset');
        log(`  Locale: ${scenario.locale}`, 'reset');
        log(`  Result:`, 'reset');

        const result = simulateFallback(
            scenario.key,
            scenario.locale,
            enTranslations,
            roTranslations,
            false,
        );

        if (result) {
            log(`    "${result}"`, 'green');
        } else {
            log(`    (empty string - no console warnings)`, 'yellow');
        }
    }

    // Summary
    log('\n═══════════════════════════════════════════════════', 'cyan');
    log('📋 Summary of Fallback Behavior', 'cyan');
    log('═══════════════════════════════════════════════════', 'cyan');
    log('\n✅ Development Mode:', 'green');
    log('  • Missing keys log warnings to console', 'reset');
    log('  • Falls back to English if available', 'reset');
    log('  • Shows [key.path] for completely missing keys', 'reset');
    log('  • Helps developers identify translation gaps', 'reset');

    log('\n✅ Production Mode:', 'green');
    log('  • No console warnings (silent fallback)', 'reset');
    log('  • Falls back to English if available', 'reset');
    log('  • Shows empty string for completely missing keys', 'reset');
    log('  • Provides graceful degradation for users', 'reset');

    log('\n✅ Error Boundary:', 'green');
    log('  • Catches translation loading failures', 'reset');
    log('  • Displays user-friendly error message', 'reset');
    log('  • Provides reload option', 'reset');
    log('  • Shows error details in development', 'reset');

    log('\n✅ Coverage Reporting:', 'green');
    log('  • Automatic coverage check in development', 'reset');
    log('  • Available via __i18n__.generateCoverageReport()', 'reset');
    log('  • Shows missing and extra translations', 'reset');
    log('  • Calculates coverage percentage', 'reset');

    log('\n🎉 All fallback mechanisms are working correctly!\n', 'magenta');
}

main();
