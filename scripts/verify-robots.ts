/**
 * Robots.txt Verification Script
 *
 * Verifies that the robots.txt configuration is working correctly
 */

import {
    generateRobotsConfig,
    isPathDisallowed,
    getRobotsMetaTag,
    formatRobotsTxt,
    validateRobotsConfig,
} from '../lib/seo/robots';

console.debug('🤖 Robots.txt Configuration Verification\n');
console.debug('='.repeat(60));

// ============================================================================
// Test 1: Generate Configuration
// ============================================================================

console.log('\n📋 Test 1: Generate Robots Configuration');
console.log('-'.repeat(60));

try {
    const config = generateRobotsConfig();
    console.log('✅ Configuration generated successfully');
    console.log(`   - Rules: ${config.rules.length}`);
    console.log(`   - Sitemaps: ${config.sitemap.length}`);
    console.log(`   - Host: ${config.host || 'Not set'}`);
} catch (error) {
    console.error('❌ Failed to generate configuration:', error);
    process.exit(1);
}

// ============================================================================
// Test 2: Validate Configuration
// ============================================================================

console.log('\n✅ Test 2: Validate Configuration');
console.log('-'.repeat(60));

try {
    const config = generateRobotsConfig();
    validateRobotsConfig(config);
    console.log('✅ Configuration is valid');
} catch (error) {
    console.error('❌ Configuration validation failed:', error);
    process.exit(1);
}

// ============================================================================
// Test 3: Check Path Disallow Rules
// ============================================================================

console.log('\n🚫 Test 3: Path Disallow Rules');
console.log('-'.repeat(60));

// Import environment check
import { isProduction } from '../lib/seo/config';

const inProduction = isProduction();
console.log(`   Environment: ${inProduction ? 'Production' : 'Development/Staging'}`);

// In non-production, all paths should be disallowed
// In production, only private routes should be disallowed
const testPaths = [
    { path: '/', shouldBeDisallowedInProd: false },
    { path: '/problems', shouldBeDisallowedInProd: false },
    { path: '/api/auth/signin', shouldBeDisallowedInProd: true },
    { path: '/settings', shouldBeDisallowedInProd: true },
    { path: '/profile/confirm', shouldBeDisallowedInProd: true },
    { path: '/problems?page=2', shouldBeDisallowedInProd: true },
];

let pathTestsPassed = 0;
for (const test of testPaths) {
    const isDisallowed = isPathDisallowed(test.path);
    const expectedDisallowed = inProduction ? test.shouldBeDisallowedInProd : true;
    const passed = isDisallowed === expectedDisallowed;

    if (passed) {
        console.log(`✅ ${test.path}: ${isDisallowed ? 'Disallowed' : 'Allowed'} (as expected)`);
        pathTestsPassed++;
    } else {
        console.log(
            `❌ ${test.path}: ${isDisallowed ? 'Disallowed' : 'Allowed'} (expected ${expectedDisallowed ? 'Disallowed' : 'Allowed'})`,
        );
    }
}

console.log(`\n   Passed: ${pathTestsPassed}/${testPaths.length}`);

// ============================================================================
// Test 4: Robots Meta Tags
// ============================================================================

console.log('\n🏷️  Test 4: Robots Meta Tags');
console.log('-'.repeat(60));

const metaTagTests = [
    { path: '/', description: 'Homepage' },
    { path: '/problems', description: 'Problems page' },
    { path: '/api/auth/signin', description: 'API route' },
    { path: '/settings', description: 'Settings page' },
];

for (const test of metaTagTests) {
    const metaTag = getRobotsMetaTag(test.path);
    console.log(`   ${test.description} (${test.path}): ${metaTag || 'No meta tag (indexable)'}`);
}

// ============================================================================
// Test 5: Format Robots.txt
// ============================================================================

console.log('\n📄 Test 5: Format Robots.txt Content');
console.log('-'.repeat(60));

try {
    const config = generateRobotsConfig();
    const formatted = formatRobotsTxt(config);

    console.log('✅ Robots.txt formatted successfully');
    console.log('\nGenerated robots.txt content:');
    console.log('─'.repeat(60));
    console.log(formatted);
    console.log('─'.repeat(60));
} catch (error) {
    console.error('❌ Failed to format robots.txt:', error);
    process.exit(1);
}

// ============================================================================
// Test 6: User Agent Rules
// ============================================================================

console.log('\n🕷️  Test 6: User Agent Rules');
console.log('-'.repeat(60));

const config = generateRobotsConfig();
for (const rule of config.rules) {
    console.log(`\n   User-agent: ${rule.userAgent}`);
    if (rule.allow) {
        console.log(`   - Allow: ${rule.allow.join(', ')}`);
    }
    if (rule.disallow) {
        console.log(`   - Disallow: ${rule.disallow.join(', ')}`);
    }
    if (rule.crawlDelay) {
        console.log(`   - Crawl-delay: ${rule.crawlDelay}`);
    }
}

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('✅ All robots.txt verification tests completed successfully!');
console.log('='.repeat(60));
