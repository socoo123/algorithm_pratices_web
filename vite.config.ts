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

function solutionApi(): Plugin {
  return {
    name: 'solution-api',
    configureServer(server) {
      // Serve solution markdown via HTTP so .md stays out of the Vite module graph.
      // (import.meta.glob + ?raw causes full page reload whenever any solutions/*.md is touched.)
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' || !req.url?.startsWith('/api/solution/')) {
          next();
          return;
        }
        const rawPath = req.url.split('?')[0] ?? '';
        const parts = rawPath.split('/').filter(Boolean); // api, solution, bankId, slug
        const bankId = parts[2];
        const slug = parts[3];
        if (!bankId || !slug || parts.length !== 4) {
          res.statusCode = 400;
          res.end('bad path');
          return;
        }
        if (!/^[a-z0-9-]+$/i.test(bankId) || !/^[a-z0-9-]+$/i.test(slug)) {
          res.statusCode = 400;
          res.end('bad id');
          return;
        }
        const file = path.join(__dirname, 'solutions', bankId, `${slug}.md`);
        try {
          const text = fs.readFileSync(file, 'utf8');
          res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.statusCode = 200;
          res.end(text);
        } catch {
          res.statusCode = 404;
          res.end('missing');
        }
      });
    },
  };
}

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
            // solutions 增删只更新 banks JSON（hasSolution），不要 full-reload。
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
        // 正文改动不影响 hasSolution，不必重写 base.json（否则 generatedAt 变了整站 HMR）
        // soft refresh 由 handleHotUpdate 发 solutions-md-update
        if (isContent) regen(true);
      });
      server.watcher.on('add', (file) => {
        const isContent = file.includes(`${path.sep}content${path.sep}banks${path.sep}`);
        const isSolution =
          file.includes(`${path.sep}solutions${path.sep}`) && file.endsWith('.md');
        if (isContent) regen(true);
        else if (isSolution) regen(false);
      });
      server.watcher.on('unlink', (file) => {
        const isContent = file.includes(`${path.sep}content${path.sep}banks${path.sep}`);
        const isSolution =
          file.includes(`${path.sep}solutions${path.sep}`) && file.endsWith('.md');
        if (isContent) regen(true);
        else if (isSolution) regen(false);
      });
    },
    handleHotUpdate({ file, server }) {
      if (!file.includes(`${path.sep}solutions${path.sep}`) || !file.endsWith('.md')) {
        return;
      }
      const rootDir = path.dirname(fileURLToPath(import.meta.url));
      const rel = path.relative(rootDir, file).split(path.sep).join('/');
      server.ws.send({
        type: 'custom',
        event: 'solutions-md-update',
        data: { path: rel },
      });
      // 空数组：不走默认 HMR / 不 page reload
      return [];
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), solutionApi(), progressSaver(), dataWatcher()],
  server: {
    port: 5800,
    strictPort: true,
    watch: {
      // progress.json：勾选时频繁写入，绝不能 HMR
      ignored: ['**/src/data/progress.json'],
    },
  },
});
