import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        id?: string;
        accessToken?: string;
        error?: string;
        expiresAt?: number;
        user?: DefaultSession['user'];
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: number;
        provider?: string;
        error?: string;
    }
}
