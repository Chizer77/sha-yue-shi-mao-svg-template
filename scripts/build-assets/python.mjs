import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { root } from '../config.mjs';
const tasks = { 'dark-dialogue': 'dark-dialogue.py', expressions: 'expressions.py' };
const script = tasks[process.argv[2]];
if (!script) throw Error('请选择 dark-dialogue 或 expressions');
const environment = path.join(
  root,
  '.venv',
  process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
);
const executable =
  process.env.PYTHON ||
  (fs.existsSync(environment) ? environment : process.platform === 'win32' ? 'python' : 'python3');
const child = spawn(executable, [path.join(root, 'scripts/build-assets', script)], {
  cwd: root,
  windowsHide: true,
  stdio: 'inherit',
  env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
});
child.on('error', (error) => {
  console.error('无法启动Python，请先安装依赖或设置PYTHON：' + error.message);
  process.exitCode = 1;
});
child.on('close', (code) => {
  process.exitCode = code ?? 1;
});
