import { Logout, LogoutLoading } from '@/components/logout';
import { Suspense } from 'react';

export default async function LogoutPage() {
    return (
        <Suspense fallback={<LogoutLoading />}>
            <Logout />
        </Suspense>
    );
}
