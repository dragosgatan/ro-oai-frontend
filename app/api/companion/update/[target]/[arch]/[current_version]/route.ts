import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Update Check API endpoint for MLCompete Companion app
 *
 * This endpoint checks if a newer version is available.
 *
 * URL format: /api/companion/update/{target}/{arch}/{current_version}
 * Example: /api/companion/update/darwin/aarch64/1.0.0
 *
 * Returns:
 * - 204 No Content: No update available
 * - 200 OK with JSON: Update available with download URL
 */

interface VersionManifest {
    version: string;
    pub_date: string;
    downloads: {
        windows: string;
        macos: string;
        linux: string;
    };
}

// Read the latest version from the manifest file
function getLatestManifest(): VersionManifest | null {
    try {
        const manifestPath = path.join(process.cwd(), 'public', 'downloads', 'latest.json');
        if (fs.existsSync(manifestPath)) {
            const content = fs.readFileSync(manifestPath, 'utf-8');
            return JSON.parse(content);
        }
    } catch (error) {
        console.error('Failed to read version manifest:', error);
    }
    return null;
}

// Compare semantic versions
function isNewerVersion(current: string, latest: string): boolean {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const currentPart = currentParts[i] || 0;
        const latestPart = latestParts[i] || 0;

        if (latestPart > currentPart) return true;
        if (latestPart < currentPart) return false;
    }

    return false;
}

// Base URL for downloads
const BASE_URL =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Get download URL based on target platform
function getDownloadUrl(target: string, manifest: VersionManifest): string {
    const normalizedTarget = target.toLowerCase();
    let relativePath: string;

    if (normalizedTarget.includes('darwin') || normalizedTarget.includes('macos')) {
        relativePath = manifest.downloads.macos;
    } else if (normalizedTarget.includes('linux')) {
        relativePath = manifest.downloads.linux;
    } else if (normalizedTarget.includes('windows')) {
        relativePath = manifest.downloads.windows;
    } else {
        // Default to windows
        relativePath = manifest.downloads.windows;
    }

    // Return full URL
    return `${BASE_URL}${relativePath}`;
}

export async function GET(
    _request: NextRequest,
    {
        params,
    }: {
        params: Promise<{ target: string; arch: string; current_version: string }>;
    },
) {
    const { target, arch, current_version } = await params;

    console.debug(
        `Update check: target=${target}, arch=${arch}, current_version=${current_version}`,
    );

    // Get the latest manifest
    const manifest = getLatestManifest();

    if (!manifest) {
        // No manifest available - return 204 No Content (no update)
        return new NextResponse(null, { status: 204 });
    }

    // Check if there's a newer version
    if (!isNewerVersion(current_version, manifest.version)) {
        // Current version is up to date - return 204 No Content
        return new NextResponse(null, { status: 204 });
    }

    // Get the platform-specific download URL
    const downloadUrl = getDownloadUrl(target, manifest);

    // Return the update information
    const response = {
        version: manifest.version,
        pub_date: manifest.pub_date,
        download_url: downloadUrl,
    };

    return NextResponse.json(response);
}
