'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, AtSign, CheckCircle2, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useSearchParams } from 'next/navigation';

import { PlatformPageHeader, PlatformPageShell } from '@/components/platform-page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchApi } from '@/lib/api';
import { isUsernameSlugFriendly, toProfileSlug } from '@/lib/profile-utils';
import { getLocaleHomePath, getSafeReturnPath } from '@/lib/safe-navigation';

const profileCopy = {
    ro: {
        eyebrow: 'Ultimul pas',
        title: 'Finalizează-ți profilul',
        description:
            'Alege un nume public ușor de recunoscut. Îl vei folosi în clasamente, competiții și conversații.',
        step: 'Pasul 01 / 01',
        panelTitle: 'Identitatea ta pe platformă',
        panelDescription:
            'Un nume clar face progresul tău ușor de urmărit și profilul ușor de distribuit.',
        benefitOne: 'Adresă de profil memorabilă',
        benefitTwo: 'Aceeași identitate în toate competițiile',
        fieldTitle: 'Alege numele public',
        fieldDescription: 'Îl poți verifica înainte de a continua.',
        username: 'Nume de utilizator',
        placeholder: 'exemplu-utilizator',
        hint: '3–20 de caractere: litere mici, cifre și cratimă.',
        suggestion: 'Variantă recomandată',
        useSuggestion: 'Folosește {username}',
        validation:
            'Alege un nume de 3–20 de caractere care folosește doar litere mici, cifre și cratimă.',
        taken: 'Acest nume este deja folosit. Încearcă o altă variantă.',
        saveError: 'Profilul nu a putut fi confirmat. Verifică conexiunea și încearcă din nou.',
        submit: 'Confirmă profilul',
    },
    en: {
        eyebrow: 'Final step',
        title: 'Complete your profile',
        description:
            'Choose a recognizable public name. You will use it across leaderboards, competitions, and conversations.',
        step: 'Step 01 / 01',
        panelTitle: 'Your platform identity',
        panelDescription:
            'A clear name makes your progress easy to follow and your profile easy to share.',
        benefitOne: 'A memorable profile address',
        benefitTwo: 'One identity across every competition',
        fieldTitle: 'Choose your public name',
        fieldDescription: 'You can review it before continuing.',
        username: 'Username',
        placeholder: 'example-user',
        hint: '3–20 characters: lowercase letters, numbers, and hyphens.',
        suggestion: 'Recommended version',
        useSuggestion: 'Use {username}',
        validation:
            'Choose a 3–20 character username using only lowercase letters, numbers, and hyphens.',
        taken: 'This username is already in use. Try another one.',
        saveError: 'Your profile could not be confirmed. Check your connection and try again.',
        submit: 'Confirm profile',
    },
} as const;

function isConfirmationLoop(path: string): boolean {
    return /\/profile\/confirm$/.test(path.split(/[?#]/, 1)[0]);
}

export default function ConfirmProfilePage() {
    const locale = useLocale();
    const tCommon = useTranslations('common');
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const copy = locale === 'ro' ? profileCopy.ro : profileCopy.en;
    const [username, setUsername] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const returnPath = useMemo(() => {
        const fallback = getLocaleHomePath(pathname);
        const safePath = getSafeReturnPath(
            searchParams.get('callbackUrl') ?? searchParams.get('returnTo'),
            fallback,
            typeof window === 'undefined' ? undefined : window.location.origin,
        );

        return isConfirmationLoop(safePath) ? fallback : safePath;
    }, [pathname, searchParams]);

    const handleUsernameChange = (value: string) => {
        setUsername(value);
        setError(null);

        const trimmed = value.trim();
        if (trimmed && !isUsernameSlugFriendly(trimmed)) {
            const slug = toProfileSlug(trimmed);
            setSuggestion(slug && slug !== trimmed.toLowerCase() ? slug : null);
        } else {
            setSuggestion(null);
        }
    };

    const applySuggestion = () => {
        if (!suggestion) return;

        setUsername(suggestion);
        setSuggestion(null);
        setError(null);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const normalizedUsername = username.trim().toLowerCase();
        if (!/^[a-z0-9-]{3,20}$/.test(normalizedUsername)) {
            setError(copy.validation);
            return;
        }

        setSaving(true);

        try {
            const response = await fetchApi(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/profile/confirm`,
                {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ username: normalizedUsername }),
                },
            );

            if (!response.ok) {
                setError(response.status === 409 ? copy.taken : copy.saveError);
                return;
            }

            window.location.assign(returnPath);
        } catch {
            setError(copy.saveError);
        } finally {
            setSaving(false);
        }
    };

    return (
        <PlatformPageShell contentClassName="max-w-6xl space-y-8 md:space-y-10">
            <PlatformPageHeader
                eyebrow={copy.eyebrow}
                icon={Sparkles}
                title={copy.title}
                description={copy.description}
            />

            <section className="platform-panel grid overflow-hidden lg:grid-cols-[0.78fr_1.22fr]">
                <div className="bg-[var(--platform-violet-strong)] p-6 text-white dark:text-[var(--platform-on-accent)] sm:p-8 lg:p-10">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--platform-citron)]">
                        {copy.step}
                    </p>
                    <h2 className="mt-8 max-w-sm text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
                        {copy.panelTitle}
                    </h2>
                    <p className="mt-4 max-w-md text-sm leading-6 text-white/75">
                        {copy.panelDescription}
                    </p>
                    <ul className="mt-8 space-y-4 border-t border-white/20 pt-6 text-sm text-white/85">
                        {[copy.benefitOne, copy.benefitTwo].map((benefit) => (
                            <li key={benefit} className="flex items-center gap-3">
                                <span className="grid h-7 w-7 shrink-0 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)]">
                                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                </span>
                                {benefit}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-[var(--platform-paper)] p-6 sm:p-8 lg:p-10">
                    <div className="mb-8 border-b border-[var(--platform-line)] pb-6">
                        <h2 className="text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]">
                            {copy.fieldTitle}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[var(--platform-ink-muted)]">
                            {copy.fieldDescription}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} aria-busy={saving} noValidate>
                        <div>
                            <Label
                                htmlFor="username"
                                className="text-sm font-bold text-[var(--platform-ink)]"
                            >
                                {copy.username}
                            </Label>
                            <div className="relative mt-2">
                                <AtSign
                                    className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--platform-ink-muted)]"
                                    aria-hidden="true"
                                />
                                <Input
                                    id="username"
                                    name="username"
                                    autoFocus
                                    required
                                    minLength={3}
                                    maxLength={20}
                                    pattern="[a-z0-9-]{3,20}"
                                    autoComplete="username"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    placeholder={copy.placeholder}
                                    value={username}
                                    onChange={(event) => handleUsernameChange(event.target.value)}
                                    disabled={saving}
                                    aria-invalid={Boolean(error)}
                                    aria-describedby={
                                        error ? 'username-hint username-error' : 'username-hint'
                                    }
                                    className="h-12 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] ps-12 text-[var(--platform-ink)] shadow-none focus-visible:scale-100 focus-visible:ring-0"
                                />
                            </div>
                            <p
                                id="username-hint"
                                className="mt-2 text-sm leading-6 text-[var(--platform-ink-muted)]"
                            >
                                {copy.hint}
                            </p>

                            {suggestion ? (
                                <div className="mt-4 flex flex-col gap-3 border-s-4 border-[var(--platform-citron)] bg-[var(--platform-paper-strong)] p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-ink-muted)]">
                                            {copy.suggestion}
                                        </p>
                                        <p className="mt-1 font-mono text-sm text-[var(--platform-ink)]">
                                            @{suggestion}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={applySuggestion}
                                        className="min-h-11 rounded-none border-[var(--platform-line-strong)] bg-transparent px-4 text-[var(--platform-ink)] shadow-none hover:bg-[var(--platform-paper)]"
                                    >
                                        {copy.useSuggestion.replace('{username}', suggestion)}
                                    </Button>
                                </div>
                            ) : null}

                            {error ? (
                                <p
                                    id="username-error"
                                    className="mt-4 border-s-4 border-[var(--platform-coral)] bg-[color-mix(in_oklch,var(--platform-coral)_10%,transparent)] p-4 text-sm font-medium leading-6 text-[var(--platform-ink)]"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            ) : null}
                        </div>

                        <div className="mt-8 flex justify-end border-t border-[var(--platform-line)] pt-6">
                            <Button
                                type="submit"
                                disabled={saving}
                                className="min-h-11 w-full rounded-none bg-[var(--platform-violet)] px-6 text-white shadow-none hover:bg-[var(--platform-violet-strong)] dark:text-[var(--platform-on-accent)] sm:w-auto"
                            >
                                {saving ? tCommon('saving') : copy.submit}
                                {!saving ? (
                                    <ArrowRight className="ms-2 h-4 w-4" aria-hidden="true" />
                                ) : null}
                            </Button>
                        </div>
                    </form>
                </div>
            </section>
        </PlatformPageShell>
    );
}
