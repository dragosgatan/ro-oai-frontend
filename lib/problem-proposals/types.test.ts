import { describe, expect, it } from 'vitest';

import {
    PROBLEM_PROPOSAL_ASSET_VISIBILITY,
    PROBLEM_PROPOSAL_EVALUATION_TYPES,
    problemProposalAssetAccept,
    type ProblemProposalEvaluationType,
} from '@/lib/problem-proposals/types';

describe('problem proposal file picker constraints', () => {
    const evaluationTypes: readonly ProblemProposalEvaluationType[] =
        PROBLEM_PROPOSAL_EVALUATION_TYPES;

    it('exposes every supported proposal evaluation type', () => {
        expect(evaluationTypes).toEqual(['CSV', 'TXT', 'JSON', 'NPY', 'NPZ', 'ZIP']);
    });

    it.each(evaluationTypes)(
        'allows every supported ground-truth representation when submissions use %s',
        (evaluationType) => {
            expect(problemProposalAssetAccept('GROUND_TRUTH', evaluationType)).toBe(
                '.csv,.txt,.json,.zip',
            );
        },
    );

    it.each(evaluationTypes)(
        'keeps sample submissions constrained to the selected %s format',
        (evaluationType) => {
            expect(problemProposalAssetAccept('SAMPLE_SUBMISSION', evaluationType)).toBe(
                `.${evaluationType.toLocaleLowerCase('en-US')}`,
            );
        },
    );

    it('offers only evaluator-supported participant dataset formats', () => {
        expect(problemProposalAssetAccept('PUBLIC_DATASET', 'CSV')).toBe('.zip,.csv,.txt,.json');
    });

    it('keeps validation submissions private instead of promising publication', () => {
        expect(PROBLEM_PROPOSAL_ASSET_VISIBILITY.SAMPLE_SUBMISSION).toBe('REVIEWERS_ONLY');
        expect(PROBLEM_PROPOSAL_ASSET_VISIBILITY.REFERENCE_SUBMISSION).toBe('REVIEWERS_ONLY');
    });
});
