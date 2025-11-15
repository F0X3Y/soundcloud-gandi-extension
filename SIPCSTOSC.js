// worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const client_id = url.searchParams.get('client_id');
  if (!client_id) {
    return new Response(JSON.stringify({ error: 'Missing client id' }), { status: 400 });
  }

  // /search?q=...
  if (url.pathname.endsWith('/search')) {
    const q = url.searchParams.get('q');
    if (!q) return new Response(JSON.stringify({ collection: [] }), { headers: { 'Content-Type': 'application/json' } });
    try {
      const scUrl = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(q)}&client_id=${client_id}&limit=20`;
      const res = await fetch(scUrl, { headers: { 'Authorization': `OAuth ${client_id}` } });
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'SoundCloud API error', details: e.toString() }), { status: 500 });
    }
  }

  // /resolve?url=...
  if (url.pathname.endsWith('/resolve')) {
    const scUrlParam = url.searchParams.get('url');
    if (!scUrlParam) return new Response(JSON.stringify({ error: 'Missing url parameter' }), { status: 400 });
    try {
      const scResolveUrl = `https://api.soundcloud.com/resolve?url=${encodeURIComponent(scUrlParam)}&client_id=${client_id}`;
      const res = await fetch(scResolveUrl, { headers: { 'Authorization': `OAuth ${client_id}` } });
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'SoundCloud API error', details: e.toString() }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Unknown endpoint' }), { status: 404 });
}
