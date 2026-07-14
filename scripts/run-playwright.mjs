import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverUrl = 'http://127.0.0.1:5173';

async function isServerReady() {
  try {
    const response = await fetch(serverUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(server) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await isServerReady()) return;
    if (server.exitCode !== null) {
      throw new Error(`Vite exited before becoming ready (code ${server.exitCode})`);
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error('Timed out waiting for Vite');
}

async function stopServer(server) {
  if (!server || server.exitCode !== null) return;

  const exited = new Promise(resolve => {
    server.once('exit', resolve);
    setTimeout(resolve, 2_000);
  });
  server.kill();
  await exited;
  if (server.exitCode !== null) return;

  if (process.platform === 'win32') {
    await new Promise(resolve => {
      spawn('taskkill', ['/pid', String(server.pid), '/t', '/f'], { stdio: 'ignore' })
        .on('exit', resolve)
        .on('error', resolve);
    });
    return;
  }
  server.kill('SIGTERM');
}

let server;
try {
  if (!(await isServerReady())) {
    server = spawn(process.execPath, [
      path.join(root, 'node_modules/vite/bin/vite.js'),
      '--host',
      '127.0.0.1',
    ], {
      cwd: root,
      stdio: 'ignore',
    });
    await waitForServer(server);
  }

  const forwardedArgs = process.argv.slice(2).filter(argument => argument !== '--');
  const playwright = spawn(process.execPath, [
    path.join(root, 'node_modules/@playwright/test/cli.js'),
    'test',
    ...forwardedArgs,
  ], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  const exitCode = await new Promise((resolve, reject) => {
    playwright.on('exit', code => resolve(code ?? 1));
    playwright.on('error', reject);
  });
  process.exitCode = exitCode;
} finally {
  await stopServer(server);
}
