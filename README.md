```txt
npm install
npm run dev
```

```txt
npm run deploy
```

## News aggregation model

UNS-N is built as a safe news aggregator:

- show headline, source, date, original URL and short snippets only
- link every card to the original publisher article
- do not copy full articles or bypass paywalls
- use RSS/Atom feeds, public metadata, sitemaps or official APIs first
- add original value through Portuguese/Japanese summaries, comments, rankings and saved articles

Legal pages are available at:

- `/terms`
- `/privacy`
- `/copyright`
- `/publishers`

## Admin login

Local demo credentials:

```txt
admin@unsn.local
admin123
```

For production, configure environment variables:

```txt
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=use-a-strong-password
SESSION_COOKIE_NAME=unsn_session
```

## Feed ingestion

Configured feeds are listed at:

```txt
GET /api/feeds
```

Protected admin routes:

```txt
GET  /api/admin/feeds/:feedId/preview
POST /api/admin/feeds/:feedId/ingest
POST /api/admin/ingest
```

Current feeds include Nikkei Asia, NHK News, Folha and g1. Imported items store source, original URL, publish date, short summary when available, and thumbnail URL when the feed provides one.

## Production persistence with Cloudflare D1

Local development uses in-memory storage. For production, create a D1 database and apply the migration:

```txt
npx wrangler d1 create unsn-news
npx wrangler d1 migrations apply unsn-news
```

Then add the D1 binding to `wrangler.jsonc` using the database id returned by Cloudflare:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "unsn-news",
    "database_id": "YOUR_DATABASE_ID"
  }
]
```

With `DB` bound, article imports persist across deployments and restarts.

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
