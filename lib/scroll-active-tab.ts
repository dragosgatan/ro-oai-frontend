export function scrollActiveTabIntoView(
    scrollContainer: HTMLElement,
    activeTrigger: HTMLElement,
    behavior: ScrollBehavior,
): boolean {
    const containerRect = scrollContainer.getBoundingClientRect();
    const triggerRect = activeTrigger.getBoundingClientRect();
    const isFullyVisible =
        triggerRect.left >= containerRect.left && triggerRect.right <= containerRect.right;

    if (isFullyVisible) return false;

    activeTrigger.scrollIntoView({
        behavior,
        block: 'nearest',
        inline: 'nearest',
    });
    return true;
}
