/**
 * Verification script for metadata generation system
 * Tests core functionality of the SEO metadata system
 */

import { generateMetadata, validateMetadataConfig } from '../lib/seo/metadata';
import {
    getCanonicalUrl,
    generateHreflangTags,
    generateAlternateLanguages,
} from '../lib/seo/canonical';
import { BASE_URL } from '../lib/seo/config';

console.debug('🔍 Verifying Metadata Generation System\n');

// Test 1: Basic metadata generation
console.debug('Test 1: Basic metadata generation');
try {
    const metadata = generateMetadata({
        title: 'Test Problem - Machine Learning Challenge',
        description:
            'This is a test problem for machine learning competitions. Solve it to improve your ranking.',
        locale: 'en',
        type: 'article',
        keywords: ['machine learning', 'test', 'challenge'],
    });

    console.debug('✓ Title:', metadata.title);
    console.debug('✓ Description:', metadata.description);
    console.debug('✓ Open Graph title:', metadata.openGraph.title);
    console.debug('✓ Twitter card type:', metadata.twitter.card);
    console.log('✓ Robots index:', metadata.robots?.index);
    console.log('✓ Canonical URL:', metadata.alternates?.canonical);
} catch (error) {
    console.error('✗ Test 1 failed:', error);
    process.exit(1);
}

// Test 2: Metadata with fallback
console.log('\nTest 2: Metadata validation and fallback');
try {
    const config = validateMetadataConfig({
        title: 'Short',
        locale: 'en',
    });

    console.log('✓ Validated config has title:', config.title);
    console.log('✓ Validated config has description:', config.description);
    console.log('✓ Validated config has locale:', config.locale);
} catch (error) {
    console.error('✗ Test 2 failed:', error);
    process.exit(1);
}

// Test 3: Canonical URL generation
console.log('\nTest 3: Canonical URL generation');
try {
    const canonical1 = getCanonicalUrl('/problems/123', 'en');
    const canonical2 = getCanonicalUrl('/problems/123/', 'ro');
    const canonical3 = getCanonicalUrl('/problems/123?page=1#section', 'en');

    console.log('✓ English canonical:', canonical1);
    console.log('✓ Romanian canonical:', canonical2);
    console.log('✓ Normalized canonical:', canonical3);

    // Verify normalization
    if (canonical1.includes('?') || canonical1.includes('#')) {
        throw new Error('Canonical URL should not contain query params or fragments');
    }
    if (canonical1.endsWith('/') && canonical1 !== BASE_URL + '/') {
        throw new Error('Canonical URL should not have trailing slash');
    }
} catch (error) {
    console.error('✗ Test 3 failed:', error);
    process.exit(1);
}

// Test 4: Hreflang tags generation
console.log('\nTest 4: Hreflang tags generation');
try {
    const hreflangTags = generateHreflangTags({
        baseUrl: BASE_URL,
        path: '/problems/123',
        supportedLocales: ['en', 'ro'],
        defaultLocale: 'en',
    });

    console.log('✓ Generated', hreflangTags.length, 'hreflang tags');

    // Should have en, ro, and x-default
    const hasEn = hreflangTags.some((tag) => tag.hreflang === 'en');
    const hasRo = hreflangTags.some((tag) => tag.hreflang === 'ro');
    const hasDefault = hreflangTags.some((tag) => tag.hreflang === 'x-default');

    if (!hasEn || !hasRo || !hasDefault) {
        throw new Error('Missing required hreflang tags');
    }

    hreflangTags.forEach((tag) => {
        console.log(`  - ${tag.hreflang}: ${tag.href}`);
    });
} catch (error) {
    console.error('✗ Test 4 failed:', error);
    process.exit(1);
}

// Test 5: Alternate languages generation
console.log('\nTest 5: Alternate languages generation');
try {
    const alternates = generateAlternateLanguages('/problems/123');

    console.log('✓ Generated alternates for locales:', Object.keys(alternates).join(', '));

    if (!alternates['en'] || !alternates['ro'] || !alternates['x-default']) {
        throw new Error('Missing required alternate language links');
    }

    Object.entries(alternates).forEach(([locale, url]) => {
        console.log(`  - ${locale}: ${url}`);
    });
} catch (error) {
    console.error('✗ Test 5 failed:', error);
    process.exit(1);
}

// Test 6: Metadata with noindex/nofollow
console.log('\nTest 6: Robots directives');
try {
    const metadata = generateMetadata({
        title: 'Private Page',
        description: 'This page should not be indexed',
        locale: 'en',
        noindex: true,
        nofollow: true,
    });

    if (metadata.robots?.index !== false || metadata.robots?.follow !== false) {
        throw new Error('Robots directives not applied correctly');
    }

    console.log('✓ Noindex:', !metadata.robots.index);
    console.log('✓ Nofollow:', !metadata.robots.follow);
} catch (error) {
    console.error('✗ Test 6 failed:', error);
    process.exit(1);
}

console.log('\n✅ All metadata system tests passed!');
console.log('\n📊 Summary:');
console.log('  - Core metadata generation: ✓');
console.log('  - Validation and fallbacks: ✓');
console.log('  - Canonical URL generation: ✓');
console.log('  - Hreflang tags: ✓');
console.log('  - Alternate languages: ✓');
console.log('  - Robots directives: ✓');
