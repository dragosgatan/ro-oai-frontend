import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const requiredTargets = [
    'chrome >= 111',
    'edge >= 111',
    'firefox >= 111',
    'safari >= 15.4',
    'ios_saf >= 15.4',
];
const configuredTargets = new Set(packageJson.browserslist ?? []);
const missingTargets = requiredTargets.filter((target) => !configuredTargets.has(target));

if (missingTargets.length > 0) {
    throw new Error(`Missing required browser targets: ${missingTargets.join(', ')}`);
}

const chunksDirectory = path.join(root, '.next', 'static', 'chunks');

async function collectJavaScriptFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(
        entries.map((entry) => {
            const entryPath = path.join(directory, entry.name);
            return entry.isDirectory()
                ? collectJavaScriptFiles(entryPath)
                : Promise.resolve(entry.name.endsWith('.js') ? [entryPath] : []);
        }),
    );

    return files.flat();
}

const incompatibleChunks = [];

for (const file of await collectJavaScriptFiles(chunksDirectory)) {
    const source = await readFile(file, 'utf8');

    // Class static initialization blocks are a parse error before Safari 16.4.
    if (/\bstatic\s*\{/.test(source)) {
        incompatibleChunks.push(path.relative(root, file));
    }
}

if (incompatibleChunks.length > 0) {
    throw new Error(
        `Safari-incompatible class static blocks found in:\n${incompatibleChunks.join('\n')}`,
    );
}

console.log(
    'Browser compatibility verified: declared Chrome, Edge, Firefox, Safari, and iOS Safari targets; Safari 15.4+ client chunks.',
);
