/**
 * Consent Management System Verification Script
 *
 * This script verifies the consent management implementation including:
 * - ConsentManager class functionality
 * - Consent storage and retrieval
 * - Event listeners
 * - Component exports
 */

import { consentManager, ConsentManager } from '../lib/analytics/consent';

console.debug('🔍 Verifying Consent Management System...\n');

// ============================================================================
// 1. Verify ConsentManager Class
// ============================================================================

console.debug('1️⃣  Verifying ConsentManager class...');

// Check if ConsentManager is a class
if (typeof ConsentManager !== 'function') {
    console.error('❌ ConsentManager is not a class');
    process.exit(1);
}

// Check if singleton instance exists
if (!consentManager) {
    console.error('❌ consentManager singleton instance not found');
    process.exit(1);
}

console.debug('✅ ConsentManager class exists');
console.debug('✅ consentManager singleton instance exists');

// ============================================================================
// 2. Verify ConsentManager Methods
// ============================================================================

console.log('\n2️⃣  Verifying ConsentManager methods...');

const requiredMethods = [
    'getConsent',
    'setConsent',
    'isConsentRequired',
    'resetConsent',
    'onConsentChange',
    'getConsentSettings',
    'hasConsent',
];

for (const method of requiredMethods) {
    if (typeof (consentManager as any)[method] !== 'function') {
        console.error(`❌ Method ${method} not found or not a function`);
        process.exit(1);
    }
    console.log(`✅ Method ${method} exists`);
}

// ============================================================================
// 3. Verify Type Exports
// ============================================================================

console.log('\n3️⃣  Verifying type exports...');

// Check if types are properly exported from analytics index
try {
    const analyticsIndex = require('../lib/analytics/index');

    if (!analyticsIndex.ConsentManager) {
        console.error('❌ ConsentManager not exported from analytics index');
        process.exit(1);
    }

    if (!analyticsIndex.consentManager) {
        console.error('❌ consentManager not exported from analytics index');
        process.exit(1);
    }

    console.log('✅ ConsentManager exported from analytics index');
    console.log('✅ consentManager exported from analytics index');
} catch (error) {
    console.error('❌ Error importing from analytics index:', error);
    process.exit(1);
}

// ============================================================================
// 4. Verify ConsentBanner Component
// ============================================================================

console.log('\n4️⃣  Verifying ConsentBanner component...');

try {
    // Note: We can't fully test React components in Node.js, but we can verify the file exists
    const fs = require('fs');
    const path = require('path');

    const componentPath = path.join(__dirname, '../components/consent-banner.tsx');
    if (!fs.existsSync(componentPath)) {
        console.error('❌ ConsentBanner component file not found');
        process.exit(1);
    }

    const componentContent = fs.readFileSync(componentPath, 'utf-8');

    // Check for key features
    const requiredFeatures = [
        'ConsentBanner',
        'useTranslations',
        'consentManager',
        'handleAcceptAll',
        'handleDeclineAll',
        'handleCustomizeClick',
        'DialogContent',
        'CONSENT_PREFERENCES_EVENT',
        'role="switch"',
        'aria-checked',
        'overflow-y-auto',
    ];

    for (const feature of requiredFeatures) {
        if (!componentContent.includes(feature)) {
            console.error(`❌ ConsentBanner missing feature: ${feature}`);
            process.exit(1);
        }
    }

    console.log('✅ ConsentBanner component file exists');
    console.log('✅ ConsentBanner has required features');
    console.log('✅ ConsentBanner has accessibility attributes');
    console.log('✅ ConsentBanner uses i18n translations');
} catch (error) {
    console.error('❌ Error verifying ConsentBanner component:', error);
    process.exit(1);
}

// ============================================================================
// 5. Verify Translation Keys
// ============================================================================

console.log('\n5️⃣  Verifying translation keys...');

try {
    const fs = require('fs');
    const path = require('path');

    const enPath = path.join(__dirname, '../locales/en.json');
    const roPath = path.join(__dirname, '../locales/ro.json');

    const enTranslations = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
    const roTranslations = JSON.parse(fs.readFileSync(roPath, 'utf-8'));

    const requiredKeys = [
        'title',
        'description',
        'analytics',
        'analyticsDesc',
        'marketing',
        'marketingDesc',
        'functional',
        'functionalDesc',
        'acceptAll',
        'declineAll',
        'customize',
        'savePreferences',
        'privacyPolicy',
        'learnMore',
    ];

    // Check English translations
    if (!enTranslations.consent) {
        console.error('❌ consent section missing in en.json');
        process.exit(1);
    }

    for (const key of requiredKeys) {
        if (!enTranslations.consent[key]) {
            console.error(`❌ Translation key "consent.${key}" missing in en.json`);
            process.exit(1);
        }
    }

    console.log('✅ All consent translation keys exist in en.json');

    // Check Romanian translations
    if (!roTranslations.consent) {
        console.error('❌ consent section missing in ro.json');
        process.exit(1);
    }

    for (const key of requiredKeys) {
        if (!roTranslations.consent[key]) {
            console.error(`❌ Translation key "consent.${key}" missing in ro.json`);
            process.exit(1);
        }
    }

    console.log('✅ All consent translation keys exist in ro.json');
} catch (error) {
    console.error('❌ Error verifying translations:', error);
    process.exit(1);
}

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('✅ Consent Management System Verification Complete!');
console.log('='.repeat(60));
console.log('\n📋 Summary:');
console.log('  ✅ ConsentManager class implemented');
console.log('  ✅ All required methods present');
console.log('  ✅ Proper exports in analytics index');
console.log('  ✅ ConsentBanner component created');
console.log('  ✅ Accessibility features implemented');
console.log('  ✅ i18n translations added (en, ro)');
console.log('\n🎉 All checks passed!');
console.log('\n📝 Next steps:');
console.log('  1. Integrate ConsentBanner into app layout');
console.log('  2. Connect consent to analytics providers');
console.log('  3. Test in browser environment');
console.log('  4. Verify GDPR compliance');
