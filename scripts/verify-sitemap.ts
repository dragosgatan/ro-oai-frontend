/**
 * Sitemap Verification Script
 *
 * Tests the sitemap generation functionality
 */

import {
    generateSitemap,
    generateStaticPagesSitemap,
    generateProblemsSitemap,
    generateProfilesSitemap,
} from '@/lib/seo/sitemap';

async function verifySitemap() {
    console.debug('🔍 Verifying Sitemap Generation\n');
    console.debug('='.repeat(60));

    // Test 1: Static Pages Sitemap
    console.debug('\n📄 Test 1: Static Pages Sitemap');
    console.debug('-'.repeat(60));
    try {
        const staticEntries = generateStaticPagesSitemap();
        console.log(`✅ Generated ${staticEntries.length} static page entries`);

        // Show sample entries
        console.log('\nSample static entries:');
        staticEntries.slice(0, 3).forEach((entry) => {
            console.log(`  - ${entry.url}`);
            console.log(`    Priority: ${entry.priority}, Frequency: ${entry.changeFrequency}`);
            console.log(`    Alternates: ${entry.alternateRefs?.length || 0} languages`);
        });
    } catch (error) {
        console.error('❌ Error generating static pages sitemap:', error);
    }

    // Test 2: Problems Sitemap
    console.log('\n📝 Test 2: Problems Sitemap');
    console.log('-'.repeat(60));
    try {
        const problemEntries = await generateProblemsSitemap();
        console.log(`✅ Generated ${problemEntries.length} problem entries`);

        if (problemEntries.length > 0) {
            console.log('\nSample problem entries:');
            problemEntries.slice(0, 3).forEach((entry) => {
                console.log(`  - ${entry.url}`);
                console.log(`    Priority: ${entry.priority}, Frequency: ${entry.changeFrequency}`);
            });
        } else {
            console.log('⚠️  No problem entries generated (API may be unavailable)');
        }
    } catch (error) {
        console.error('❌ Error generating problems sitemap:', error);
    }

    // Test 3: Profiles Sitemap
    console.log('\n👤 Test 3: Profiles Sitemap');
    console.log('-'.repeat(60));
    try {
        const profileEntries = await generateProfilesSitemap();
        console.log(`✅ Generated ${profileEntries.length} profile entries`);

        if (profileEntries.length > 0) {
            console.log('\nSample profile entries:');
            profileEntries.slice(0, 3).forEach((entry) => {
                console.log(`  - ${entry.url}`);
                console.log(`    Priority: ${entry.priority}, Frequency: ${entry.changeFrequency}`);
            });
        } else {
            console.log(
                '⚠️  No profile entries generated (API may be unavailable or no public profiles)',
            );
        }
    } catch (error) {
        console.error('❌ Error generating profiles sitemap:', error);
    }

    // Test 4: Complete Sitemap
    console.log('\n🌐 Test 4: Complete Sitemap');
    console.log('-'.repeat(60));
    try {
        const allEntries = await generateSitemap();
        console.log(`✅ Generated complete sitemap with ${allEntries.length} total entries`);

        // Verify structure
        const hasUrl = allEntries.every(
            (entry) => typeof entry.url === 'string' && entry.url.length > 0,
        );
        const hasLastModified = allEntries.every((entry) => entry.lastModified instanceof Date);
        const hasChangeFrequency = allEntries.every((entry) => entry.changeFrequency !== undefined);
        const hasPriority = allEntries.every((entry) => typeof entry.priority === 'number');
        const hasAlternates = allEntries.every((entry) => Array.isArray(entry.alternateRefs));

        console.log('\nStructure validation:');
        console.log(`  ${hasUrl ? '✅' : '❌'} All entries have valid URLs`);
        console.log(`  ${hasLastModified ? '✅' : '❌'} All entries have lastModified dates`);
        console.log(`  ${hasChangeFrequency ? '✅' : '❌'} All entries have changeFrequency`);
        console.log(`  ${hasPriority ? '✅' : '❌'} All entries have priority`);
        console.log(`  ${hasAlternates ? '✅' : '❌'} All entries have alternate refs`);

        // Check for duplicates
        const urls = allEntries.map((e) => e.url);
        const uniqueUrls = new Set(urls);
        const hasDuplicates = urls.length !== uniqueUrls.size;
        console.log(`  ${!hasDuplicates ? '✅' : '❌'} No duplicate URLs`);

        if (hasDuplicates) {
            const duplicates = urls.filter((url, index) => urls.indexOf(url) !== index);
            console.log(`    Duplicates found: ${[...new Set(duplicates)].join(', ')}`);
        }

        // URL distribution
        const urlsByType = {
            homepage: urls.filter((u) => u.match(/\/(en|ro)?$/)).length,
            problems: urls.filter((u) => u.includes('/problems')).length,
            profiles: urls.filter((u) => u.includes('/profile')).length,
            leaderboard: urls.filter((u) => u.includes('/leaderboard')).length,
            other: 0,
        };
        urlsByType.other =
            urls.length -
            Object.values(urlsByType).reduce((a, b) => a + b, 0) +
            urlsByType.homepage;

        console.log('\nURL distribution:');
        console.log(`  Homepage: ${urlsByType.homepage}`);
        console.log(`  Problems: ${urlsByType.problems}`);
        console.log(`  Profiles: ${urlsByType.profiles}`);
        console.log(`  Leaderboard: ${urlsByType.leaderboard}`);
        console.log(`  Other: ${urlsByType.other}`);
    } catch (error) {
        console.error('❌ Error generating complete sitemap:', error);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Sitemap verification complete!\n');
}

// Run verification
verifySitemap().catch(console.error);
