import hljs from 'highlight.js/lib/core';

// Register commonly used languages for ML/competitive programming problems.
import python from 'highlight.js/lib/languages/python';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import yaml from 'highlight.js/lib/languages/yaml';
import plaintext from 'highlight.js/lib/languages/plaintext';
import cpp from 'highlight.js/lib/languages/cpp';
import c from 'highlight.js/lib/languages/c';
import java from 'highlight.js/lib/languages/java';
import sql from 'highlight.js/lib/languages/sql';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import markdown from 'highlight.js/lib/languages/markdown';

hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('tsx', typescript);
hljs.registerLanguage('jsx', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('plaintext', plaintext);
hljs.registerLanguage('text', plaintext);
hljs.registerLanguage('txt', plaintext);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c++', cpp);
hljs.registerLanguage('cxx', cpp);
hljs.registerLanguage('c', c);
hljs.registerLanguage('java', java);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);

const DEFAULT_LANGUAGE = 'python';

/** Human-readable language labels shown in the code block header. */
const LANGUAGE_LABELS: Record<string, string> = {
    python: 'Python',
    py: 'Python',
    javascript: 'JavaScript',
    js: 'JavaScript',
    typescript: 'TypeScript',
    ts: 'TypeScript',
    tsx: 'TSX',
    jsx: 'JSX',
    json: 'JSON',
    bash: 'Bash',
    sh: 'Shell',
    shell: 'Shell',
    yaml: 'YAML',
    yml: 'YAML',
    plaintext: 'Text',
    text: 'Text',
    txt: 'Text',
    cpp: 'C++',
    'c++': 'C++',
    cxx: 'C++',
    c: 'C',
    java: 'Java',
    sql: 'SQL',
    css: 'CSS',
    html: 'HTML',
    xml: 'XML',
    markdown: 'Markdown',
    md: 'Markdown',
};

/** Accent color per language — used for the indicator dot in the header. */
const LANGUAGE_ACCENTS: Record<string, string> = {
    python: '#3776ab',
    py: '#3776ab',
    javascript: '#f7df1e',
    js: '#f7df1e',
    typescript: '#3178c6',
    ts: '#3178c6',
    tsx: '#3178c6',
    jsx: '#f7df1e',
    cpp: '#00599c',
    'c++': '#00599c',
    cxx: '#00599c',
    c: '#a8b9cc',
    java: '#f89820',
    json: '#cbcb41',
    bash: '#4eaa25',
    sh: '#4eaa25',
    shell: '#4eaa25',
    yaml: '#cb171e',
    yml: '#cb171e',
    sql: '#e48e00',
    css: '#563d7c',
    html: '#e34f26',
    xml: '#0060ac',
    markdown: '#083fa1',
    md: '#083fa1',
    plaintext: '#8b949e',
    text: '#8b949e',
    txt: '#8b949e',
};

const CODE_BLOCK_REGEX = /<pre(?:[^>]*)><code([^>]*)>([\s\S]*?)<\/code><\/pre>/gi;

const CLASS_ATTR_REGEX = /class\s*=\s*"([^"]*)"/i;
const LANGUAGE_CLASS_REGEX = /language-([A-Za-z0-9_+#-]+)/;

const HTML_ENTITIES: Record<string, string> = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
};

function decodeEntities(text: string): string {
    return text.replace(/&(?:lt|gt|amp|quot|#39|nbsp);/g, (m) => HTML_ENTITIES[m] ?? m);
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function resolveLanguage(rawLang: string | null): string {
    if (!rawLang) return DEFAULT_LANGUAGE;
    const normalized = rawLang.toLowerCase().trim();
    if (hljs.getLanguage(normalized)) return normalized;
    return DEFAULT_LANGUAGE;
}

function languageLabel(lang: string): string {
    return LANGUAGE_LABELS[lang] ?? lang.charAt(0).toUpperCase() + lang.slice(1);
}

function languageAccent(lang: string): string {
    return LANGUAGE_ACCENTS[lang] ?? '#58a6ff';
}

/**
 * Splits highlighted HTML into per-line rows for line numbering.
 * Preserves `<span class="hljs-...">` tokens that span the boundary by letting
 * the browser parser handle any leftover open/close tags (safe: hljs rarely
 * produces cross-line spans in practice, and if it does, the CSS isolates
 * visual damage per line).
 */
function splitLines(highlightedHtml: string): string[] {
    // Normalize trailing newline — the backend often includes one.
    const trimmed = highlightedHtml.replace(/\n+$/, '');
    // Empty document → single empty line so the container still has a height.
    if (!trimmed) return [''];
    return trimmed.split('\n');
}

/**
 * Replaces <pre><code> blocks in HTML with beautifully highlighted versions,
 * wrapped in a premium container with traffic-light chrome, a language
 * indicator, line numbers, and an animated copy button.
 *
 * Defaults to Python when the code fence does not specify a language.
 *
 * @param html - HTML string, typically the output of the backend markdown renderer
 * @param labels - Optional translated UI labels
 */
export function renderCodeBlocks(
    html: string,
    labels?: { copy?: string; copied?: string },
): string {
    if (!html || !html.includes('<pre')) return html;

    const copyLabel = escapeHtml(labels?.copy ?? 'Copy');
    const copiedLabel = escapeHtml(labels?.copied ?? 'Copied');

    return html.replace(CODE_BLOCK_REGEX, (_match, attrs: string, rawContent: string) => {
        const classMatch = CLASS_ATTR_REGEX.exec(attrs ?? '');
        const langClassMatch = classMatch ? LANGUAGE_CLASS_REGEX.exec(classMatch[1]) : null;
        const lang = resolveLanguage(langClassMatch ? langClassMatch[1] : null);
        const label = languageLabel(lang);
        const accent = languageAccent(lang);

        const source = decodeEntities(rawContent).replace(/\n$/, '');

        let highlighted: string;
        try {
            highlighted = hljs.highlight(source, { language: lang, ignoreIllegals: true }).value;
        } catch {
            highlighted = escapeHtml(source);
        }

        const lines = splitLines(highlighted);
        const lineRows = lines
            .map(
                (line, i) =>
                    `<span class="code-block__line">` +
                    `<span class="code-block__lineno" aria-hidden="true">${i + 1}</span>` +
                    `<span class="code-block__linecode">${line || '&#8203;'}</span>` +
                    `</span>`,
            )
            .join('');

        const rawForCopy = escapeHtml(source);
        const showLineNumbers = lines.length > 1;

        return (
            `<div class="code-block not-prose${showLineNumbers ? '' : ' code-block--no-lines'}" data-code-lang="${lang}" style="--code-accent:${accent}">` +
            `<div class="code-block__header">` +
            `<span class="code-block__chrome" aria-hidden="true">` +
            `<span class="code-block__dot code-block__dot--red"></span>` +
            `<span class="code-block__dot code-block__dot--amber"></span>` +
            `<span class="code-block__dot code-block__dot--green"></span>` +
            `</span>` +
            `<span class="code-block__lang">` +
            `<span class="code-block__lang-dot" aria-hidden="true"></span>` +
            `<span class="code-block__lang-label">${escapeHtml(label)}</span>` +
            `</span>` +
            `<button type="button" class="code-block__copy" ` +
            `data-code-source="${rawForCopy}" ` +
            `data-copy-label="${copyLabel}" ` +
            `data-copied-label="${copiedLabel}" ` +
            `aria-label="${copyLabel}">` +
            `<span class="code-block__copy-icons" aria-hidden="true">` +
            // Clipboard icon (default state)
            `<svg class="code-block__copy-icon code-block__copy-icon--clipboard" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
            `<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>` +
            `<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>` +
            `</svg>` +
            // Check icon (copied state)
            `<svg class="code-block__copy-icon code-block__copy-icon--check" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">` +
            `<polyline points="20 6 9 17 4 12"/>` +
            `</svg>` +
            `</span>` +
            `<span class="code-block__copy-label">${copyLabel}</span>` +
            `</button>` +
            `</div>` +
            `<div class="code-block__body">` +
            `<pre class="code-block__pre"><code class="hljs language-${lang}">${lineRows}</code></pre>` +
            `</div>` +
            `</div>`
        );
    });
}
