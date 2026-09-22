const tmdbBase = 'https://api.themoviedb.org/3'
const cache = new Map()
const pending = new Map()

async function readTmdb(path, key) {
  const saved = cache.get(path)
  if (saved && saved.expires > Date.now()) return saved
  if (pending.has(path)) return pending.get(path)
  const task = (async () => {
    const upstream = new URL(`${tmdbBase}${path}`)
    upstream.searchParams.set('api_key', key.trim())
    const response = await fetch(upstream, { signal: AbortSignal.timeout(12000) })
    const result = { status: response.status, body: await response.text(), expires: 0 }
    if (response.ok) {
      const minutes = path.startsWith('/watch/providers/tv') ? 1440 : path.startsWith('/discover/tv') ? 30 : 360
      result.expires = Date.now() + minutes * 60_000
      if (cache.size >= 500) cache.delete(cache.keys().next().value)
      cache.set(path, result)
    }
    return result
  })()
  pending.set(path, task)
  try { return await task } finally { pending.delete(path) }
}

export function tmdbPath(url) {
  if (url.pathname === '/api/tmdb/watch/providers/tv') {
    return '/watch/providers/tv?watch_region=SE&language=sv-SE'
  }
  if (url.pathname === '/api/tmdb/discover/tv') {
    const ids = url.searchParams.get('with_watch_providers') || ''
    const sort = url.searchParams.get('sort_by') || ''
    const genres = url.searchParams.get('with_genres') || ''
    if (!/^\d+(\|\d+)*$/.test(ids) || !['popularity.desc', 'vote_average.desc'].includes(sort)) return null
    if (genres && !/^\d+(\|\d+)*$/.test(genres)) return null
    const query = new URLSearchParams({
      watch_region: 'SE', language: 'sv-SE', with_watch_providers: ids,
      with_watch_monetization_types: 'flatrate|free|ads', sort_by: sort,
      'vote_count.gte': '20', include_adult: 'false',
    })
    if (genres) query.set('with_genres', genres)
    return `/discover/tv?${query}`
  }
  const watch = url.pathname.match(/^\/api\/tmdb\/tv\/(\d+)\/watch\/providers$/)
  if(watch)return `/tv/${watch[1]}/watch/providers?language=sv-SE`
  const details=url.pathname.match(/^\/api\/tmdb\/tv\/(\d+)$/)
  return details ? `/tv/${details[1]}?language=sv-SE` : null
}

export async function handleTmdb(req, res, key) {
  if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }).end(); return }
  const url = new URL(req.url || '/', 'http://localhost')
  const path = tmdbPath(url)
  if (!path) { res.writeHead(404).end(); return }
  if (!key?.trim()) { res.writeHead(503).end('TMDB_API_KEY saknas'); return }
  try {
    const response = await readTmdb(path, key)
    res.writeHead(response.status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
    res.end(response.body)
  } catch {
    res.writeHead(502).end('TMDB kunde inte nås')
  }
}
