const allowedOrigins = new Set([
  'https://diariodosbns.com.br',
  'https://www.diariodosbns.com.br',
  'https://iwally1197.github.io'
]);

function corsHeaders(request: Request): Headers {
  const origin = request.headers.get('origin') || '';
  const allowedOrigin = allowedOrigins.has(origin) ? origin : 'https://diariodosbns.com.br';
  return new Headers({
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
}

Deno.serve((request: Request) => {
  const headers = corsHeaders(request);
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  return new Response(JSON.stringify({
    error: 'O assistente por API foi desativado. Use a IA local disponível no site.'
  }), { status: 410, headers });
});
