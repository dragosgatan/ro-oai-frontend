import type { Config } from 'tailwindcss';
import { designTokens } from './lib/design-tokens';

// all in fixtures is set to tailwind v3 as interims solutions

const config: Config = {
    darkMode: ['class'],
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        '*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))',
                },
                sidebar: {
                    DEFAULT: 'hsl(var(--sidebar-background))',
                    foreground: 'hsl(var(--sidebar-foreground))',
                    primary: 'hsl(var(--sidebar-primary))',
                    'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
                    accent: 'hsl(var(--sidebar-accent))',
                    'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
                    border: 'hsl(var(--sidebar-border))',
                    ring: 'hsl(var(--sidebar-ring))',
                },
                // Semantic colors from design tokens
                success: {
                    DEFAULT: 'hsl(var(--success))',
                    foreground: 'hsl(var(--success-foreground))',
                    hover: 'hsl(var(--success-hover))',
                },
                warning: {
                    DEFAULT: 'hsl(var(--warning))',
                    foreground: 'hsl(var(--warning-foreground))',
                    hover: 'hsl(var(--warning-hover))',
                },
                error: {
                    DEFAULT: 'hsl(var(--error))',
                    foreground: 'hsl(var(--error-foreground))',
                    hover: 'hsl(var(--error-hover))',
                },
                info: {
                    DEFAULT: 'hsl(var(--info))',
                    foreground: 'hsl(var(--info-foreground))',
                    hover: 'hsl(var(--info-hover))',
                },
                // Hover states for all colors
                'primary-hover': 'hsl(var(--primary-hover))',
                'secondary-hover': 'hsl(var(--secondary-hover))',
                'accent-hover': 'hsl(var(--accent-hover))',
                // Focus states
                'primary-focus': 'hsl(var(--primary-focus))',
                'accent-focus': 'hsl(var(--accent-focus))',
            },
            backgroundImage: {
                'gradient-primary': 'var(--gradient-primary)',
                'gradient-accent': 'var(--gradient-accent)',
                'gradient-success': 'var(--gradient-success)',
                'gradient-warning': 'var(--gradient-warning)',
                'gradient-error': 'var(--gradient-error)',
                'gradient-info': 'var(--gradient-info)',
                'gradient-gold': 'var(--gradient-gold)',
                'gradient-silver': 'var(--gradient-silver)',
                'gradient-bronze': 'var(--gradient-bronze)',
                'gradient-mesh': 'var(--gradient-mesh)',
            },
            spacing: {
                ...designTokens.spacing,
            },
            fontSize: {
                ...designTokens.typography.fontSizes,
                // Responsive font sizes with mobile-first approach
                'display-lg': ['3.75rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
                'display-md': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
                'display-sm': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
                // Mobile-optimized sizes (20-30% smaller)
                'display-lg-mobile': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
                'display-md-mobile': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
                'display-sm-mobile': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
            },
            lineHeight: {
                tight: designTokens.typography.lineHeight.tight.toString(),
                normal: designTokens.typography.lineHeight.normal.toString(),
                relaxed: designTokens.typography.lineHeight.relaxed.toString(),
            },
            fontWeight: {
                normal: '400',
                medium: '500',
                semibold: '600',
                bold: '700',
            },
            letterSpacing: {
                ...designTokens.typography.letterSpacing,
            },
            borderRadius: {
                none: '0',
                xs: designTokens.borderRadius.sm,
                sm: 'calc(var(--radius) - 4px)',
                md: 'calc(var(--radius) - 2px)',
                lg: 'var(--radius)',
                xl: designTokens.borderRadius.xl,
                '2xl': designTokens.borderRadius['2xl'],
                full: designTokens.borderRadius.full,
            },
            boxShadow: {
                ...designTokens.shadows,
            },
            zIndex: {
                base: '0',
                dropdown: '1000',
                sticky: '1100',
                fixed: '1200',
                modalBackdrop: '1300',
                modal: '1400',
                popover: '1500',
                tooltip: '1600',
            },
            maxWidth: {
                ...designTokens.containers,
            },
            transitionDuration: {
                fast: `${designTokens.animation.duration.fast}ms`,
                normal: `${designTokens.animation.duration.normal}ms`,
                slow: `${designTokens.animation.duration.slow}ms`,
                slower: `${designTokens.animation.duration.slower}ms`,
            },
            transitionTimingFunction: {
                'ease-in-out': designTokens.animation.easing.easeInOut,
                'ease-out': designTokens.animation.easing.easeOut,
                'ease-in': designTokens.animation.easing.easeIn,
                spring: designTokens.animation.easing.spring,
                bounce: designTokens.animation.easing.bounce,
            },
            keyframes: {
                'accordion-down': {
                    from: {
                        height: '0',
                    },
                    to: {
                        height: 'var(--radix-accordion-content-height)',
                    },
                },
                'accordion-up': {
                    from: {
                        height: 'var(--radix-accordion-content-height)',
                    },
                    to: {
                        height: '0',
                    },
                },
                'fade-in': {
                    from: {
                        opacity: '0',
                    },
                    to: {
                        opacity: '1',
                    },
                },
                'fade-out': {
                    from: {
                        opacity: '1',
                    },
                    to: {
                        opacity: '0',
                    },
                },
                'slide-up': {
                    from: {
                        transform: 'translateY(20px)',
                        opacity: '0',
                    },
                    to: {
                        transform: 'translateY(0)',
                        opacity: '1',
                    },
                },
                'slide-down': {
                    from: {
                        transform: 'translateY(-20px)',
                        opacity: '0',
                    },
                    to: {
                        transform: 'translateY(0)',
                        opacity: '1',
                    },
                },
                'slide-left': {
                    from: {
                        transform: 'translateX(20px)',
                        opacity: '0',
                    },
                    to: {
                        transform: 'translateX(0)',
                        opacity: '1',
                    },
                },
                'slide-right': {
                    from: {
                        transform: 'translateX(-20px)',
                        opacity: '0',
                    },
                    to: {
                        transform: 'translateX(0)',
                        opacity: '1',
                    },
                },
                'scale-in': {
                    from: {
                        transform: 'scale(0.95)',
                        opacity: '0',
                    },
                    to: {
                        transform: 'scale(1)',
                        opacity: '1',
                    },
                },
                'scale-out': {
                    from: {
                        transform: 'scale(1)',
                        opacity: '1',
                    },
                    to: {
                        transform: 'scale(0.95)',
                        opacity: '0',
                    },
                },
                shimmer: {
                    '0%': {
                        backgroundPosition: '-1000px 0',
                    },
                    '100%': {
                        backgroundPosition: '1000px 0',
                    },
                },
                pulse: {
                    '0%, 100%': {
                        opacity: '1',
                    },
                    '50%': {
                        opacity: '0.5',
                    },
                },
                bounce: {
                    '0%, 100%': {
                        transform: 'translateY(-25%)',
                        animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
                    },
                    '50%': {
                        transform: 'translateY(0)',
                        animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
                    },
                },
                'gradient-x': {
                    '0%, 100%': {
                        backgroundPosition: '0% 50%',
                    },
                    '50%': {
                        backgroundPosition: '100% 50%',
                    },
                },
                'glow-pulse': {
                    '0%, 100%': {
                        opacity: '0.6',
                        transform: 'scale(1)',
                    },
                    '50%': {
                        opacity: '1',
                        transform: 'scale(1.02)',
                    },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-in': 'fade-in 0.3s ease-out',
                'fade-out': 'fade-out 0.3s ease-out',
                'slide-up': 'slide-up 0.4s ease-out',
                'slide-down': 'slide-down 0.4s ease-out',
                'slide-left': 'slide-left 0.4s ease-out',
                'slide-right': 'slide-right 0.4s ease-out',
                'scale-in': 'scale-in 0.3s ease-out',
                'scale-out': 'scale-out 0.3s ease-out',
                shimmer: 'shimmer 2s linear infinite',
                pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                bounce: 'bounce 1s infinite',
                'gradient-x': 'gradient-x 3s ease infinite',
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
export default config;
