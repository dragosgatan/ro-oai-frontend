'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

type TranslationErrorCopy = {
    title: string;
    heading: string;
    description: string;
    suggestion: string;
    tryAgain: string;
    goHome: string;
    loading: string;
};

interface TranslationErrorBoundaryProps {
    children: ReactNode;
    locale: string;
    copy: TranslationErrorCopy;
    fallback?: ReactNode;
}

interface TranslationErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorCount: number;
    showErrorUI: boolean;
}

const MAX_AUTO_RETRIES = 3;
const ERROR_UI_DELAY = 800;

/** Keeps the locale shell recoverable if a message bundle or formatter fails at runtime. */
export class TranslationErrorBoundary extends Component<
    TranslationErrorBoundaryProps,
    TranslationErrorBoundaryState
> {
    private retryTimeout: ReturnType<typeof setTimeout> | null = null;
    private errorUITimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(props: TranslationErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorCount: 0,
            showErrorUI: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<TranslationErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('[i18n] Translation error boundary caught an error:', error, errorInfo);

        const errorCount = this.state.errorCount + 1;
        this.setState({ errorCount });

        if (errorCount < MAX_AUTO_RETRIES) {
            this.retryTimeout = setTimeout(this.handleReset, 250 * errorCount);
            return;
        }

        this.errorUITimeout = setTimeout(() => {
            this.setState({ showErrorUI: true });
        }, ERROR_UI_DELAY);
    }

    componentWillUnmount(): void {
        if (this.retryTimeout) clearTimeout(this.retryTimeout);
        if (this.errorUITimeout) clearTimeout(this.errorUITimeout);
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null, showErrorUI: false });
    };

    handleManualReload = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorCount: 0,
            showErrorUI: false,
        });
        window.location.reload();
    };

    render(): ReactNode {
        if (!this.state.hasError) return this.props.children;

        if (!this.state.showErrorUI) {
            return (
                <main className="platform-page-shell min-h-screen">
                    <div
                        className="platform-page-inner flex min-h-screen items-center justify-center"
                        role="status"
                        aria-live="polite"
                    >
                        <span className="flex min-h-11 items-center gap-3 border-y border-[var(--platform-line-strong)] px-5 font-semibold text-[var(--platform-ink-muted)]">
                            <RefreshCw
                                className="h-5 w-5 animate-spin text-[var(--platform-violet)]"
                                aria-hidden="true"
                            />
                            {this.props.copy.loading}
                        </span>
                    </div>
                </main>
            );
        }

        if (this.props.fallback) return this.props.fallback;

        const { copy, locale } = this.props;

        return (
            <main className="platform-page-shell min-h-screen">
                <div className="platform-page-inner flex min-h-screen items-center">
                    <section
                        className="grid w-full items-center gap-10 py-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20"
                        role="alert"
                    >
                        <div className="min-w-0">
                            <p className="platform-page-eyebrow">
                                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                                <span>{copy.title}</span>
                            </p>
                            <h1 className="platform-page-title">{copy.heading}</h1>
                            <div className="mt-6 max-w-2xl space-y-2 text-pretty text-[var(--platform-ink-muted)]">
                                <p className="text-base leading-7 sm:text-lg">{copy.description}</p>
                                <p className="text-sm leading-6">{copy.suggestion}</p>
                            </div>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                <button
                                    type="button"
                                    onClick={this.handleManualReload}
                                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-[var(--platform-violet)] bg-[var(--platform-violet)] px-4 py-2.5 text-sm font-bold text-white shadow-[4px_4px_0_var(--platform-citron)] transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-[var(--platform-violet-strong)] focus-visible:outline-none active:translate-y-px sm:w-auto dark:text-[var(--platform-on-accent)]"
                                >
                                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                    {copy.tryAgain}
                                </button>
                                <a
                                    href={`/${locale}`}
                                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 py-2.5 text-sm font-bold text-[var(--platform-ink)] transition-colors duration-150 hover:border-[var(--platform-violet)] hover:bg-[var(--platform-paper-strong)] focus-visible:outline-none sm:w-auto"
                                >
                                    <Home className="h-4 w-4" aria-hidden="true" />
                                    {copy.goHome}
                                </a>
                            </div>

                            {process.env.NODE_ENV === 'development' && this.state.error ? (
                                <details className="mt-8 max-w-2xl border-y border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] px-4 py-3 text-sm text-[var(--platform-ink-muted-strong)]">
                                    <summary className="min-h-11 cursor-pointer py-3 font-semibold text-[var(--platform-ink)]">
                                        {copy.title}
                                    </summary>
                                    <pre className="overflow-x-auto whitespace-pre-wrap break-words border-t border-[var(--platform-line)] py-4 font-mono text-xs leading-5">
                                        {this.state.error.message}
                                    </pre>
                                </details>
                            ) : null}
                        </div>

                        <div
                            className="relative hidden min-h-72 border-y border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] lg:grid lg:place-items-center"
                            aria-hidden="true"
                        >
                            <span className="absolute start-0 top-0 h-3 w-24 bg-[var(--platform-citron)]" />
                            <AlertTriangle className="h-20 w-20 text-[var(--platform-violet)]" />
                            <span className="absolute bottom-0 end-0 h-12 w-12 bg-[var(--platform-coral)]" />
                        </div>
                    </section>
                </div>
            </main>
        );
    }
}
