import { defineConfig, Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

function filePersistencePlugin(): Plugin {
  const dataDir = path.resolve(__dirname, 'data');
  const dataFile = path.resolve(dataDir, 'knowledge-base.json');

  const handler = (req: any, res: any, next: any) => {
    const url = req.url?.split('?')[0];
    if (url !== '/api/data') {
      return next();
    }

    // GET /api/data -> Load permanent JSON from disk
    if (req.method === 'GET') {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(dataFile)) {
        try {
          const content = fs.readFileSync(dataFile, 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache');
          res.statusCode = 200;
          res.end(content);
          return;
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }
    }

    // POST /api/data -> Save permanent JSON to disk
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: Buffer | string) => {
        body += chunk;
      });

      req.on('end', () => {
        try {
          if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
          }

          // Validate JSON integrity before saving
          const parsed = JSON.parse(body);
          if (!parsed || !parsed.name) {
            throw new Error('Invalid knowledge tree format');
          }

          const formatted = JSON.stringify(parsed, null, 2);
          fs.writeFileSync(dataFile, formatted, 'utf-8');

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, savedAt: new Date().toISOString() }));
        } catch (err: any) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    next();
  };

  return {
    name: 'file-persistence-plugin',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

export default defineConfig({
  plugins: [filePersistencePlugin()],
  server: {
    port: 5173
  }
});
