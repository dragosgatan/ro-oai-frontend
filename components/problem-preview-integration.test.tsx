import '@testing-library/jest-dom/vitest';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HeroSection, type HeroSpotlight } from '@/components/hero-section';
import { HomeProblemsSection, type HomeProblemItem } from '@/components/home-problems-section';
import type { ProblemPreviewImage } from '@/lib/types';

vi.mock('@/i18n/routing', () => ({
    Link: ({
        href,
        children,
        ...props
    }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

const previewImage: ProblemPreviewImage = {
    url: 'https://storage.platform.test/problem-preview.webp',
    source: 'UPLOADED',
    automatic: false,
    contentType: 'image/webp',
    width: 1600,
    height: 900,
};

const spotlight: HeroSpotlight = {
    problemId: 290,
    href: '/problems/290',
    overline: 'Problem #290',
    title: 'GridForget',
    description: 'A stable environment-unlearning challenge.',
    status: 'Hard',
    metaLabel: 'Author',
    metaValue: 'Pixel Testerson',
    tone: 'hard',
    previewImage,
};

const featuredProblem: HomeProblemItem = {
    id: 288,
    title: 'ForgetMeNot',
    description: 'Stable sentiment unlearning.',
    difficulty: 'hard',
    difficultyLabel: 'Hard',
    author: 'Pixel Testerson',
    score: null,
    previewImage,
};

describe('problem preview integration', () => {
    it('uses the problem preview as the eager homepage spotlight artwork', () => {
        render(
            <HeroSection
                ariaLabel="Homepage introduction"
                eyebrow="Machine learning platform"
                title="MLCompete"
                subtitle="Learn through practice"
                primaryLabel="Explore"
                primaryHref="/problems"
                secondaryLabel={null}
                secondaryHref={null}
                locale="en"
                totalProblems={99}
                totalCompetitions={15}
                problemsLabel="Problems"
                competitionsLabel="Competitions"
                spotlight={spotlight}
            />,
        );

        const image = screen.getByTestId('problem-preview-image');
        expect(image).toHaveAttribute('src', previewImage.url);
        expect(image).toHaveAttribute('loading', 'eager');
        expect(image).toHaveAttribute('fetchpriority', 'high');
    });

    it('uses the problem preview lazily in the below-fold featured problem', () => {
        render(
            <HomeProblemsSection
                locale="en"
                problems={[featuredProblem]}
                title="Latest problems"
                subtitle="Choose a challenge"
                viewAllLabel="View all"
                authorLabel="Author"
                scoreLabel="Your best"
                problemLabel="Problem"
                unavailable={false}
                errorMessage="Could not load problems"
            />,
        );

        const image = screen.getByTestId('problem-preview-image');
        expect(image).toHaveAttribute('src', previewImage.url);
        expect(image).toHaveAttribute('loading', 'lazy');
    });
});
