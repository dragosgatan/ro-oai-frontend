/**
 * Locale message contract tests.
 *
 * Locale files may intentionally be partial: both request-time loaders merge
 * missing messages from English through `mergeMessageFallback`. These tests
 * validate the source messages and, more importantly, the complete message
 * shape that next-intl receives at runtime.
 */

import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { MESSAGE_FALLBACK_LOCALE, mergeMessageFallback } from '@/lib/i18n-messages';
import { SUPPORTED_LOCALES } from '@/lib/types';

type Messages = Record<string, unknown>;

const localesDir = path.join(__dirname);
const configuredLocales = [...SUPPORTED_LOCALES];

function loadLocaleFile(locale: string): Messages {
    const filePath = path.join(localesDir, `${locale}.json`);
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Messages;
}

function getAllLeafPaths(obj: Messages, prefix = ''): string[] {
    const paths: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            paths.push(...getAllLeafPaths(value as Messages, fullPath));
        } else {
            paths.push(fullPath);
        }
    }

    return paths;
}

function getValueByPath(obj: Messages, keyPath: string): unknown {
    let current: unknown = obj;

    for (const part of keyPath.split('.')) {
        if (current === null || typeof current !== 'object' || Array.isArray(current)) {
            return undefined;
        }

        current = (current as Messages)[part];
    }

    return current;
}

const sourceMessages = Object.fromEntries(
    configuredLocales.map((locale) => [locale, loadLocaleFile(locale)]),
) as Record<(typeof configuredLocales)[number], Messages>;

const fallbackMessages = sourceMessages[MESSAGE_FALLBACK_LOCALE];
const fallbackLeafPaths = getAllLeafPaths(fallbackMessages);
const fallbackTopLevelKeys = Object.keys(fallbackMessages);

const runtimeMessages = Object.fromEntries(
    configuredLocales.map((locale) => [
        locale,
        locale === MESSAGE_FALLBACK_LOCALE
            ? sourceMessages[locale]
            : mergeMessageFallback(sourceMessages[locale], fallbackMessages),
    ]),
) as Record<(typeof configuredLocales)[number], Messages>;

describe('locale message structure', () => {
    describe('configured locale files', () => {
        it('keeps the supported locale list and fallback locale in sync', () => {
            expect(configuredLocales).toHaveLength(30);
            expect(configuredLocales).toContain(MESSAGE_FALLBACK_LOCALE);
            expect(new Set(configuredLocales).size).toBe(configuredLocales.length);
        });

        for (const locale of configuredLocales) {
            it(`${locale}.json exists and contains a message object`, () => {
                expect(sourceMessages[locale]).toBeDefined();
                expect(sourceMessages[locale]).not.toBeNull();
                expect(Array.isArray(sourceMessages[locale])).toBe(false);
            });
        }
    });

    describe('source message quality', () => {
        for (const locale of configuredLocales) {
            it(`${locale}.json contains only non-empty string leaves`, () => {
                const localeMessages = sourceMessages[locale];
                const leafPaths = getAllLeafPaths(localeMessages);

                expect(leafPaths.length).toBeGreaterThan(0);

                for (const keyPath of leafPaths) {
                    const value = getValueByPath(localeMessages, keyPath);
                    expect(value, `${locale}:${keyPath}`).toEqual(expect.any(String));
                    expect((value as string).trim().length, `${locale}:${keyPath}`).toBeGreaterThan(
                        0,
                    );
                }
            });
        }
    });

    describe('runtime fallback contract', () => {
        for (const locale of configuredLocales) {
            it(`${locale} resolves every fallback message to a non-empty string`, () => {
                const resolved = runtimeMessages[locale];

                for (const keyPath of fallbackLeafPaths) {
                    const value = getValueByPath(resolved, keyPath);
                    expect(value, `${locale}:${keyPath}`).toEqual(expect.any(String));
                    expect((value as string).trim().length, `${locale}:${keyPath}`).toBeGreaterThan(
                        0,
                    );
                }
            });

            it(`${locale} exposes every fallback top-level namespace`, () => {
                expect(Object.keys(runtimeMessages[locale])).toEqual(
                    expect.arrayContaining(fallbackTopLevelKeys),
                );
            });

            it(`${locale} preserves every translation supplied by its source file`, () => {
                const source = sourceMessages[locale];
                const resolved = runtimeMessages[locale];

                for (const keyPath of getAllLeafPaths(source)) {
                    expect(getValueByPath(resolved, keyPath), `${locale}:${keyPath}`).toBe(
                        getValueByPath(source, keyPath),
                    );
                }
            });
        }
    });

    describe('language selector labels', () => {
        for (const locale of configuredLocales) {
            it(`${locale} resolves a label for every supported language`, () => {
                const languages = runtimeMessages[locale].languages as
                    | Record<string, unknown>
                    | undefined;

                expect(languages).toBeDefined();
                expect(Object.keys(languages ?? {}).sort()).toEqual([...configuredLocales].sort());

                for (const supportedLocale of configuredLocales) {
                    const value = languages?.[supportedLocale];
                    expect(value, `${locale}:languages.${supportedLocale}`).toEqual(
                        expect.any(String),
                    );
                    expect(
                        (value as string).trim().length,
                        `${locale}:languages.${supportedLocale}`,
                    ).toBeGreaterThan(0);
                }
            });
        }
    });
});
