'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    ShieldCheck,
    Download,
    Monitor,
    Apple,
    Terminal,
    CheckCircle2,
    XCircle,
    Loader2,
    ExternalLink,
    Globe,
    Cpu,
    Clock,
    AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/routing';

/**
 * Props for the AntiCheatInstallModal component
 */
export interface AntiCheatInstallModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Callback when the modal should close */
    onOpenChange: (open: boolean) => void;
    /** Competition ID for the anti-cheat session */
    competitionId: number;
    /** Competition name for display */
    competitionName: string;
    /** Callback when user consents and confirms installation */
    onConsent: () => void;
    /** Callback when user cancels */
    onCancel: () => void;
    /** Whether the companion app is connected (optional, for status display) */
    isConnected?: boolean;
    /** Whether we're currently checking connection status */
    isCheckingConnection?: boolean;
}

/**
 * Download link configuration for each platform
 */
interface DownloadLink {
    platform: 'windows' | 'macos' | 'linux';
    icon: React.ReactNode;
    url: string;
}

/**
 * AntiCheatInstallModal component displays installation instructions and consent
 * for the MLCompete Companion App required for anti-cheat protected competitions.
 *
 * Requirements: 10.2, 10.3, 10.4, 10.5, 10.6
 * - Display download links for Windows, macOS, Linux
 * - Show step-by-step installation instructions
 * - List data types collected (URLs, process names, timestamps)
 * - Add consent checkbox with privacy policy link
 * - Add "I have installed and connected" button
 */
export function AntiCheatInstallModal({
    open,
    onOpenChange,
    onConsent,
    onCancel,
    isConnected = false,
    isCheckingConnection = false,
}: AntiCheatInstallModalProps) {
    const t = useTranslations('antiCheat.installModal');
    const [consentChecked, setConsentChecked] = useState(false);
    const [showError, setShowError] = useState<string | null>(null);

    // Download links for each platform
    // Files are served from public/downloads folder
    // Windows uses MSI installer to avoid antivirus false positives (NSIS extracts System.dll to Temp)
    const downloadLinks: DownloadLink[] = [
        {
            platform: 'windows',
            icon: <Monitor className="h-5 w-5" />,
            url: `/downloads/MLCompete-Companion_x64.msi`,
        },
        {
            platform: 'macos',
            icon: <Apple className="h-5 w-5" />,
            url: `/downloads/MLCompete-Companion_universal.dmg`,
        },
        {
            platform: 'linux',
            icon: <Terminal className="h-5 w-5" />,
            url: `/downloads/mlcompete-companion_amd64.AppImage`,
        },
    ];

    const handleConfirm = useCallback(() => {
        setShowError(null);

        if (!consentChecked) {
            setShowError(t('errors.consentRequired'));
            return;
        }

        // In a real implementation, we would check if the companion app is connected
        // For now, we'll just call onConsent
        onConsent();
    }, [consentChecked, onConsent, t]);

    const handleCancel = useCallback(() => {
        setShowError(null);
        setConsentChecked(false);
        onCancel();
    }, [onCancel]);

    const handleOpenChange = useCallback(
        (newOpen: boolean) => {
            if (!newOpen) {
                setShowError(null);
                setConsentChecked(false);
            }
            onOpenChange(newOpen);
        },
        [onOpenChange],
    );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <ShieldCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        {t('title')}
                    </DialogTitle>
                    <DialogDescription className="text-base">{t('description')}</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Download Section */}
                    <section className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Download className="h-5 w-5 text-muted-foreground" />
                            {t('downloadSection.title')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {t('downloadSection.description')}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {downloadLinks.map((link) => (
                                <a
                                    key={link.platform}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        'flex flex-col items-center gap-2 p-4 rounded-lg border',
                                        'bg-muted/50 hover:bg-muted transition-colors',
                                        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                                    )}
                                    aria-label={`Download for ${t(`downloadSection.${link.platform}`)}`}
                                >
                                    {link.icon}
                                    <span className="font-medium">
                                        {t(`downloadSection.${link.platform}`)}
                                    </span>
                                    <span className="text-xs text-muted-foreground text-center">
                                        {t(`downloadSection.${link.platform}Desc`)}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </section>

                    {/* Installation Steps */}
                    <section className="space-y-3">
                        <h3 className="font-semibold text-lg">{t('installSteps.title')}</h3>
                        <ol className="space-y-2 list-decimal list-inside text-sm">
                            <li className="text-muted-foreground">{t('installSteps.step1')}</li>
                            <li className="text-muted-foreground">{t('installSteps.step2')}</li>
                            <li className="text-muted-foreground">{t('installSteps.step3')}</li>
                            <li className="text-muted-foreground">{t('installSteps.step4')}</li>
                            <li className="text-muted-foreground">{t('installSteps.step5')}</li>
                        </ol>
                    </section>

                    {/* Data Collection Notice */}
                    <section className="space-y-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <h3 className="font-semibold text-lg flex items-center gap-2 text-amber-700 dark:text-amber-300">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            {t('dataCollection.title')}
                        </h3>
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            {t('dataCollection.description')}
                        </p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                                <Globe className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>{t('dataCollection.urls')}</span>
                            </li>
                            <li className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                                <Cpu className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>{t('dataCollection.processes')}</span>
                            </li>
                            <li className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                                <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>{t('dataCollection.timestamps')}</span>
                            </li>
                        </ul>
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                            {t('dataCollection.privacyNote')}
                        </p>
                    </section>

                    {/* Connection Status */}
                    <section className="flex items-center gap-3 p-3 rounded-lg border">
                        {isCheckingConnection ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {t('status.checking')}
                                </span>
                            </>
                        ) : isConnected ? (
                            <>
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                                    {t('status.connected')}
                                </span>
                            </>
                        ) : (
                            <>
                                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                <span className="text-sm text-red-700 dark:text-red-300">
                                    {t('status.disconnected')}
                                </span>
                            </>
                        )}
                    </section>

                    {/* Consent Checkbox */}
                    <section className="space-y-3">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="consent-checkbox"
                                checked={consentChecked}
                                onCheckedChange={(checked) => setConsentChecked(checked === true)}
                                aria-describedby="consent-description"
                            />
                            <div className="space-y-1">
                                <Label
                                    htmlFor="consent-checkbox"
                                    className="text-sm font-medium cursor-pointer"
                                >
                                    {t('consent.label')}
                                </Label>
                                <p
                                    id="consent-description"
                                    className="text-xs text-muted-foreground"
                                >
                                    <Link
                                        href="/privacy"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        {t('consent.privacyLink')}
                                        <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Error Message */}
                    {showError && (
                        <div
                            className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300"
                            role="alert"
                        >
                            {showError}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                        {t('buttons.cancel')}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!consentChecked || isCheckingConnection}
                        className="w-full sm:w-auto"
                    >
                        {isCheckingConnection ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t('buttons.connecting')}
                            </>
                        ) : (
                            t('buttons.confirm')
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default AntiCheatInstallModal;
