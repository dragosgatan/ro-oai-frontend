/**
 * Centralized Design Tokens
 *
 * This file contains all design system values for spacing, typography,
 * animation, colors, and other design primitives. These tokens ensure
 * consistency across the application.
 */

export const designTokens = {
    /**
     * Spacing scale based on 8px base unit
     * Provides consistent spacing throughout the application
     */
    spacing: {
        xs: '0.5rem', // 8px
        sm: '0.75rem', // 12px
        md: '1rem', // 16px
        lg: '1.5rem', // 24px
        xl: '2rem', // 32px
        '2xl': '2.5rem', // 40px
        '3xl': '3rem', // 48px
        '4xl': '4rem', // 64px
        '5xl': '5rem', // 80px
        '6xl': '6rem', // 96px
    },

    /**
     * Typography system
     * Major third scale (1.25 ratio) for harmonious hierarchy
     */
    typography: {
        scale: 1.25, // Major third scale
        fontSizes: {
            xs: '0.75rem', // 12px
            sm: '0.875rem', // 14px
            base: '1rem', // 16px
            lg: '1.125rem', // 18px
            xl: '1.25rem', // 20px
            '2xl': '1.5rem', // 24px
            '3xl': '1.875rem', // 30px
            '4xl': '2.25rem', // 36px
            '5xl': '3rem', // 48px
            '6xl': '3.75rem', // 60px
            '7xl': '4.5rem', // 72px
        },
        // Mobile-optimized font sizes (20-30% reduction)
        mobileFontSizes: {
            xs: '0.75rem', // 12px (no change for small text)
            sm: '0.875rem', // 14px (no change for small text)
            base: '0.9375rem', // 15px (~6% reduction)
            lg: '1rem', // 16px (~11% reduction)
            xl: '1.125rem', // 18px (~10% reduction)
            '2xl': '1.25rem', // 20px (~17% reduction)
            '3xl': '1.5rem', // 24px (~20% reduction)
            '4xl': '1.75rem', // 28px (~22% reduction)
            '5xl': '2rem', // 32px (~33% reduction)
            '6xl': '2.5rem', // 40px (~33% reduction)
            '7xl': '3rem', // 48px (~33% reduction)
        },
        lineHeight: {
            tight: 1.2,
            normal: 1.6,
            relaxed: 1.8,
        },
        fontWeights: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
        },
        letterSpacing: {
            tight: '-0.025em',
            normal: '0',
            wide: '0.025em',
        },
        // Maximum line length for optimal readability
        maxLineLength: '75ch',
    },

    /**
     * Animation system
     * Consistent durations and easing functions
     */
    animation: {
        duration: {
            fast: 150,
            normal: 300,
            slow: 500,
            slower: 800,
        },
        easing: {
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
            easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        },
    },

    /**
     * Border radius scale
     * Consistent rounded corners
     */
    borderRadius: {
        none: '0',
        sm: '0.5rem', // 8px
        md: '0.75rem', // 12px
        lg: '1rem', // 16px
        xl: '1.5rem', // 24px
        '2xl': '2rem', // 32px
        full: '9999px',
    },

    /**
     * Shadow system
     * Elevation levels for depth
     */
    shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    },

    /**
     * Z-index scale
     * Consistent layering
     */
    zIndex: {
        base: 0,
        dropdown: 1000,
        sticky: 1100,
        fixed: 1200,
        modalBackdrop: 1300,
        modal: 1400,
        popover: 1500,
        tooltip: 1600,
    },

    /**
     * Breakpoints for responsive design
     */
    breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
    },

    /**
     * Container max widths
     */
    containers: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
    },

    /**
     * Transition presets
     */
    transitions: {
        fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        normal: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        slow: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        colors: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        theme: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 200ms cubic-bezier(0.4, 0, 0.2, 1), fill 200ms cubic-bezier(0.4, 0, 0.2, 1), stroke 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    },

    /**
     * Color system
     * Semantic color names for consistent usage
     */
    colors: {
        semantic: {
            success: 'hsl(var(--success))',
            warning: 'hsl(var(--warning))',
            error: 'hsl(var(--error))',
            info: 'hsl(var(--info))',
        },
        gradients: {
            primary: 'var(--gradient-primary)',
            accent: 'var(--gradient-accent)',
            success: 'var(--gradient-success)',
            warning: 'var(--gradient-warning)',
            error: 'var(--gradient-error)',
            info: 'var(--gradient-info)',
            gold: 'var(--gradient-gold)',
            silver: 'var(--gradient-silver)',
            bronze: 'var(--gradient-bronze)',
            mesh: 'var(--gradient-mesh)',
        },
        hover: {
            primary: 'hsl(var(--primary-hover))',
            secondary: 'hsl(var(--secondary-hover))',
            accent: 'hsl(var(--accent-hover))',
            success: 'hsl(var(--success-hover))',
            warning: 'hsl(var(--warning-hover))',
            error: 'hsl(var(--error-hover))',
            info: 'hsl(var(--info-hover))',
        },
        focus: {
            primary: 'hsl(var(--primary-focus))',
            accent: 'hsl(var(--accent-focus))',
        },
    },
} as const;

/**
 * Type exports for TypeScript support
 */
export type DesignTokens = typeof designTokens;
export type Spacing = keyof typeof designTokens.spacing;
export type FontSize = keyof typeof designTokens.typography.fontSizes;
export type AnimationDuration = keyof typeof designTokens.animation.duration;
export type AnimationEasing = keyof typeof designTokens.animation.easing;
export type BorderRadius = keyof typeof designTokens.borderRadius;
export type Shadow = keyof typeof designTokens.shadows;
export type ZIndex = keyof typeof designTokens.zIndex;
export type Breakpoint = keyof typeof designTokens.breakpoints;
