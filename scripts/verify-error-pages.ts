#!/usr/bin/env tsx

/**
 * Error Pages Verification Script
 *
 * Verifies that custom error pages are properly implemented with:
 * - Correct file locations
 * - Proper exports
 * - Required translations
 * - SEO metadata
 */

import fs from 'fs';
import path from 'path';

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
}

function checkFileContent(
    filePath: string,
    patterns: string[],
): { found: string[]; missing: string[] } {
    const content = fs.readFileSync(filePath, 'utf-8');
    const found: string[] = [];
    const missing: string[] = [];

    patterns.forEach((pattern) => {
        if (content.includes(pattern)) {
            found.push(pattern);
        } else {
            missing.push(pattern);
        }
    });

    return { found, missing };
}

async function verifyErrorPages() {
    log('\n🔍 Verifying Error Pages Implementation\n', 'cyan');

    let allPassed = true;

    // ============================================================================
    // Check 404 Page (not-found.tsx)
    // ============================================================================

    log('📄 Checking 404 Page (not-found.tsx)...', 'blue');

    const notFoundPath = path.join(process.cwd(), 'app', 'not-found.tsx');

    if (!checkFileExists(notFoundPath)) {
        log('  ❌ File not found: app/not-found.tsx', 'red');
        allPassed = false;
    } else {
        log('  ✅ File exists: app/not-found.tsx', 'green');

        // Check for required exports and features
        const notFoundPatterns = [
            'export async function generateMetadata',
            'export default async function NotFound',
            'getServerLocale',
            'getMessages',
            'errors?.notFound',
            'noindex: true',
            'nofollow: true',
            'getCanonicalUrl',
        ];

        const { found, missing } = checkFileContent(notFoundPath, notFoundPatterns);

        if (missing.length === 0) {
            log('  ✅ All required patterns found', 'green');
        } else {
            log('  ❌ Missing patterns:', 'red');
            missing.forEach((pattern) => log(`    - ${pattern}`, 'red'));
            allPassed = false;
        }
    }

    // ============================================================================
    // Check Error Page (error.tsx)
    // ============================================================================

    log('\n📄 Checking Error Page (error.tsx)...', 'blue');

    const errorPath = path.join(process.cwd(), 'app', 'error.tsx');

    if (!checkFileExists(errorPath)) {
        log('  ❌ File not found: app/error.tsx', 'red');
        allPassed = false;
    } else {
        log('  ✅ File exists: app/error.tsx', 'green');

        // Check for required exports and features
        const errorPatterns = [
            "'use client'",
            'export default function Error',
            'useTranslations',
            'errors.serverError',
            'error: Error',
            'reset: () => void',
            'onClick={reset}',
        ];

        const { found, missing } = checkFileContent(errorPath, errorPatterns);

        if (missing.length === 0) {
            log('  ✅ All required patterns found', 'green');
        } else {
            log('  ❌ Missing patterns:', 'red');
            missing.forEach((pattern) => log(`    - ${pattern}`, 'red'));
            allPassed = false;
        }
    }

    // ============================================================================
    // Check Translations
    // ============================================================================

    log('\n🌐 Checking Translations...', 'blue');

    const locales = ['en', 'ro'];
    const requiredKeys = [
        'errors.notFound.title',
        'errors.notFound.heading',
        'errors.notFound.description',
        'errors.notFound.suggestion',
        'errors.notFound.goHome',
        'errors.notFound.viewProblems',
        'errors.notFound.viewLeaderboard',
        'errors.serverError.title',
        'errors.serverError.heading',
        'errors.serverError.description',
        'errors.serverError.suggestion',
        'errors.serverError.tryAgain',
        'errors.serverError.goHome',
        'errors.serverError.contactSupport',
    ];

    for (const locale of locales) {
        const localePath = path.join(process.cwd(), 'locales', `${locale}.json`);

        if (!checkFileExists(localePath)) {
            log(`  ❌ Locale file not found: locales/${locale}.json`, 'red');
            allPassed = false;
            continue;
        }

        log(`  📝 Checking ${locale}.json...`, 'cyan');

        const localeContent = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
        const missingKeys: string[] = [];

        requiredKeys.forEach((key) => {
            const keys = key.split('.');
            let current: any = localeContent;

            for (const k of keys) {
                if (current && typeof current === 'object' && k in current) {
                    current = current[k];
                } else {
                    missingKeys.push(key);
                    break;
                }
            }
        });

        if (missingKeys.length === 0) {
            log(`    ✅ All required translation keys found in ${locale}.json`, 'green');
        } else {
            log(`    ❌ Missing translation keys in ${locale}.json:`, 'red');
            missingKeys.forEach((key) => log(`      - ${key}`, 'red'));
            allPassed = false;
        }
    }

    // ============================================================================
    // Summary
    // ============================================================================

    log('\n' + '='.repeat(60), 'cyan');

    if (allPassed) {
        log('✅ All error page verifications passed!', 'green');
        log('\n📋 Summary:', 'cyan');
        log('  • 404 page (not-found.tsx) is properly implemented', 'green');
        log('  • Error page (error.tsx) is properly implemented', 'green');
        log('  • All required translations are present', 'green');
        log('  • SEO metadata is configured correctly', 'green');
        log('\n🎉 Error pages are ready for production!', 'green');
    } else {
        log('❌ Some verifications failed. Please review the errors above.', 'red');
        process.exit(1);
    }

    log('='.repeat(60) + '\n', 'cyan');
}

// Run verification
verifyErrorPages().catch((error) => {
    log(`\n❌ Verification failed with error: ${error.message}`, 'red');
    process.exit(1);
});
