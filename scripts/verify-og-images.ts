/**
 * Verification Script: Open Graph Image Generation
 *
 * Tests the dynamic OG image generation system
 */

import {
    generateProblemOgImageUrl,
    generateProfileOgImageUrl,
    generateGenericOgImageUrl,
    getFallbackOgImageUrl,
} from '@/lib/seo';

console.debug('🖼️  Open Graph Image Generation Verification\n');
console.debug('='.repeat(60));

// ============================================================================
// Test 1: Problem OG Image URL
// ============================================================================

console.debug('\n📝 Test 1: Problem OG Image URL Generation');
console.debug('-'.repeat(60));

try {
    const problemUrl = generateProblemOgImageUrl(
        'Predict House Prices with Linear Regression',
        'Medium',
    );

    console.log('✅ Problem OG image URL generated successfully');
    console.log(`   URL: ${problemUrl}`);

    // Verify URL structure
    const url = new URL(problemUrl);
    const params = url.searchParams;

    if (params.get('type') === 'problem') {
        console.log('✅ Type parameter is correct');
    } else {
        console.log('❌ Type parameter is incorrect');
    }

    if (params.get('title') === 'Predict House Prices with Linear Regression') {
        console.log('✅ Title parameter is correct');
    } else {
        console.log('❌ Title parameter is incorrect');
    }

    if (params.get('difficulty') === 'Medium') {
        console.log('✅ Difficulty parameter is correct');
    } else {
        console.log('❌ Difficulty parameter is incorrect');
    }
} catch (error) {
    console.log('❌ Failed to generate problem OG image URL');
    console.error(error);
}

// ============================================================================
// Test 2: Profile OG Image URL
// ============================================================================

console.log('\n👤 Test 2: Profile OG Image URL Generation');
console.log('-'.repeat(60));

try {
    const profileUrl = generateProfileOgImageUrl('john_doe', {
        rank: 5,
        totalScore: 1250.5,
        problemsSolved: 15,
    });

    console.log('✅ Profile OG image URL generated successfully');
    console.log(`   URL: ${profileUrl}`);

    // Verify URL structure
    const url = new URL(profileUrl);
    const params = url.searchParams;

    if (params.get('type') === 'profile') {
        console.log('✅ Type parameter is correct');
    } else {
        console.log('❌ Type parameter is incorrect');
    }

    if (params.get('username') === 'john_doe') {
        console.log('✅ Username parameter is correct');
    } else {
        console.log('❌ Username parameter is incorrect');
    }

    if (params.get('rank') === '5') {
        console.log('✅ Rank parameter is correct');
    } else {
        console.log('❌ Rank parameter is incorrect');
    }

    if (params.get('totalScore') === '1250.5') {
        console.log('✅ Total score parameter is correct');
    } else {
        console.log('❌ Total score parameter is incorrect');
    }

    if (params.get('problemsSolved') === '15') {
        console.log('✅ Problems solved parameter is correct');
    } else {
        console.log('❌ Problems solved parameter is incorrect');
    }
} catch (error) {
    console.log('❌ Failed to generate profile OG image URL');
    console.error(error);
}

// ============================================================================
// Test 3: Generic OG Image URL
// ============================================================================

console.log('\n🌐 Test 3: Generic OG Image URL Generation');
console.log('-'.repeat(60));

try {
    const genericUrl = generateGenericOgImageUrl(
        'Leaderboard',
        'Top performers in machine learning competitions',
    );

    console.log('✅ Generic OG image URL generated successfully');
    console.log(`   URL: ${genericUrl}`);

    // Verify URL structure
    const url = new URL(genericUrl);
    const params = url.searchParams;

    if (params.get('type') === 'generic') {
        console.log('✅ Type parameter is correct');
    } else {
        console.log('❌ Type parameter is incorrect');
    }

    if (params.get('title') === 'Leaderboard') {
        console.log('✅ Title parameter is correct');
    } else {
        console.log('❌ Title parameter is incorrect');
    }

    if (params.get('subtitle') === 'Top performers in machine learning competitions') {
        console.log('✅ Subtitle parameter is correct');
    } else {
        console.log('❌ Subtitle parameter is incorrect');
    }
} catch (error) {
    console.log('❌ Failed to generate generic OG image URL');
    console.error(error);
}

// ============================================================================
// Test 4: Generic OG Image URL (without subtitle)
// ============================================================================

console.log('\n🌐 Test 4: Generic OG Image URL (No Subtitle)');
console.log('-'.repeat(60));

try {
    const genericUrl = generateGenericOgImageUrl('MLCompete');

    console.log('✅ Generic OG image URL generated successfully');
    console.log(`   URL: ${genericUrl}`);

    // Verify URL structure
    const url = new URL(genericUrl);
    const params = url.searchParams;

    if (params.get('type') === 'generic') {
        console.log('✅ Type parameter is correct');
    } else {
        console.log('❌ Type parameter is incorrect');
    }

    if (params.get('title') === 'MLCompete') {
        console.log('✅ Title parameter is correct');
    } else {
        console.log('❌ Title parameter is incorrect');
    }

    if (!params.has('subtitle')) {
        console.log('✅ Subtitle parameter correctly omitted');
    } else {
        console.log('❌ Subtitle parameter should not be present');
    }
} catch (error) {
    console.log('❌ Failed to generate generic OG image URL');
    console.error(error);
}

// ============================================================================
// Test 5: Fallback OG Image URL
// ============================================================================

console.log('\n🔄 Test 5: Fallback OG Image URL');
console.log('-'.repeat(60));

try {
    const fallbackUrl = getFallbackOgImageUrl();

    console.log('✅ Fallback OG image URL retrieved successfully');
    console.log(`   URL: ${fallbackUrl}`);

    if (fallbackUrl.includes('/og-image.png')) {
        console.log('✅ Fallback URL points to static image');
    } else {
        console.log('❌ Fallback URL is incorrect');
    }
} catch (error) {
    console.log('❌ Failed to get fallback OG image URL');
    console.error(error);
}

// ============================================================================
// Test 6: URL Encoding
// ============================================================================

console.log('\n🔐 Test 6: URL Encoding for Special Characters');
console.log('-'.repeat(60));

try {
    const problemUrl = generateProblemOgImageUrl('Predict Prices & Trends (2024)', 'Hard');

    console.log('✅ Problem OG image URL with special characters generated');
    console.log(`   URL: ${problemUrl}`);

    // Verify URL is properly encoded
    const url = new URL(problemUrl);
    const title = url.searchParams.get('title');

    if (title === 'Predict Prices & Trends (2024)') {
        console.log('✅ Special characters properly decoded');
    } else {
        console.log('❌ Special characters not properly handled');
    }
} catch (error) {
    console.log('❌ Failed to handle special characters');
    console.error(error);
}

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('✅ Open Graph Image Generation Verification Complete');
console.log('='.repeat(60));
console.log('\n📋 Next Steps:');
console.log('   1. Start the development server: npm run dev');
console.log('   2. Visit: http://localhost:3000/api/og?type=problem&title=Test&difficulty=Easy');
console.log('   3. Verify the image renders correctly');
console.log('   4. Test different image types (problem, profile, generic)');
console.log('   5. Check metadata in actual pages');
console.log('\n');
