'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    translations?: {
        title: string;
        description: string;
        suggestion: string;
        technicalDetails: string;
        reloadSection: string;
        reloadPage: string;
        retry: string;
    };
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

// Default translations (fallback to English)
const defaultTranslations = {
    title: 'An error occurred',
    description: "We're sorry, but the comments section encountered a problem.",
    suggestion: 'You can try reloading the section or come back later.',
    technicalDetails: 'Technical details (development only)',
    reloadSection: 'Reload comments section',
    reloadPage: 'Reload page',
    retry: 'Retry',
};

export class CommentsErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console for debugging
        console.error('Comments Error Boundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });

        // You can also log the error to an error reporting service here
        // Example: logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const t = this.props.translations || defaultTranslations;

            return (
                <section
                    className="border border-red-700/35 bg-[var(--platform-paper)] shadow-[6px_6px_0_color-mix(in_oklch,var(--platform-coral)_32%,transparent)]"
                    role="alert"
                >
                    <header className="border-b border-red-700/25 bg-red-500/10 px-5 py-4 sm:px-7">
                        <h2 className="flex items-center gap-2 font-bold text-red-800 dark:text-red-200">
                            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                            {t.title}
                        </h2>
                    </header>
                    <div className="space-y-5 px-5 py-5 sm:px-7">
                        <div className="text-sm leading-6 text-[var(--platform-ink-muted)]">
                            <p className="mb-2">{t.description}</p>
                            <p>{t.suggestion}</p>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="border-y border-[var(--platform-line)] bg-[var(--platform-paper-strong)] p-3 text-xs">
                                <summary className="cursor-pointer font-semibold mb-2">
                                    {t.technicalDetails}
                                </summary>
                                <pre className="whitespace-pre-wrap break-words">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <Button
                                onClick={this.handleReset}
                                variant="default"
                                size="sm"
                                aria-label={t.reloadSection}
                                className="min-h-11 rounded-none bg-[var(--platform-violet)] px-4 text-white hover:bg-[var(--platform-violet-strong)] dark:text-[var(--platform-on-accent)]"
                            >
                                <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
                                {t.retry}
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                size="sm"
                                aria-label={t.reloadPage}
                                className="min-h-11 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)]"
                            >
                                {t.reloadPage}
                            </Button>
                        </div>
                    </div>
                </section>
            );
        }

        return this.props.children;
    }
}
