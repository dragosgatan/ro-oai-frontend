export const DEFAULT_READ_REQUEST_TIMEOUT_MS = 15_000;

/**
 * Fetch with a deadline while preserving a caller-provided abort signal.
 * This intentionally uses AbortController instead of AbortSignal.timeout so
 * the client bundle remains compatible with older Safari releases.
 */
export async function fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit = {},
    timeoutMs: number = DEFAULT_READ_REQUEST_TIMEOUT_MS,
): Promise<Response> {
    const controller = new AbortController();
    const callerSignal = init.signal;
    const abortFromCaller = () => controller.abort();

    if (callerSignal?.aborted) {
        controller.abort();
    } else {
        callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
    }

    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(input, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
        callerSignal?.removeEventListener('abort', abortFromCaller);
    }
}
