// Checks plugin.json against the OpenAI plugin submission limits
// (developers.openai.com/plugins/deploy/submission) before building the ZIP.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'plugin.json'), 'utf8'));
const openai = manifest.extensions?.['com.openai'] ?? {};
const ui = openai.interface ?? {};
const errors = [];

const maxLen = (label, value, limit, required = true) => {
    if (value == null || value === '') return required && errors.push(`${label} is required`);
    if (value.length > limit) errors.push(`${label} is ${value.length} chars (max ${limit})`);
};

if (!/^[a-z0-9-]{1,64}$/.test(manifest.name ?? '')) errors.push('name must be 1-64 chars of a-z, 0-9, -');
if (!/^\d+\.\d+\.\d+/.test(manifest.version ?? '')) errors.push('version must be semver');
maxLen('description', manifest.description, 4000);
maxLen('author.name', manifest.author?.name, 120);
maxLen('displayName', ui.displayName, 30);
maxLen('shortDescription', ui.shortDescription, 30);
maxLen('longDescription', ui.longDescription, 4000);
maxLen('developerName', ui.developerName, 80);
maxLen('category', ui.category, 200);
for (const key of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) {
    maxLen(key, ui[key], 1024);
    if (ui[key] && !ui[key].startsWith('https://')) errors.push(`${key} must be https`);
}
if ((ui.capabilities ?? []).length > 20) errors.push('capabilities: max 20 items');
(ui.capabilities ?? []).forEach((c, i) => maxLen(`capabilities[${i}]`, c, 120));
if ((ui.defaultPrompt ?? []).length > 3) errors.push('defaultPrompt: max 3 items');
(ui.defaultPrompt ?? []).forEach((p, i) => {
    maxLen(`defaultPrompt[${i}]`, p, 128);
    if (p.includes('@')) errors.push(`defaultPrompt[${i}] must not contain @mentions`);
});
for (const key of ['brandColor', 'brandColorDark']) {
    if (ui[key] && !/^#[0-9A-Fa-f]{6}$/.test(ui[key])) errors.push(`${key} must be #RRGGBB`);
}
for (const key of ['composerIcon', 'logo']) {
    if (!ui[key]) errors.push(`${key} is required`);
    else if (!ui[key].startsWith('./') || !existsSync(join(root, ui[key]))) errors.push(`${key} must be a ./ path that exists`);
    else if (statSync(join(root, ui[key])).size > 5 * 1024 * 1024) errors.push(`${key} is over 5 MiB`);
}
for (const [locale, t] of Object.entries(openai.publication?.translations ?? {})) {
    maxLen(`translations.${locale}.subtitle`, t.subtitle, 30);
    maxLen(`translations.${locale}.description`, t.description, 4000);
}

const cases = openai.review?.test_cases ?? {};
if ((cases.positive ?? []).length !== 5) errors.push('review needs exactly 5 positive test cases');
if ((cases.negative ?? []).length !== 3) errors.push('review needs exactly 3 negative test cases');
(cases.positive ?? []).forEach((c, i) => {
    for (const key of ['description', 'prompt', 'tools_triggered', 'expected_behavior']) {
        if (!c[key]) errors.push(`positive[${i}].${key} is required`);
    }
});

// No secrets may ship in the ZIP.
const secretPattern = /sk_live_[A-Za-z0-9_-]{10,}|Bearer\s+[A-Za-z0-9._-]{20,}/;
const scan = (dir) => {
    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) scan(path);
        else if (/\.(json|md|txt)$/.test(entry) && secretPattern.test(readFileSync(path, 'utf8'))) errors.push(`possible secret in ${path}`);
    }
};
for (const part of ['plugin.json', 'mcp.json', 'skills']) {
    const path = join(root, part);
    if (statSync(path).isDirectory()) scan(path);
    else if (secretPattern.test(readFileSync(path, 'utf8'))) errors.push(`possible secret in ${part}`);
}

if (errors.length) {
    console.error(`plugin.json failed ${errors.length} check(s):\n- ${errors.join('\n- ')}`);
    process.exit(1);
}
console.log('plugin.json passes the OpenAI submission checks');
