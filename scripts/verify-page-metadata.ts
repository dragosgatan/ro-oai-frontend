#!/usr/bin/env tsx
/**
 * Verification Script: Page Metadata Integration
 *
 * This script verifies that metadata and structured data have been
 * properly integrated into all pages.
 */

import { generateHomeMetadata, generateLeaderboardMetadata } from '@/lib/seo/page-metadata';
import { generateOrganizationSchema, generateWebSiteSchema } from '@/lib/seo/structured-data';

async function verifyPageMetadata() {
    console.debug('🔍 Verifying Page Metadata Integration\n');

    let allPassed = true;

    // Test 1: Homepage Metadata
    console.debug('1️⃣  Testing Homepage Metadata Generation...');
    try {
        const homeMetadata = await generateHomeMetadata('en');

        if (!homeMetadata.title) {
            console.error('   ❌ Homepage metadata missing title');
            allPassed = false;
        } else {
            console.debug(`   ✅ Title: ${homeMetadata.title}`);
        }

        if (!homeMetadata.description) {
            console.error('   ❌ Homepage metadata missing description');
            allPassed = false;
        } else {
            console.log(`   ✅ Description: ${homeMetadata.description.substring(0, 60)}...`);
        }

        if (!homeMetadata.openGraph) {
            console.error('   ❌ Homepage metadata missing Open Graph tags');
            allPassed = false;
        } else {
            console.log('   ✅ Open Graph tags present');
        }

        if (!homeMetadata.twitter) {
            console.error('   ❌ Homepage metadata missing Twitter Card tags');
            allPassed = false;
        } else {
            console.log('   ✅ Twitter Card tags present');
        }
    } catch (error) {
        console.error('   ❌ Error generating homepage metadata:', error);
        allPassed = false;
    }

    console.log('');

    // Test 2: Leaderboard Metadata
    console.log('2️⃣  Testing Leaderboard Metadata Generation...');
    try {
        const leaderboardMetadata = await generateLeaderboardMetadata('en');

        if (!leaderboardMetadata.title) {
            console.error('   ❌ Leaderboard metadata missing title');
            allPassed = false;
        } else {
            console.log(`   ✅ Title: ${leaderboardMetadata.title}`);
        }

        if (!leaderboardMetadata.description) {
            console.error('   ❌ Leaderboard metadata missing description');
            allPassed = false;
        } else {
            console.log(
                `   ✅ Description: ${leaderboardMetadata.description.substring(0, 60)}...`,
            );
        }
    } catch (error) {
        console.error('   ❌ Error generating leaderboard metadata:', error);
        allPassed = false;
    }

    console.log('');

    // Test 3: Organization Schema
    console.log('3️⃣  Testing Organization Schema Generation...');
    try {
        const orgSchema = generateOrganizationSchema('en');

        if (!orgSchema['@context']) {
            console.error('   ❌ Organization schema missing @context');
            allPassed = false;
        } else {
            console.log('   ✅ @context present');
        }

        if (!orgSchema['@type'] || orgSchema['@type'] !== 'Organization') {
            console.error('   ❌ Organization schema missing or incorrect @type');
            allPassed = false;
        } else {
            console.log('   ✅ @type: Organization');
        }

        if (!orgSchema.name) {
            console.error('   ❌ Organization schema missing name');
            allPassed = false;
        } else {
            console.log(`   ✅ Name: ${orgSchema.name}`);
        }
    } catch (error) {
        console.error('   ❌ Error generating organization schema:', error);
        allPassed = false;
    }

    console.log('');

    // Test 4: WebSite Schema
    console.log('4️⃣  Testing WebSite Schema Generation...');
    try {
        const websiteSchema = generateWebSiteSchema('en');

        if (!websiteSchema['@context']) {
            console.error('   ❌ WebSite schema missing @context');
            allPassed = false;
        } else {
            console.log('   ✅ @context present');
        }

        if (!websiteSchema['@type'] || websiteSchema['@type'] !== 'WebSite') {
            console.error('   ❌ WebSite schema missing or incorrect @type');
            allPassed = false;
        } else {
            console.log('   ✅ @type: WebSite');
        }

        if (!websiteSchema.potentialAction) {
            console.error('   ❌ WebSite schema missing potentialAction (search)');
            allPassed = false;
        } else {
            console.log('   ✅ Search action present');
        }
    } catch (error) {
        console.error('   ❌ Error generating website schema:', error);
        allPassed = false;
    }

    console.log('');
    console.log('═'.repeat(60));

    if (allPassed) {
        console.log('✅ All page metadata integration tests passed!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Start the development server: npm run dev');
        console.log('2. Visit http://localhost:3000 and view page source');
        console.log('3. Verify metadata tags in <head>');
        console.log('4. Verify JSON-LD structured data in <script> tags');
        console.log('5. Test with Google Rich Results Test');
        console.log('6. Test with Facebook Sharing Debugger');
        console.log('7. Test with Twitter Card Validator');
    } else {
        console.log('❌ Some page metadata integration tests failed');
        console.log('Please review the errors above and fix the issues.');
        process.exit(1);
    }
}

// Run verification
verifyPageMetadata().catch((error) => {
    console.error('Fatal error during verification:', error);
    process.exit(1);
});
