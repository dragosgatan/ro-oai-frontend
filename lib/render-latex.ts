import katex from 'katex';

const KATEX_OPTIONS = {
    throwOnError: false,
    output: 'htmlAndMathml' as const,
    strict: false,
    trust: false,
    maxSize: 500,
    maxExpand: 1000,
};

/** Tags whose text content should never be processed for LaTeX. */
const SKIP_TAGS = /^(pre|code|script|style|textarea|kbd|samp|var)$/i;

/**
 * Matches $$...$$ (display), $...$ (inline), \[...\] (display), \(...\) (inline).
 * Inline $...$ requires non-whitespace after opening $ and before closing $.
 * Single-char like $x$ is supported. Guards against currency ($100).
 */
const LATEX_PATTERN =
    /\$\$([\s\S]+?)\$\$|\$(\S(?:[^$]*?\S)?)\$(?!\d)|\$(\S)\$(?!\d)|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;

/** Common HTML entities that may appear inside LaTeX delimiters after markdown rendering. */
const HTML_ENTITIES: Record<string, string> = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&le;': '≤',
    '&ge;': '≥',
    '&ne;': '≠',
    '&times;': '×',
    '&minus;': '−',
    '&plusmn;': '±',
    '&middot;': '·',
    '&hellip;': '…',
    '&infin;': '∞',
};

const ENTITY_REGEX = new RegExp(Object.keys(HTML_ENTITIES).join('|'), 'g');

function decodeEntities(text: string): string {
    return text.replace(ENTITY_REGEX, (m) => HTML_ENTITIES[m] ?? m);
}

let equationCounter = 0;
let formulaTooltip = '';

function escapeHtmlAttribute(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/** Reset equation counter (call before rendering a full page/document). */
export function resetEquationCounter() {
    equationCounter = 0;
}

/** Renders a single LaTeX expression to HTML with data-latex for copy and optional equation number. */
function renderExpression(latex: string, displayMode: boolean): string {
    const decoded = decodeEntities(latex);
    const html = katex.renderToString(decoded, { ...KATEX_OPTIONS, displayMode });
    const escaped = escapeHtmlAttribute(decoded);
    const interactionAttributes = formulaTooltip
        ? ` role="button" tabindex="0" aria-label="${escapeHtmlAttribute(
              `${formulaTooltip}: ${decoded}`,
          )}" title="${escapeHtmlAttribute(formulaTooltip)}"`
        : ' role="math"';
    if (displayMode) {
        equationCounter++;
        return `<div class="latex-formula latex-display" data-latex="${escaped}"${interactionAttributes}><span class="latex-eq-number">(${equationCounter})</span>${html}</div>`;
    }
    return `<span class="latex-formula" data-latex="${escaped}"${interactionAttributes}>${html}</span>`;
}

/**
 * Processes an HTML string, rendering LaTeX delimiters into KaTeX HTML.
 * Skips content inside <pre>, <code>, <script>, <style>, <textarea> tags.
 * Works in both server and client environments (no DOM dependency).
 * @param tooltip - Optional translated tooltip text for formulas (e.g. "Click to copy formula")
 */
export function renderLatex(html: string, tooltip?: string): string {
    if (!html || (!html.includes('$') && !html.includes('\\(') && !html.includes('\\['))) {
        return html;
    }

    equationCounter = 0;
    formulaTooltip = tooltip ?? '';

    const result: string[] = [];
    let skipDepth = 0;
    let pos = 0;
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let tagMatch: RegExpExecArray | null;

    while ((tagMatch = tagRegex.exec(html)) !== null) {
        const textBefore = html.slice(pos, tagMatch.index);
        if (textBefore) {
            result.push(skipDepth > 0 ? textBefore : processText(textBefore));
        }

        const fullTag = tagMatch[0];
        const tagName = tagMatch[1];
        result.push(fullTag);

        if (SKIP_TAGS.test(tagName)) {
            if (fullTag.startsWith('</')) {
                skipDepth = Math.max(0, skipDepth - 1);
            } else if (!fullTag.endsWith('/>')) {
                skipDepth++;
            }
        }

        pos = tagMatch.index + fullTag.length;
    }

    const remaining = html.slice(pos);
    if (remaining) {
        result.push(skipDepth > 0 ? remaining : processText(remaining));
    }

    return result.join('');
}

/** Replaces LaTeX delimiters in a text segment with rendered KaTeX HTML. */
function processText(text: string): string {
    return text.replace(
        LATEX_PATTERN,
        (match, display$$, inline$multi, inline$single, displayBracket, inlineParen) => {
            const latex = (
                display$$ ??
                displayBracket ??
                inline$multi ??
                inline$single ??
                inlineParen ??
                ''
            ).trim();
            if (!latex) return match;
            const displayMode = display$$ != null || displayBracket != null;
            try {
                return renderExpression(latex, displayMode);
            } catch {
                return match;
            }
        },
    );
}
