/**
 * Structured Data Verification Script
 *
 * Tests the structured data generators to ensure they produce valid schema.org markup
 */

import {
    generateOrganizationSchema,
    generateWebSiteSchema,
    generateProblemSchema,
    generatePersonSchema,
    generateItemListSchema,
    generateBreadcrumbSchema,
    validateStructuredData,
    sanitizeStructuredData,
    combineStructuredData,
} from '../lib/seo/structured-data';
import type { Problem, UserProfile, GenericLeaderboardEntry } from '../lib/types';

console.debug('🔍 Verifying Structured Data Generators\n');

// ============================================================================
// Test Data
// ============================================================================

const mockProblem: Problem = {
    id: '1',
    title: 'Image Classification Challenge',
    shortDescription: 'Build a model to classify images into 10 categories',
    longDescription: 'Detailed description...',
    difficulty: 'Medium',
    author: 'MLCompete Team',
    lastAttemptedScore: 85.5,
    topScore: 95.2,
    partialTopScore: 95.2,
    datasetUrl: 'https://example.com/dataset',
    inputFormat: 'CSV',
    outputFormat: 'CSV',
    subtasks: null,
};

const mockProfile: UserProfile = {
    username: 'johndoe',
    email: 'john@example.com',
    joinedAt: new Date('2024-01-01'),
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Machine learning enthusiast',
    location: 'San Francisco, CA',
    website: 'https://johndoe.com',
    github: 'johndoe',
    totalScore: 1250,
    problemsSolved: 15,
    averageScore: 83.3,
    rank: 5,
    leaderboardPlaced: true,
};

const mockLeaderboard: GenericLeaderboardEntry[] = [
    {
        rank: 1,
        userId: 'user1',
        username: 'alice',
        totalScore: 2500,
        solvedCount: 25,
        averageScore: 90.5,
        avatar: 'https://example.com/alice.jpg',
    },
    {
        rank: 2,
        userId: 'user2',
        username: 'bob',
        totalScore: 2300,
        solvedCount: 23,
        averageScore: 88.2,
    },
];

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const mockBreadcrumbs = [
    { name: 'Home', url: siteUrl },
    { name: 'Problems', url: `${siteUrl}/problems` },
    { name: 'Image Classification', url: `${siteUrl}/problems/1` },
];

// ============================================================================
// Test Functions
// ============================================================================

function testSchema(name: string, generator: () => object) {
    console.debug(`Testing ${name}...`);

    try {
        const schema = generator();
        const isValid = validateStructuredData(schema);

        if (isValid) {
            console.debug(`✅ ${name} - Valid`);
            console.debug(JSON.stringify(schema, null, 2));
            console.log('');
            return true;
        } else {
            console.log(`❌ ${name} - Invalid`);
            console.log(JSON.stringify(schema, null, 2));
            console.log('');
            return false;
        }
    } catch (error) {
        console.log(`❌ ${name} - Error: ${error}`);
        console.log('');
        return false;
    }
}

// ============================================================================
// Run Tests
// ============================================================================

let passed = 0;
let failed = 0;

console.log('📋 Testing Schema Generators\n');
console.log('='.repeat(80));
console.log('');

// Test Organization Schema
if (testSchema('Organization Schema', () => generateOrganizationSchema('en'))) {
    passed++;
} else {
    failed++;
}

// Test WebSite Schema
if (testSchema('WebSite Schema', () => generateWebSiteSchema('en'))) {
    passed++;
} else {
    failed++;
}

// Test Problem Schema
if (testSchema('Problem Schema', () => generateProblemSchema(mockProblem, 'en'))) {
    passed++;
} else {
    failed++;
}

// Test Person Schema
if (testSchema('Person Schema', () => generatePersonSchema(mockProfile, 'en'))) {
    passed++;
} else {
    failed++;
}

// Test ItemList Schema
if (testSchema('ItemList Schema', () => generateItemListSchema(mockLeaderboard, 'en'))) {
    passed++;
} else {
    failed++;
}

// Test Breadcrumb Schema
if (testSchema('Breadcrumb Schema', () => generateBreadcrumbSchema(mockBreadcrumbs))) {
    passed++;
} else {
    failed++;
}

// ============================================================================
// Test Utility Functions
// ============================================================================

console.log('='.repeat(80));
console.log('');
console.log('🔧 Testing Utility Functions\n');

// Test sanitization
console.log('Testing sanitizeStructuredData...');
const maliciousData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Test<script>alert("xss")</script>',
    description: 'Test javascript:alert("xss")',
};

const sanitized = sanitizeStructuredData(maliciousData);
const sanitizedName = (sanitized as any).name;
const sanitizedDesc = (sanitized as any).description;

if (!sanitizedName.includes('<script>') && !sanitizedDesc.includes('javascript:')) {
    console.log('✅ Sanitization working correctly');
    console.log('Sanitized:', JSON.stringify(sanitized, null, 2));
    passed++;
} else {
    console.log('❌ Sanitization failed');
    failed++;
}
console.log('');

// Test combining schemas
console.log('Testing combineStructuredData...');
const org = generateOrganizationSchema('en');
const website = generateWebSiteSchema('en');
const combined = combineStructuredData(org, website);

if (combined.length === 2) {
    console.log('✅ Schema combination working correctly');
    console.log(`Combined ${combined.length} schemas`);
    passed++;
} else {
    console.log('❌ Schema combination failed');
    failed++;
}
console.log('');

// ============================================================================
// Summary
// ============================================================================

console.log('='.repeat(80));
console.log('');
console.log('📊 Test Summary\n');
console.log(`Total Tests: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('');

if (failed === 0) {
    console.log('🎉 All structured data generators are working correctly!');
    process.exit(0);
} else {
    console.log('⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
}
