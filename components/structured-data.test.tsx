import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { StructuredData } from '@/components/structured-data';

describe('StructuredData', () => {
    it('keeps HTML-valid script-closing variants inside JSON-LD', () => {
        const html = renderToStaticMarkup(
            <StructuredData
                data={{
                    '@context': 'https://schema.org',
                    '@type': 'Article',
                    name: '</script ><base href=https://evil.example/><p id=owned>owned',
                }}
            />,
        );

        expect(html).toContain('\\u003c/script >');
        expect(html).not.toContain('</script ><base');
    });
});
