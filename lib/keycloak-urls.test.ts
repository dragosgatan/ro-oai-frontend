import { describe, expect, it } from 'vitest';

import { buildKeycloakLogoutUrl, buildKeycloakOidcEndpoint } from '@/lib/keycloak-urls';

const issuer = 'https://auth.example.test/realms/example';

describe('Keycloak URL builders', () => {
    it.each([issuer, `${issuer}/`])('preserves the realm in logout URLs for %s', (value) => {
        const logoutUrl = buildKeycloakLogoutUrl(
            value,
            'frontend-with-secret',
            'https://platform.olimpiada-ai.ro/ro',
        );

        expect(logoutUrl.origin).toBe('https://auth.example.test');
        expect(logoutUrl.pathname).toBe('/realms/example/protocol/openid-connect/logout');
        expect(logoutUrl.searchParams.get('client_id')).toBe('frontend-with-secret');
        expect(logoutUrl.searchParams.get('post_logout_redirect_uri')).toBe(
            'https://platform.olimpiada-ai.ro/ro',
        );
    });

    it('preserves the realm in the token endpoint as well', () => {
        expect(buildKeycloakOidcEndpoint(issuer, 'token').toString()).toBe(
            'https://auth.example.test/realms/example/protocol/openid-connect/token',
        );
    });
});
