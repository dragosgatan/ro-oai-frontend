/**
 * Demo script to showcase locale-specific formatting differences
 * between English and Romanian
 *
 * Run with: npx tsx scripts/demo-i18n-formatting.ts
 */

import {
    formatShortDate,
    formatMediumDate,
    formatLongDate,
    formatDateTime,
    formatTime,
    formatInteger,
    formatDecimal,
    formatPercent,
    formatScore,
    formatPlural,
    formatFileSize,
    formatDuration,
    formatRelativeTime,
} from '../lib/i18n-formatting';

console.debug('='.repeat(60));
console.debug('i18n Formatting Demo: English vs Romanian');
console.debug('='.repeat(60));

// Test date
const testDate = new Date('2024-01-15T14:30:45');

console.debug('\n📅 DATE FORMATTING');
console.debug('-'.repeat(60));
console.log('Short Date:');
console.log(`  EN: ${formatShortDate(testDate, 'en')}`);
console.log(`  RO: ${formatShortDate(testDate, 'ro')}`);

console.log('\nMedium Date:');
console.log(`  EN: ${formatMediumDate(testDate, 'en')}`);
console.log(`  RO: ${formatMediumDate(testDate, 'ro')}`);

console.log('\nLong Date:');
console.log(`  EN: ${formatLongDate(testDate, 'en')}`);
console.log(`  RO: ${formatLongDate(testDate, 'ro')}`);

console.log('\nDate + Time:');
console.log(`  EN: ${formatDateTime(testDate, 'en')}`);
console.log(`  RO: ${formatDateTime(testDate, 'ro')}`);

console.log('\nTime Only:');
console.log(`  EN: ${formatTime(testDate, 'en')}`);
console.log(`  RO: ${formatTime(testDate, 'ro')}`);

console.log('\nRelative Time (2 days ago):');
const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
console.log(`  EN: ${formatRelativeTime(twoDaysAgo, 'en')}`);
console.log(`  RO: ${formatRelativeTime(twoDaysAgo, 'ro')}`);

// Number formatting
console.log('\n🔢 NUMBER FORMATTING');
console.log('-'.repeat(60));

console.log('Large Integer (1,234,567):');
console.log(`  EN: ${formatInteger(1234567, 'en')}`);
console.log(`  RO: ${formatInteger(1234567, 'ro')}`);

console.log('\nDecimal (123.456):');
console.log(`  EN: ${formatDecimal(123.456, 'en', 2)}`);
console.log(`  RO: ${formatDecimal(123.456, 'ro', 2)}`);

console.log('\nPercentage (75%):');
console.log(`  EN: ${formatPercent(75, 'en')}`);
console.log(`  RO: ${formatPercent(75, 'ro')}`);

console.log('\nScore (99.9876):');
console.log(`  EN: ${formatScore(99.9876, 'en')}`);
console.log(`  RO: ${formatScore(99.9876, 'ro')}`);

console.log('\nScore (85.5):');
console.log(`  EN: ${formatScore(85.5, 'en')}`);
console.log(`  RO: ${formatScore(85.5, 'ro')}`);

// Pluralization
console.log('\n📊 PLURALIZATION');
console.log('-'.repeat(60));

const problemOptions = {
    one: 'problem',
    other: 'problems',
};

const problemaOptions = {
    one: 'problemă',
    few: 'probleme',
    other: 'de probleme',
};

console.log('English (simple: one/other):');
console.log(`  0: ${formatPlural(0, 'en', problemOptions)}`);
console.log(`  1: ${formatPlural(1, 'en', problemOptions)}`);
console.log(`  2: ${formatPlural(2, 'en', problemOptions)}`);
console.log(`  5: ${formatPlural(5, 'en', problemOptions)}`);
console.log(` 20: ${formatPlural(20, 'en', problemOptions)}`);

console.log('\nRomanian (complex: one/few/other):');
console.log(`  0: ${formatPlural(0, 'ro', problemaOptions)}`);
console.log(`  1: ${formatPlural(1, 'ro', problemaOptions)}`);
console.log(`  2: ${formatPlural(2, 'ro', problemaOptions)}`);
console.log(`  5: ${formatPlural(5, 'ro', problemaOptions)}`);
console.log(` 15: ${formatPlural(15, 'ro', problemaOptions)}`);
console.log(` 19: ${formatPlural(19, 'ro', problemaOptions)}`);
console.log(` 20: ${formatPlural(20, 'ro', problemaOptions)}`);
console.log(`100: ${formatPlural(100, 'ro', problemaOptions)}`);

// Utility formatters
console.log('\n🛠️  UTILITY FORMATTERS');
console.log('-'.repeat(60));

console.log('File Sizes:');
console.log(`  1 KB (EN): ${formatFileSize(1024, 'en')}`);
console.log(`  1 KB (RO): ${formatFileSize(1024, 'ro')}`);
console.log(`  5 MB (EN): ${formatFileSize(5 * 1024 * 1024, 'en')}`);
console.log(`  5 MB (RO): ${formatFileSize(5 * 1024 * 1024, 'ro')}`);

console.log('\nDurations:');
console.log(`  30 seconds (EN): ${formatDuration(30 * 1000, 'en')}`);
console.log(`  30 seconds (RO): ${formatDuration(30 * 1000, 'ro')}`);
console.log(`  5 minutes (EN): ${formatDuration(5 * 60 * 1000, 'en')}`);
console.log(`  5 minutes (RO): ${formatDuration(5 * 60 * 1000, 'ro')}`);
console.log(`  2 hours (EN): ${formatDuration(2 * 60 * 60 * 1000, 'en')}`);
console.log(`  2 hours (RO): ${formatDuration(2 * 60 * 60 * 1000, 'ro')}`);
console.log(`  3 days (EN): ${formatDuration(3 * 24 * 60 * 60 * 1000, 'en')}`);
console.log(`  3 days (RO): ${formatDuration(3 * 24 * 60 * 60 * 1000, 'ro')}`);

console.log('\n' + '='.repeat(60));
console.log('✅ Demo complete!');
console.log('='.repeat(60));
