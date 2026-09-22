const tmdbBase = 'https://api.themoviedb.org/3'

export function tmdbPath(url) {
  if (url.pathname === '/api/tmdb/watch/providers/tv') {
    return '/watch/providers/tv?watch_region=SE&language=sv-SE'
  }
  if (url.pathname === '/api/tmdb/discover/tv') {
    const ids = url.searchParams.get('with_watch_providers') || ''
    const sort = url.searchParams.get('sort_by') || ''
    if (!/^\d+(\|\d+)*$/.test(ids) || !['popularity.desc', 'vote_average.desc'].includes(sort)) return null
    const query = new URLSearchParams({
      watch_region: 'SE', language: 'sv-SE', with_watch_providers: ids,
      with_watch_monetization_types: 'flatrate|free|ads', sort_by: sort,
      'vote_count.gte': '20', include_adult: 'false',
    })
    return `/discover/tv?${query}`
  }
  const watch = url.pathname.match(/^\/api\/tmdb\/tv\/(\d+)\/watch\/providers$/)
  return watch ? `/tv/${watch[1]}/watch/providers?language=sv-SE` : null
}

export async function handleTmdb(req, res, key) {
  if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }).end(); return }
  const url = new URL(req.url || '/', 'http://localhost')
  const path = tmdbPath(url)
  if (!path) { res.writeHead(404).end(); return }
  if (!key?.trim()) { res.writeHead(503).end('TMDB_API_KEY saknas'); return }
  try {
    const upstream = new URL(`${tmdbBase}${path}`)
    upstream.searchParams.set('api_key', key.trim())
    const response = await fetch(upstream, { signal: AbortSignal.timeout(12000) })
    res.writeHead(response.status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
    res.end(await response.text())
  } catch {
    res.writeHead(502).end('TMDB kunde inte nås')
  }
}
