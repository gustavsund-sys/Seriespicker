import { afterEach, expect, it, vi } from 'vitest'
import { handleTmdb, tmdbPath } from './proxy.mjs'

afterEach(() => vi.unstubAllGlobals())

function response() {
  return {
    status: 200,
    headers: {},
    body: '',
    writeHead(status, headers = {}) { this.status = status; this.headers = headers; return this },
    end(body = '') { this.body = body; return this },
  }
}

it('begränsar proxyn till appens TMDB-anrop', () => {
  expect(tmdbPath(new URL('http://localhost/api/tmdb/discover/tv?with_watch_providers=8%7C119&sort_by=popularity.desc'))).toContain('/discover/tv?')
  expect(tmdbPath(new URL('http://localhost/api/tmdb/discover/tv?with_watch_providers=8%2Faccount&sort_by=popularity.desc'))).toBeNull()
  expect(tmdbPath(new URL('http://localhost/api/tmdb/account'))).toBeNull()
})

it('lägger nyckeln bara på serverns anrop till TMDB', async () => {
  const fetchMock = vi.fn(async url => {
    expect(url.origin).toBe('https://api.themoviedb.org')
    expect(url.searchParams.get('api_key')).toBe('server-secret')
    return { status: 200, text: async () => '{"results":[]}' }
  })
  vi.stubGlobal('fetch', fetchMock)
  const res = response()
  await handleTmdb({ method: 'GET', url: '/api/tmdb/watch/providers/tv' }, res, 'server-secret')
  expect(res.status).toBe(200)
  expect(res.body).toBe('{"results":[]}')
  expect(res.body).not.toContain('server-secret')
})

it('avvisar andra API-vägar och metoder', async () => {
  const unknown = response()
  await handleTmdb({ method: 'GET', url: '/api/tmdb/account' }, unknown, 'server-secret')
  expect(unknown.status).toBe(404)
  const post = response()
  await handleTmdb({ method: 'POST', url: '/api/tmdb/watch/providers/tv' }, post, 'server-secret')
  expect(post.status).toBe(405)
})
