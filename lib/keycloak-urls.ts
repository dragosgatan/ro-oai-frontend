type KeycloakOidcEndpoint = 'logout' | 'token';

export function buildKeycloakOidcEndpoint(issuer: string, endpoint: KeycloakOidcEndpoint): URL {
    const issuerUrl = new URL(issuer.trim());

    // A leading slash in the relative endpoint would discard the realm path.
    // Normalize the issuer as a directory so URL resolution preserves it.
    issuerUrl.pathname = `${issuerUrl.pathname.replace(/\/+$/, '')}/`;
    issuerUrl.search = '';
    issuerUrl.hash = '';

    return new URL(`protocol/openid-connect/${endpoint}`, issuerUrl);
}

export function buildKeycloakLogoutUrl(
    issuer: string,
    clientId: string,
    postLogoutRedirectUri: string,
): URL {
    const logoutUrl = buildKeycloakOidcEndpoint(issuer, 'logout');
    logoutUrl.searchParams.set('client_id', clientId);
    logoutUrl.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
    return logoutUrl;
}
