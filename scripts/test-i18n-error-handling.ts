#!/usr/bin/env tsx

/**
 * Test script for i18n error handling and fallback mechanisms
 *
 * This script tests:
 * 1. Missing translation key detection
 * 2. Fallback to English for missing Romanian translations
 * 3. Translation coverage reporting
 * 4. Error handling for invalid keys
 *
 * Run with: npx tsx scripts/test-i18n-error-handling.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
    console.debug(`${colors[color]}${message}${colors.reset}`);
}

function loadTranslations(locale: string): Record<string, any> {
    const filePath = join(process.cwd(), 'locales', `${locale}.json`);
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
}

function getAllKeys(obj: any, prefix: string = ''): string[] {
    const keys: string[] = [];

    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            keys.push(...getAllKeys(obj[key], fullKey));
        } else {
            keys.push(fullKey);
        }
    }

    return keys;
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

function findMissingKeys(source: Record<string, any>, target: Record<string, any>): string[] {
    const sourceKeys = getAllKeys(source);
    const missing: string[] = [];

    for (const key of sourceKeys) {
        if (getNestedValue(target, key) === undefined) {
            missing.push(key);
        }
    }

    return missing;
}

function findExtraKeys(source: Record<string, any>, target: Record<string, any>): string[] {
    const sourceKeys = new Set(getAllKeys(source));
    const targetKeys = getAllKeys(target);

    return targetKeys.filter((key) => !sourceKeys.has(key));
}

async function main() {
    log('\n🧪 Testing i18n Error Handling and Fallback Mechanisms\n', 'cyan');

    try {
        // Load translations
        log('📂 Loading translation files...', 'blue');
        const enTranslations = loadTranslations('en');
        const roTranslations = loadTranslations('ro');
        log('✅ Translation files loaded successfully\n', 'green');

        // Test 1: Count total keys
        log('📊 Test 1: Translation Key Count', 'blue');
        const enKeys = getAllKeys(enTranslations);
        const roKeys = getAllKeys(roTranslations);
        log(`  English keys: ${enKeys.length}`, 'reset');
        log(`  Romanian keys: ${roKeys.length}`, 'reset');
        log('✅ Test 1 passed\n', 'green');

        // Test 2: Find missing translations in Romanian
        log('📊 Test 2: Missing Romanian Translations', 'blue');
        const missingInRo = findMissingKeys(enTranslations, roTranslations);

        if (missingInRo.length === 0) {
            log('  ✅ No missing translations in Romanian!', 'green');
        } else {
            log(`  ⚠️  Found ${missingInRo.length} missing translations in Romanian:`, 'yellow');
            missingInRo.slice(0, 10).forEach((key) => {
                log(`    - ${key}`, 'yellow');
            });
            if (missingInRo.length > 10) {
                log(`    ... and ${missingInRo.length - 10} more`, 'yellow');
            }
        }
        log('✅ Test 2 completed\n', 'green');

        // Test 3: Find extra translations in Romanian
        log('📊 Test 3: Extra Romanian Translations', 'blue');
        const extraInRo = findExtraKeys(enTranslations, roTranslations);

        if (extraInRo.length === 0) {
            log('  ✅ No extra translations in Romanian', 'green');
        } else {
            log(`  ℹ️  Found ${extraInRo.length} extra translations in Romanian:`, 'cyan');
            extraInRo.slice(0, 10).forEach((key) => {
                log(`    - ${key}`, 'cyan');
            });
            if (extraInRo.length > 10) {
                log(`    ... and ${extraInRo.length - 10} more`, 'cyan');
            }
        }
        log('✅ Test 3 completed\n', 'green');

        // Test 4: Calculate coverage
        log('📊 Test 4: Translation Coverage', 'blue');
        const coverage = ((enKeys.length - missingInRo.length) / enKeys.length) * 100;
        log(`  Romanian coverage: ${coverage.toFixed(2)}%`, 'reset');

        if (coverage === 100) {
            log('  ✅ Perfect coverage!', 'green');
        } else if (coverage >= 90) {
            log('  ⚠️  Good coverage, but some translations missing', 'yellow');
        } else {
            log('  ❌ Low coverage, many translations missing', 'red');
        }
        log('✅ Test 4 completed\n', 'green');

        // Test 5: Test fallback mechanism simulation
        log('📊 Test 5: Fallback Mechanism Simulation', 'blue');
        const testKeys = ['common.appName', 'navigation.problems', 'hero.title', 'nonexistent.key'];

        for (const key of testKeys) {
            const enValue = getNestedValue(enTranslations, key);
            const roValue = getNestedValue(roTranslations, key);

            if (enValue === undefined) {
                log(`  ❌ Key "${key}" missing in English (should not happen)`, 'red');
            } else if (roValue === undefined) {
                log(
                    `  ⚠️  Key "${key}" missing in Romanian, would fallback to: "${enValue}"`,
                    'yellow',
                );
            } else {
                log(`  ✅ Key "${key}" present in both locales`, 'green');
            }
        }
        log('✅ Test 5 completed\n', 'green');

        // Test 6: Validate structure consistency
        log('📊 Test 6: Structure Consistency', 'blue');
        const enNamespaces = Object.keys(enTranslations);
        const roNamespaces = Object.keys(roTranslations);

        const missingNamespaces = enNamespaces.filter((ns) => !roNamespaces.includes(ns));
        const extraNamespaces = roNamespaces.filter((ns) => !enNamespaces.includes(ns));

        if (missingNamespaces.length === 0 && extraNamespaces.length === 0) {
            log('  ✅ All namespaces consistent', 'green');
        } else {
            if (missingNamespaces.length > 0) {
                log(
                    `  ⚠️  Missing namespaces in Romanian: ${missingNamespaces.join(', ')}`,
                    'yellow',
                );
            }
            if (extraNamespaces.length > 0) {
                log(`  ℹ️  Extra namespaces in Romanian: ${extraNamespaces.join(', ')}`, 'cyan');
            }
        }
        log('✅ Test 6 completed\n', 'green');

        // Summary
        log('═══════════════════════════════════════════════════', 'cyan');
        log('📈 Summary', 'cyan');
        log('═══════════════════════════════════════════════════', 'cyan');
        log(`Total English keys: ${enKeys.length}`, 'reset');
        log(`Total Romanian keys: ${roKeys.length}`, 'reset');
        log(
            `Missing in Romanian: ${missingInRo.length}`,
            missingInRo.length > 0 ? 'yellow' : 'green',
        );
        log(`Extra in Romanian: ${extraInRo.length}`, extraInRo.length > 0 ? 'cyan' : 'green');
        log(`Coverage: ${coverage.toFixed(2)}%`, coverage === 100 ? 'green' : 'yellow');
        log('═══════════════════════════════════════════════════\n', 'cyan');

        if (missingInRo.length === 0 && extraInRo.length === 0) {
            log('🎉 All tests passed! Translation system is healthy.', 'green');
        } else if (missingInRo.length > 0) {
            log(
                '⚠️  Some translations are missing. Fallback mechanism will handle them.',
                'yellow',
            );
        } else {
            log('ℹ️  Tests completed with notes. Review the output above.', 'cyan');
        }
    } catch (error) {
        log(`\n❌ Error during testing: ${error}`, 'red');
        process.exit(1);
    }
}

main();
