'use client';

import { useTranslations } from 'next-intl';
import { ShieldCheck, Monitor, Cpu, Wifi, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

export interface AntiCheatIndicatorProps {
    /** Whether anti-cheat is enabled for the competition */
    enabled: boolean;
    /** Optional additional CSS classes */
    className?: string;
}

/**
 * AntiCheatIndicator component displays a prominent indicator on the competition
 * detail page explaining the anti-cheat monitoring scope and requirements.
 *
 * Requirements: 11.1, 11.2, 11.4
 * - Show prominent indicator on competition detail page
 * - Include tooltip or expandable section explaining the monitoring scope
 * - Competition rules section includes anti-cheat terms when enabled
 */
export function AntiCheatIndicator({ enabled, className = '' }: AntiCheatIndicatorProps) {
    const t = useTranslations('antiCheat');

    // Don't render anything if anti-cheat is not enabled
    if (!enabled) {
        return null;
    }

    return (
        <Card
            className={`border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 ${className}`}
        >
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900">
                        <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <CardTitle className="text-lg text-indigo-900 dark:text-indigo-100">
                            {t('indicator.title')}
                        </CardTitle>
                        <CardDescription className="text-indigo-700 dark:text-indigo-300">
                            {t('indicator.description')}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem
                        value="requirements"
                        className="border-indigo-200 dark:border-indigo-800"
                    >
                        <AccordionTrigger className="text-sm font-medium text-indigo-800 dark:text-indigo-200 hover:no-underline">
                            {t('indicator.requirements')}
                        </AccordionTrigger>
                        <AccordionContent>
                            <ul className="space-y-2 text-sm text-indigo-700 dark:text-indigo-300">
                                <li className="flex items-start gap-2">
                                    <Monitor className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>{t('indicator.requirementsList.companionApp')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Cpu className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>{t('indicator.requirementsList.keepRunning')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>{t('indicator.requirementsList.consent')}</span>
                                </li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                        value="monitoring"
                        className="border-indigo-200 dark:border-indigo-800"
                    >
                        <AccordionTrigger className="text-sm font-medium text-indigo-800 dark:text-indigo-200 hover:no-underline">
                            {t('indicator.monitoringScope')}
                        </AccordionTrigger>
                        <AccordionContent>
                            <ul className="space-y-2 text-sm text-indigo-700 dark:text-indigo-300">
                                <li className="flex items-start gap-2">
                                    <Monitor className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>{t('indicator.monitoringScopeList.browserUrls')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Cpu className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>{t('indicator.monitoringScopeList.processes')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Wifi className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>{t('indicator.monitoringScopeList.heartbeat')}</span>
                                </li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                <div className="mt-4 p-3 rounded-lg bg-indigo-100/50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-start gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{t('indicator.privacyNote')}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default AntiCheatIndicator;
