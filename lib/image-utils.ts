/**
 * Image optimization utilities
 * Provides helpers for image loading, blur placeholders, and optimization
 */

/**
 * Generate a simple blur data URL for image placeholders
 * This creates a tiny 1x1 pixel blur placeholder for better perceived performance
 * @param color - Optional color in hex format (default: gray)
 * @returns Base64 encoded blur data URL
 */
export function generateBlurDataURL(color: string = '#cccccc'): string {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Create a 1x1 pixel SVG with the color
    const svg = `
    <svg width="1" height="1" xmlns="http://www.w3.org/2000/svg">
      <rect width="1" height="1" fill="rgb(${r},${g},${b})" />
    </svg>
  `;

    // Convert to base64
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Default blur placeholder for avatars (neutral gray)
 */
export const AVATAR_BLUR_PLACEHOLDER = generateBlurDataURL('#e5e7eb');

/**
 * Default blur placeholder for images (light gray)
 */
export const IMAGE_BLUR_PLACEHOLDER = generateBlurDataURL('#f3f4f6');

/**
 * Get optimized image sizes for responsive images
 * @param type - Type of image (avatar, card, hero, etc.)
 * @returns Sizes string for Next.js Image component
 */
export function getImageSizes(type: 'avatar' | 'card' | 'hero' | 'thumbnail' | 'full'): string {
    switch (type) {
        case 'avatar':
            return '(max-width: 640px) 48px, (max-width: 768px) 64px, 80px';
        case 'thumbnail':
            return '(max-width: 640px) 100px, (max-width: 768px) 150px, 200px';
        case 'card':
            return '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw';
        case 'hero':
            return '100vw';
        case 'full':
            return '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px';
        default:
            return '100vw';
    }
}

/**
 * Check if an image URL is external
 * @param url - Image URL
 * @returns True if external, false if internal
 */
export function isExternalImage(url: string): boolean {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Get optimized image props for Next.js Image component
 * @param src - Image source URL
 * @param type - Type of image
 * @param priority - Whether to prioritize loading
 * @returns Props object for Next.js Image
 */
export function getOptimizedImageProps(
    src: string,
    type: 'avatar' | 'card' | 'hero' | 'thumbnail' | 'full' = 'card',
    priority: boolean = false,
) {
    return {
        src,
        sizes: getImageSizes(type),
        priority,
        loading: priority ? ('eager' as const) : ('lazy' as const),
        placeholder: 'blur' as const,
        blurDataURL: type === 'avatar' ? AVATAR_BLUR_PLACEHOLDER : IMAGE_BLUR_PLACEHOLDER,
    };
}

/**
 * Preload critical images for better performance
 * @param urls - Array of image URLs to preload
 */
export function preloadImages(urls: string[]): void {
    if (typeof window === 'undefined') return;

    urls.forEach((url) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
    });
}

/**
 * Lazy load images below the fold
 * Uses Intersection Observer for efficient lazy loading
 * @param element - Image element to lazy load
 * @param src - Image source URL
 * @param callback - Optional callback when image loads
 */
export function lazyLoadImage(
    element: HTMLImageElement,
    src: string,
    callback?: () => void,
): () => void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        // Fallback for browsers without IntersectionObserver
        element.src = src;
        if (callback) callback();
        return () => {};
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    element.src = src;
                    observer.unobserve(element);
                    if (callback) callback();
                }
            });
        },
        {
            rootMargin: '50px', // Start loading 50px before entering viewport
        },
    );

    observer.observe(element);

    // Return cleanup function
    return () => {
        observer.unobserve(element);
        observer.disconnect();
    };
}

/**
 * Convert image to WebP format (client-side)
 * Note: This requires canvas support and may not work for all images
 * @param imageUrl - Original image URL
 * @param quality - WebP quality (0-1)
 * @returns Promise with WebP data URL
 */
export async function convertToWebP(imageUrl: string, quality: number = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0);

            // Convert to WebP
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Could not convert to WebP'));
                        return;
                    }

                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve(reader.result as string);
                    };
                    reader.readAsDataURL(blob);
                },
                'image/webp',
                quality,
            );
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        img.src = imageUrl;
    });
}
