#!/usr/bin/env tsx
/**
 * Translation Coverage Check Script
 *
 * This script validates translation coverage and reports any missing keys.
 * Run with: npx tsx scripts/check-translations.ts
 */

import {
    findMissingTranslations,
    getTranslationCoverage,
    validateTranslationKey,
    logTranslationCoverage,
} from '../lib/i18n-validation';

console.debug('🔍 Checking translation coverage...\n');

// Check coverage for both locales
const enCoverage = getTranslationCoverage('ro', 'en');
const roCoverage = getTranslationCoverage('en', 'ro');

console.debug(`📊 Coverage Report:`);
console.debug(`   English (EN): ${enCoverage}%`);
console.debug(`   Romanian (RO): ${roCoverage}%\n`);

// Find missing translations
const missingInEn = findMissingTranslations('ro', 'en');
const missingInRo = findMissingTranslations('en', 'ro');

if (missingInEn.length > 0) {
    console.debug(`⚠️  Missing in English (${missingInEn.length} keys):`);
    missingInEn.forEach((key) => console.debug(`   - ${key}`));
    console.debug('');
}

if (missingInRo.length > 0) {
    console.log(`⚠️  Missing in Romanian (${missingInRo.length} keys):`);
    missingInRo.forEach((key) => console.log(`   - ${key}`));
    console.log('');
}

// Test some key validations
console.log('🧪 Testing key validation:');
const testKeys = ['common.loading', 'navigation.problems', 'hero.title', 'invalid.key'];

testKeys.forEach((key) => {
    const existsEn = validateTranslationKey(key, 'en');
    const existsRo = validateTranslationKey(key, 'ro');
    const status = existsEn && existsRo ? '✅' : '❌';
    console.log(`   ${status} ${key} (EN: ${existsEn}, RO: ${existsRo})`);
});

console.log('');

// Summary
if (enCoverage === 100 && roCoverage === 100) {
    console.log('✅ All translations are complete!');
    process.exit(0);
} else {
    console.log('❌ Some translations are missing. Please update the translation files.');
    process.exit(1);
}
