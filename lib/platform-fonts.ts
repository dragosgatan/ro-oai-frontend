import { Onest, Unbounded } from 'next/font/google';

export const platformSans = Onest({
    subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
    display: 'swap',
    preload: false,
    variable: '--font-home-sans',
});

export const platformDisplay = Unbounded({
    subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
    display: 'swap',
    preload: false,
    variable: '--font-home-display',
});
