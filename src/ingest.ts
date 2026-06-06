import { articles, feedSources, sources, type Article, type FeedSource, type Locale } from './data'

type FeedItem = {
  title: string
  link: string
  summary: string
  imageUrl?: string
  publishedAt: string
}

export type IngestResult = {
  feedId: string
  sourceName: string
  fetched: number
  imported: number
  skipped: number
  errors: string[]
}

type SaveArticle = (article: Article) => Promise<void> | void

export const fetchFeedXml = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      'user-agent': 'UNS-N News Aggregator (+https://example.local)'
    }
  })

  if (!response.ok) {
    throw new Error(`Feed returned ${response.status}`)
  }

  const buffer = await response.arrayBuffer()
  const preview = new TextDecoder('utf-8').decode(buffer.slice(0, 500))
  const contentType = response.headers.get('content-type') ?? ''
  const charset =
    contentType.match(/charset=([^;\s]+)/i)?.[1] ?? preview.match(/encoding=["']([^"']+)["']/i)?.[1] ?? 'utf-8'

  try {
    return new TextDecoder(charset).decode(buffer)
  } catch {
    return new TextDecoder('utf-8').decode(buffer)
  }
}

const absoluteUrl = (value: string, baseUrl: string) => {
  try {
    return new URL(value, baseUrl).toString()
  } catch {
    return ''
  }
}

const normalizeArticleUrl = (url: string) => {
  if (url.startsWith('http://www3.nhk.or.jp/news/')) {
    return url.replace('http://', 'https://')
  }

  return url
}

const metadataUrlForArticle = (url: string) => {
  const normalizedUrl = normalizeArticleUrl(url)
  const nhkNewsId = normalizedUrl.match(/\/(k\d+)\.html$/)?.[1]

  if (normalizedUrl.includes('www3.nhk.or.jp/news/html/') && nhkNewsId) {
    return `https://news.web.nhk/newsweb/na/na-${nhkNewsId}`
  }

  return normalizedUrl
}

const getMetaContent = (html: string, key: string) => {
  const propertyFirst = html.match(
    new RegExp(`<meta\\s+[^>]*(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i')
  )
  if (propertyFirst) return decoder(propertyFirst[1])

  const contentFirst = html.match(
    new RegExp(`<meta\\s+[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["'][^>]*>`, 'i')
  )
  return contentFirst ? decoder(contentFirst[1]) : ''
}

const fetchArticleImageUrl = async (url: string) => {
  const articleUrl = metadataUrlForArticle(url)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 9000)

  try {
    const response = await fetch(articleUrl, {
      headers: {
        accept: 'text/html',
        'user-agent': 'Mozilla/5.0 (compatible; UNS-N News Aggregator; +https://example.local)'
      },
      redirect: 'follow',
      signal: controller.signal
    })

    if (!response.ok) return ''

    const html = await response.text()
    const image = getMetaContent(html, 'og:image') || getMetaContent(html, 'twitter:image')
    return image ? absoluteUrl(image, articleUrl) : ''
  } catch {
    return ''
  } finally {
    clearTimeout(timeout)
  }
}

const decoder = (value: string) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim()

const stripHtml = (value: string) => decoder(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '))

const truncateSnippet = (value: string, maxLength = 320) => {
  const clean = value.trim()
  if (clean.length <= maxLength) return clean
  return `${clean.slice(0, maxLength).replace(/\s+\S*$/, '')}...`
}

const getTag = (xml: string, tag: string) => {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? decoder(match[1]) : ''
}

const getAnyTag = (xml: string, tags: string[]) => tags.map((tag) => getTag(xml, tag)).find(Boolean) ?? ''

const getAtomLink = (xml: string) => {
  const href = xml.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*>/i)
  return href ? decoder(href[1]) : ''
}

const getAttributeUrl = (xml: string, tagPattern: string) => {
  const match = xml.match(new RegExp(`<${tagPattern}\\s+[^>]*(?:url|href)=["']([^"']+)["'][^>]*>`, 'i'))
  return match ? decoder(match[1]) : ''
}

const getImageUrl = (block: string) => {
  const media = getAttributeUrl(block, 'media:content') || getAttributeUrl(block, 'media:thumbnail')
  if (media) return media

  const imageEnclosure = block.match(/<enclosure\s+[^>]*type=["']image\/[^"']+["'][^>]*url=["']([^"']+)["'][^>]*>/i)
  if (imageEnclosure) return decoder(imageEnclosure[1])

  const embeddedImage = decoder(block).match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i)
  return embeddedImage ? decoder(embeddedImage[1]) : ''
}

const getEnclosureUrl = (block: string) => getAttributeUrl(block, 'enclosure')

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80) || `story-${Date.now()}`

const contentForLocale = (text: string, sourceLanguage: FeedSource['language'], locale: Locale) => {
  if (sourceLanguage === locale) return text
  return text
}

export const parseFeed = (xml: string): FeedItem[] => {
  const rssItems = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []
  const atomItems = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? []
  const blocks = rssItems.length > 0 ? rssItems : atomItems

  return blocks
    .map((block) => {
      const title = stripHtml(getTag(block, 'title'))
      const link = normalizeArticleUrl(
        decoder(getTag(block, 'link') || getAtomLink(block) || getTag(block, 'guid') || getEnclosureUrl(block))
      )
      const summary = truncateSnippet(
        stripHtml(getAnyTag(block, ['description', 'atom:subtitle', 'summary', 'content:encoded', 'content']))
      )
      const imageUrl = getImageUrl(block)
      const date = getTag(block, 'pubDate') || getTag(block, 'published') || getTag(block, 'updated') || getTag(block, 'dc:date')
      const publishedAt = date ? new Date(date).toISOString() : new Date().toISOString()

      return { title, link, summary, imageUrl, publishedAt }
    })
    .filter((item) => item.title && item.link)
}

export const ingestFeed = async (
  feed: FeedSource,
  limit = 12,
  existingArticles = articles,
  saveArticle: SaveArticle = (article) => articles.unshift(article)
): Promise<IngestResult> => {
  const result: IngestResult = {
    feedId: feed.id,
    sourceName: feed.name,
    fetched: 0,
    imported: 0,
    skipped: 0,
    errors: []
  }

  try {
    const xml = await fetchFeedXml(feed.url)
    const items = parseFeed(xml).slice(0, limit)
    const source = sources.find((item) => item.id === feed.sourceId)
    result.fetched = items.length

    for (const item of items) {
      if (existingArticles.some((article) => article.url === item.link || article.slug === slugify(item.title))) {
        result.skipped += 1
        continue
      }

      const summary = item.summary || item.title
      const imageUrl = item.imageUrl || (await fetchArticleImageUrl(item.link))
      const article: Article = {
        id: `feed-${crypto.randomUUID()}`,
        slug: slugify(item.title),
        category: feed.category,
        sourceId: feed.sourceId,
        sourceName: source?.name ?? feed.name,
        url: item.link,
        imageUrl,
        publishedAt: item.publishedAt,
        fetchedAt: new Date().toISOString(),
        originalLanguage: feed.language,
        needsTranslation: feed.language !== 'ja',
        importance: 'normal',
        imageIcon: source?.country === 'BR' ? 'BR' : 'JP',
        tags: ['feed', feed.language, feed.id],
        title: {
          pt: contentForLocale(item.title, feed.language, 'pt'),
          en: contentForLocale(item.title, feed.language, 'en'),
          ja: contentForLocale(item.title, feed.language, 'ja')
        },
        summary: {
          pt: contentForLocale(summary, feed.language, 'pt'),
          en: contentForLocale(summary, feed.language, 'en'),
          ja: contentForLocale(summary, feed.language, 'ja')
        },
        body: {
          pt: contentForLocale(summary, feed.language, 'pt'),
          en: contentForLocale(summary, feed.language, 'en'),
          ja: contentForLocale(summary, feed.language, 'ja')
        }
      }

      await saveArticle(article)
      if (!existingArticles.some((existing) => existing.id === article.id)) {
        existingArticles.push(article)
      }
      result.imported += 1
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown feed error')
  }

  return result
}

export const ingestEnabledFeeds = async (
  limitPerFeed = 12,
  existingArticles = articles,
  saveArticle: SaveArticle = (article) => articles.unshift(article)
) => {
  const enabledFeeds = feedSources.filter((feed) => feed.enabled)
  return Promise.all(enabledFeeds.map((feed) => ingestFeed(feed, limitPerFeed, existingArticles, saveArticle)))
}
