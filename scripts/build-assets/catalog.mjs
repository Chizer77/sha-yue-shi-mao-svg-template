import fs from 'node:fs/promises';
import path from 'node:path';

export const generationTasks = {
  'light-dialogue': ['light-dialogue.mjs'],
  'dark-dialogue': ['python.mjs', 'dark-dialogue'],
  expressions: ['python.mjs', 'expressions'],
};

export async function loadGenerationGroups(root) {
  const [catalog, inventory] = await Promise.all(
    ['config/generated-assets.json', 'config/media.json'].map(async (file) =>
      JSON.parse(await fs.readFile(path.join(root, file), 'utf8')),
    ),
  );
  return catalog.groups.map((group) => {
    const assets = inventory.assets.filter((asset) => asset.group === group.directory);
    return {
      ...group,
      files: assets.map((asset) => asset.file),
      stages: [...new Set(assets.flatMap((asset) => asset.stages))],
    };
  });
}

async function fileState(root, file) {
  try {
    const stat = await fs.stat(path.join(root, file));
    return { file, exists: stat.isFile() && stat.size > 0, modified: stat.mtimeMs };
  } catch (error) {
    if (error.code === 'ENOENT') return { file, exists: false, modified: 0 };
    throw error;
  }
}

async function groupStatus(root, group) {
  const [outputs, sources] = await Promise.all([
    Promise.all(group.files.map((file) => fileState(root, file))),
    Promise.all(group.sources.map((source) => fileState(root, source.file))),
  ]);
  const missingFiles = outputs.filter((file) => !file.exists).map((file) => file.file),
    missingSources = sources.filter((file) => !file.exists).map((file) => file.file);
  const newestSource = Math.max(...sources.map((file) => file.modified));
  const outdated = outputs.some((file) => file.exists && file.modified < newestSource);
  return {
    ...group,
    total: outputs.length,
    existing: outputs.length - missingFiles.length,
    missingFiles,
    missingSources,
    outdated,
  };
}

export async function generationStatus(root) {
  return Promise.all((await loadGenerationGroups(root)).map((group) => groupStatus(root, group)));
}
