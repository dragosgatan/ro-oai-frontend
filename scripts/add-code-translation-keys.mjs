// One-shot script to add copyCode and codeCopied translation keys to all locale files.
// Run with: node scripts/add-code-translation-keys.mjs
// Safe to re-run — existing values are overwritten with the canonical translations.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'locales');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));

const translations = {
    en: { copyCode: 'Copy code', codeCopied: 'Code copied' },
    ro: { copyCode: 'Copiază cod', codeCopied: 'Cod copiat' },
    de: { copyCode: 'Code kopieren', codeCopied: 'Code kopiert' },
    bg: { copyCode: 'Копирай кода', codeCopied: 'Кодът е копиран' },
    sr: { copyCode: 'Kopiraj kod', codeCopied: 'Kod je kopiran' },
    uk: { copyCode: 'Копіювати код', codeCopied: 'Код скопійовано' },
    hu: { copyCode: 'Kód másolása', codeCopied: 'Kód másolva' },
    ru: { copyCode: 'Копировать код', codeCopied: 'Код скопирован' },
    kk: { copyCode: 'Кодты көшіру', codeCopied: 'Код көшірілді' },
    ka: { copyCode: 'კოდის კოპირება', codeCopied: 'კოდი დაკოპირდა' },
    fr: { copyCode: 'Copier le code', codeCopied: 'Code copié' },
    nl: { copyCode: 'Code kopiëren', codeCopied: 'Code gekopieerd' },
    et: { copyCode: 'Kopeeri kood', codeCopied: 'Kood kopeeritud' },
    fi: { copyCode: 'Kopioi koodi', codeCopied: 'Koodi kopioitu' },
    sv: { copyCode: 'Kopiera kod', codeCopied: 'Kod kopierad' },
    lv: { copyCode: 'Kopēt kodu', codeCopied: 'Kods nokopēts' },
    lt: { copyCode: 'Kopijuoti kodą', codeCopied: 'Kodas nukopijuotas' },
    hr: { copyCode: 'Kopiraj kod', codeCopied: 'Kod je kopiran' },
    sk: { copyCode: 'Kopírovať kód', codeCopied: 'Kód skopírovaný' },
    sl: { copyCode: 'Kopiraj kodo', codeCopied: 'Koda kopirana' },
    cs: { copyCode: 'Kopírovat kód', codeCopied: 'Kód zkopírován' },
    da: { copyCode: 'Kopier kode', codeCopied: 'Kode kopieret' },
    it: { copyCode: 'Copia codice', codeCopied: 'Codice copiato' },
    es: { copyCode: 'Copiar código', codeCopied: 'Código copiado' },
    pt: { copyCode: 'Copiar código', codeCopied: 'Código copiado' },
    pl: { copyCode: 'Kopiuj kod', codeCopied: 'Kod skopiowany' },
    no: { copyCode: 'Kopier kode', codeCopied: 'Kode kopiert' },
    'zh-CN': { copyCode: '复制代码', codeCopied: '代码已复制' },
    ar: { copyCode: 'نسخ الكود', codeCopied: 'تم نسخ الكود' },
    he: { copyCode: 'העתק קוד', codeCopied: 'הקוד הועתק' },
};

for (const file of files) {
    const locale = file.replace('.json', '');
    const filePath = path.join(dir, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const hadTrailingNewline = raw.endsWith('\n');
    const data = JSON.parse(raw);
    const t = translations[locale];
    if (!t) {
        console.log('No translation for', locale);
        continue;
    }
    if (!data.common) data.common = {};
    data.common.copyCode = t.copyCode;
    data.common.codeCopied = t.codeCopied;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4) + (hadTrailingNewline ? '\n' : ''));
    console.log('Updated', file);
}
