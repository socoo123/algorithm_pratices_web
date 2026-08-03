import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const progressPath = path.join(__dirname, 'src/data/progress.json');

function progressSaver(): Plugin {
  return {
    name: 'progress-saver',
    configureServer(server) {
      // Writing progress.json must not trigger Vite HMR / full reload (causes page flash).
      server.watcher.unwatch(progressPath);
      server.watcher.addListener('add', (file) => {
        if (path.resolve(file) === progressPath) server.watcher.unwatch(file);
      });

      server.middlewares.use('/api/progress', (req, res, next) => {
        if (req.method === 'GET') {
          try {
            const raw = fs.readFileSync(progressPath, 'utf8');
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(raw);
          } catch {
            res.statusCode = 404;
            res.end('missing');
          }
          return;
        }
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('only POST');
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (body?.version !== 1 || typeof body.problems !== 'object') {
              res.statusCode = 400;
              res.end('invalid progress payload');
              return;
            }
            fs.mkdirSync(path.dirname(progressPath), { recursive: true });
            // Temporarily unwatch around write in case chokidar re-adds the path
            server.watcher.unwatch(progressPath);
            fs.writeFileSync(progressPath, `${JSON.stringify(body, null, 2)}\n`, 'utf8');
            server.watcher.unwatch(progressPath);
            res.statusCode = 200;
            res.end('ok');
          } catch {
            res.statusCode = 400;
            res.end('bad json');
          }
        });
        req.on('error', next);
      });
    },
  };
}

function dataWatcher(): Plugin {
  return {
    name: 'data-watcher',
    configureServer(server) {
      const rootDir = path.dirname(fileURLToPath(import.meta.url));
      let timer: ReturnType<typeof setTimeout> | null = null;
      const regen = (needsFullReload: boolean) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            execSync('npm run data', { cwd: rootDir, stdio: 'inherit' });
            // content/banks 改了题单结构需要整页刷新；
            // 仅 solutions 变更时只靠 JSON HMR + 当前题解模块更新，避免看题解时整页闪。
            if (needsFullReload) {
              server.ws.send({ type: 'full-reload' });
            }
          } catch {
            // keep server running; user can fix content and save again
          }
        }, 200);
      };
      server.watcher.add(['content/banks/**', 'solutions/**']);
      server.watcher.on('change', (file) => {
        const isContent = file.includes(`${path.sep}content${path.sep}banks${path.sep}`);
        const isSolution = file.includes(`${path.sep}solutions${path.sep}`);
        if (isContent || isSolution) {
          regen(isContent);
        }
      });
      server.watcher.on('add', (file) => {
        const isContent = file.includes(`${path.sep}content${path.sep}banks${path.sep}`);
        const isSolution = file.includes(`${path.sep}solutions${path.sep}`);
        if (isContent || isSolution) {
          // 新建题解要让表格出现「题解」链接：刷新 banks JSON 即可，不必整页重载
          regen(isContent);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), progressSaver(), dataWatcher()],
  server: {
    port: 5800,
    strictPort: true,
    watch: {
      // progress.json is written on every checkbox click — never HMR on it
      ignored: ['**/src/data/progress.json'],
    },
  },
});
