import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import {
  getCurrentSiteUser,
  getCurrentUser,
  login,
  loginSiteUser,
  logout,
  logoutSiteUser,
  requireAuth,
  type SessionUser
} from './auth'
import { categories, feedSources, sources, type Article, type Category, type Locale } from './data'
import { fetchFeedXml, ingestEnabledFeeds, ingestFeed, parseFeed } from './ingest'
import {
  renderCopyrightPage,
  renderAdminPage,
  renderAdminLoginPage,
  renderLoginPage,
  renderPrivacyPage,
  renderPublisherPolicyPage,
  renderSectionPage,
  renderTermsPage,
  renderUserPage
} from './pages'
import { findStoredArticle, listStoredArticles, saveArticle, type D1Database } from './storage'

type AppEnv = {
  Bindings: {
    ADMIN_EMAIL?: string
    ADMIN_PASSWORD?: string
    CRON_SECRET?: string
    SESSION_COOKIE_NAME?: string
    USER_COOKIE_NAME?: string
    DB?: D1Database
  }
  Variables: {
    user: SessionUser
  }
}

const app = new Hono<AppEnv>()
app.use('/static/*', serveStatic({ root: './' }))

const runFeedImport = async (context: { env: AppEnv['Bindings'] }, limit = 6) => {
  const existingArticles = await listStoredArticles(context)
  return ingestEnabledFeeds(limit, existingArticles, (article) => saveArticle(context, article))
}

// favicon — inline SVG as data URI to avoid 404
app.get('/favicon.ico', (c) => {
  return new Response(null, { status: 204 })
})

app.get('/terms', (c) => c.html(renderTermsPage()))
app.get('/privacy', (c) => c.html(renderPrivacyPage()))
app.get('/copyright', (c) => c.html(renderCopyrightPage()))
app.get('/publishers', (c) => c.html(renderPublisherPolicyPage()))

const normalizeLocale = (value: string | null): Locale => {
  if (value === 'ja' || value === 'en') return value
  return 'pt'
}

const normalizeCategory = (value: string | null): Category | undefined => {
  const allowed = new Set<Category>(categories.map((category) => category.id))
  return value && allowed.has(value as Category) ? (value as Category) : undefined
}

const publicArticle = (article: Article, locale: Locale) => ({
  id: article.id,
  slug: article.slug,
  category: article.category,
  sourceId: article.sourceId,
  sourceName: article.sourceName,
  url: article.url ?? null,
  imageUrl: article.imageUrl ?? null,
  publishedAt: article.publishedAt,
  fetchedAt: article.fetchedAt ?? null,
  originalLanguage: article.originalLanguage ?? null,
  needsTranslation: article.needsTranslation ?? false,
  importance: article.importance,
  imageIcon: article.imageIcon,
  tags: article.tags,
  title: article.title[locale],
  summary: article.summary[locale],
  body: article.body[locale],
  translations: {
    pt: {
      title: article.title.pt,
      summary: article.summary.pt
    },
    en: {
      title: article.title.en,
      summary: article.summary.en
    },
    ja: {
      title: article.title.ja,
      summary: article.summary.ja
    }
  }
})

app.get('/api/health', (c) => {
  return c.json({
    ok: true,
    service: 'unsn-news-backend',
    timestamp: new Date().toISOString()
  })
})

app.get('/api/categories', (c) => {
  const locale = normalizeLocale(c.req.query('lang') ?? null)
  return c.json({
    data: categories.map((category) => ({
      id: category.id,
      label: category.label[locale]
    }))
  })
})

app.get('/api/sources', (c) => {
  return c.json({ data: sources })
})

app.get('/api/feeds', (c) => {
  return c.json({ data: feedSources })
})

app.get('/api/articles', async (c) => {
  const locale = normalizeLocale(c.req.query('lang') ?? null)
  const category = normalizeCategory(c.req.query('category') ?? null)
  const query = (c.req.query('q') ?? '').trim().toLowerCase()
  const allArticles = await listStoredArticles(c)

  const filtered = allArticles
    .filter((article) => !article.originalLanguage || article.originalLanguage === locale)
    .filter((article) => !category || article.category === category)
    .filter((article) => {
      if (!query) return true

      const searchable = [
        article.title.pt,
        article.title.ja,
        article.summary.pt,
        article.summary.ja,
        article.sourceName,
        ...article.tags
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(query)
    })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))

  return c.json({
    data: filtered.map((article) => publicArticle(article, locale)),
    meta: {
      locale,
      category: category ?? null,
      query: query || null,
      count: filtered.length
    }
  })
})

app.get('/api/articles/:slug', async (c) => {
  const locale = normalizeLocale(c.req.query('lang') ?? null)
  const article = await findStoredArticle(c, c.req.param('slug'))

  if (!article) {
    return c.json({ error: 'Article not found' }, 404)
  }

  return c.json({ data: publicArticle(article, locale) })
})

app.get('/section/:category', async (c) => {
  const locale = normalizeLocale(c.req.query('lang') ?? null)
  const category = normalizeCategory(c.req.param('category')) ?? 'top'
  const allArticles = await listStoredArticles(c)
  const sectionLabel = categories.find((item) => item.id === category)?.label[locale] ?? category

  const filtered = allArticles
    .filter((article) => !article.originalLanguage || article.originalLanguage === locale)
    .filter((article) => category === 'media' || article.category === category)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))

  return c.html(
    renderSectionPage({
      category,
      title: sectionLabel,
      locale,
      articles: filtered,
      sources
    })
  )
})

app.get('/api/me', (c) => {
  return c.json({ user: getCurrentSiteUser(c) ?? getCurrentUser(c) })
})

app.post('/api/user/login', async (c) => {
  const payload = await c.req.json<{ email?: string; name?: string }>().catch(() => null)
  const user = payload?.email ? loginSiteUser(c, payload.email, payload.name) : null

  if (!user) {
    return c.json({ error: 'Invalid email' }, 400)
  }

  return c.json({ user })
})

app.post('/api/auth/login', async (c) => {
  const payload = await c.req.json<{ email?: string; password?: string }>().catch(() => null)
  const user = payload?.email && payload?.password ? login(c, payload.email, payload.password) : null

  if (!user) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  return c.json({ user })
})

app.post('/api/auth/logout', (c) => {
  logout(c)
  logoutSiteUser(c)
  return c.json({ ok: true })
})

app.post('/api/cron/ingest', async (c) => {
  const secret = c.env.CRON_SECRET
  const providedSecret = c.req.header('x-cron-secret') ?? c.req.query('secret')

  if (secret && providedSecret !== secret) {
    return c.json({ error: 'Invalid cron secret' }, 401)
  }

  const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 6) || 6, 1), 12)
  const results = await runFeedImport(c, limit)
  return c.json({ data: results })
})

app.post('/api/admin/articles', requireAuth, async (c) => {
  const payload = await c.req.json<Partial<Article>>().catch(() => null)

  if (!payload?.slug || !payload.title?.pt || !payload.title?.ja || !payload.summary?.pt || !payload.summary?.ja) {
    return c.json(
      {
        error:
          'Missing required fields: slug, title.pt, title.ja, summary.pt, summary.ja'
      },
      400
    )
  }

  const article: Article = {
    id: `art-${Date.now()}`,
    slug: payload.slug,
    category: normalizeCategory(payload.category ?? null) ?? 'top',
    sourceId: payload.sourceId ?? 'manual',
    sourceName: payload.sourceName ?? 'UNS-N Editorial',
    url: payload.url,
    imageUrl: payload.imageUrl,
    publishedAt: payload.publishedAt ?? new Date().toISOString(),
    fetchedAt: payload.fetchedAt,
    originalLanguage: payload.originalLanguage,
    needsTranslation: payload.needsTranslation ?? false,
    importance: payload.importance ?? 'normal',
    imageIcon: payload.imageIcon ?? 'UN',
    tags: payload.tags ?? [],
    title: {
      pt: payload.title.pt,
      en: payload.title.en ?? payload.title.pt,
      ja: payload.title.ja
    },
    summary: {
      pt: payload.summary.pt,
      en: payload.summary.en ?? payload.summary.pt,
      ja: payload.summary.ja
    },
    body: {
      pt: payload.body?.pt ?? payload.summary.pt,
      en: payload.body?.en ?? payload.summary.en ?? payload.summary.pt,
      ja: payload.body?.ja ?? payload.summary.ja
    }
  }

  await saveArticle(c, article)

  return c.json({ data: publicArticle(article, 'pt') }, 201)
})

app.get('/api/admin/feeds/:feedId/preview', requireAuth, async (c) => {
  const feed = feedSources.find((item) => item.id === c.req.param('feedId'))

  if (!feed) {
    return c.json({ error: 'Feed not found' }, 404)
  }

  const xml = await fetchFeedXml(feed.url).catch((error) => null)

  if (!xml) {
    return c.json({ error: 'Feed preview failed' }, 502)
  }

  return c.json({
    feed,
    data: parseFeed(xml).slice(0, 10)
  })
})

app.post('/api/admin/feeds/:feedId/ingest', requireAuth, async (c) => {
  const feed = feedSources.find((item) => item.id === c.req.param('feedId'))

  if (!feed) {
    return c.json({ error: 'Feed not found' }, 404)
  }

  const existingArticles = await listStoredArticles(c)
  const result = await ingestFeed(feed, 12, existingArticles, (article) => saveArticle(c, article))
  return c.json({ data: result })
})

app.post('/api/admin/ingest', requireAuth, async (c) => {
  const results = await runFeedImport(c, 12)
  return c.json({ data: results })
})

app.get('/admin', async (c) => {
  const user = getCurrentUser(c)

  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return c.redirect('/admin/login')
  }

  const allArticles = await listStoredArticles(c)
  return c.html(renderAdminPage(user, feedSources, [], allArticles.length))
})

app.post('/admin/ingest', async (c) => {
  const user = getCurrentUser(c)

  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return c.redirect('/admin/login')
  }

  const results = await runFeedImport(c, 12)
  const allArticles = await listStoredArticles(c)

  return c.html(renderAdminPage(user, feedSources, results, allArticles.length))
})

app.get('/login', (c) => {
  if (getCurrentSiteUser(c)) {
    return c.redirect('/me')
  }

  return c.html(renderLoginPage())
})

app.post('/login', async (c) => {
  const form = await c.req.formData()
  const email = String(form.get('email') ?? '')
  const name = String(form.get('name') ?? '')
  const user = loginSiteUser(c, email, name)

  if (!user) {
    return c.html(renderLoginPage('Informe um email valido.'), 401)
  }

  return c.redirect('/me')
})

app.get('/admin/login', (c) => {
  const user = getCurrentUser(c)

  if (user && (user.role === 'admin' || user.role === 'editor')) {
    return c.redirect('/admin')
  }

  return c.html(renderAdminLoginPage())
})

app.post('/admin/login', async (c) => {
  const form = await c.req.formData()
  const email = String(form.get('email') ?? '')
  const password = String(form.get('password') ?? '')
  const user = login(c, email, password)

  if (!user) {
    return c.html(renderAdminLoginPage('Email ou senha invalidos.'), 401)
  }

  return c.redirect('/admin')
})

app.get('/me', (c) => {
  const user = getCurrentSiteUser(c)

  if (!user) {
    return c.redirect('/login')
  }

  return c.html(renderUserPage(user))
})

app.post('/logout', (c) => {
  logout(c)
  logoutSiteUser(c)
  return c.redirect('/login')
})

app.get('/', (c) => {
  const user = getCurrentSiteUser(c) ?? getCurrentUser(c)

  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>UNS→N（アンシーン）</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%231a73e8'/><text x='16' y='23' text-anchor='middle' font-size='18' font-family='Arial' font-weight='bold' fill='white'>U</text></svg>"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet"/>
  <style>
/* ─────────────────────────────────────────────
   RESET & BASE
───────────────────────────────────────────── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:14px;scroll-behavior:smooth}
body{
  font-family:'Inter','Noto Sans JP',sans-serif;
  background:#f2f2f2;
  color:#202124;
  -webkit-font-smoothing:antialiased;
  min-height:100vh;
}
a{text-decoration:none;color:inherit}
button{cursor:pointer;border:none;background:none;font-family:inherit}
img{display:block;max-width:100%}

/* ─────────────────────────────────────────────
   VARIABLES
───────────────────────────────────────────── */
:root{
  --bg:#f2f2f2;
  --surface:#ffffff;
  --border:#e0e0e0;
  --border-light:#f0f0f0;
  --text:#202124;
  --text-2:#5f6368;
  --text-3:#9aa0a6;
  --blue:#1a73e8;
  --blue-light:#e8f0fe;
  --red:#d93025;
  --green:#137333;
  --amber:#e37400;
  --chip-bg:#f1f3f4;
  --chip-hover:#e8eaed;
  --nav-h:56px;
  --radius:8px;
  --shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.08);
  --shadow-hover:0 4px 12px rgba(0,0,0,.15),0 2px 6px rgba(0,0,0,.1);
}

/* ─────────────────────────────────────────────
   SCROLLBAR
───────────────────────────────────────────── */
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#bdc1c6;border-radius:3px}

/* ─────────────────────────────────────────────
   TOP NAV
───────────────────────────────────────────── */
.top-nav{
  position:sticky;top:0;z-index:200;
  background:#fff;
  border-bottom:1px solid var(--border);
  height:var(--nav-h);
  display:flex;align-items:center;
}
.top-nav-inner{
  width:100%;max-width:1280px;margin:0 auto;
  padding:0 16px;
  display:flex;align-items:center;gap:12px;
}

/* Logo */
.logo{display:flex;align-items:center;gap:8px;flex-shrink:0;margin-right:8px}
.logo-text{
  font-size:17px;font-weight:700;letter-spacing:-.3px;
  color:var(--text);
}
.logo-text span{color:var(--blue)}
.logo-kana{font-size:10px;color:var(--text-3);font-weight:500;letter-spacing:.5px}

/* Search bar */
.search-wrap{
  flex:1;max-width:680px;position:relative;
}
.search-input{
  width:100%;height:38px;
  background:var(--chip-bg);
  border:1px solid transparent;
  border-radius:24px;
  padding:0 16px 0 40px;
  font-size:14px;color:var(--text);
  transition:all .2s;
  outline:none;
}
.search-input:focus{
  background:#fff;
  border-color:var(--blue);
  box-shadow:0 0 0 3px rgba(26,115,232,.15);
}
.search-icon{
  position:absolute;left:13px;top:50%;transform:translateY(-50%);
  color:var(--text-3);font-size:15px;pointer-events:none;
}

/* Lang switcher */
.lang-sw{
  display:flex;gap:2px;
  background:var(--chip-bg);
  border-radius:20px;padding:3px;
  flex-shrink:0;margin-left:auto;
}
.lang-btn{
  padding:4px 12px;border-radius:16px;
  font-size:11px;font-weight:600;
  color:var(--text-2);transition:all .15s;
}
.lang-btn.active{background:#fff;color:var(--blue);box-shadow:0 1px 3px rgba(0,0,0,.15)}
.lang-btn:hover:not(.active){background:var(--chip-hover);color:var(--text)}
.admin-nav-link{
  height:30px;padding:0 12px;border-radius:16px;
  display:inline-flex;align-items:center;justify-content:center;
  background:var(--blue);color:#fff;font-size:12px;font-weight:800;
  flex-shrink:0;
}
.admin-nav-link:hover{background:#1557b0}

/* ─────────────────────────────────────────────
   TOPIC TABS  (Google News "For You / Japan / World…")
───────────────────────────────────────────── */
.topic-bar{
  background:#fff;
  border-bottom:1px solid var(--border);
  position:sticky;top:var(--nav-h);z-index:190;
}
.topic-bar-inner{
  max-width:1280px;margin:0 auto;
  padding:0 8px;
  display:flex;align-items:center;
  overflow-x:auto;scrollbar-width:none;gap:0;
}
.topic-bar-inner::-webkit-scrollbar{display:none}
.tab{
  display:flex;align-items:center;gap:6px;
  padding:0 16px;height:44px;
  font-size:13px;font-weight:500;
  color:var(--text-2);white-space:nowrap;
  border-bottom:3px solid transparent;
  transition:all .15s;flex-shrink:0;
}
.tab svg{width:16px;height:16px;opacity:.7}
.tab:hover{color:var(--text);background:var(--chip-bg)}
.tab.active{color:var(--blue);border-bottom-color:var(--blue);font-weight:600}
.tab.active svg{opacity:1}

/* ─────────────────────────────────────────────
   PAGE LAYOUT
───────────────────────────────────────────── */
.page{
  max-width:1280px;margin:0 auto;
  padding:16px 16px 40px;
  display:grid;
  grid-template-columns:1fr 340px;
  gap:16px;
  align-items:start;
}

/* ─────────────────────────────────────────────
   SECTION HEADER  (Google News "Top stories" style)
───────────────────────────────────────────── */
.sec-head{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:10px;
}
.sec-title{
  font-size:13px;font-weight:600;color:var(--text-2);
  letter-spacing:.3px;text-transform:uppercase;
}
.sec-more{
  font-size:12px;font-weight:600;color:var(--blue);
  padding:4px 8px;border-radius:4px;
  transition:background .15s;
}
.sec-more:hover{background:var(--blue-light)}

/* ─────────────────────────────────────────────
   CARD — BASE
───────────────────────────────────────────── */
.card{
  background:var(--surface);
  border-radius:var(--radius);
  box-shadow:var(--shadow);
  overflow:hidden;
  transition:box-shadow .2s,transform .2s;
  cursor:pointer;
}
.card:hover{
  box-shadow:var(--shadow-hover);
  transform:translateY(-2px);
}

/* ─────────────────────────────────────────────
   HEADLINE CLUSTER  (top story = big + 2 related)
   Google News uses a "cluster" pattern
───────────────────────────────────────────── */
.cluster{
  background:var(--surface);
  border-radius:var(--radius);
  box-shadow:var(--shadow);
  overflow:hidden;
  margin-bottom:16px;
  transition:box-shadow .2s;
}
.cluster:hover{box-shadow:var(--shadow-hover)}

.cluster-hero{
  display:grid;
  grid-template-columns:1fr 180px;
  gap:0;
  padding:16px;
  border-bottom:1px solid var(--border-light);
  cursor:pointer;
}
.cluster-hero:hover .ch-title{color:var(--blue)}
.cluster-hero-text{padding-right:12px}
.cluster-hero-img{
  width:180px;height:108px;border-radius:6px;
  object-fit:cover;background:var(--chip-bg);
  display:flex;align-items:center;justify-content:center;
  font-size:24px;font-weight:900;color:var(--text-3);letter-spacing:.4px;flex-shrink:0;
  overflow:hidden;
}
.cluster-hero-img img{width:100%;height:100%;object-fit:cover}

.ch-source{
  font-size:11px;font-weight:600;color:var(--text-2);
  margin-bottom:5px;display:flex;align-items:center;gap:5px;
}
.ch-source-dot{
  width:14px;height:14px;border-radius:50%;
  display:inline-flex;align-items:center;justify-content:center;
  font-size:8px;font-weight:900;color:#fff;flex-shrink:0;
}
.ch-title{
  font-size:17px;font-weight:700;line-height:1.3;
  letter-spacing:-.2px;margin-bottom:6px;
  transition:color .15s;
}
.ch-lead{
  font-size:12.5px;color:var(--text-2);line-height:1.6;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.ch-time{font-size:11px;color:var(--text-3);margin-top:6px}

/* Related items inside cluster */
.cluster-related{display:flex;flex-direction:column}
.cluster-rel-item{
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 16px;gap:10px;
  border-bottom:1px solid var(--border-light);
  cursor:pointer;transition:background .15s;
}
.cluster-rel-item:last-child{border-bottom:none}
.cluster-rel-item:hover{background:var(--chip-bg)}
.cri-text{flex:1;min-width:0}
.cri-source{font-size:10px;font-weight:600;color:var(--text-3);margin-bottom:2px}
.cri-title{
  font-size:13px;font-weight:500;line-height:1.35;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.cri-img{
  width:72px;height:48px;border-radius:4px;background:var(--chip-bg);
  flex-shrink:0;display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:900;color:var(--text-3);letter-spacing:.3px;
}
.cluster-more{
  padding:10px 16px;
  font-size:12px;font-weight:600;color:var(--blue);
  display:flex;align-items:center;gap:4px;
  cursor:pointer;transition:background .15s;border-top:1px solid var(--border-light);
}
.cluster-more:hover{background:var(--blue-light)}

/* ─────────────────────────────────────────────
   CARD GRID  (2-col, 3-col)
───────────────────────────────────────────── */
.card-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.card-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px}
.card-grid-auto{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-bottom:16px}

/* Standard news card */
.news-card{padding:12px}
.nc-img{
  width:100%;height:110px;border-radius:5px;
  background:var(--chip-bg);margin-bottom:10px;
  display:flex;align-items:center;justify-content:center;
  font-size:18px;font-weight:900;color:var(--text-3);letter-spacing:.4px;overflow:hidden;
}
.nc-source{font-size:10px;font-weight:700;color:var(--text-2);margin-bottom:4px;display:flex;align-items:center;gap:4px}
.nc-title{font-size:13.5px;font-weight:600;line-height:1.35;margin-bottom:5px}
.nc-lead{font-size:11.5px;color:var(--text-2);line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.nc-time{font-size:11px;color:var(--text-3);margin-top:5px}

/* Horizontal news card (list-style) */
.hcard{
  display:flex;gap:10px;align-items:flex-start;
  padding:12px;
  background:var(--surface);border-radius:var(--radius);
  box-shadow:var(--shadow);margin-bottom:8px;
  cursor:pointer;transition:box-shadow .2s,transform .2s;
}
.hcard:hover{box-shadow:var(--shadow-hover);transform:translateY(-1px)}
.hcard-img{
  width:80px;height:56px;border-radius:4px;
  background:var(--chip-bg);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:900;color:var(--text-3);letter-spacing:.3px;
}
.hcard-body{flex:1;min-width:0}
.hcard-source{font-size:10px;font-weight:700;color:var(--text-2);margin-bottom:3px}
.hcard-title{font-size:13px;font-weight:600;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:3px}
.hcard-time{font-size:11px;color:var(--text-3)}

/* ─────────────────────────────────────────────
   CHIP / TAG
───────────────────────────────────────────── */
.chip{
  display:inline-flex;align-items:center;gap:4px;
  padding:3px 10px;border-radius:12px;
  font-size:11px;font-weight:600;
  background:var(--chip-bg);color:var(--text-2);
  transition:background .15s;cursor:pointer;
}
.chip:hover{background:var(--chip-hover)}
.chip-blue{background:var(--blue-light);color:var(--blue)}
.chip-red{background:#fce8e6;color:var(--red)}
.chip-green{background:#e6f4ea;color:var(--green)}
.chip-amber{background:#fef7e0;color:var(--amber)}

/* Lang snippet block */
.lang-snip{
  margin-top:8px;padding:8px 10px;
  background:#f8f9fa;border-left:3px solid var(--blue);
  border-radius:0 4px 4px 0;
  font-size:11.5px;line-height:1.65;color:var(--text-2);
  font-family:'Noto Sans JP',sans-serif;
}
.lang-snip-label{
  font-size:9px;font-weight:700;letter-spacing:1px;
  text-transform:uppercase;color:var(--blue);margin-bottom:3px;
}

/* ─────────────────────────────────────────────
   SOURCE PILL GRID  (Google News "Follow" style)
───────────────────────────────────────────── */
.source-pill-row{
  display:flex;flex-wrap:wrap;gap:8px;
  margin-bottom:4px;
}
.source-pill{
  display:flex;align-items:center;gap:7px;
  padding:7px 12px 7px 8px;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:20px;
  font-size:12px;font-weight:600;
  color:var(--text);
  transition:all .15s;cursor:pointer;
  box-shadow:0 1px 2px rgba(0,0,0,.06);
}
.source-pill:hover{
  border-color:var(--blue);
  box-shadow:0 2px 6px rgba(26,115,232,.2);
  color:var(--blue);
}
.source-pill-icon{
  width:22px;height:22px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:10px;font-weight:900;color:#fff;flex-shrink:0;
}
.sp-follow{
  font-size:10px;font-weight:600;color:var(--blue);margin-left:2px;
}

/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */
.sidebar{display:flex;flex-direction:column;gap:16px}

/* Sidebar widget */
.widget{
  background:var(--surface);
  border-radius:var(--radius);
  box-shadow:var(--shadow);
  overflow:hidden;
}
.widget-head{
  padding:12px 16px 8px;
  font-size:13px;font-weight:700;
  color:var(--text);
  border-bottom:1px solid var(--border-light);
  display:flex;align-items:center;gap:6px;
}
.widget-head-icon{
  min-width:34px;height:18px;border-radius:4px;background:var(--chip-bg);
  display:inline-flex;align-items:center;justify-content:center;
  padding:0 6px;font-size:9px;font-weight:900;color:var(--text-3);letter-spacing:.4px;
}

/* Mini story list */
.mini-story{
  display:flex;gap:8px;align-items:flex-start;
  padding:10px 16px;border-bottom:1px solid var(--border-light);
  cursor:pointer;transition:background .15s;
  color:inherit;text-decoration:none;
}
.mini-story:last-child{border-bottom:none}
.mini-story:hover{background:var(--chip-bg)}
.ms-num{
  font-size:22px;font-weight:800;
  color:#e8eaed;line-height:1;
  flex-shrink:0;width:24px;text-align:center;padding-top:1px;
}
.ms-body{flex:1;min-width:0}
.ms-source{font-size:10px;font-weight:600;color:var(--text-3);margin-bottom:2px}
.ms-title{font-size:12.5px;font-weight:600;line-height:1.35;color:var(--text)}
.ms-time{font-size:10px;color:var(--text-3);margin-top:2px}

/* Quick-link grid */
.ql-grid{
  display:grid;grid-template-columns:1fr 1fr;gap:1px;
  background:var(--border-light);
}
.ql-item{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:4px;padding:14px 8px;
  background:var(--surface);
  cursor:pointer;transition:background .15s;
  text-align:center;
}
.ql-item:hover{background:var(--chip-bg)}
.ql-icon{
  min-width:36px;height:28px;border-radius:5px;background:var(--chip-bg);
  display:inline-flex;align-items:center;justify-content:center;
  padding:0 6px;font-size:10px;font-weight:900;color:var(--text-3);letter-spacing:.2px;
}
.ql-label{font-size:11px;font-weight:600;color:var(--text);line-height:1.3}
.ql-sub{font-size:10px;color:var(--text-3)}

/* Language info widget */
.lang-widget-body{padding:12px 16px}
.lang-pills{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.lang-pill{
  padding:4px 10px;border-radius:12px;border:1px solid var(--border);
  font-size:11px;font-weight:600;color:var(--text-2);background:var(--chip-bg);
}

/* ─────────────────────────────────────────────
   ADMIN GUIDE CARDS
───────────────────────────────────────────── */
.admin-cluster{
  background:var(--surface);border-radius:var(--radius);
  box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px;
}
.admin-item{
  padding:14px 16px;border-bottom:1px solid var(--border-light);
  cursor:pointer;transition:background .15s;
}
.admin-item:last-child{border-bottom:none}
.admin-item:hover{background:var(--chip-bg)}
.ai-head{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.ai-icon{
  width:34px;height:34px;border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  font-size:10px;font-weight:900;color:var(--text-2);letter-spacing:.3px;flex-shrink:0;
}
.ai-badge{
  font-size:9px;font-weight:700;letter-spacing:.8px;
  text-transform:uppercase;padding:2px 7px;border-radius:10px;
}
.badge-red{background:#fce8e6;color:var(--red)}
.badge-amber{background:#fef7e0;color:var(--amber)}
.badge-green{background:#e6f4ea;color:var(--green)}
.badge-blue{background:var(--blue-light);color:var(--blue)}
.ai-title{font-size:14px;font-weight:700;line-height:1.3;color:var(--text)}
.ai-title-en{font-size:11px;color:var(--text-3);margin-top:1px}
.ai-body{font-size:12px;color:var(--text-2);line-height:1.65}
.ai-bullets{list-style:none;margin-top:6px;display:flex;flex-direction:column;gap:4px}
.ai-bullets li{display:flex;gap:6px;font-size:11.5px;color:var(--text-2);align-items:flex-start}
.ai-bullet-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;margin-top:5px}
.ai-source{
  font-size:10px;color:var(--text-3);margin-top:8px;
  display:flex;align-items:center;gap:4px;
}
.ai-source a{color:var(--blue)}
.ai-source a:hover{text-decoration:underline}

/* ─────────────────────────────────────────────
   TICKER BAR
───────────────────────────────────────────── */
.ticker{
  background:var(--blue);color:#fff;
  display:flex;align-items:center;height:30px;overflow:hidden;
}
.ticker-label{
  background:rgba(0,0,0,.2);
  font-size:9px;font-weight:800;letter-spacing:2px;
  padding:0 12px;height:100%;
  display:flex;align-items:center;flex-shrink:0;white-space:nowrap;
}
.ticker-track{
  display:flex;gap:48px;white-space:nowrap;
  animation:ticker 40s linear infinite;
  padding-left:24px;
}
.ticker-item{font-size:11.5px;font-weight:500;opacity:.92}
@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

/* ─────────────────────────────────────────────
   LIVE FEED FROM SAFE AGGREGATION
───────────────────────────────────────────── */
.live-feed-band{
  background:#fff;
  border-radius:var(--radius);
  box-shadow:var(--shadow);
  overflow:hidden;
  margin-bottom:16px;
}
.live-feed-head{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:14px 16px;border-bottom:1px solid var(--border-light);
}
.live-feed-title{font-size:13px;font-weight:800;color:var(--text);letter-spacing:.2px}
.live-feed-meta{font-size:11px;color:var(--text-3)}
.live-feed-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--border-light)}
.topic-feed-list{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;
  margin:0 0 16px;
}
.live-card{
  background:#fff;padding:12px;display:grid;grid-template-columns:92px 1fr;gap:12px;
  min-height:116px;
  border-radius:var(--radius);box-shadow:var(--shadow);
}
.live-card:hover .live-title{color:var(--blue)}
.live-thumb{
  width:92px;height:92px;border-radius:6px;background:var(--chip-bg);
  display:flex;align-items:center;justify-content:center;overflow:hidden;
  font-size:22px;font-weight:800;color:var(--text-3);
}
.live-thumb img{width:100%;height:100%;object-fit:cover}
.live-source{font-size:10px;font-weight:800;color:var(--text-2);margin-bottom:4px}
.live-title{font-size:13px;font-weight:700;line-height:1.35;transition:color .15s}
.live-summary{font-size:11.5px;color:var(--text-2);line-height:1.5;margin-top:5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.live-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px}
.live-time{font-size:10px;color:var(--text-3)}
.original-link{font-size:11px;font-weight:800;color:var(--blue);white-space:nowrap}
.aggregator-note{font-size:10.5px;color:var(--text-3);padding:10px 16px;background:#fafafa;border-top:1px solid var(--border-light)}
.prototype-static{display:none}
.sec-head[id]{scroll-margin-top:112px}
.section-featured{margin-bottom:12px}

/* ─────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────── */
footer{
  background:#fff;border-top:1px solid var(--border);
  padding:28px 16px 20px;
  margin-top:8px;
}
.footer-inner{max-width:1280px;margin:0 auto}
.footer-row{
  display:flex;gap:40px;flex-wrap:wrap;
  margin-bottom:20px;
}
.footer-col-title{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text-2);margin-bottom:10px}
.footer-links{display:flex;flex-direction:column;gap:6px}
.footer-link{font-size:12px;color:var(--text-2);transition:color .15s}
.footer-link:hover{color:var(--blue)}
.footer-bottom{
  border-top:1px solid var(--border-light);padding-top:14px;
  font-size:11px;color:var(--text-3);
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;
}
.footer-logo{font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px}
.footer-logo span{color:var(--blue)}
.footer-desc{font-size:11.5px;color:var(--text-2);line-height:1.65;max-width:260px}

/* ─────────────────────────────────────────────
   RESPONSIVE
───────────────────────────────────────────── */
@media(max-width:960px){
  .page{grid-template-columns:1fr}
  .card-grid-3{grid-template-columns:1fr 1fr}
  .cluster-hero{grid-template-columns:1fr}
  .cluster-hero-img{display:none}
}
@media(max-width:600px){
  .top-nav-inner{gap:8px}
  .search-wrap{display:none}
  .card-grid-2,.card-grid-3{grid-template-columns:1fr}
  .live-feed-list,.topic-feed-list{grid-template-columns:1fr}
  .footer-row{flex-direction:column;gap:20px}
}
  </style>
</head>
<body>

<!-- ══════════════════════════════
     TOP NAV
══════════════════════════════ -->
<nav class="top-nav" role="banner">
  <div class="top-nav-inner">
    <div class="logo">
      <div>
        <div class="logo-text">UNS<span>→</span>N</div>
        <div class="logo-kana">アンシーン</div>
      </div>
    </div>

    <div class="search-wrap">
      <span class="search-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      </span>
      <input class="search-input" type="search" placeholder="ニュース・情報を検索..." aria-label="検索"/>
    </div>

    <div class="lang-sw">
      <button class="lang-btn active" onclick="setLang('pt')">PT</button>
      <button class="lang-btn" onclick="setLang('en')">EN</button>
      <button class="lang-btn" onclick="setLang('ja')">日本語</button>
    </div>
    <a class="admin-nav-link" href="${user ? (user.role === 'admin' || user.role === 'editor' ? '/admin' : '/me') : '/login'}">${user ? (user.role === 'admin' || user.role === 'editor' ? 'Admin' : 'Minha pagina') : 'Login'}</a>
  </div>
</nav>

<!-- ══════════════════════════════
     TOPIC TABS
══════════════════════════════ -->
<div class="topic-bar" role="navigation" aria-label="トピック">
  <div class="topic-bar-inner">
    <button class="tab active" onclick="setTab(this,'top')">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      トップ
    </button>
    <button class="tab" onclick="setTab(this,'business')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
      ビジネス
    </button>
    <button class="tab" onclick="setTab(this,'life')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      生活・行政
    </button>
    <button class="tab" onclick="setTab(this,'global')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      ブラジル・南米
    </button>
    <button class="tab" onclick="setTab(this,'media')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></svg>
      メディア一覧
    </button>
    <button class="tab" onclick="setTab(this,'admin')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      自治体・行政
    </button>
  </div>
</div>

<!-- TICKER -->
<div class="ticker" aria-live="polite">
  <div class="ticker-label">速報</div>
  <div style="overflow:hidden;flex:1">
    <div class="ticker-track" id="breaking-ticker-track" aria-hidden="true">
      <span class="ticker-item">UNS-N · Carregando noticias de hoje...</span>
      <span class="ticker-item">・</span>
      <span class="ticker-item">UNS-N · Carregando noticias de hoje...</span>
      <span class="ticker-item">・</span>
    </div>
  </div>
</div>

<!-- ══════════════════════════════
     MAIN PAGE GRID
══════════════════════════════ -->
<div class="page">

<!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     LEFT / MAIN COLUMN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
<main>

  <section class="live-feed-band" aria-live="polite">
    <div class="live-feed-head">
      <div>
        <div class="live-feed-title">Live Feed · ニュースリンク</div>
        <div class="live-feed-meta">Headlines, source attribution and original article links</div>
      </div>
      <button class="sec-more" onclick="loadLiveFeed()">Atualizar</button>
    </div>
    <div class="live-feed-list" id="live-feed-list"></div>
    <div class="aggregator-note">
      UNS→N mostra metadados e resumos curtos para descoberta. O artigo completo abre sempre no site original.
    </div>
  </section>

  <!-- ────────────────────────────
       TOP STORIES  CLUSTER
  ──────────────────────────────── -->
  <div class="sec-head">
    <span class="sec-title">トップニュース</span>
    <a class="sec-more" href="/section/top?lang=pt" data-section-more="top">すべて見る →</a>
  </div>
  <div id="featured-clusters"></div>
  <div class="topic-feed-list" data-topic-feed="top"></div>

  <!-- ────────────────────────────
       BUSINESS & TECH  (card grid)
  ──────────────────────────────── -->
  <div class="sec-head" id="business" style="margin-top:8px">
    <span class="sec-title">ビジネス・テクノロジー</span>
    <a class="sec-more" href="/section/business?lang=pt" data-section-more="business">すべて見る →</a>
  </div>
  <div class="section-featured" data-section-featured="business"></div>
  <div class="topic-feed-list" data-topic-feed="business"></div>

  <div class="card-grid-3 prototype-static">
    <div class="card news-card">
      <div class="nc-img">IND</div>
      <div class="nc-source">
        <span class="ch-source-dot" style="background:#e37400;font-size:8px">IMARC</span>
        IMARC Research
      </div>
      <div class="nc-title">スマート製造市場、2034年に3兆円へ — CAGR 15.2%で急拡大</div>
      <div class="nc-lead">AIとIoTで動く工場が急増。2025年の¥8,400億から9年で3兆円規模に。外国人エンジニアへの需要が急拡大。</div>
      <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">
        <span class="chip chip-amber" style="font-size:10px">製造DX</span>
        <span class="chip" style="font-size:10px">AI</span>
      </div>
      <div class="nc-time">2026年6月</div>
    </div>

    <div class="card news-card">
      <div class="nc-img">TC</div>
      <div class="nc-source">
        <span class="ch-source-dot" style="background:#1a73e8;font-size:8px">TC</span>
        TechCrunch / 東京都
      </div>
      <div class="nc-title">SusHi Tech Tokyo 2026：AI・ロボット・宇宙で500社が集結</div>
      <div class="nc-lead">4月27〜29日開催。政府の5年10兆円スタートアップ計画が加速。グローバル人材の需要が拡大。</div>
      <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">
        <span class="chip chip-blue" style="font-size:10px">スタートアップ</span>
        <span class="chip" style="font-size:10px">ロボット</span>
      </div>
      <div class="nc-time">2026年4月</div>
    </div>

    <div class="card news-card">
      <div class="nc-img">AUTO</div>
      <div class="nc-source">
        <span class="ch-source-dot" style="background:#137333;font-size:8px">JR</span>
        JR Automation
      </div>
      <div class="nc-title">産業自動化市場2,210億ドル突破 — コボット・デジタルツインが主役に</div>
      <div class="nc-lead">協働ロボット（コボット）とAI予測保全が製造現場の標準に。外国人エンジニアの必須スキルへ。</div>
      <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">
        <span class="chip" style="font-size:10px">自動化</span>
        <span class="chip" style="font-size:10px">コボット</span>
      </div>
      <div class="nc-time">2026年3月</div>
    </div>
  </div>

  <!-- ────────────────────────────
       MEDIA SOURCE SECTION
  ──────────────────────────────── -->
  <div class="sec-head" id="media" style="margin-top:8px">
    <span class="sec-title">メディアをフォロー</span>
    <a class="sec-more" href="/section/media?lang=pt" data-section-more="media">一覧を見る →</a>
  </div>
  <div class="section-featured" data-section-featured="media"></div>

  <!-- 全国紙・経済紙 -->
  <div class="widget" style="margin-bottom:10px">
    <div class="widget-head">
      <span class="widget-head-icon">MEDIA</span> 日本の主要紙・経済紙
    </div>
    <div style="padding:14px 16px 10px">
      <div class="source-pill-row">
        <a href="https://www.nikkei.com" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#d4a017">日</span>
          日本経済新聞
        </a>
        <a href="https://asia.nikkei.com" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#1a73e8">N</span>
          Nikkei Asia
        </a>
        <a href="https://www.asahi.com" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#d93025">朝</span>
          朝日新聞
        </a>
        <a href="https://www.yomiuri.co.jp" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#374151">読</span>
          読売新聞
        </a>
        <a href="https://mainichi.jp" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#b45309">毎</span>
          毎日新聞
        </a>
        <a href="https://www.sankei.com" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#166534">産</span>
          産経新聞
        </a>
        <a href="https://www.japantimes.co.jp" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#1d4ed8">JT</span>
          The Japan Times
        </a>
        <a href="https://nhkworld.nhk.or.jp" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#5b21b6">N</span>
          NHK World
        </a>
        <a href="https://www3.nhk.or.jp/news/easy/" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#c2410c">や</span>
          NHK やさしい日本語
        </a>
        <a href="https://toyokeizai.net" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#991b1b">東</span>
          東洋経済オンライン
        </a>
        <a href="https://diamond.jp" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#c2410c">ダ</span>
          ダイヤモンド・オンライン
        </a>
        <a href="https://newspicks.com" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#166534">NP</span>
          NewsPicks
        </a>
        <a href="https://techcrunch.com/tag/japan" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#1a73e8">TC</span>
          TechCrunch Japan
        </a>
        <a href="https://jp.reuters.com" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#1e40af">R</span>
          ロイター日本語版
        </a>
        <a href="https://www.bloomberg.co.jp" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#0f172a">BB</span>
          Bloomberg Japan
        </a>
      </div>
    </div>
  </div>

  <!-- ブラジル・ポルトガル語メディア -->
  <div class="widget" style="margin-bottom:10px">
    <div class="widget-head">
      <span class="widget-head-icon">PT</span> ブラジル・ポルトガル語メディア
    </div>
    <div style="padding:14px 16px 10px">
      <div class="source-pill-row">
        <a href="https://www.folha.uol.com.br" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#1d4ed8">F</span>
          Folha de S.Paulo
        </a>
        <a href="https://oglobo.globo.com" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#991b1b">G</span>
          O Globo
        </a>
        <a href="https://valor.globo.com" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#166534">V</span>
          Valor Econômico
        </a>
        <a href="https://www.estadao.com.br" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#c2410c">E</span>
          O Estado de S. Paulo
        </a>
        <a href="https://www.infomoney.com.br" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#1e40af">IM</span>
          InfoMoney
        </a>
        <a href="https://nhkworld.nhk.or.jp/pt/" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#5b21b6">NHK</span>
          NHK Brasil (PT)
        </a>
      </div>
    </div>
  </div>

  <!-- ────────────────────────────
       GLOBAL FEED
  ──────────────────────────────── -->
  <div class="sec-head" id="global" style="margin-top:8px">
    <span class="sec-title">ブラジル・南米 グローバルフィード</span>
    <a class="sec-more" href="/section/global?lang=pt" data-section-more="global">すべて見る →</a>
  </div>
  <div class="section-featured" data-section-featured="global"></div>
  <div class="topic-feed-list" data-topic-feed="global"></div>

  <div class="cluster prototype-static">
    <div class="cluster-hero">
      <div class="cluster-hero-text">
        <div class="ch-source">
          <span class="ch-source-dot" style="background:#166534">R</span>
          Reuters / Nikkei Asia
        </div>
        <div class="ch-title">日本・メルコスールEPA交渉が正式スタート — 日ブラジル経済が新章へ</div>
        <div class="ch-lead">2026年5月26日、日本とメルコスール（ブラジル・アルゼンチン等）が経済連携協定の交渉を開始。ポルトガル語人材の価値が商社・エネルギー業界で急上昇。</div>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
          <span class="chip chip-green">通商</span>
          <span class="chip">EPA</span>
          <span class="chip chip-blue">Brazil</span>
        </div>
        <div class="lang-snip">
          <div class="lang-snip-label">日本語サマリー（職場で使える）</div>
          日本とブラジルを含む南米4か国（メルコスール）が経済連携協定の交渉を開始しました。日本はブラジルから石油・農産物の輸入増加を、ブラジルは日本製自動車の関税引き下げを目指します。ポルトガル語が話せる専門家の価値が日本の商社・エネルギー業界でさらに高まります。
        </div>
        <div class="ch-time">2026年5月26日 · Reuters</div>
      </div>
      <div class="cluster-hero-img">BR-JP</div>
    </div>
    <div class="cluster-related">
      <div class="cluster-rel-item">
        <div class="cri-text">
          <div class="cri-source">Kyodo News · May 18, 2026</div>
          <div class="cri-title">ブラジル外相「日本への石油輸出拡大の準備ができている」エネルギー安保で急接近</div>
        </div>
        <div class="cri-img">EN</div>
      </div>
      <div class="cluster-rel-item">
        <div class="cri-text">
          <div class="cri-source">EU Trade / EY · May 2026</div>
          <div class="cri-title">EU・メルコスール協定発効 — ブラジルの再生エネルギー産業が急成長</div>
        </div>
        <div class="cri-img">ESG</div>
      </div>
    </div>
    <div class="cluster-more">
      関連記事をもっと見る（4件）
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
    </div>
  </div>

  <!-- ────────────────────────────
       ADMIN / VISA GUIDE
  ──────────────────────────────── -->
  <div class="sec-head" id="life" style="margin-top:8px">
    <span class="sec-title">生活・行政・ビザ</span>
    <a class="sec-more" href="/section/life?lang=pt" data-section-more="life">すべて見る →</a>
  </div>
  <div class="section-featured" data-section-featured="life"></div>
  <div class="topic-feed-list" data-topic-feed="life"></div>

  <div class="admin-cluster prototype-static">

    <div class="admin-item">
      <div class="ai-head">
        <div class="ai-icon" style="background:#fce8e6">ID</div>
        <div>
          <span class="ai-badge badge-red">6月14日施行</span>
          <div class="ai-title">在留カード＋マイナンバー統合 — 新「特定在留カード」</div>
          <div class="ai-title-en">New Specified Residence Card · Jun 14, 2026</div>
        </div>
      </div>
      <div class="ai-body">在留カードとマイナンバーカードが1枚に。現行カードは有効期限まで使用可能。次回更新から自動切替。</div>
      <ul class="ai-bullets">
        <li><span class="ai-bullet-dot" style="background:#34a853"></span>現行カードは期限まで継続OK</li>
        <li><span class="ai-bullet-dot" style="background:#34a853"></span>入管局1か所で手続き完結</li>
        <li><span class="ai-bullet-dot" style="background:#fbbc04"></span>ICチップに保険情報連携（オプトアウト可）</li>
      </ul>
      <div class="ai-source">
        出典：入管庁 / Fragomen (Mar 2026) ·
        <a href="https://www.fragomen.com/insights/japan-new-integrated-specified-residence-card-to-launch.html" target="_blank">原文を読む ↗</a>
      </div>
    </div>

    <div class="admin-item">
      <div class="ai-head">
        <div class="ai-icon" style="background:#fef7e0">LAW</div>
        <div>
          <span class="ai-badge badge-amber">国会審議中</span>
          <div class="ai-title">労働基準法 大改正（40年ぶり）</div>
          <div class="ai-title-en">Labour Standards Act Major Reform · 2026</div>
        </div>
      </div>
      <div class="ai-body">AI・リモートワーク・ギグ経済への対応を目的とした大改正。外国人就労者への多言語説明義務化も検討中。</div>
      <ul class="ai-bullets">
        <li><span class="ai-bullet-dot" style="background:#fbbc04"></span>残業代計算ルール見直し（裁量労働拡大案）</li>
        <li><span class="ai-bullet-dot" style="background:#34a853"></span>有給休暇取得義務強化（案：10日→14日）</li>
        <li><span class="ai-bullet-dot" style="background:#34a853"></span>外国人への多言語説明義務化へ</li>
      </ul>
      <div class="ai-source">
        出典：Paul Hastings (Feb 2026) ·
        <a href="https://www.paulhastings.com/insights/practice-area-articles/japan" target="_blank">原文を読む ↗</a>
      </div>
    </div>

    <div class="admin-item">
      <div class="ai-head">
        <div class="ai-icon" style="background:#e6f4ea">SSW</div>
        <div>
          <span class="ai-badge badge-green">拡大中</span>
          <div class="ai-title">特定技能ビザ（SSW）2026年最新動向</div>
          <div class="ai-title-en">Specified Skilled Worker Visa · 2026 Updates</div>
        </div>
      </div>
      <div class="ai-body">特定技能2号は更新無制限・家族帯同可。永住への有力ルート。ポルトガル語対応試験センターも増設。</div>
      <ul class="ai-bullets">
        <li><span class="ai-bullet-dot" style="background:#34a853"></span>2号：更新無制限＋家族帯同可（永住への道）</li>
        <li><span class="ai-bullet-dot" style="background:#34a853"></span>PT語対応試験センター：名古屋・浜松に増設</li>
        <li><span class="ai-bullet-dot" style="background:#fbbc04"></span>飲食分野が外国人枠の上限に接近（約46,000人）</li>
      </ul>
      <div class="ai-source">
        出典：Global Law Experts (May 2026) ·
        <a href="https://www.ssw.go.jp/en/" target="_blank">公式SSWポータル ↗</a>
      </div>
    </div>

  </div><!-- /admin-cluster -->

  <!-- ────────────────────────────
       GOVERNMENT / MUNICIPALITY LINKS
  ──────────────────────────────── -->
  <div class="sec-head" id="admin" style="margin-top:8px">
    <span class="sec-title">行政窓口・自治体</span>
    <a class="sec-more" href="/section/admin?lang=pt" data-section-more="admin">すべて見る →</a>
  </div>

  <div class="widget" style="margin-bottom:10px">
    <div class="widget-head"><span class="widget-head-icon">GOV</span> 主要行政窓口（公式）</div>
    <div style="padding:14px 16px 10px">
      <div class="source-pill-row">
        <a href="https://www.moj.go.jp/isa/" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#1a73e8">ISA</span>
          出入国在留管理庁
        </a>
        <a href="https://www.mhlw.go.jp/english/" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#166534">MHLW</span>
          厚生労働省
        </a>
        <a href="https://www.nta.go.jp/english/" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#b45309">TAX</span>
          国税庁（税務）
        </a>
        <a href="https://www.digital.go.jp/en/policies/mynumber/" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#5b21b6">ID</span>
          デジタル庁（マイナ）
        </a>
        <a href="https://www.nenkin.go.jp/international/" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#991b1b">PEN</span>
          日本年金機構
        </a>
        <a href="https://www.hellowork.mhlw.go.jp" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#c2410c">JOB</span>
          ハローワーク
        </a>
        <a href="https://www.ssw.go.jp/en/" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#0369a1">SSW</span>
          特定技能SSWポータル
        </a>
      </div>
    </div>
  </div>

  <div class="widget" style="margin-bottom:16px">
    <div class="widget-head"><span class="widget-head-icon">CITY</span> 主要都市・自治体（外国人向け窓口）</div>
    <div style="padding:14px 16px 10px">
      <div class="source-pill-row">
        <a href="https://www.tokyo-icc.jp" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#1e40af">TKY</span>
          東京都国際交流委員会
        </a>
        <a href="https://www.city.hamamatsu.shizuoka.jp/foreign/" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#b45309">HM</span>
          浜松市国際課
        </a>
        <a href="https://www.city.toyohashi.lg.jp/foreigners" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#166534">TYH</span>
          豊橋市外国人支援
        </a>
        <a href="https://www.pref.aichi.jp/soshiki/tabunka/" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#991b1b">AIC</span>
          愛知県多文化共生
        </a>
        <a href="https://www.pref.shizuoka.jp/kurashikankyo/tabunka/" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#4c1d95">SZK</span>
          静岡県多文化共生
        </a>
        <a href="https://www.city.nagoya.jp/en/category/828-0-0-0-0-0-0-0-0-0.html" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#c2410c">NGY</span>
          名古屋市国際課
        </a>
        <a href="https://www.city.toyota.aichi.jp/multilingual/" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#0369a1">TYT</span>
          豊田市多文化共生
        </a>
        <a href="https://www.city.oizumi.gunma.jp/0000000466.html" target="_blank" rel="noopener" class="source-pill">
          <span class="source-pill-icon" style="background:#065f46">OIZ</span>
          大泉町（群馬）
        </a>
      </div>
    </div>
  </div>

</main>

<!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     RIGHT SIDEBAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
<aside class="sidebar">

  <!-- Quick Access -->
  <div class="widget">
    <div class="widget-head"><span class="widget-head-icon">LINKS</span> クイックアクセス</div>
    <div class="ql-grid">
      <a href="https://www.moj.go.jp/isa/" target="_blank" rel="noopener" class="ql-item">
        <span class="ql-icon">ISA</span>
        <span class="ql-label">入管庁</span>
        <span class="ql-sub">ビザ・在留</span>
      </a>
      <a href="https://www3.nhk.or.jp/news/easy/" target="_blank" rel="noopener" class="ql-item">
        <span class="ql-icon">NHK</span>
        <span class="ql-label">NHK やさしい</span>
        <span class="ql-sub">易しい日本語</span>
      </a>
      <a href="https://www.nta.go.jp/english/" target="_blank" rel="noopener" class="ql-item">
        <span class="ql-icon">TAX</span>
        <span class="ql-label">国税庁</span>
        <span class="ql-sub">税金・申告</span>
      </a>
      <a href="https://www.nenkin.go.jp/international/" target="_blank" rel="noopener" class="ql-item">
        <span class="ql-icon">PEN</span>
        <span class="ql-label">年金機構</span>
        <span class="ql-sub">年金・保険</span>
      </a>
      <a href="https://www.ssw.go.jp/en/" target="_blank" rel="noopener" class="ql-item">
        <span class="ql-icon">SSW</span>
        <span class="ql-label">特定技能SSW</span>
        <span class="ql-sub">就労ビザ</span>
      </a>
      <a href="https://nhkworld.nhk.or.jp/pt/" target="_blank" rel="noopener" class="ql-item">
        <span class="ql-icon">PT</span>
        <span class="ql-label">NHK Brasil</span>
        <span class="ql-sub">Português</span>
      </a>
    </div>
  </div>

  <!-- 今週の注目 -->
  <div class="widget">
    <div class="widget-head"><span class="widget-head-icon">RANK</span> 今週の注目</div>
    <div id="weekly-highlight-list">
      <div class="mini-story">
        <div class="ms-num">1</div>
        <div class="ms-body">
          <div class="ms-source">UNS-N</div>
          <div class="ms-title">Carregando noticias da semana...</div>
          <div class="ms-time">...</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 求人トレンド -->
  <div class="widget">
    <div class="widget-head"><span class="widget-head-icon">JOBS</span> 求人トレンド 2026</div>
    <div style="padding:10px 16px">
      <div class="hcard" style="box-shadow:none;border:1px solid var(--border);margin-bottom:8px;border-radius:6px">
        <div class="hcard-img">DX</div>
        <div class="hcard-body">
          <div class="hcard-source" style="color:var(--red);font-weight:700">需要急増 +42%</div>
          <div class="hcard-title">製造DXエンジニア</div>
          <div style="font-size:11px;color:#137333;font-weight:700">¥5.5M – ¥9.0M</div>
          <div style="display:flex;gap:3px;margin-top:3px;flex-wrap:wrap">
            <span class="chip" style="font-size:9px;padding:1px 6px">IoT</span>
            <span class="chip" style="font-size:9px;padding:1px 6px">AI</span>
            <span class="chip" style="font-size:9px;padding:1px 6px">日本語N3+</span>
          </div>
        </div>
      </div>
      <div class="hcard" style="box-shadow:none;border:1px solid var(--border);margin-bottom:8px;border-radius:6px">
        <div class="hcard-img">PT</div>
        <div class="hcard-body">
          <div class="hcard-source" style="color:var(--red);font-weight:700">需要急増 +38%</div>
          <div class="hcard-title">海外事業開拓（PT語）</div>
          <div style="font-size:11px;color:#137333;font-weight:700">¥6.0M – ¥12.0M</div>
          <div style="display:flex;gap:3px;margin-top:3px;flex-wrap:wrap">
            <span class="chip" style="font-size:9px;padding:1px 6px">Português</span>
            <span class="chip" style="font-size:9px;padding:1px 6px">商社</span>
          </div>
        </div>
      </div>
      <div class="hcard" style="box-shadow:none;border:1px solid var(--border);border-radius:6px">
        <div class="hcard-img">PM</div>
        <div class="hcard-body">
          <div class="hcard-source" style="color:var(--red);font-weight:700">最高需要 +55%</div>
          <div class="hcard-title">建設DX PM</div>
          <div style="font-size:11px;color:#137333;font-weight:700">¥5.0M – ¥8.5M</div>
          <div style="display:flex;gap:3px;margin-top:3px;flex-wrap:wrap">
            <span class="chip" style="font-size:9px;padding:1px 6px">BIM</span>
            <span class="chip" style="font-size:9px;padding:1px 6px">SSW2号</span>
          </div>
        </div>
      </div>
      <div style="font-size:10px;color:var(--text-3);text-align:center;margin-top:8px">求人データは今後のUNS→N Jobsで拡充予定</div>
    </div>
  </div>

  <!-- 言語設定 -->
  <div class="widget">
    <div class="widget-head"><span class="widget-head-icon">LANG</span> 3言語対応</div>
    <div class="lang-widget-body">
      <div style="font-size:12px;color:var(--text-2);line-height:1.65">
        UNS→Nは全記事を3言語でお届けすることを目指しています。
      </div>
      <div class="lang-pills">
        <span class="lang-pill">JP 日本語</span>
        <span class="lang-pill">PT Português</span>
        <span class="lang-pill">EN English</span>
      </div>
    </div>
  </div>

</aside>

</div><!-- /page -->

<!-- ══════════════════════════════
     FOOTER
══════════════════════════════ -->
<footer>
  <div class="footer-inner">
    <div class="footer-row">
      <div style="max-width:260px">
        <div class="footer-logo">UNS<span>→</span>N <span style="font-size:11px;color:var(--text-3);font-weight:400">アンシーン</span></div>
        <p class="footer-desc">日本で働く・暮らす日系ブラジル人・外国人プロフェッショナルのための次世代ビジネスメディア。3言語で届けます。</p>
      </div>
      <div>
        <div class="footer-col-title">主要メディア</div>
        <div class="footer-links">
          <a href="https://www.nikkei.com" target="_blank" class="footer-link">日本経済新聞</a>
          <a href="https://www.asahi.com" target="_blank" class="footer-link">朝日新聞</a>
          <a href="https://www.japantimes.co.jp" target="_blank" class="footer-link">The Japan Times</a>
          <a href="https://nhkworld.nhk.or.jp" target="_blank" class="footer-link">NHK World</a>
          <a href="https://www.folha.uol.com.br" target="_blank" class="footer-link">Folha de S.Paulo</a>
        </div>
      </div>
      <div>
        <div class="footer-col-title">行政・ビザ</div>
        <div class="footer-links">
          <a href="https://www.moj.go.jp/isa/" target="_blank" class="footer-link">出入国在留管理庁</a>
          <a href="https://www.mhlw.go.jp" target="_blank" class="footer-link">厚生労働省</a>
          <a href="https://www.nta.go.jp" target="_blank" class="footer-link">国税庁</a>
          <a href="https://www.ssw.go.jp/en/" target="_blank" class="footer-link">特定技能SSWポータル</a>
        </div>
      </div>
      <div>
        <div class="footer-col-title">UNS→N</div>
        <div class="footer-links">
          <a href="#" class="footer-link">サービス概要</a>
          <a href="#" class="footer-link">パートナー募集</a>
          <a href="/privacy" class="footer-link">プライバシーポリシー</a>
          <a href="/terms" class="footer-link">利用規約</a>
          <a href="/copyright" class="footer-link">Copyright / Removal</a>
          <a href="/publishers" class="footer-link">Publisher Policy</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 UNS→N（アンシーン） — Concept Prototype</span>
      <span>Nikkei Brasileiro no Japão · 在日外国人コミュニティ</span>
    </div>
  </div>
</footer>

<script>
const params=new URLSearchParams(window.location.search);
let currentLang=(function(lang){return lang==='ja'||lang==='en'?lang:'pt';})(params.get('lang'));

function escapeHtml(value){
  return String(value||'').replace(/[&<>"']/g,function(ch){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
  });
}

function timeAgo(dateValue){
  const time=new Date(dateValue).getTime();
  if(!time)return '';
  const diff=Math.max(0,Date.now()-time);
  const minutes=Math.floor(diff/60000);
  if(minutes<60)return minutes+' min';
  const hours=Math.floor(minutes/60);
  if(hours<24)return hours+' h';
  return Math.floor(hours/24)+' d';
}

function isToday(dateValue){
  const date=new Date(dateValue);
  if(!date.getTime())return false;
  const now=new Date();
  return date.getFullYear()===now.getFullYear()&&
    date.getMonth()===now.getMonth()&&
    date.getDate()===now.getDate();
}

function isWithinDays(dateValue, days){
  const date=new Date(dateValue);
  if(!date.getTime())return false;
  const diff=Date.now()-date.getTime();
  return diff>=0&&diff<=days*24*60*60*1000;
}

function categoryLabel(category){
  const labels={
    top:'TOP',
    business:'BUS',
    life:'LIFE',
    global:'BR-JP',
    media:'MEDIA',
    admin:'GOV'
  };
  return labels[category]||'NEWS';
}

function breakingEmptyText(){
  return {
    pt:'UNS-N · Nenhuma noticia de hoje importada ainda',
    en:'UNS-N · No imported breaking updates yet today',
    ja:'UNS-N · 本日の速報はまだインポートされていません'
  }[currentLang];
}

function tickerItemsHtml(items){
  if(!items.length){
    const text=breakingEmptyText();
    return '<span class="ticker-item">'+escapeHtml(text)+'</span><span class="ticker-item">・</span>'+
      '<span class="ticker-item">'+escapeHtml(text)+'</span><span class="ticker-item">・</span>';
  }

  const entries=items.concat(items);
  return entries.map(function(item){
    return '<span class="ticker-item">'+escapeHtml(categoryLabel(item.category))+' · '+escapeHtml(item.title)+'</span>'+
      '<span class="ticker-item">・</span>';
  }).join('');
}

async function loadBreakingTicker(){
  const target=document.getElementById('breaking-ticker-track');
  if(!target)return;
  try{
    const res=await fetch('/api/articles?lang='+encodeURIComponent(currentLang));
    const payload=await res.json();
    const all=(payload.data||[]).filter(function(item){return item.url;});
    const todays=all.filter(function(item){return isToday(item.publishedAt);});
    const items=(todays.length?todays:all).slice(0,8);
    target.innerHTML=tickerItemsHtml(items);
  }catch(err){
    const fallback={
      pt:'UNS-N · Nao foi possivel carregar o ticker',
      en:'UNS-N · Could not load ticker updates',
      ja:'UNS-N · 速報を読み込めませんでした'
    }[currentLang];
    target.innerHTML='<span class="ticker-item">'+escapeHtml(fallback)+'</span><span class="ticker-item">・</span>'+
      '<span class="ticker-item">'+escapeHtml(fallback)+'</span><span class="ticker-item">・</span>';
  }
}

function feedCardHtml(item){
  const image=item.imageUrl?'<img src="'+escapeHtml(item.imageUrl)+'" alt=""/>':escapeHtml(item.imageIcon||'UN');
  const summary=item.summary&&item.summary!==item.title?'<div class="live-summary">'+escapeHtml(item.summary)+'</div>':'';
  const link=item.url
    ? '<a class="original-link" href="'+escapeHtml(item.url)+'" target="_blank" rel="noopener noreferrer">Original ↗</a>'
    : '<span class="live-time">UNS-N</span>';

  return '<article class="live-card">'+
    '<div class="live-thumb">'+image+'</div>'+
    '<div>'+
      '<div class="live-source">'+escapeHtml(item.sourceName)+'</div>'+
      '<div class="live-title">'+escapeHtml(item.title)+'</div>'+
      summary+
      '<div class="live-actions">'+
        '<span class="live-time">'+escapeHtml(timeAgo(item.publishedAt))+'</span>'+
        link+
      '</div>'+
    '</div>'+
  '</article>';
}

function miniStoryHtml(item,index){
  const href=item.url||('/section/'+encodeURIComponent(item.category||'top')+'?lang='+encodeURIComponent(currentLang));
  return '<a class="mini-story" href="'+escapeHtml(href)+'" target="_blank" rel="noopener noreferrer">'+
    '<div class="ms-num">'+escapeHtml(String(index+1))+'</div>'+
    '<div class="ms-body">'+
      '<div class="ms-source">'+escapeHtml(item.sourceName||'UNS-N')+' · '+escapeHtml(categoryLabel(item.category))+'</div>'+
      '<div class="ms-title">'+escapeHtml(item.title)+'</div>'+
      '<div class="ms-time">'+escapeHtml(timeAgo(item.publishedAt))+'</div>'+
    '</div>'+
  '</a>';
}

function featuredClusterHtml(item){
  const image=item.imageUrl?'<img src="'+escapeHtml(item.imageUrl)+'" alt=""/>':escapeHtml(item.imageIcon||'UN');
  const tags=(item.tags||[]).slice(0,3).map(function(tag){
    return '<span class="chip chip-blue">'+escapeHtml(tag)+'</span>';
  }).join('');
  const note=currentLang==='ja'
    ? 'UNS→Nは見出し・短い要約・出典リンクのみを表示します。全文は配信元でお読みください。'
    : currentLang==='en'
      ? 'UNS-N shows headlines, short summaries and source links. Read the full story on the original site.'
      : 'UNS-N mostra titulo, resumo curto e link da fonte. Leia o texto completo no site original.';

  return '<div class="cluster">'+
    '<a class="cluster-hero" href="'+escapeHtml(item.url||'#')+'" target="_blank" rel="noopener noreferrer">'+
      '<div class="cluster-hero-text">'+
        '<div class="ch-source">'+
          '<span class="ch-source-dot" style="background:#1a73e8">'+escapeHtml((item.sourceName||'U').slice(0,1))+'</span>'+
          escapeHtml(item.sourceName||'UNS-N')+
        '</div>'+
        '<div class="ch-title">'+escapeHtml(item.title)+'</div>'+
        '<div class="ch-lead">'+escapeHtml(item.summary||'')+'</div>'+
        '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">'+tags+'</div>'+
        '<div class="lang-snip">'+
          '<div class="lang-snip-label">'+(currentLang==='ja'?'出典リンク':'Fonte original')+'</div>'+
          escapeHtml(note)+
        '</div>'+
        '<div class="ch-time">'+escapeHtml(timeAgo(item.publishedAt))+' · Original ↗</div>'+
      '</div>'+
      '<div class="cluster-hero-img">'+image+'</div>'+
    '</a>'+
  '</div>';
}

function emptyFeedHtml(category){
  const messages={
    top:{pt:'Nenhuma noticia em portugues no Top ainda.',en:'No English top stories yet.',ja:'トップの日本語記事はまだありません。'},
    business:{pt:'Nenhuma noticia de negocios em portugues ainda.',en:'No English business stories yet.',ja:'ビジネスの日本語記事はまだありません。'},
    global:{pt:'Nenhuma noticia Brasil/global em portugues ainda.',en:'No English Brazil/global stories yet.',ja:'ブラジル・グローバルの日本語記事はまだありません。'},
    life:{pt:'Nenhuma noticia de vida/admin em portugues ainda.',en:'No English life/admin stories yet.',ja:'生活・行政の日本語記事はまだありません。'}
  };
  const msg=(messages[category]||messages.top)[currentLang]||messages.top.pt;
  const hint={
    pt:'Use /admin para importar feeds em portugues, como NHK World Radio Japan Portugues.',
    en:'Use /admin to import English feeds, such as Nikkei Asia.',
    ja:'Adminで日本語フィードをインポートしてください。'
  }[currentLang];
  return '<div class="live-card"><div class="live-thumb">UN</div><div><div class="live-source">UNS-N</div><div class="live-title">'+escapeHtml(msg)+'</div><div class="live-summary">'+escapeHtml(hint)+'</div></div></div>';
}

async function loadLiveFeed(){
  const target=document.getElementById('live-feed-list');
  if(!target)return;
  target.innerHTML='<div class="live-card"><div class="live-thumb">...</div><div><div class="live-source">UNS-N</div><div class="live-title">Carregando noticias...</div></div></div>';
  try{
    const res=await fetch('/api/articles?lang='+encodeURIComponent(currentLang));
    const payload=await res.json();
    const items=(payload.data||[]).filter(function(item){return item.url;}).slice(0,4);
    if(items.length===0){
      target.innerHTML='<div class="live-card"><div class="live-thumb">UN</div><div><div class="live-source">UNS-N</div><div class="live-title">Nenhuma noticia importada ainda.</div><div class="live-summary">Use a rota protegida /api/admin/ingest para importar feeds RSS configurados.</div></div></div>';
      return;
    }
    target.innerHTML=items.map(feedCardHtml).join('');
  }catch(err){
    target.innerHTML='<div class="live-card"><div class="live-thumb">!</div><div><div class="live-source">UNS-N</div><div class="live-title">Nao foi possivel carregar o feed.</div></div></div>';
  }
}

async function loadWeeklyHighlights(){
  const target=document.getElementById('weekly-highlight-list');
  if(!target)return;
  target.innerHTML='<div class="mini-story"><div class="ms-num">1</div><div class="ms-body"><div class="ms-source">UNS-N</div><div class="ms-title">Carregando noticias da semana...</div><div class="ms-time">...</div></div></div>';
  try{
    const res=await fetch('/api/articles?lang='+encodeURIComponent(currentLang));
    const payload=await res.json();
    const all=(payload.data||[]).filter(function(item){return item.url;});
    const week=all.filter(function(item){return isWithinDays(item.publishedAt,7);});
    const items=(week.length?week:all).slice(0,5);
    if(items.length===0){
      const empty={pt:'Nenhuma noticia da semana ainda.',en:'No weekly highlights yet.',ja:'今週の注目記事はまだありません。'}[currentLang];
      target.innerHTML='<div class="mini-story"><div class="ms-num">1</div><div class="ms-body"><div class="ms-source">UNS-N</div><div class="ms-title">'+escapeHtml(empty)+'</div><div class="ms-time">Admin</div></div></div>';
      return;
    }
    target.innerHTML=items.map(miniStoryHtml).join('');
  }catch(err){
    const error={pt:'Nao foi possivel carregar a semana.',en:'Could not load weekly highlights.',ja:'週間ニュースを読み込めませんでした。'}[currentLang];
    target.innerHTML='<div class="mini-story"><div class="ms-num">!</div><div class="ms-body"><div class="ms-source">UNS-N</div><div class="ms-title">'+escapeHtml(error)+'</div><div class="ms-time">--</div></div></div>';
  }
}

async function loadFeaturedStories(){
  const target=document.getElementById('featured-clusters');
  if(!target)return;
  target.innerHTML='<div class="cluster"><div class="cluster-hero"><div class="cluster-hero-text"><div class="ch-source">UNS-N</div><div class="ch-title">Carregando destaques...</div></div><div class="cluster-hero-img">...</div></div></div>';
  try{
    const res=await fetch('/api/articles?lang='+encodeURIComponent(currentLang));
    const payload=await res.json();
    const items=(payload.data||[]).filter(function(item){return item.url;}).slice(0,2);
    if(items.length===0){
      target.innerHTML='<div class="cluster"><div class="cluster-hero"><div class="cluster-hero-text"><div class="ch-source">UNS-N</div><div class="ch-title">Nenhuma noticia importada ainda.</div><div class="ch-lead">Entre no Admin e importe os feeds para preencher os destaques automaticamente.</div></div><div class="cluster-hero-img">UN</div></div></div>';
      return;
    }
    target.innerHTML=items.map(featuredClusterHtml).join('');
  }catch(err){
    target.innerHTML='<div class="cluster"><div class="cluster-hero"><div class="cluster-hero-text"><div class="ch-source">UNS-N</div><div class="ch-title">Nao foi possivel carregar os destaques.</div></div><div class="cluster-hero-img">!</div></div></div>';
  }
}

async function loadSectionFeatured(section, category){
  const target=document.querySelector('[data-section-featured="'+section+'"]');
  if(!target)return;
  target.innerHTML='<div class="cluster"><div class="cluster-hero"><div class="cluster-hero-text"><div class="ch-source">UNS-N</div><div class="ch-title">Carregando destaque...</div></div><div class="cluster-hero-img">...</div></div></div>';
  try{
    const url=category
      ? '/api/articles?lang='+encodeURIComponent(currentLang)+'&category='+encodeURIComponent(category)
      : '/api/articles?lang='+encodeURIComponent(currentLang);
    const res=await fetch(url);
    const payload=await res.json();
    const item=(payload.data||[]).filter(function(article){return article.url;})[0];
    if(!item){
      const title={pt:'Ainda nao ha noticias nesta secao.',en:'No stories in this section yet.',ja:'このセクションの記事はまだありません。'}[currentLang];
      const lead={pt:'Importe feeds em portugues no Admin para preencher este destaque.',en:'Import English feeds in Admin to fill this featured card.',ja:'Adminでこの言語のフィードをインポートすると、ここに大きなカードが表示されます。'}[currentLang];
      target.innerHTML='<div class="cluster"><div class="cluster-hero"><div class="cluster-hero-text"><div class="ch-source">UNS-N</div><div class="ch-title">'+escapeHtml(title)+'</div><div class="ch-lead">'+escapeHtml(lead)+'</div></div><div class="cluster-hero-img">UN</div></div></div>';
      return;
    }
    target.innerHTML=featuredClusterHtml(item);
  }catch(err){
    target.innerHTML='<div class="cluster"><div class="cluster-hero"><div class="cluster-hero-text"><div class="ch-source">UNS-N</div><div class="ch-title">Nao foi possivel carregar este destaque.</div></div><div class="cluster-hero-img">!</div></div></div>';
  }
}

async function loadTopicFeed(category){
  const target=document.querySelector('[data-topic-feed="'+category+'"]');
  if(!target)return;
  target.innerHTML='<div class="live-card"><div class="live-thumb">...</div><div><div class="live-source">UNS-N</div><div class="live-title">Carregando...</div></div></div>';
  try{
    const res=await fetch('/api/articles?lang='+encodeURIComponent(currentLang)+'&category='+encodeURIComponent(category));
    const payload=await res.json();
    const items=(payload.data||[]).slice(0,4);
    target.innerHTML=items.length?items.map(feedCardHtml).join(''):emptyFeedHtml(category);
  }catch(err){
    target.innerHTML='<div class="live-card"><div class="live-thumb">!</div><div><div class="live-source">UNS-N</div><div class="live-title">Nao foi possivel carregar esta categoria.</div></div></div>';
  }
}

// ── Lang switcher
function updateSectionLinks(){
  document.querySelectorAll('[data-section-more]').forEach(function(link){
    const category=link.getAttribute('data-section-more');
    if(category)link.setAttribute('href','/section/'+encodeURIComponent(category)+'?lang='+encodeURIComponent(currentLang));
  });
}

function syncLangButtons(){
  document.querySelectorAll('.lang-btn').forEach(b=>b.classList.remove('active'));
  const map={pt:'PT',en:'EN',ja:'日本語'};
  document.querySelectorAll('.lang-btn').forEach(b=>{
    if(b.textContent.trim()===map[currentLang])b.classList.add('active');
  });
}

function loadAllFeeds(){
  syncLangButtons();
  updateSectionLinks();
  loadBreakingTicker();
  loadWeeklyHighlights();
  loadLiveFeed();
  loadFeaturedStories();
  loadSectionFeatured('business','business');
  loadSectionFeatured('global','global');
  loadSectionFeatured('life','life');
  loadSectionFeatured('media',null);
  ['top','business','global','life'].forEach(loadTopicFeed);
}
loadAllFeeds();

function setLang(lang){
  currentLang=lang==='ja'||lang==='en'?lang:'pt';
  syncLangButtons();
  const msgs={pt:'Modo Português ativado.',en:'English mode activated.',ja:'日本語モードになりました。'};
  toast(msgs[currentLang]);
  loadAllFeeds();
}

function toast(msg){
  const old=document.querySelector('.gn-toast');if(old)old.remove();
  const t=document.createElement('div');t.className='gn-toast';
  Object.assign(t.style,{
    position:'fixed',bottom:'20px',right:'20px',zIndex:'999',
    background:'#202124',color:'#fff',
    padding:'10px 16px',borderRadius:'8px',
    fontSize:'13px',fontWeight:'600',
    boxShadow:'0 4px 12px rgba(0,0,0,.25)',
    opacity:'1',transition:'opacity .3s'
  });
  t.textContent=msg;document.body.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),300);},2200);
}

// ── Tab switcher
function setTab(el,id){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  if(id==='top'){window.scrollTo({top:0,behavior:'smooth'});return;}
  const sec=document.getElementById(id);
  if(sec){
    const stickyOffset=112;
    const top=sec.getBoundingClientRect().top+window.pageYOffset-stickyOffset;
    window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
  }
}

// ── Highlight tab on scroll
const secIds=['business','life','global','media','admin'];
secIds.forEach(id=>{
  const el=document.getElementById(id);
  if(!el)return;
  new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(t=>{
          if(t.textContent.trim().includes(
            {business:'ビジネス',life:'生活',global:'ブラジル',media:'メディア',admin:'自治体'}[id]||''
          ))t.classList.add('active');
        });
      }
    });
  },{threshold:.4}).observe(el);
});
</script>
</body>
</html>`)
})

export default {
  fetch: app.fetch,
  scheduled: (_controller: unknown, env: AppEnv['Bindings'], ctx: { waitUntil: (promise: Promise<unknown>) => void }) => {
    ctx.waitUntil(runFeedImport({ env }, 6))
  }
}
