#!/usr/bin/env tsx

/**
 * Environment Configuration Verification Script
 *
 * This script verifies that environment variables are properly configured
 * for the SEO and Analytics system.
 *
 * Usage:
 *   npx tsx scripts/verify-environment-config.ts
 */

import { getEnvironment, getEnvironmentConfig } from '../lib/analytics/config';
import { BASE_URL, ENVIRONMENT, SITE_CONFIG } from '../lib/seo/config';

console.debug('🔍 Verifying Environment Configuration...\n');

// ============================================================================
// Environment Detection
// ============================================================================

console.debug('📍 Environment Detection:');
console.debug('─────────────────────────────────────────');

const analyticsEnv = getEnvironment();
const seoEnv = ENVIRONMENT;

console.debug(`Analytics Environment: ${analyticsEnv}`);
console.debug(`SEO Environment: ${seoEnv}`);

if (analyticsEnv !== seoEnv) {
    console.debug('⚠️  WARNING: Environment mismatch between analytics and SEO configs');
} else {
    console.debug('✅ Environment detection is consistent');
}

console.log('');

// ============================================================================
// Environment Variables
// ============================================================================

console.log('🔧 Environment Variables:');
console.log('─────────────────────────────────────────');

const envVars = {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_GTM_CONTAINER_ID: process.env.NEXT_PUBLIC_GTM_CONTAINER_ID,
    NEXT_PUBLIC_GA_MEASUREMENT_ID_STAGING: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID_STAGING,
    NEXT_PUBLIC_GTM_CONTAINER_ID_STAGING: process.env.NEXT_PUBLIC_GTM_CONTAINER_ID_STAGING,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
};

for (const [key, value] of Object.entries(envVars)) {
    if (value) {
        // Mask sensitive values
        const displayValue =
            key.includes('MEASUREMENT_ID') || key.includes('CONTAINER_ID')
                ? value.substring(0, 6) + '...'
                : value;
        console.log(`✅ ${key}: ${displayValue}`);
    } else {
        console.log(`❌ ${key}: Not set`);
    }
}

console.log('');

// ============================================================================
// SEO Configuration
// ============================================================================

console.log('🔍 SEO Configuration:');
console.log('─────────────────────────────────────────');

console.log(`Site Name: ${SITE_CONFIG.name}`);
console.log(`Site URL: ${SITE_CONFIG.url}`);
console.log(`Base URL: ${BASE_URL}`);
console.log(`Default Locale: ${SITE_CONFIG.locale}`);
console.log(`Supported Locales: ${SITE_CONFIG.supportedLocales.join(', ')}`);
console.log(`OG Image: ${SITE_CONFIG.ogImage}`);

// Validate URL format
try {
    new URL(BASE_URL);
    console.log('✅ Base URL is valid');
} catch (error) {
    console.log('❌ Base URL is invalid');
}

console.log('');

// ============================================================================
// Analytics Configuration
// ============================================================================

console.log('📊 Analytics Configuration:');
console.log('─────────────────────────────────────────');

const envConfig = getEnvironmentConfig();

console.log(`Site URL: ${envConfig.siteUrl}`);
console.log(`Analytics Enabled: ${envConfig.analyticsEnabled ? '✅' : '❌'}`);
console.log(`Debug Mode: ${envConfig.debug ? '✅' : '❌'}`);
console.log(`No Index: ${envConfig.noindex ? '✅' : '❌'}`);

if (envConfig.googleAnalytics) {
    console.log(`✅ Google Analytics: ${envConfig.googleAnalytics.substring(0, 6)}...`);
} else {
    console.log('❌ Google Analytics: Not configured');
}

if (envConfig.googleTagManager) {
    console.log(`✅ Google Tag Manager: ${envConfig.googleTagManager.substring(0, 6)}...`);
} else {
    console.log('❌ Google Tag Manager: Not configured');
}

console.log('');

// ============================================================================
// Validation
// ============================================================================

console.log('✅ Validation Results:');
console.log('─────────────────────────────────────────');

const issues: string[] = [];
const warnings: string[] = [];

// Check required variables
if (!process.env.NEXT_PUBLIC_SITE_URL) {
    issues.push('NEXT_PUBLIC_SITE_URL is not set');
}

// Check analytics configuration for production
if (analyticsEnv === 'production') {
    if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && !process.env.NEXT_PUBLIC_GTM_CONTAINER_ID) {
        warnings.push('No analytics provider configured for production');
    }

    if (envConfig.noindex) {
        issues.push('Production environment has noindex enabled');
    }

    if (!envConfig.analyticsEnabled) {
        warnings.push('Analytics is disabled in production');
    }
}

// Check staging configuration
if (analyticsEnv === 'staging') {
    if (
        !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID_STAGING &&
        !process.env.NEXT_PUBLIC_GTM_CONTAINER_ID_STAGING
    ) {
        warnings.push('No staging-specific analytics IDs configured (will use production IDs)');
    }

    if (!envConfig.noindex) {
        warnings.push('Staging environment should have noindex enabled');
    }
}

// Check development configuration
if (analyticsEnv === 'development') {
    if (envConfig.analyticsEnabled) {
        warnings.push('Analytics is enabled in development (usually should be disabled)');
    }
}

// Check URL consistency
if (envConfig.siteUrl !== BASE_URL) {
    warnings.push(`URL mismatch: Analytics (${envConfig.siteUrl}) vs SEO (${BASE_URL})`);
}

// Display results
if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ All checks passed!');
} else {
    if (issues.length > 0) {
        console.log('\n❌ Issues Found:');
        issues.forEach((issue) => console.log(`   • ${issue}`));
    }

    if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        warnings.forEach((warning) => console.log(`   • ${warning}`));
    }
}

console.log('');

// ============================================================================
// Recommendations
// ============================================================================

console.log('💡 Recommendations:');
console.log('─────────────────────────────────────────');

if (analyticsEnv === 'development') {
    console.log('• Copy .env.example to .env.local and configure variables');
    console.log('• Set NEXT_PUBLIC_SITE_URL=http://localhost:3000');
    console.log('• Analytics is disabled by default in development');
}

if (analyticsEnv === 'staging') {
    console.log('• Configure staging-specific analytics IDs to avoid polluting production data');
    console.log('• Ensure noindex is enabled to prevent search engine indexing');
    console.log('• Test analytics tracking before deploying to production');
}

if (analyticsEnv === 'production') {
    console.log('• Ensure NEXT_PUBLIC_GA_MEASUREMENT_ID or NEXT_PUBLIC_GTM_CONTAINER_ID is set');
    console.log('• Verify noindex is disabled to allow search engine indexing');
    console.log('• Monitor analytics data in Google Analytics dashboard');
    console.log('• Submit sitemap to Google Search Console');
}

console.log('');

// ============================================================================
// Next Steps
// ============================================================================

console.log('📋 Next Steps:');
console.log('─────────────────────────────────────────');
console.log('1. Review the configuration above');
console.log('2. Fix any issues or warnings');
console.log('3. Restart your development server');
console.log('4. Test analytics tracking in browser DevTools');
console.log('5. Verify SEO metadata on key pages');
console.log('6. Check /sitemap.xml and /robots.txt');
console.log('');
console.log('📚 Documentation:');
console.log('   • lib/seo/ENVIRONMENT_SETUP.md');
console.log('   • lib/seo/DEPLOYMENT_CHECKLIST.md');
console.log('   • .env.example');
console.log('');

// Exit with error code if there are issues
if (issues.length > 0) {
    process.exit(1);
}
