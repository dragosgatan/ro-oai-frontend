import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function GET() {
    const deploymentId = process.env.NEXT_DEPLOYMENT_ID ?? 'unknown';

    return NextResponse.json(
        {
            status: 'ok',
            deploymentId,
        },
        {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Deployment-Id': deploymentId,
            },
        },
    );
}
