import { ShieldCheck } from 'lucide-react';

import { LegalDocumentShell } from './legal-document-shell';
import { Locale } from '@/lib/types';
import { PrivacyRO } from './privacy-ro';
import { PrivacyEN } from './privacy-en';

interface PrivacyContentProps {
    locale: Locale;
}

export default function PrivacyContent({ locale }: PrivacyContentProps) {
    const isRomanian = locale === 'ro';
    const isEnglish = locale === 'en';

    return (
        <LegalDocumentShell
            title={isRomanian ? 'Politica de confidențialitate' : 'Privacy policy'}
            description={
                isRomanian
                    ? 'Cum colectăm, folosim și protejăm datele tale pe platforma Olimpiadei Naționale de Inteligență Artificială.'
                    : 'How we collect, use, and protect your data across the National AI Olympiad platform.'
            }
            eyebrow={isRomanian ? 'Datele tale' : 'Your data'}
            icon={ShieldCheck}
            contentLanguage={isRomanian ? 'ro' : 'en'}
            showEnglishNotice={!isRomanian && !isEnglish}
        >
            {isRomanian ? <PrivacyRO /> : <PrivacyEN />}
        </LegalDocumentShell>
    );
}
