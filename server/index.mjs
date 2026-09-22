import { createServer } from 'node:http'
import { readFileSync, existsSync, createReadStream } from 'node:fs'
import { resolve, extname, sep } from 'node:path'
import { handleTmdb } from '../functions/proxy.mjs'

const root = resolve(import.meta.dirname, '..')
const dist = resolve(root, 'dist')
const dev = process.argv.includes('--dev')

// Local secrets are loaded by the server only. A deployment can set TMDB_API_KEY
// directly in its environment instead.
const envFile = resolve(root, '.env.local')
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z_0-9]*)=(.*)\s*$/)
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2')
    }
  }
}

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webmanifest': 'application/manifest+json',
}

function staticFile(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return }
  let pathname
  try { pathname = decodeURIComponent(url.pathname) } catch { res.writeHead(400).end(); return }
  const file = resolve(dist, `.${pathname}`)
  if (file !== dist && !file.startsWith(dist + sep)) { res.writeHead(404).end(); return }
  const target = existsSync(file) && extname(file) ? file : resolve(dist, 'index.html')
  if (!existsSync(target)) { res.writeHead(503).end('Bygg appen med pnpm build'); return }
  res.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream' })
  if (req.method === 'HEAD') { res.end(); return }
  createReadStream(target).pipe(res)
}

const vite = dev ? await (await import('vite')).createServer({
  root, server: { middlewareMode: true }, appType: 'spa',
}) : null

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost')
  if (url.pathname.startsWith('/api/')) { void handleTmdb(req, res, process.env.TMDB_API_KEY); return }
  if (vite) { vite.middlewares(req, res, () => res.writeHead(404).end()); return }
  staticFile(req, res, url)
})

const port = Number(process.env.PORT || (dev ? 5173 : 3000))
const host = process.env.HOST || '127.0.0.1'
server.listen(port, host, () => console.log(`Seriespicker: http://${host}:${port}/`))
