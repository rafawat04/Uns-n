export type Locale = 'pt' | 'en' | 'ja'

export type Category =
  | 'top'
  | 'business'
  | 'life'
  | 'global'
  | 'media'
  | 'admin'

export type Article = {
  id: string
  slug: string
  category: Category
  sourceId: string
  sourceName: string
  url?: string
  imageUrl?: string
  publishedAt: string
  fetchedAt?: string
  originalLanguage?: Locale
  needsTranslation?: boolean
  importance: 'breaking' | 'high' | 'normal'
  imageIcon: string
  tags: string[]
  title: Record<Locale, string>
  summary: Record<Locale, string>
  body: Record<Locale, string>
}

export type NewsSource = {
  id: string
  name: string
  language: Locale | 'multi'
  url: string
  country: 'JP' | 'BR' | 'GLOBAL'
  category: Category
}

export type FeedSource = {
  id: string
  sourceId: string
  name: string
  url: string
  homepageUrl?: string
  language: Locale
  category: Category
  enabled: boolean
  usage: 'rss-headlines' | 'metadata-only'
}

export const categories: Array<{ id: Category; label: Record<Locale, string> }> = [
  { id: 'top', label: { pt: 'Principais', en: 'Top', ja: 'トップ' } },
  { id: 'business', label: { pt: 'Negocios', en: 'Business', ja: 'ビジネス' } },
  { id: 'life', label: { pt: 'Vida no Japao', en: 'Life in Japan', ja: '生活・行政' } },
  { id: 'global', label: { pt: 'Brasil e Japao', en: 'Brazil and Japan', ja: 'ブラジル・日本' } },
  { id: 'media', label: { pt: 'Midias', en: 'Media', ja: 'メディア一覧' } },
  { id: 'admin', label: { pt: 'Governo', en: 'Government', ja: '自治体・行政' } }
]

export const sources: NewsSource[] = [
  {
    id: 'nhk-world-pt',
    name: 'NHK World Brasil',
    language: 'pt',
    url: 'https://www3.nhk.or.jp/nhkworld/pt/',
    country: 'JP',
    category: 'media'
  },
  {
    id: 'nhk-japan',
    name: 'NHK News',
    language: 'ja',
    url: 'https://www3.nhk.or.jp/news/',
    country: 'JP',
    category: 'top'
  },
  {
    id: 'asahi',
    name: '朝日新聞',
    language: 'ja',
    url: 'https://www.asahi.com',
    country: 'JP',
    category: 'top'
  },
  {
    id: 'mainichi',
    name: '毎日新聞',
    language: 'ja',
    url: 'https://mainichi.jp',
    country: 'JP',
    category: 'top'
  },
  {
    id: 'nikkei',
    name: 'Nikkei Asia',
    language: 'en',
    url: 'https://asia.nikkei.com',
    country: 'JP',
    category: 'business'
  },
  {
    id: 'nytimes',
    name: 'The New York Times',
    language: 'en',
    url: 'https://www.nytimes.com',
    country: 'GLOBAL',
    category: 'top'
  },
  {
    id: 'guardian',
    name: 'The Guardian',
    language: 'en',
    url: 'https://www.theguardian.com',
    country: 'GLOBAL',
    category: 'top'
  },
  {
    id: 'bbc',
    name: 'BBC News',
    language: 'en',
    url: 'https://www.bbc.com/news',
    country: 'GLOBAL',
    category: 'top'
  },
  {
    id: 'meti',
    name: 'METI',
    language: 'multi',
    url: 'https://www.meti.go.jp',
    country: 'JP',
    category: 'business'
  },
  {
    id: 'zaikei',
    name: '財経新聞',
    language: 'ja',
    url: 'https://www.zaikei.co.jp',
    country: 'JP',
    category: 'business'
  },
  {
    id: 'folha',
    name: 'Folha de S.Paulo',
    language: 'pt',
    url: 'https://www.folha.uol.com.br',
    country: 'BR',
    category: 'global'
  },
  {
    id: 'g1',
    name: 'g1',
    language: 'pt',
    url: 'https://g1.globo.com',
    country: 'BR',
    category: 'global'
  },
  {
    id: 'tecmundo',
    name: 'TecMundo',
    language: 'pt',
    url: 'https://www.tecmundo.com.br',
    country: 'BR',
    category: 'business'
  },
  {
    id: 'mhlw',
    name: '厚生労働省',
    language: 'ja',
    url: 'https://www.mhlw.go.jp',
    country: 'JP',
    category: 'life'
  },
  {
    id: 'japan-times',
    name: 'The Japan Times',
    language: 'en',
    url: 'https://www.japantimes.co.jp',
    country: 'JP',
    category: 'life'
  },
  {
    id: 'immigration-services-agency',
    name: '出入国在留管理庁',
    language: 'ja',
    url: 'https://www.moj.go.jp/isa/',
    country: 'JP',
    category: 'admin'
  }
]

export const feedSources: FeedSource[] = [
  {
    id: 'nikkei-asia-top',
    sourceId: 'nikkei',
    name: 'Nikkei Asia',
    url: 'https://asia.nikkei.com/rss/feed/nar',
    homepageUrl: 'https://asia.nikkei.com',
    language: 'en',
    category: 'business',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'nytimes-home',
    sourceId: 'nytimes',
    name: 'The New York Times Top Stories',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    homepageUrl: 'https://www.nytimes.com',
    language: 'en',
    category: 'top',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'nytimes-world',
    sourceId: 'nytimes',
    name: 'The New York Times World',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    homepageUrl: 'https://www.nytimes.com/section/world',
    language: 'en',
    category: 'top',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'nytimes-technology',
    sourceId: 'nytimes',
    name: 'The New York Times Technology',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
    homepageUrl: 'https://www.nytimes.com/section/technology',
    language: 'en',
    category: 'business',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'guardian-world',
    sourceId: 'guardian',
    name: 'The Guardian World',
    url: 'https://www.theguardian.com/world/rss',
    homepageUrl: 'https://www.theguardian.com/world',
    language: 'en',
    category: 'top',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'guardian-technology',
    sourceId: 'guardian',
    name: 'The Guardian Technology',
    url: 'https://www.theguardian.com/technology/rss',
    homepageUrl: 'https://www.theguardian.com/technology',
    language: 'en',
    category: 'business',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'bbc-news',
    sourceId: 'bbc',
    name: 'BBC News',
    url: 'https://feeds.bbci.co.uk/news/rss.xml',
    homepageUrl: 'https://www.bbc.com/news',
    language: 'en',
    category: 'top',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'bbc-world',
    sourceId: 'bbc',
    name: 'BBC World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    homepageUrl: 'https://www.bbc.com/news/world',
    language: 'en',
    category: 'top',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'bbc-technology',
    sourceId: 'bbc',
    name: 'BBC Technology',
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    homepageUrl: 'https://www.bbc.com/news/technology',
    language: 'en',
    category: 'business',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'meti-english-latest',
    sourceId: 'meti',
    name: 'METI English',
    url: 'https://www.meti.go.jp/ml_index_en_atom.xml',
    homepageUrl: 'https://www.meti.go.jp/english/',
    language: 'en',
    category: 'business',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'zaikei-it',
    sourceId: 'zaikei',
    name: '財経新聞 IT・サイエンス',
    url: 'https://www.zaikei.co.jp/rss/sections/it.xml',
    homepageUrl: 'https://www.zaikei.co.jp/news/category/87.html',
    language: 'ja',
    category: 'business',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'zaikei-management',
    sourceId: 'zaikei',
    name: '財経新聞 経営・ビジネス',
    url: 'https://www.zaikei.co.jp/rss/sections/management.xml',
    homepageUrl: 'https://www.zaikei.co.jp/news/category/65.html',
    language: 'ja',
    category: 'business',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'asahi-headlines',
    sourceId: 'asahi',
    name: '朝日新聞 ニュース',
    url: 'https://www.asahi.com/rss/asahi/newsheadlines.rdf',
    homepageUrl: 'https://www.asahi.com',
    language: 'ja',
    category: 'top',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'mainichi-flash',
    sourceId: 'mainichi',
    name: '毎日新聞 ニュース速報',
    url: 'https://mainichi.jp/rss/etc/mainichi-flash.rss',
    homepageUrl: 'https://mainichi.jp',
    language: 'ja',
    category: 'top',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'g1-economia',
    sourceId: 'g1',
    name: 'g1 Economia',
    url: 'https://g1.globo.com/rss/g1/economia',
    homepageUrl: 'https://g1.globo.com/economia/',
    language: 'pt',
    category: 'business',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'tecmundo-latest',
    sourceId: 'tecmundo',
    name: 'TecMundo',
    url: 'https://rss.tecmundo.com.br/feed',
    homepageUrl: 'https://www.tecmundo.com.br',
    language: 'pt',
    category: 'business',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'nhk-japan-society',
    sourceId: 'nhk-japan',
    name: 'NHK News 社会',
    url: 'https://www3.nhk.or.jp/rss/news/cat1.xml',
    homepageUrl: 'https://www3.nhk.or.jp/news/cat01.html',
    language: 'ja',
    category: 'life',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'mhlw-latest',
    sourceId: 'mhlw',
    name: '厚生労働省 新着情報',
    url: 'https://www.mhlw.go.jp/stf/news.rdf',
    homepageUrl: 'https://www.mhlw.go.jp/stf/new-info/index.html',
    language: 'ja',
    category: 'life',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'japan-times-latest',
    sourceId: 'japan-times',
    name: 'The Japan Times',
    url: 'https://www.japantimes.co.jp/feed/',
    homepageUrl: 'https://www.japantimes.co.jp',
    language: 'en',
    category: 'life',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'g1-bemestar',
    sourceId: 'g1',
    name: 'g1 Bem Estar',
    url: 'https://g1.globo.com/rss/g1/bemestar',
    homepageUrl: 'https://g1.globo.com/bemestar/',
    language: 'pt',
    category: 'life',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'nhk-world-portuguese',
    sourceId: 'nhk-world-pt',
    name: 'NHK World Radio Japan Portugues',
    url: 'http://www3.nhk.or.jp/rj/podcast/rss/portuguese.xml',
    homepageUrl: 'https://www3.nhk.or.jp/nhkworld/pt/',
    language: 'pt',
    category: 'top',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'nhk-japan-top',
    sourceId: 'nhk-japan',
    name: 'NHK News',
    url: 'https://www3.nhk.or.jp/rss/news/cat0.xml',
    homepageUrl: 'https://www3.nhk.or.jp/news/',
    language: 'ja',
    category: 'top',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'folha-latest',
    sourceId: 'folha',
    name: 'Folha de S.Paulo',
    url: 'https://feeds.folha.uol.com.br/emcimadahora/rss091.xml',
    homepageUrl: 'https://www.folha.uol.com.br',
    language: 'pt',
    category: 'global',
    enabled: true,
    usage: 'rss-headlines'
  },
  {
    id: 'g1-latest',
    sourceId: 'g1',
    name: 'g1',
    url: 'https://g1.globo.com/rss/g1/',
    homepageUrl: 'https://g1.globo.com',
    language: 'pt',
    category: 'global',
    enabled: true,
    usage: 'rss-headlines'
  }
]

export const articles: Article[] = [
  {
    id: 'art-001',
    slug: 'specified-residence-card-2026',
    category: 'life',
    sourceId: 'immigration-services-agency',
    sourceName: '出入国在留管理庁',
    originalLanguage: 'ja',
    publishedAt: '2026-06-05T08:00:00.000Z',
    importance: 'breaking',
    imageIcon: 'ID',
    tags: ['visa', 'mynumber', 'residentes'],
    title: {
      pt: 'Novo cartao de residencia integrado com My Number comeca em junho',
      en: 'Japan prepares integrated residence and My Number card',
      ja: '在留カードとマイナンバーの一体化、6月から開始'
    },
    summary: {
      pt: 'O novo cartao deve simplificar parte dos procedimentos para estrangeiros residentes no Japao.',
      en: 'The new card is expected to simplify some procedures for foreign residents in Japan.',
      ja: '外国人住民の手続きを一部簡素化する新カードの導入が始まります。'
    },
    body: {
      pt: 'O Japao prepara um cartao que integra dados de residencia e My Number. A troca deve acontecer conforme renovacoes e procedimentos oficiais.',
      en: 'Japan is preparing a card that connects residence information with My Number-related information. The transition is expected to happen through renewals and official procedures.',
      ja: '日本では、在留情報とマイナンバー関連情報を連携する新しいカード制度の準備が進んでいます。更新時など公式手続きにあわせて切り替えが進む見込みです。'
    }
  },
  {
    id: 'art-002',
    slug: 'japan-brazil-business-talent',
    category: 'business',
    sourceId: 'nikkei',
    sourceName: 'Nikkei Asia',
    originalLanguage: 'en',
    publishedAt: '2026-06-04T09:30:00.000Z',
    importance: 'high',
    imageIcon: 'BR',
    tags: ['business', 'portugues', 'carreira'],
    title: {
      pt: 'Empresas japonesas buscam mais profissionais com portugues',
      en: 'Japanese companies seek more Portuguese-speaking professionals',
      ja: '日本企業、ポルトガル語人材への需要が拡大'
    },
    summary: {
      pt: 'Comercio, energia e manufatura puxam a demanda por profissionais bilingues entre Brasil e Japao.',
      en: 'Trading, energy and manufacturing are driving demand for bilingual professionals between Brazil and Japan.',
      ja: '商社、エネルギー、製造業を中心に、ブラジルと日本をつなぐ人材需要が高まっています。'
    },
    body: {
      pt: 'A relacao economica entre Brasil e Japao aumenta a procura por profissionais que entendam negocios japoneses e comuniquem em portugues.',
      en: 'As the economic relationship between Brazil and Japan deepens, demand is growing for professionals who understand Japanese business and can communicate in Portuguese.',
      ja: 'ブラジルと日本の経済関係が深まるなか、日本式のビジネスを理解しポルトガル語で発信できる人材への期待が高まっています。'
    }
  },
  {
    id: 'art-003',
    slug: 'easy-japanese-workplace-rights',
    category: 'life',
    sourceId: 'nhk-world-pt',
    sourceName: 'NHK World Brasil',
    originalLanguage: 'pt',
    publishedAt: '2026-06-03T22:15:00.000Z',
    importance: 'normal',
    imageIcon: 'JP',
    tags: ['trabalho', 'direitos', 'yasashii'],
    title: {
      pt: 'Guia em japones simples ajuda estrangeiros a entender direitos no trabalho',
      en: 'Simple Japanese guide helps foreign workers understand workplace rights',
      ja: 'やさしい日本語で外国人の労働ルール理解を支援'
    },
    summary: {
      pt: 'Materiais em linguagem simples ajudam trabalhadores estrangeiros a confirmar regras de contrato, horas extras e ferias.',
      en: 'Plain-language materials help foreign workers check rules on contracts, overtime and paid leave.',
      ja: '契約、残業、有給休暇などを確認しやすいよう、やさしい日本語での情報提供が広がっています。'
    },
    body: {
      pt: 'O conteudo em japones simples reduz barreiras para quem ainda esta aprendendo o idioma e precisa entender regras do cotidiano.',
      en: 'Simple Japanese content lowers barriers for people still learning the language who need to understand everyday work rules.',
      ja: 'やさしい日本語の情報は、日本語学習中の人が生活や仕事のルールを理解する助けになります。'
    }
  }
]
