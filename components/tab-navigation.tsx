'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export interface TabConfig {
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    count?: number;
    ariaLabel?: string;
}

export interface TabNavigationProps {
    tabs: TabConfig[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    className?: string;
    ariaLabel?: string;
}

export function TabNavigation({
    tabs,
    activeTab,
    onTabChange,
    className,
    ariaLabel = 'Tab navigation',
}: TabNavigationProps) {
    const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

    const activateTab = (index: number) => {
        tabRefs.current[index]?.focus();
        onTabChange(tabs[index].id);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        const direction = window.getComputedStyle(event.currentTarget).direction;
        const previousIndex = index > 0 ? index - 1 : tabs.length - 1;
        const nextIndex = index < tabs.length - 1 ? index + 1 : 0;

        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                activateTab(direction === 'rtl' ? nextIndex : previousIndex);
                break;
            case 'ArrowRight':
                event.preventDefault();
                activateTab(direction === 'rtl' ? previousIndex : nextIndex);
                break;
            case 'ArrowUp':
                event.preventDefault();
                activateTab(previousIndex);
                break;
            case 'ArrowDown':
                event.preventDefault();
                activateTab(nextIndex);
                break;
            case 'Home':
                event.preventDefault();
                activateTab(0);
                break;
            case 'End':
                event.preventDefault();
                activateTab(tabs.length - 1);
                break;
        }
    };

    return (
        <div className="platform-toolbar overflow-x-auto scrollbar-thin">
            <div
                role="tablist"
                aria-label={ariaLabel}
                aria-orientation="horizontal"
                className={cn('flex min-w-max items-stretch gap-1 p-1.5 sm:gap-2', className)}
            >
                {tabs.map((tab, index) => {
                    const isActive = tab.id === activeTab;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            id={`tab-${tab.id}`}
                            ref={(element) => {
                                tabRefs.current[index] = element;
                            }}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`tabpanel-${tab.id}`}
                            aria-label={tab.ariaLabel || tab.label}
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => onTabChange(tab.id)}
                            onKeyDown={(event) => handleKeyDown(event, index)}
                            className={cn(
                                'relative inline-flex min-h-11 min-w-28 items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors sm:min-w-36 sm:px-5',
                                'focus-visible:outline-none active:translate-y-px',
                                isActive
                                    ? 'bg-[var(--platform-ink)] text-[var(--platform-paper)]'
                                    : 'text-[var(--platform-ink-muted-strong)] hover:bg-[var(--platform-paper)] hover:text-[var(--platform-ink)]',
                            )}
                        >
                            {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden={true} /> : null}
                            <span>{tab.label}</span>
                            {typeof tab.count === 'number' ? (
                                <span
                                    className={cn(
                                        'min-w-5 px-1.5 py-0.5 text-center text-xs tabular-nums',
                                        isActive
                                            ? 'bg-[var(--platform-citron)] text-[var(--platform-on-accent)]'
                                            : 'bg-[var(--platform-paper-strong)] text-[var(--platform-ink-muted-strong)]',
                                    )}
                                    aria-label={String(tab.count)}
                                >
                                    {tab.count}
                                </span>
                            ) : null}
                            {isActive ? (
                                <span
                                    className="absolute inset-x-0 bottom-0 h-1 bg-[var(--platform-citron)]"
                                    aria-hidden="true"
                                />
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
