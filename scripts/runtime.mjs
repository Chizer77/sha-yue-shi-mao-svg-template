import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';
const require=createRequire(import.meta.url);export function dependency(name){try{return require(name);}catch{}const bases=[process.env.CODEX_NODE_MODULES,process.env.USERPROFILE&&path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')].filter(Boolean);for(const b of bases)try{return require(path.join(b,name));}catch{}throw new Error(`Missing ${name}; install it locally or set CODEX_NODE_MODULES`);}
export const playwright=dependency('playwright');export const sharp=dependency('sharp');
export const ffmpeg=process.env.FFMPEG_PATH||'ffmpeg';export const ffprobe=process.env.FFPROBE_PATH||'ffprobe';
