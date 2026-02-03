import { createReadStream, promises as fsPromises } from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const historyFallbackConfig = {
  index: '/index.html',
  rewrites: [
    {
      from: /^\/lp\/.*$/,
      to: ({ parsedUrl }: { parsedUrl: URL }) => {
        const pathname = parsedUrl.pathname;
        return pathname.endsWith('/') ? pathname : `${pathname}`;
      },
    },
  ],
};

const lpStaticMiddleware = (root: string) => {
  return async (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
    const method = req.method || 'GET';
    if (method !== 'GET' && method !== 'HEAD') return next();

    const rawUrl = req.url?.split('?')[0] ?? '';
    if (!rawUrl.startsWith('/lp/')) return next();

    if (!rawUrl.endsWith('/')) return next();

    const normalizedUrl = `${rawUrl}index.html`;
    const filePath = path.resolve(root, 'public', normalizedUrl.replace(/^\//, ''));

    try {
      const stat = await fsPromises.stat(filePath);
      if (!stat.isFile()) return next();
    } catch {
      return next();
    }

    if (method === 'HEAD') {
      res.statusCode = 200;
      return res.end();
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const stream = createReadStream(filePath);
    stream.on('error', next);
    stream.pipe(res);
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [
      {
        name: 'lp-static-middleware',
        configureServer(server) {
          server.middlewares.use(lpStaticMiddleware(server.config.root));
        },
        configurePreviewServer(server) {
          server.middlewares.use(lpStaticMiddleware(server.config.root));
        },
      },
      react(),
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      historyApiFallback: historyFallbackConfig,
    },
    preview: {
      historyApiFallback: historyFallbackConfig,
    },
  };
});
