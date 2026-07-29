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
      const regen = () => {
        try {
          execSync('npm run data', { cwd: rootDir, stdio: 'inherit' });
          server.ws.send({ type: 'full-reload' });
        } catch {
          // keep server running; user can fix content and save again
        }
      };
      server.watcher.add(['content/banks/**', 'solutions/**']);
      server.watcher.on('change', (file) => {
        if (file.includes(`${path.sep}content${path.sep}banks${path.sep}`) || file.includes(`${path.sep}solutions${path.sep}`)) {
          regen();
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
