import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname;
const OUT = join(ROOT, 'design/banner/background.png');

const quality = process.argv[2] ?? 'low';
const model = process.env['IMAGE_MODEL'] ?? 'gpt-image-2.5-flare';

const prompt = `Wide horizontal background illustration for a banner, risograph print style on warm cream paper (#f7ebe4) with visible paper grain and slight ink misregistration.
Subject: a faint, hand-drawn bird's-eye map of the Valley of Mexico: soft street grids, a few winding avenues, gentle contour lines of the surrounding hills, small patches of trees.
Palette limited to cream, dusty pink (#e9b9c4), muted wine red (#9d2449) at very low intensity, sage and leaf green (#8dbe3f, #1e5b45) at very low intensity, and touches of warm yellow (#f2b630).
Composition: the left 60% stays calm and very light, almost empty paper with only subtle texture and faint lines, so dark text placed there stays perfectly readable. The right 40% has a bit more map detail, still soft and low contrast.
Mood: hopeful, warm, community-made, like a printed poster from a neighborhood workshop.
Strictly no text, no letters, no numbers, no labels, no logos, no people, no monuments, no buildings in elevation, no vehicles.`;

const envFile = readFileSync(join(homedir(), '.config/openai/api.env'), 'utf8');
const apiKey = /OPENAI_API_KEY=(.+)/.exec(envFile)?.[1]?.trim();
if (!apiKey) throw new Error('No encontré OPENAI_API_KEY en ~/.config/openai/api.env');

const started = Date.now();
const response = await fetch('https://api.openai.com/v1/images/generations', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model, prompt, size: '2560x864', quality, background: 'opaque', output_format: 'png', n: 1 }),
});
const data = (await response.json()) as { data?: { b64_json?: string }[]; usage?: unknown; error?: { message: string; code?: string } };
if (!response.ok || !data.data?.[0]?.b64_json) throw new Error(`OpenAI respondió ${response.status}: ${JSON.stringify(data.error ?? data).slice(0, 600)}`);

const bytes = Buffer.from(data.data[0].b64_json, 'base64');
writeFileSync(OUT, bytes);
console.log(`${OUT.replace(ROOT, '')}: ${bytes.length} bytes, ${model}, calidad ${quality}, ${((Date.now() - started) / 1000).toFixed(1)} s`);
console.log(`uso: ${JSON.stringify(data.usage)}`);
