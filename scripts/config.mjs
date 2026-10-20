import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const composition = JSON.parse(
  fs.readFileSync(path.join(root, 'config/composition.json'), 'utf8'),
);
export function readJSON(relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
}
