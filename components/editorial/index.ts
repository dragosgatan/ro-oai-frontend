/**
 * Editorial components for displaying competition editorials.
 *
 * These centralized exports give competition editorials one stable public API.
 */

export { EditorialAuthorCard } from './editorial-author-card';
export { formatRankBadge } from './editorial-author-utils';
export { getProfileUrl } from '@/lib/profile-utils';
export { EditorialContent, extractHeadings, generateSlug } from './editorial-content';
export type { TocHeading } from './editorial-content';
export { EditorialContributionsSection } from './editorial-contributions-section';
export { EditorialTab } from './editorial-tab';
export { FeaturedSolutionCard } from './featured-solution-card';
export { FeaturedSolutionsSection } from './featured-solutions-section';
export {
    sortFeaturedSolutionsByRank,
    shouldShowFeaturedSolutions,
} from './featured-solutions-utils';
export { SourceCodeModal } from './source-code-modal';
