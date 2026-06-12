const port = process.env.LOCAL_PORT || process.env.PORT || '5175'
const limit = process.env.INGEST_LIMIT || '3'
const intervalMs = Number(process.env.INGEST_INTERVAL_MS || 30 * 60 * 1000)
const watch = process.argv.includes('--watch')
const endpoint = `http://localhost:${port}/api/cron/ingest?limit=${encodeURIComponent(limit)}`

const runIngest = async () => {
  const startedAt = new Date().toISOString()
  const response = await fetch(endpoint, { method: 'POST' })
  const text = await response.text()

  if (!response.ok) {
    throw new Error(`Local ingest failed at ${startedAt}: ${response.status} ${text}`)
  }

  const payload = JSON.parse(text)
  const totals = (payload.data || []).reduce(
    (acc, feed) => ({
      fetched: acc.fetched + Number(feed.fetched || 0),
      imported: acc.imported + Number(feed.imported || 0),
      skipped: acc.skipped + Number(feed.skipped || 0)
    }),
    { fetched: 0, imported: 0, skipped: 0 }
  )

  console.log(
    `[${startedAt}] local ingest ok: fetched ${totals.fetched}, imported ${totals.imported}, skipped ${totals.skipped}`
  )
}

await runIngest()

if (watch) {
  console.log(`Watching local ingest every ${Math.round(intervalMs / 60000)} minutes on ${endpoint}`)
  setInterval(() => {
    runIngest().catch((error) => {
      console.error(error.message)
    })
  }, intervalMs)
}
