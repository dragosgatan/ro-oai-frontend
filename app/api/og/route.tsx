/**
 * Dynamic Open Graph Image Generator
 *
 * Generates dynamic OG images for:
 * - Problem pages (with title, difficulty, branding)
 * - Competition pages (with name, status badge, dates)
 * - User profile pages (with username, stats)
 * - Generic pages (with title and branding)
 *
 * Uses Next.js ImageResponse API for edge-optimized image generation
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

// ============================================================================
// Configuration
// ============================================================================

// runtime: 'edge' is not compatible with Next.js 16 Cache Components
// export const runtime = 'edge';

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get difficulty color
 */
function getDifficultyColor(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
        case 'easy':
            return '#10b981'; // green-500
        case 'medium':
            return '#f59e0b'; // amber-500
        case 'hard':
            return '#ef4444'; // red-500
        default:
            return '#6b7280'; // gray-500
    }
}

/**
 * Get competition status color and label
 */
function getCompetitionStatusInfo(status: string): { color: string; label: string } {
    switch (status.toUpperCase()) {
        case 'UPCOMING':
            return { color: '#3b82f6', label: 'Upcoming' }; // blue-500
        case 'ACTIVE':
            return { color: '#10b981', label: 'Active' }; // green-500
        case 'ENDED':
            return { color: '#6b7280', label: 'Ended' }; // gray-500
        default:
            return { color: '#6b7280', label: status };
    }
}

/**
 * Format date for display in OG image
 */
function formatDateForOg(dateString: string): string {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return dateString;
    }
}

/**
 * Truncate text to fit within image
 */
function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength - 3) + '...';
}

// ============================================================================
// Image Templates
// ============================================================================

/**
 * Generate problem OG image
 */
function generateProblemImage(title: string, difficulty: string) {
    const truncatedTitle = truncateText(title, 80);
    const difficultyColor = getDifficultyColor(difficulty);

    return (
        <div
            style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0f172a', // slate-900
                backgroundImage:
                    'radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)',
                backgroundSize: '100px 100px',
                padding: '80px',
            }}
        >
            {/* Logo/Brand */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '40px',
                }}
            >
                <div
                    style={{
                        fontSize: '48px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                        backgroundClip: 'text',
                        color: 'transparent',
                        display: 'flex',
                    }}
                >
                    MLCompete
                </div>
            </div>

            {/* Problem Title */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    maxWidth: '900px',
                }}
            >
                <div
                    style={{
                        fontSize: '64px',
                        fontWeight: 'bold',
                        color: '#f8fafc', // slate-50
                        lineHeight: 1.2,
                        marginBottom: '30px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                    }}
                >
                    {truncatedTitle}
                </div>

                {/* Difficulty Badge */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: difficultyColor,
                        color: '#ffffff',
                        fontSize: '32px',
                        fontWeight: 'bold',
                        padding: '16px 40px',
                        borderRadius: '12px',
                    }}
                >
                    {difficulty}
                </div>
            </div>

            {/* Footer */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#94a3b8', // slate-400
                    fontSize: '24px',
                }}
            >
                Machine Learning Competition Platform
            </div>
        </div>
    );
}

/**
 * Generate competition OG image
 */
function generateCompetitionImage(
    name: string,
    status: string,
    startDate: string,
    endDate: string,
) {
    const truncatedName = truncateText(name, 60);
    const statusInfo = getCompetitionStatusInfo(status);
    const formattedStartDate = formatDateForOg(startDate);
    const formattedEndDate = formatDateForOg(endDate);

    return (
        <div
            style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0f172a', // slate-900
                backgroundImage:
                    'radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)',
                backgroundSize: '100px 100px',
                padding: '80px',
            }}
        >
            {/* Logo/Brand */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '30px',
                }}
            >
                <div
                    style={{
                        fontSize: '40px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                        backgroundClip: 'text',
                        color: 'transparent',
                        display: 'flex',
                    }}
                >
                    MLCompete
                </div>
            </div>

            {/* Competition Label */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#94a3b8', // slate-400
                    fontSize: '28px',
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                }}
            >
                Competition
            </div>

            {/* Competition Name */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    maxWidth: '900px',
                }}
            >
                <div
                    style={{
                        fontSize: '56px',
                        fontWeight: 'bold',
                        color: '#f8fafc', // slate-50
                        lineHeight: 1.2,
                        marginBottom: '30px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                    }}
                >
                    {truncatedName}
                </div>

                {/* Status Badge */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: statusInfo.color,
                        color: '#ffffff',
                        fontSize: '28px',
                        fontWeight: 'bold',
                        padding: '12px 32px',
                        borderRadius: '10px',
                        marginBottom: '30px',
                    }}
                >
                    {statusInfo.label}
                </div>

                {/* Dates */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        color: '#cbd5e1', // slate-300
                        fontSize: '24px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px' }}>📅</span>
                        {formattedStartDate}
                    </div>
                    <div style={{ display: 'flex', color: '#64748b' }}>→</div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>{formattedEndDate}</div>
                </div>
            </div>

            {/* Footer */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#94a3b8', // slate-400
                    fontSize: '24px',
                }}
            >
                Join the Competition on MLCompete
            </div>
        </div>
    );
}

/**
 * Generate profile OG image
 */
function generateProfileImage(
    username: string,
    stats: {
        rank?: number;
        totalScore?: number;
        problemsSolved?: number;
    },
) {
    const truncatedUsername = truncateText(username, 30);

    return (
        <div
            style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0f172a', // slate-900
                backgroundImage:
                    'radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)',
                backgroundSize: '100px 100px',
                padding: '80px',
            }}
        >
            {/* Logo/Brand */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '40px',
                }}
            >
                <div
                    style={{
                        fontSize: '36px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                        backgroundClip: 'text',
                        color: 'transparent',
                        display: 'flex',
                    }}
                >
                    MLCompete
                </div>
            </div>

            {/* Username */}
            <div
                style={{
                    fontSize: '72px',
                    fontWeight: 'bold',
                    color: '#f8fafc', // slate-50
                    marginBottom: '50px',
                    display: 'flex',
                }}
            >
                {truncatedUsername}
            </div>

            {/* Stats */}
            <div
                style={{
                    display: 'flex',
                    gap: '60px',
                    alignItems: 'center',
                }}
            >
                {stats.rank !== undefined && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '48px',
                                fontWeight: 'bold',
                                color: '#3b82f6', // blue-500
                                display: 'flex',
                            }}
                        >
                            #{stats.rank}
                        </div>
                        <div
                            style={{
                                fontSize: '24px',
                                color: '#94a3b8', // slate-400
                                display: 'flex',
                            }}
                        >
                            Rank
                        </div>
                    </div>
                )}

                {stats.totalScore !== undefined && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '48px',
                                fontWeight: 'bold',
                                color: '#8b5cf6', // purple-500
                                display: 'flex',
                            }}
                        >
                            {stats.totalScore.toFixed(0)}
                        </div>
                        <div
                            style={{
                                fontSize: '24px',
                                color: '#94a3b8', // slate-400
                                display: 'flex',
                            }}
                        >
                            Score
                        </div>
                    </div>
                )}

                {stats.problemsSolved !== undefined && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '48px',
                                fontWeight: 'bold',
                                color: '#10b981', // green-500
                                display: 'flex',
                            }}
                        >
                            {stats.problemsSolved}
                        </div>
                        <div
                            style={{
                                fontSize: '24px',
                                color: '#94a3b8', // slate-400
                                display: 'flex',
                            }}
                        >
                            Solved
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#94a3b8', // slate-400
                    fontSize: '24px',
                }}
            >
                View Profile on MLCompete
            </div>
        </div>
    );
}

/**
 * Generate generic OG image
 */
function generateGenericImage(title: string, subtitle?: string) {
    const truncatedTitle = truncateText(title, 60);
    const truncatedSubtitle = subtitle ? truncateText(subtitle, 100) : undefined;

    return (
        <div
            style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0f172a', // slate-900
                backgroundImage:
                    'radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)',
                backgroundSize: '100px 100px',
                padding: '80px',
            }}
        >
            {/* Logo/Brand */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '60px',
                }}
            >
                <div
                    style={{
                        fontSize: '56px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                        backgroundClip: 'text',
                        color: 'transparent',
                        display: 'flex',
                    }}
                >
                    MLCompete
                </div>
            </div>

            {/* Title */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    maxWidth: '900px',
                }}
            >
                <div
                    style={{
                        fontSize: '72px',
                        fontWeight: 'bold',
                        color: '#f8fafc', // slate-50
                        lineHeight: 1.2,
                        marginBottom: truncatedSubtitle ? '30px' : '0',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                    }}
                >
                    {truncatedTitle}
                </div>

                {truncatedSubtitle && (
                    <div
                        style={{
                            fontSize: '32px',
                            color: '#94a3b8', // slate-400
                            lineHeight: 1.4,
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                        }}
                    >
                        {truncatedSubtitle}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#94a3b8', // slate-400
                    fontSize: '24px',
                }}
            >
                Machine Learning Competition Platform
            </div>
        </div>
    );
}

// ============================================================================
// Route Handler
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Get parameters
        const type = searchParams.get('type') || 'generic';
        const title = searchParams.get('title') || 'MLCompete';
        const subtitle = searchParams.get('subtitle');
        const difficulty = searchParams.get('difficulty');
        const username = searchParams.get('username');
        const rank = searchParams.get('rank');
        const totalScore = searchParams.get('totalScore');
        const problemsSolved = searchParams.get('problemsSolved');
        const status = searchParams.get('status');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Generate appropriate image based on type
        let imageElement;

        switch (type) {
            case 'problem':
                if (!difficulty) {
                    return new Response('Missing difficulty parameter', { status: 400 });
                }
                imageElement = generateProblemImage(title, difficulty);
                break;

            case 'profile':
                if (!username) {
                    return new Response('Missing username parameter', { status: 400 });
                }
                imageElement = generateProfileImage(username, {
                    rank: rank ? parseInt(rank, 10) : undefined,
                    totalScore: totalScore ? parseFloat(totalScore) : undefined,
                    problemsSolved: problemsSolved ? parseInt(problemsSolved, 10) : undefined,
                });
                break;

            case 'competition':
                if (!status || !startDate || !endDate) {
                    return new Response(
                        'Missing competition parameters (status, startDate, endDate)',
                        { status: 400 },
                    );
                }
                imageElement = generateCompetitionImage(title, status, startDate, endDate);
                break;

            case 'generic':
            default:
                imageElement = generateGenericImage(title, subtitle || undefined);
                break;
        }

        // Generate image response
        return new ImageResponse(imageElement, {
            width: OG_IMAGE_WIDTH,
            height: OG_IMAGE_HEIGHT,
            headers: {
                'Cache-Control':
                    'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
            },
        });
    } catch (error) {
        console.error('[OG Image] Generation failed:', error);
        return new Response('Failed to generate image', { status: 500 });
    }
}
