/**
 * Webpack Bundle Analyzer Configuration
 * Run with: ANALYZE=true npm run build
 *
 * This helps identify large dependencies and optimization opportunities
 */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
    openAnalyzer: true,
});

module.exports = withBundleAnalyzer;
