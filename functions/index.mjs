import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { handleTmdb } from './proxy.mjs'

const tmdbKey = defineSecret('TMDB_API_KEY')

export const tmdbProxy = onRequest(
  { region: 'europe-west1', secrets: [tmdbKey], maxInstances: 10 },
  (req, res) => handleTmdb(req, res, tmdbKey.value()),
)
