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

export type ArticleComment = {
  id: string
  articleSlug: string
  userId: string
  userName: string
  body: string
  createdAt: string
}

type ArticleCommentRow = {
  id: string
  article_slug: string
  user_id: string
  user_name: string
  body: string
  created_at: string
}

type CountRow = {
  count: number
}

const hasDb = (context: EnvWithDb) => Boolean(context.env.DB)
const memoryLikes = new Map<string, Set<string>>()
const memoryComments: ArticleComment[] = []
let engagementTablesReady = false

const createLocalId = (prefix: string) => {
  const randomValues =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

  return `${prefix}-${randomValues}`
}

const ensureEngagementTables = async (db: D1Database) => {
  if (engagementTablesReady) return

  await db
    .prepare(
      `create table if not exists article_likes (
        article_slug text not null,
        user_id text not null,
        created_at text not null,
        primary key (article_slug, user_id)
      )`
    )
    .run()
  await db.prepare('create index if not exists idx_article_likes_slug on article_likes (article_slug)').run()
  await db
    .prepare(
      `create table if not exists article_comments (
        id text primary key,
        article_slug text not null,
        user_id text not null,
        user_name text not null,
        body text not null,
        created_at text not null
      )`
    )
    .run()
  await db
    .prepare('create index if not exists idx_article_comments_slug_created_at on article_comments (article_slug, created_at desc)')
    .run()

  engagementTablesReady = true
}

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

const rowToComment = (row: ArticleCommentRow): ArticleComment => ({
  id: row.id,
  articleSlug: row.article_slug,
  userId: row.user_id,
  userName: row.user_name,
  body: row.body,
  createdAt: row.created_at
})

export const getArticleEngagement = async (context: EnvWithDb, articleSlug: string, userId?: string | null) => {
  if (!hasDb(context)) {
    const likes = memoryLikes.get(articleSlug) ?? new Set<string>()
    const comments = memoryComments
      .filter((comment) => comment.articleSlug === articleSlug)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 50)

    return {
      likes: {
        count: likes.size,
        liked: userId ? likes.has(userId) : false
      },
      comments
    }
  }

  await ensureEngagementTables(context.env.DB!)

  const likeCountRow = await context.env.DB!.prepare('select count(*) as count from article_likes where article_slug = ?')
    .bind(articleSlug)
    .first<CountRow>()
    .catch(() => null)
  const likedRow = userId
    ? await context.env.DB!.prepare('select article_slug from article_likes where article_slug = ? and user_id = ? limit 1')
        .bind(articleSlug, userId)
        .first<{ article_slug: string }>()
        .catch(() => null)
    : null
  const commentsRows = await context.env.DB!.prepare(
    'select * from article_comments where article_slug = ? order by created_at desc limit 50'
  )
    .bind(articleSlug)
    .all<ArticleCommentRow>()
    .catch(() => null)

  return {
    likes: {
      count: Number(likeCountRow?.count ?? 0),
      liked: Boolean(likedRow)
    },
    comments: (commentsRows?.results ?? []).map(rowToComment)
  }
}

export const toggleArticleLike = async (context: EnvWithDb, articleSlug: string, userId: string) => {
  const now = new Date().toISOString()

  if (!hasDb(context)) {
    const likes = memoryLikes.get(articleSlug) ?? new Set<string>()
    const liked = likes.has(userId)

    if (liked) {
      likes.delete(userId)
    } else {
      likes.add(userId)
    }

    memoryLikes.set(articleSlug, likes)

    return {
      liked: !liked,
      count: likes.size
    }
  }

  await ensureEngagementTables(context.env.DB!)

  const existing = await context.env.DB!.prepare('select article_slug from article_likes where article_slug = ? and user_id = ? limit 1')
    .bind(articleSlug, userId)
    .first<{ article_slug: string }>()
    .catch(() => null)

  if (existing) {
    await context.env.DB!.prepare('delete from article_likes where article_slug = ? and user_id = ?').bind(articleSlug, userId).run()
  } else {
    await context.env.DB!.prepare('insert into article_likes (article_slug, user_id, created_at) values (?, ?, ?)')
      .bind(articleSlug, userId, now)
      .run()
  }

  const likeCountRow = await context.env.DB!.prepare('select count(*) as count from article_likes where article_slug = ?')
    .bind(articleSlug)
    .first<CountRow>()
    .catch(() => null)

  return {
    liked: !existing,
    count: Number(likeCountRow?.count ?? 0)
  }
}

export const addArticleComment = async (
  context: EnvWithDb,
  comment: {
    articleSlug: string
    userId: string
    userName: string
    body: string
  }
) => {
  const createdAt = new Date().toISOString()
  const item: ArticleComment = {
    id: createLocalId('comment'),
    articleSlug: comment.articleSlug,
    userId: comment.userId,
    userName: comment.userName,
    body: comment.body,
    createdAt
  }

  if (!hasDb(context)) {
    memoryComments.unshift(item)
    return item
  }

  await ensureEngagementTables(context.env.DB!)

  await context.env.DB!.prepare(
    'insert into article_comments (id, article_slug, user_id, user_name, body, created_at) values (?, ?, ?, ?, ?, ?)'
  )
    .bind(item.id, item.articleSlug, item.userId, item.userName, item.body, item.createdAt)
    .run()

  return item
}
