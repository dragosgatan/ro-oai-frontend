import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    fetchApi: vi.fn(),
    fetchPublicApi: vi.fn(),
}));

vi.mock('@/lib/api', () => ({ fetchApi: mocks.fetchApi }));
vi.mock('@/lib/public-api', () => ({ fetchPublicApi: mocks.fetchPublicApi }));

import {
    createCompetitionHostingRequest,
    getCompetitionOrganizerDataConsent,
    getCompetitionInvitation,
    getHostedCompetitionInvitations,
    getHostedCompetitionParticipants,
    getHostedCompetitionProblemProposals,
    getHostingRequestProblemProposals,
    getMyHostedCompetitions,
    inviteHostedCompetitionParticipant,
    normalizeCompetitionParticipantInvitation,
    normalizeCompetitionHostingRequest,
    normalizeHostedCompetitionParticipant,
    normalizeHostedCompetition,
    redeemStoredCompetitionInvitation,
    resendHostedCompetitionInvitation,
    searchCompetitionInvitees,
    submitCompetitionHostingRequest,
    updateCompetitionOrganizerDataConsent,
} from '@/lib/competition-hosting/api';
import type {
    CompetitionHostingRequestInput,
    CompetitionParticipantInvitation,
} from '@/lib/competition-hosting/types';

const input: CompetitionHostingRequestInput = {
    name: 'Community AI Cup',
    shortDescription: 'A complete practical machine learning competition for students.',
    description:
        'Participants build a model from a supplied dataset and submit reproducible predictions to the evaluator.',
    rules: 'Use only the supplied data and respect the submission limit.',
    startTime: '2026-08-01T09:00:00Z',
    endTime: '2026-08-01T13:00:00Z',
    requestMode: 'WITH_PROBLEMS',
    competitionType: 'CLASSIC',
    access: 'PRIVATE',
    allowPublicQuestions: false,
    commentsEnabled: true,
    selectionLimit: 2,
};

function requestDetail(overrides: Record<string, unknown> = {}) {
    return {
        id: 11,
        ...input,
        isPrivate: true,
        access: undefined,
        status: 'DRAFT',
        reviewerNote: null,
        approvedCompetitionId: null,
        problemProposalCount: 0,
        createdAt: '2026-07-21T09:00:00Z',
        updatedAt: '2026-07-21T09:00:00Z',
        version: 3,
        permissions: {
            canEdit: true,
            canSubmit: true,
            canCancel: false,
            canResubmit: false,
            canDelete: true,
            canAddProblems: true,
        },
        ...overrides,
    };
}

describe('competition hosting API adapter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.test';
    });

    afterEach(() => vi.unstubAllGlobals());

    it('normalizes reviewer notes and trusts backend request permissions', () => {
        expect(
            normalizeCompetitionHostingRequest(
                requestDetail({
                    status: 'CHANGES_REQUESTED',
                    reviewerNote: 'Clarify who may participate.',
                    permissions: {
                        canEdit: false,
                        canSubmit: false,
                        canCancel: true,
                        canResubmit: true,
                        canDelete: false,
                        canAddProblems: false,
                    },
                }),
            ),
        ).toMatchObject({
            id: 11,
            access: 'PRIVATE',
            reviewerMessage: 'Clarify who may participate.',
            permissions: {
                canEdit: false,
                canSubmit: false,
                canCancelReview: true,
                canResubmit: true,
                canDeleteDraft: false,
                canAddProblems: false,
            },
        });
    });

    it('normalizes hosted competition permissions without deriving organizer access', () => {
        expect(
            normalizeHostedCompetition({
                id: 42,
                name: 'Hosted cup',
                startTime: '2026-08-01T09:00:00Z',
                endTime: '2026-08-01T13:00:00Z',
                isPrivate: false,
                version: 7,
                permissions: {
                    approvedHosting: true,
                    canEditContent: false,
                    canEditSchedule: true,
                    canManageParticipants: false,
                    canInviteParticipants: true,
                    canSubmitProblems: false,
                },
            }),
        ).toMatchObject({
            id: 42,
            access: 'PUBLIC',
            version: 7,
            permissions: {
                approvedHosting: true,
                canEditContent: false,
                canEditSchedule: true,
                canManageParticipants: false,
                canInviteParticipants: true,
                canSubmitProblems: false,
            },
        });
    });

    it('serializes the backend upsert contract and converts access to isPrivate', async () => {
        mocks.fetchApi.mockResolvedValue(Response.json(requestDetail()));

        await createCompetitionHostingRequest(input);

        const [url, init] = mocks.fetchApi.mock.calls[0];
        expect(url.toString()).toBe('https://api.example.test/me/competition-hosting-requests');
        expect(init).toMatchObject({ method: 'POST' });
        expect(JSON.parse(init.body)).toEqual({
            name: input.name,
            shortDescription: input.shortDescription,
            description: input.description,
            rules: input.rules,
            startTime: input.startTime,
            endTime: input.endTime,
            competitionType: input.competitionType,
            isPrivate: true,
            allowPublicQuestions: input.allowPublicQuestions,
            commentsEnabled: input.commentsEnabled,
            selectionLimit: input.selectionLimit,
            requestMode: input.requestMode,
        });
    });

    it('submits with the current optimistic version', async () => {
        const request = normalizeCompetitionHostingRequest(requestDetail());
        mocks.fetchApi.mockResolvedValue(Response.json(requestDetail({ status: 'PENDING' })));

        await submitCompetitionHostingRequest(request);

        const [url, init] = mocks.fetchApi.mock.calls[0];
        expect(url.toString()).toBe(
            'https://api.example.test/me/competition-hosting-requests/11/submit',
        );
        expect(init).toMatchObject({ method: 'POST', body: JSON.stringify({ version: 3 }) });
    });

    it('uses the organizer-scoped safe user search contract', async () => {
        mocks.fetchApi.mockResolvedValue(
            Response.json({
                items: [
                    {
                        userId: 'user-1',
                        username: 'nova-testperson',
                        displayName: 'Nova Testperson',
                    },
                ],
            }),
        );

        await expect(searchCompetitionInvitees(42, ' ana ')).resolves.toEqual([
            {
                userId: 'user-1',
                username: 'nova-testperson',
                displayName: 'Nova Testperson',
                avatar: null,
            },
        ]);
        const url = mocks.fetchApi.mock.calls[0][0] as URL;
        expect(url.pathname).toBe('/me/hosted-competitions/42/users/search');
        expect(url.searchParams.get('query')).toBe('ana');
        expect(url.searchParams.get('size')).toBe('8');
    });

    it('preserves hosted competition page metadata and sends bounded paging parameters', async () => {
        mocks.fetchApi.mockResolvedValue(
            Response.json({
                items: [
                    {
                        id: 42,
                        name: 'Hosted cup',
                        startTime: '2026-08-01T09:00:00Z',
                        endTime: '2026-08-01T13:00:00Z',
                    },
                ],
                page: 2,
                size: 20,
                totalElements: 55,
                totalPages: 3,
            }),
        );

        await expect(getMyHostedCompetitions({ page: 2, size: 20 })).resolves.toMatchObject({
            content: [{ id: 42, name: 'Hosted cup' }],
            page: { number: 2, size: 20, totalElements: 55, totalPages: 3 },
        });
        const url = mocks.fetchApi.mock.calls[0][0] as URL;
        expect(url.pathname).toBe('/me/hosted-competitions');
        expect(url.searchParams.get('page')).toBe('2');
        expect(url.searchParams.get('size')).toBe('20');
    });

    it('pages participants and invitation history independently', async () => {
        mocks.fetchApi
            .mockResolvedValueOnce(
                Response.json({
                    items: [
                        {
                            id: 7,
                            username: 'nova-testperson',
                            displayName: 'Nova Testperson',
                        },
                    ],
                    page: 1,
                    size: 20,
                    totalElements: 21,
                    totalPages: 2,
                }),
            )
            .mockResolvedValueOnce(
                Response.json({
                    items: [{ id: 'invite-1', email: 'ana@example.org', status: 'ACCEPTED' }],
                    page: 2,
                    size: 10,
                    totalElements: 25,
                    totalPages: 3,
                }),
            );

        await expect(
            getHostedCompetitionParticipants(42, { page: 1, size: 20 }),
        ).resolves.toMatchObject({
            content: [{ id: 7, displayName: 'Nova Testperson' }],
            page: { number: 1, totalElements: 21, totalPages: 2 },
        });
        await expect(
            getHostedCompetitionInvitations(42, { page: 2, size: 10 }),
        ).resolves.toMatchObject({
            content: [{ id: 'invite-1', status: 'ACCEPTED' }],
            page: { number: 2, totalElements: 25, totalPages: 3 },
        });
        const participantUrl = mocks.fetchApi.mock.calls[0][0] as URL;
        const invitationUrl = mocks.fetchApi.mock.calls[1][0] as URL;
        expect(participantUrl.searchParams.get('page')).toBe('1');
        expect(participantUrl.searchParams.get('size')).toBe('20');
        expect(invitationUrl.searchParams.get('page')).toBe('2');
        expect(invitationUrl.searchParams.get('size')).toBe('10');
    });

    it('keeps organizer-only personal fields unavailable without active consent', () => {
        expect(
            normalizeHostedCompetitionParticipant({
                id: 7,
                username: 'ana',
                displayName: 'Ana P.',
                sharePersonalDataWithOrganizer: false,
                firstName: 'Ana',
                lastName: 'Pop',
                email: 'ana@example.org',
                grade: '11',
                institution: 'Colegiul Exemplu',
            }),
        ).toMatchObject({
            displayName: 'Ana P.',
            sharePersonalDataWithOrganizer: false,
            firstName: null,
            lastName: null,
            email: null,
            grade: null,
            institution: null,
        });
    });

    it('normalizes explicitly shared organizer participant details', () => {
        expect(
            normalizeHostedCompetitionParticipant({
                id: 7,
                username: 'ana',
                displayName: 'Ana P.',
                sharePersonalDataWithOrganizer: true,
                firstName: 'Ana',
                lastName: 'Pop',
                email: 'ana@example.org',
                grade: '11',
                institutionName: 'Colegiul Exemplu',
                consentNoticeVersion: '2026-07-22',
            }),
        ).toMatchObject({
            sharePersonalDataWithOrganizer: true,
            firstName: 'Ana',
            lastName: 'Pop',
            email: 'ana@example.org',
            grade: '11',
            institution: 'Colegiul Exemplu',
            consentNoticeVersion: '2026-07-22',
        });
    });

    it('loads every backend page of scoped competition and request problem proposals', async () => {
        const firstPage = {
            items: [{ id: 101, title: 'First problem', status: 'DRAFT' }],
            page: 0,
            size: 50,
            totalElements: 2,
            totalPages: 2,
        };
        const secondPage = {
            items: [{ id: 102, title: 'Second problem', status: 'PENDING' }],
            page: 1,
            size: 50,
            totalElements: 2,
            totalPages: 2,
        };
        mocks.fetchApi
            .mockResolvedValueOnce(Response.json(firstPage))
            .mockResolvedValueOnce(Response.json(secondPage))
            .mockResolvedValueOnce(Response.json(firstPage))
            .mockResolvedValueOnce(Response.json(secondPage));

        await expect(getHostedCompetitionProblemProposals(42)).resolves.toMatchObject([
            { id: 101, title: 'First problem' },
            { id: 102, title: 'Second problem' },
        ]);
        await expect(getHostingRequestProblemProposals(11)).resolves.toMatchObject([
            { id: 101, title: 'First problem' },
            { id: 102, title: 'Second problem' },
        ]);

        const urls = mocks.fetchApi.mock.calls.map(([url]) => (url as URL).toString());
        expect(urls).toEqual([
            'https://api.example.test/me/hosted-competitions/42/problem-proposals?page=0&size=50',
            'https://api.example.test/me/hosted-competitions/42/problem-proposals?page=1&size=50',
            'https://api.example.test/me/competition-hosting-requests/11/problem-proposals?page=0&size=50',
            'https://api.example.test/me/competition-hosting-requests/11/problem-proposals?page=1&size=50',
        ]);
    });

    it('sends one invitation recipient and versions resend actions', async () => {
        const invitationPayload = {
            id: '11111111-2222-4333-8444-555555555555',
            status: 'PENDING',
            recipientUserId: 'user-1',
            username: 'ana',
            displayName: 'Nova Testperson',
            version: 5,
        };
        mocks.fetchApi.mockResolvedValueOnce(Response.json(invitationPayload));
        const invitation = await inviteHostedCompetitionParticipant(42, {
            userId: 'user-1',
            message: 'Welcome',
        });
        expect(JSON.parse(mocks.fetchApi.mock.calls[0][1].body)).toEqual({
            userId: 'user-1',
            message: 'Welcome',
        });

        mocks.fetchApi.mockResolvedValueOnce(Response.json({ ...invitationPayload, version: 6 }));
        await resendHostedCompetitionInvitation(42, invitation as CompetitionParticipantInvitation);
        const [, resendInit] = mocks.fetchApi.mock.calls[1];
        expect(resendInit).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ version: 5, expiresAt: null }),
        });
    });

    it('sends an external email recipient and normalizes its queued POST response', async () => {
        mocks.fetchApi.mockResolvedValueOnce(
            Response.json({
                id: 'invite-email-1',
                email: 'ana@example.org',
                maskedEmail: 'a***@example.org',
                status: 'PENDING',
                deliveryStatus: 'queued',
                deliveryAttemptedAt: null,
                deliveryAttemptCount: 0,
                version: 3,
            }),
        );

        await expect(
            inviteHostedCompetitionParticipant(42, {
                email: 'ana@example.org',
                message: 'Welcome',
            }),
        ).resolves.toMatchObject({
            recipientType: 'EMAIL',
            maskedEmail: 'a***@example.org',
            deliveryStatus: 'QUEUED',
            deliveryAttemptedAt: null,
            deliveryAttemptCount: 0,
        });
        const [url, init] = mocks.fetchApi.mock.calls[0];
        expect((url as URL).pathname).toBe('/me/hosted-competitions/42/invitations');
        expect(init).toMatchObject({ method: 'POST' });
        expect(JSON.parse(init.body)).toEqual({
            email: 'ana@example.org',
            message: 'Welcome',
        });
    });

    it('keeps delivery metadata nullable and bounds invalid legacy attempt counts', () => {
        expect(
            normalizeCompetitionParticipantInvitation({
                id: 'delivered-invite',
                recipientUserId: 'user-1',
                deliveryStatus: 'sent',
                deliveryAttemptedAt: '2026-07-22T10:15:00Z',
                deliveryAttemptCount: 2,
            }),
        ).toMatchObject({
            recipientType: 'PLATFORM_USER',
            deliveryStatus: 'SENT',
            deliveryAttemptedAt: '2026-07-22T10:15:00Z',
            deliveryAttemptCount: 2,
        });
        expect(
            normalizeCompetitionParticipantInvitation({
                id: 'legacy-invite',
                email: 'legacy@example.org',
                deliveryStatus: 'unknown-provider-value',
                deliveryAttemptCount: -4,
            }),
        ).toMatchObject({
            recipientType: 'EMAIL',
            deliveryStatus: null,
            deliveryAttemptedAt: null,
            deliveryAttemptCount: 0,
        });
    });

    it('previews invitations with the token in a no-store POST body, never the URL', async () => {
        mocks.fetchPublicApi.mockResolvedValue(
            Response.json({
                status: 'PENDING',
                competitionId: 42,
                competitionName: 'Community AI Cup',
            }),
        );

        await getCompetitionInvitation('a-secret-token');

        const [url, init] = mocks.fetchPublicApi.mock.calls[0];
        expect(url.toString()).toBe('https://api.example.test/competition-invitations/preview');
        expect(url.toString()).not.toContain('a-secret-token');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ token: 'a-secret-token' }),
            cache: 'no-store',
        });
    });

    it('sends an explicit invitation consent decision through the same-origin proxy', async () => {
        const request = vi.fn().mockResolvedValue(Response.json({ competitionId: 42 }));
        vi.stubGlobal('fetch', request);

        await redeemStoredCompetitionInvitation('safe-handle', false);

        expect(request).toHaveBeenCalledWith(
            '/api/competition-invitations/safe-handle/redeem',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ sharePersonalDataWithOrganizer: false }),
            }),
        );
    });

    it('omits the invitation decision when no organizer notice was available', async () => {
        const request = vi.fn().mockResolvedValue(Response.json({ competitionId: 42 }));
        vi.stubGlobal('fetch', request);

        await redeemStoredCompetitionInvitation('safe-handle');

        expect(JSON.parse(request.mock.calls[0]?.[1]?.body as string)).toEqual({});
    });

    it('loads and updates the participant organizer-sharing decision', async () => {
        const response = {
            thirdPartyHosted: true,
            organizerDisplayName: 'Community Foundation',
            noticeVersion: '2026-07-22',
            joined: true,
            sharePersonalDataWithOrganizer: false,
            consentedAt: null,
            decisionUpdatedAt: '2026-07-22T09:00:00Z',
        };
        mocks.fetchApi
            .mockResolvedValueOnce(Response.json(response))
            .mockResolvedValueOnce(
                Response.json({ ...response, sharePersonalDataWithOrganizer: true }),
            );

        await expect(getCompetitionOrganizerDataConsent(42)).resolves.toEqual(response);
        await expect(updateCompetitionOrganizerDataConsent(42, true)).resolves.toMatchObject({
            sharePersonalDataWithOrganizer: true,
        });

        const [getUrl] = mocks.fetchApi.mock.calls[0];
        const [putUrl, putInit] = mocks.fetchApi.mock.calls[1];
        expect(getUrl.toString()).toBe(
            'https://api.example.test/competitions/42/organizer-data-consent',
        );
        expect(putUrl.toString()).toBe(getUrl.toString());
        expect(putInit).toMatchObject({
            method: 'PUT',
            body: JSON.stringify({ sharePersonalDataWithOrganizer: true }),
        });
    });
});
