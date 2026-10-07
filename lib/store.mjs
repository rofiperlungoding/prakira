// Small JSON files on disk for results that are costly to fetch and do not change: 30-year normals and
// climate-model outlooks. Open-Meteo's free tier counts a multi-decade request as many calls against a
// daily limit, so each place should be fetched once, not once per server restart.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = process.env.DATA_DIR || fileURLToPath(new URL('../data/', import.meta.url));
const file = (kind, key) => path.join(DIR, `${kind}-${key.replace(/[^0-9a-z.,-]/gi, '_')}.json`);

export function load(kind, key) {
  try {
    return JSON.parse(fs.readFileSync(file(kind, key), 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') console.error('store: cannot read', kind, key, e.message);
    return undefined;
  }
}

// A failed write only costs a refetch later, so it is logged and not thrown.
export function save(kind, key, value) {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(file(kind, key), JSON.stringify(value));
  } catch (e) {
    console.error('store: cannot write', kind, key, e.message);
  }
}
