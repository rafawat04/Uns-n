import { articles as seedArticles, type Article } from './data'

type D1Result<T> = {
  results?: T[]
}

type D1Statement = {
  bind: (...values: unknown[]) => D1Statement
  all: <T = unknown>() => Promise<D1Result<T>>
  first: <T = unknown>() => Promise<T | null>
  run: () => Promise<unknown>
}

export type D1Database = {
  prepare: (sql: string) => D1Statement
}

type EnvWithDb = {
  env: {
    DB?: D1Database
  }
}

type ArticleRow = {
  id: string
  slug: string
  category: Article['category']
  source_id: string
  source_name: string
  url: string | null
  image_url: string | null
  published_at: string
  fetched_at: string | null
  original_language: Article['originalLanguage'] | null
  needs_translation: number
  importance: Article['importance']
  image_icon: string
  tags_json: string
  title_pt: string
  title_en: string
  title_ja: string
  summary_pt: string
  summary_en: string
  summary_ja: string
  body_pt: string
  body_en: string
  body_ja: string
}

const hasDb = (context: EnvWithDb) => Boolean(context.env.DB)

const rowToArticle = (row: ArticleRow): Article => ({
  id: row.id,
  slug: row.slug,
  category: row.category,
  sourceId: row.source_id,
  sourceName: row.source_name,
  url: row.url ?? undefined,
  imageUrl: row.image_url ?? undefined,
  publishedAt: row.published_at,
  fetchedAt: row.fetched_at ?? undefined,
  originalLanguage: row.original_language ?? undefined,
  needsTranslation: Boolean(row.needs_translation),
  importance: row.importance,
  imageIcon: row.image_icon,
  tags: JSON.parse(row.tags_json || '[]'),
  title: {
    pt: row.title_pt,
    en: row.title_en,
    ja: row.title_ja
  },
  summary: {
    pt: row.summary_pt,
    en: row.summary_en,
    ja: row.summary_ja
  },
  body: {
    pt: row.body_pt,
    en: row.body_en,
    ja: row.body_ja
  }
})

export const listStoredArticles = async (context: EnvWithDb) => {
  if (!hasDb(context)) return seedArticles

  const rows = await context.env.DB!.prepare('select * from articles order by published_at desc limit 250').all<ArticleRow>().catch(() => null)
  if (!rows) return seedArticles

  const stored = (rows.results ?? []).map(rowToArticle)
  const storedUrls = new Set(stored.map((article) => article.url).filter(Boolean))
  const storedSlugs = new Set(stored.map((article) => article.slug))
  const seeds = seedArticles.filter((article) => !storedSlugs.has(article.slug) && (!article.url || !storedUrls.has(article.url)))

  return [...stored, ...seeds]
}

export const findStoredArticle = async (context: EnvWithDb, slug: string) => {
  if (!hasDb(context)) {
    return seedArticles.find((article) => article.slug === slug) ?? null
  }

  const row = await context.env.DB!.prepare('select * from articles where slug = ? limit 1').bind(slug).first<ArticleRow>().catch(() => null)
  return row ? rowToArticle(row) : seedArticles.find((article) => article.slug === slug) ?? null
}

export const saveArticle = async (context: EnvWithDb, article: Article) => {
  if (!hasDb(context)) {
    if (!seedArticles.some((item) => item.slug === article.slug || item.url === article.url)) {
      seedArticles.unshift(article)
    }
    return
  }

  const result = await context.env.DB!.prepare(
    `insert or ignore into articles (
      id, slug, category, source_id, source_name, url, image_url, published_at, fetched_at,
      original_language, needs_translation, importance, image_icon, tags_json,
      title_pt, title_en, title_ja, summary_pt, summary_en, summary_ja, body_pt, body_en, body_ja
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      article.id,
      article.slug,
      article.category,
      article.sourceId,
      article.sourceName,
      article.url ?? null,
      article.imageUrl ?? null,
      article.publishedAt,
      article.fetchedAt ?? null,
      article.originalLanguage ?? null,
      article.needsTranslation ? 1 : 0,
      article.importance,
      article.imageIcon,
      JSON.stringify(article.tags),
      article.title.pt,
      article.title.en,
      article.title.ja,
      article.summary.pt,
      article.summary.en,
      article.summary.ja,
      article.body.pt,
      article.body.en,
      article.body.ja
    )
    .run()
    .catch(() => null)

  if (!result && !seedArticles.some((item) => item.slug === article.slug || item.url === article.url)) {
    seedArticles.unshift(article)
  }
}
