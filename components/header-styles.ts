/**
 * Shared visual vocabulary for header controls and their portalled menus.
 *
 * These colors mirror the competition-notebook system used by the homepage and
 * product shells. Keeping them here lets dropdowns and popovers inherit the same
 * treatment even though Radix renders them outside the header DOM tree.
 */
export const headerControlClassName =
    'inline-flex h-10 w-10 min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-[var(--header-radius)] border border-[var(--header-line-strong)] bg-transparent text-[var(--header-ink)] shadow-none transition-colors duration-150 hover:border-[var(--header-accent)] hover:bg-[var(--header-surface-strong)] hover:text-[var(--header-accent-strong)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--header-focus)] focus-visible:ring-0 focus-visible:ring-offset-0 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50';

export const headerActiveControlClassName =
    'border-[var(--header-accent)] bg-[var(--header-selected)] text-[var(--header-selected-ink)] shadow-[var(--header-active-shadow)] hover:bg-[var(--header-selected)] hover:text-[var(--header-selected-ink)]';

export const headerMenuSurfaceClassName =
    'rounded-[var(--header-menu-radius)] [border-width:var(--header-menu-border-width)] border-[var(--header-line-strong)] bg-[var(--header-surface)] text-[var(--header-ink)] shadow-[var(--header-menu-shadow)] data-[state=closed]:animate-none data-[state=open]:animate-none';

export const headerMenuItemClassName =
    'min-h-11 cursor-pointer rounded-[var(--header-radius)] border border-transparent px-3 py-2.5 text-sm text-[var(--header-ink-muted-strong)] transition-colors duration-150 focus:border-[var(--header-accent)] focus:bg-[var(--header-surface-strong)] focus:text-[var(--header-accent-strong)] data-[highlighted]:border-[var(--header-accent)] data-[highlighted]:bg-[var(--header-surface-strong)] data-[highlighted]:text-[var(--header-accent-strong)] data-[state=checked]:border-[var(--header-accent)] data-[state=checked]:bg-[var(--header-selected)] data-[state=checked]:text-[var(--header-selected-ink)]';
