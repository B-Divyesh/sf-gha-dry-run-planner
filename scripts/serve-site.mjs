import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist/site');
const port = Number(process.env.PORT || 4173);
const appRoutes = new Set(['/', '/demo', '/privacy', '/terms']);
const types = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

createServer((request, response) => {
  const pathname = new URL(request.url || '/', `http://${request.headers.host}`).pathname;
  let status = 200;
  let file = appRoutes.has(pathname) ? join(root, 'index.html') : join(root, normalize(pathname).replace(/^\/+/, ''));
  if (pathname === '/404.html' || !existsSync(file) || !statSync(file).isFile()) {
    status = 404;
    file = join(root, '404.html');
  }
  response.writeHead(status, {
    'Content-Type': types[extname(file)] || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  });
  if (request.method === 'HEAD') response.end(); else createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => process.stdout.write(`ghaplan site at http://127.0.0.1:${port}\n`));
