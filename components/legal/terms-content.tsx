import { ScrollText } from 'lucide-react';

import { LegalDocumentShell } from './legal-document-shell';
import { Locale } from '@/lib/types';
import { TermsRO } from './terms-ro';
import { TermsEN } from './terms-en';

interface TermsContentProps {
    locale: Locale;
}

export default function TermsContent({ locale }: TermsContentProps) {
    const isRomanian = locale === 'ro';
    const isEnglish = locale === 'en';
    const privacyHref = `/${locale}/privacy`;

    return (
        <LegalDocumentShell
            title={isRomanian ? 'Termeni și condiții' : 'Terms & conditions'}
            description={
                isRomanian
                    ? 'Regulile clare care păstrează platforma corectă, sigură și utilă pentru întreaga comunitate.'
                    : 'The clear rules that keep the platform fair, safe, and useful for the whole community.'
            }
            eyebrow={isRomanian ? 'Regulile platformei' : 'Platform rules'}
            icon={ScrollText}
            contentLanguage={isRomanian ? 'ro' : 'en'}
            showEnglishNotice={!isRomanian && !isEnglish}
        >
            {isRomanian ? (
                <TermsRO privacyHref={privacyHref} />
            ) : (
                <TermsEN privacyHref={privacyHref} />
            )}
        </LegalDocumentShell>
    );
}
