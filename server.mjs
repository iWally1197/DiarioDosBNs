import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const configuredPort = Number(process.env.PORT || 4173);
const port = Number.isInteger(configuredPort) && configuredPort > 0 && configuredPort <= 65535 ? configuredPort : 4173;
const host = process.env.HOST || '127.0.0.1';
const retiredPaths = new Set([
  '/login', '/cadastro', '/acessar-conta', '/criar-perfil', '/recuperar-senha',
  '/auth/callback', '/auth', '/conta', '/perfil', '/aluno', '/professor', '/admin',
  '/turma', '/turmas'
]);
const mime = {
  '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml',
  '.webp':'image/webp','.woff2':'font/woff2','.blend':'application/octet-stream','.pdf':'application/pdf','.mp4':'video/mp4',
  '.glb':'model/gltf-binary','.csv':'text/csv; charset=utf-8','.txt':'text/plain; charset=utf-8'
};

function send(res, status, contentType, body, extra = {}) {
  res.writeHead(status, {
    'Content-Type':contentType,
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'strict-origin-when-cross-origin',
    'X-Frame-Options':'SAMEORIGIN',
    'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy':"default-src 'self'; script-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; frame-src https://www.youtube-nocookie.com https://www.youtube.com; media-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'",
    ...extra
  });
  res.end(body);
}

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'text/plain; charset=utf-8', 'Método não permitido.', { Allow: 'GET, HEAD' });
  }
  const aliasPath = url.pathname.length > 1 ? url.pathname.replace(/\/$/, '') : url.pathname;
  if (retiredPaths.has(aliasPath.toLowerCase())) {
    res.writeHead(308, { Location: '/index.html', 'Cache-Control': 'no-store' });
    return res.end();
  }
  if (url.pathname === '/healthz') return send(res, 200, 'application/json; charset=utf-8', req.method === 'HEAD' ? '' : '{"ok":true}');
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return send(res, 400, 'text/plain; charset=utf-8', 'Endereço inválido.'); }
  if (pathname.split('/').some((part) => part.startsWith('.') && part !== '.well-known')) return send(res, 404, 'text/plain; charset=utf-8', 'Não encontrado.');
  if (pathname === '/server.mjs' || pathname === '/package.json') return send(res, 404, 'text/plain; charset=utf-8', 'Não encontrado.');

  let relative = pathname === '/' ? 'index.html' : normalize(pathname.replace(/^[/\\]+/, ''));
  let file = resolve(root, relative);
  if (file !== root && !file.startsWith(root + sep)) return send(res, 403, 'text/plain; charset=utf-8', 'Acesso negado.');
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file) || !statSync(file).isFile()) return send(res, 404, 'text/plain; charset=utf-8', 'Página não encontrada.');
  const contentType = mime[extname(file).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type':contentType,
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'strict-origin-when-cross-origin',
    'X-Frame-Options':'SAMEORIGIN',
    'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy':"default-src 'self'; script-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; frame-src https://www.youtube-nocookie.com https://www.youtube.com; media-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'"
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
});

server.listen(port, host, () => {
  console.log(`Diário dos BNs disponível em http://${host}:${port}`);
});
