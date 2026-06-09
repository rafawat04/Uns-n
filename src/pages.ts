import type { Article, Category, FeedSource, Locale, NewsSource } from './data'
import type { IngestResult } from './ingest'
import type { SessionUser } from './auth'

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatDate = (value: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : locale === 'en' ? 'en-US' : 'pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))

const sourceDot = (sourceName: string) =>
  sourceName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase() || 'UN'

const sectionEmptyCopy: Record<Locale, string> = {
  pt: 'Ainda nao ha noticias importadas nesta secao para este idioma.',
  en: 'There are no imported stories in this section for this language yet.',
  ja: 'この言語のニュースはこのセクションにまだありません。'
}

const sectionBackCopy: Record<Locale, string> = {
  pt: 'Voltar ao inicio',
  en: 'Back home',
  ja: 'ホームへ戻る'
}

const originalCopy: Record<Locale, string> = {
  pt: 'Ler na fonte original',
  en: 'Read at original source',
  ja: '元の記事を読む'
}

const mediaCopy: Record<Locale, string> = {
  pt: 'Fontes acompanhadas',
  en: 'Tracked sources',
  ja: 'フォロー中のメディア'
}

const langName: Record<Locale, string> = {
  pt: 'PT',
  en: 'EN',
  ja: '日本語'
}

const loginShell = (params: {
  title: string
  subtitle: string
  action: string
  fields: string
  button: string
  error?: string
  hint?: string
}) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(params.title)} | UNS-N</title>
  <style>
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f6f8;color:#202124;font-family:Inter,Arial,sans-serif}
    .login{width:min(420px,calc(100vw - 32px));background:#fff;border:1px solid #dfe3e8;border-radius:8px;padding:28px;box-shadow:0 12px 32px rgba(0,0,0,.08)}
    h1{font-size:24px;margin:0 0 6px}
    p{margin:0 0 22px;color:#667085;line-height:1.5}
    label{display:block;font-size:13px;font-weight:700;margin:14px 0 6px}
    input{width:100%;height:44px;border:1px solid #ccd3da;border-radius:6px;padding:0 12px;font:inherit}
    input:focus{outline:2px solid #b9d5ff;border-color:#1a73e8}
    button{width:100%;height:44px;margin-top:20px;border:0;border-radius:6px;background:#1a73e8;color:#fff;font:inherit;font-weight:800;cursor:pointer}
    .error{background:#fce8e6;color:#b42318;border-radius:6px;padding:10px 12px;margin-bottom:16px;font-size:13px}
    .hint{font-size:12px;color:#8a94a6;margin-top:14px}
  </style>
</head>
<body>
  <main class="login">
    <h1>${escapeHtml(params.title)}</h1>
    <p>${escapeHtml(params.subtitle)}</p>
    ${params.error ? `<div class="error">${escapeHtml(params.error)}</div>` : ''}
    <form method="post" action="${escapeHtml(params.action)}">
      ${params.fields}
      <button type="submit">${escapeHtml(params.button)}</button>
    </form>
    ${params.hint ? `<div class="hint">${escapeHtml(params.hint)}</div>` : ''}
  </main>
</body>
</html>`

export const renderLoginPage = (error?: string) =>
  loginShell({
    title: 'Entrar no UNS-N',
    subtitle: 'Salve preferencias e acompanhe noticias para a sua rotina no Japao.',
    action: '/login',
    error,
    button: 'Continuar',
    hint: 'Protótipo: basta informar seu nome e email.',
    fields: `
      <label for="name">Nome</label>
      <input id="name" name="name" type="text" autocomplete="name" required/>
      <label for="email">Email</label>
      <input id="email" name="email" type="email" autocomplete="email" required/>`
  })

export const renderAdminLoginPage = (error?: string) =>
  loginShell({
    title: 'UNS-N Editor',
    subtitle: 'Area interna para operar fontes e acompanhar importacoes.',
    action: '/admin/login',
    error,
    button: 'Entrar',
    hint: 'Demo local: admin@unsn.local / admin123. Configure ADMIN_EMAIL e ADMIN_PASSWORD em producao.',
    fields: `
      <label for="email">Email</label>
      <input id="email" name="email" type="email" autocomplete="username" required/>
      <label for="password">Senha</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required/>`
  })

export const renderUserPage = (user: SessionUser) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Minha pagina | UNS-N</title>
  <style>
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;background:#f4f6f8;color:#202124;font-family:Inter,Arial,sans-serif}
    header{height:58px;background:#fff;border-bottom:1px solid #dfe3e8;display:flex;align-items:center;justify-content:space-between;padding:0 18px}
    main{max-width:880px;margin:0 auto;padding:28px 16px 56px}
    h1{font-size:26px;margin:0 0 6px}
    p{color:#667085;line-height:1.55;margin:0}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}
    .card{background:#fff;border:1px solid #dfe3e8;border-radius:8px;padding:16px;min-height:118px}
    .k{font-size:12px;color:#667085;font-weight:800;text-transform:uppercase;margin-bottom:8px}
    .v{font-size:18px;font-weight:900}
    a{color:#1a73e8;text-decoration:none;font-weight:800}
    button{height:36px;border:0;border-radius:6px;background:#eef4ff;color:#1a73e8;font:inherit;font-weight:800;padding:0 12px;cursor:pointer}
    @media(max-width:720px){.grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <header>
    <strong>UNS-N</strong>
    <nav style="display:flex;gap:12px;align-items:center">
      <a href="/">Noticias</a>
      <form method="post" action="/logout"><button type="submit">Sair</button></form>
    </nav>
  </header>
  <main>
    <h1>Oi, ${escapeHtml(user.name)}</h1>
    <p>Esta e uma primeira versao simples da pagina do leitor. Em breve ela pode ter temas salvos, fontes seguidas e historico de leitura.</p>
    <div class="grid">
      <section class="card"><div class="k">Conta</div><div class="v">${escapeHtml(user.email)}</div></section>
      <section class="card"><div class="k">Idioma</div><div class="v">PT / JA / EN</div></section>
      <section class="card"><div class="k">Status</div><div class="v">Leitor</div></section>
    </div>
  </main>
</body>
</html>`

export const renderAdminPage = (
  user: SessionUser,
  feeds: FeedSource[],
  results: IngestResult[] = [],
  articleCount = 0
) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin | UNS-N</title>
  <style>
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;background:#f4f6f8;color:#202124;font-family:Inter,Arial,sans-serif}
    a{color:#1a73e8;text-decoration:none}
    header{height:58px;background:#fff;border-bottom:1px solid #dfe3e8;display:flex;align-items:center;justify-content:space-between;padding:0 18px}
    main{max-width:1040px;margin:0 auto;padding:24px 16px 56px}
    h1{font-size:26px;margin:0 0 4px}
    h2{font-size:16px;margin:0 0 12px}
    p{color:#667085;line-height:1.55;margin:0}
    button{height:42px;border:0;border-radius:6px;background:#1a73e8;color:#fff;font:inherit;font-weight:800;padding:0 16px;cursor:pointer}
    .ghost{background:#eef4ff;color:#1a73e8}
    .bar{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:20px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .card{background:#fff;border:1px solid #dfe3e8;border-radius:8px;padding:16px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
    .feed{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid #eef0f3;padding:12px 0}
    .feed:first-of-type{border-top:0}
    .feed-title{font-weight:800;font-size:14px}
    .feed-meta{font-size:12px;color:#667085;margin-top:2px}
    .pill{display:inline-flex;align-items:center;border-radius:999px;background:#eef4ff;color:#1a73e8;padding:4px 9px;font-size:11px;font-weight:800}
    .result{display:grid;grid-template-columns:1fr repeat(3,72px);gap:10px;align-items:center;border-top:1px solid #eef0f3;padding:11px 0;font-size:13px}
    .result:first-of-type{border-top:0}
    .num{text-align:right;font-weight:800}
    .muted{color:#667085}
    .nav{display:flex;align-items:center;gap:12px;font-size:13px;font-weight:800}
    @media(max-width:760px){.grid{grid-template-columns:1fr}.result{grid-template-columns:1fr 56px 56px 56px}.bar{align-items:flex-start;flex-direction:column}}
  </style>
</head>
<body>
  <header>
    <strong>UNS-N Admin</strong>
    <nav class="nav">
      <a href="/">Site</a>
      <a href="/api/feeds">Feeds API</a>
      <form method="post" action="/logout"><button class="ghost" type="submit">Sair</button></form>
    </nav>
  </header>
  <main>
    <div class="bar">
      <div>
        <h1>Atualizacao automatica</h1>
        <p>Logado como ${user.email}. Noticias disponiveis agora: ${articleCount}. O sistema busca novos itens automaticamente pelos feeds RSS.</p>
      </div>
    </div>

    <div class="grid">
      <section class="card">
        <h2>Feeds ativos</h2>
        ${feeds
          .map(
            (feed) => `<div class="feed">
              <div>
                <div class="feed-title">${feed.name}</div>
                <div class="feed-meta">${feed.language.toUpperCase()} · ${feed.category} · ${feed.usage}</div>
              </div>
              <div>
                <span class="pill">${feed.enabled ? 'ON' : 'OFF'}</span>
              </div>
            </div>`
          )
          .join('')}
      </section>

      <section class="card">
        <h2>Ultima importacao</h2>
        ${
          results.length === 0
            ? '<p>A importacao roda automaticamente a cada 30 minutos em producao. Quando uma execucao terminar, os itens novos entram no site sem acao manual.</p>'
            : results
                .map(
                  (result) => `<div class="result">
                    <div>
                      <strong>${result.sourceName}</strong>
                      ${result.errors.length ? `<div class="muted">${result.errors.join(', ')}</div>` : ''}
                    </div>
                    <div class="num">${result.fetched}</div>
                    <div class="num">${result.imported}</div>
                    <div class="num">${result.skipped}</div>
                  </div>`
                )
                .join('') +
              '<div class="result muted"><div></div><div class="num">fetched</div><div class="num">new</div><div class="num">skip</div></div>'
        }
      </section>
    </div>
  </main>
</body>
</html>`

export const renderSectionPage = (
  params: {
    category: Category
    title: string
    locale: Locale
    articles: Article[]
    sources: NewsSource[]
  }
) => {
  const { category, title, locale, articles, sources } = params
  const languageLinks: Locale[] = ['pt', 'en', 'ja']
  const sourceRows = sources
    .filter((source) => category !== 'media' || source.category === 'media' || source.language === locale)
    .map(
      (source) => `<a class="source-pill" href="${escapeHtml(source.url)}" target="_blank" rel="noopener">
        <span>${escapeHtml(sourceDot(source.name))}</span>
        <strong>${escapeHtml(source.name)}</strong>
        <small>${escapeHtml(source.language.toUpperCase())} · ${escapeHtml(source.country)}</small>
      </a>`
    )
    .join('')

  const articleRows = articles
    .map((article) => {
      const detailUrl = `/article/${encodeURIComponent(article.slug)}?lang=${locale}`
      const storyUrl = locale === 'ja' ? detailUrl : article.url ?? detailUrl
      const image = article.imageUrl
        ? `<img src="${escapeHtml(article.imageUrl)}" alt="" loading="lazy"/>`
        : `<div class="fallback">${escapeHtml(article.imageIcon)}</div>`

      return `<article class="story">
        <a class="thumb" href="${escapeHtml(storyUrl)}" ${locale === 'ja' ? '' : 'target="_blank" rel="noopener"'}>${image}</a>
        <div>
          <div class="meta">${escapeHtml(article.sourceName)} · ${escapeHtml(formatDate(article.publishedAt, locale))}</div>
          <h2><a href="${escapeHtml(storyUrl)}" ${locale === 'ja' ? '' : 'target="_blank" rel="noopener"'}>${escapeHtml(article.title[locale])}</a></h2>
          <p>${escapeHtml(article.summary[locale])}</p>
          ${
            article.url
              ? `<a class="original" href="${escapeHtml(article.url)}" target="_blank" rel="noopener">${originalCopy[locale]} -></a>`
              : ''
          }
        </div>
      </article>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="${locale === 'ja' ? 'ja' : locale === 'en' ? 'en' : 'pt-BR'}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(title)} | UNS-N</title>
  <style>
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;background:#f4f6f8;color:#202124;font-family:Inter,Arial,sans-serif}
    a{color:inherit;text-decoration:none}
    header{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid #dfe3e8}
    .bar{max-width:1100px;margin:0 auto;height:60px;padding:0 18px;display:flex;align-items:center;justify-content:space-between;gap:14px}
    .brand{font-weight:900;letter-spacing:.02em}
    .langs{display:flex;gap:6px;align-items:center}
    .langs a{height:34px;min-width:44px;border:1px solid #dfe3e8;border-radius:6px;display:grid;place-items:center;font-size:12px;font-weight:900;background:#fff}
    .langs a.active{background:#1a73e8;color:#fff;border-color:#1a73e8}
    main{max-width:1100px;margin:0 auto;padding:28px 18px 64px}
    .back{display:inline-flex;margin-bottom:18px;color:#1a73e8;font-size:13px;font-weight:900}
    h1{font-size:32px;line-height:1.15;margin:0 0 8px}
    .sub{margin:0 0 22px;color:#667085;font-size:14px}
    .grid{display:grid;grid-template-columns:1fr;gap:12px}
    .story{display:grid;grid-template-columns:210px 1fr;gap:16px;background:#fff;border:1px solid #dfe3e8;border-radius:8px;padding:12px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
    .thumb{width:100%;aspect-ratio:16/10;background:#eef0f3;border-radius:6px;overflow:hidden;display:grid;place-items:center;color:#1a73e8;font-weight:900}
    .thumb img{width:100%;height:100%;object-fit:cover;display:block}
    .fallback{font-size:28px}
    .meta{font-size:12px;color:#667085;font-weight:800;margin-bottom:6px}
    h2{font-size:20px;line-height:1.25;margin:0 0 7px}
    p{font-size:14px;line-height:1.5;color:#3f4652;margin:0 0 10px}
    .original{display:inline-flex;color:#1a73e8;font-size:13px;font-weight:900}
    .empty{background:#fff;border:1px solid #dfe3e8;border-radius:8px;padding:18px;color:#667085}
    .sources{margin:0 0 20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px}
    .source-pill{background:#fff;border:1px solid #dfe3e8;border-radius:8px;padding:12px;display:grid;grid-template-columns:44px 1fr;column-gap:10px;align-items:center}
    .source-pill span{width:38px;height:38px;border-radius:6px;background:#eef4ff;color:#1a73e8;display:grid;place-items:center;font-size:12px;font-weight:900;grid-row:span 2}
    .source-pill strong{font-size:14px}
    .source-pill small{font-size:11px;color:#667085;font-weight:800}
    .source-title{font-size:15px;margin:26px 0 10px}
    @media(max-width:700px){
      .bar{height:auto;min-height:58px;align-items:flex-start;flex-direction:column;padding:12px 16px}
      main{padding:22px 14px 48px}
      h1{font-size:26px}
      .story{grid-template-columns:1fr}
      .thumb{aspect-ratio:16/9}
      h2{font-size:18px}
    }
  </style>
</head>
<body>
  <header>
    <div class="bar">
      <a class="brand" href="/">UNS-N</a>
      <nav class="langs" aria-label="Language">
        ${languageLinks
          .map(
            (lang) =>
              `<a class="${lang === locale ? 'active' : ''}" href="/section/${category}?lang=${lang}">${langName[lang]}</a>`
          )
          .join('')}
      </nav>
    </div>
  </header>
  <main>
    <a class="back" href="/?lang=${locale}"><- ${sectionBackCopy[locale]}</a>
    <h1>${escapeHtml(title)}</h1>
    <p class="sub">${articles.length} stories · ${langName[locale]}</p>
    ${
      category === 'media'
        ? `<h2 class="source-title">${mediaCopy[locale]}</h2><div class="sources">${sourceRows}</div>`
        : ''
    }
    <div class="grid">
      ${articleRows || `<div class="empty">${sectionEmptyCopy[locale]}</div>`}
    </div>
  </main>
</body>
</html>`
}

const legalLayout = (title: string, body: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title} | UNS-N</title>
  <style>
    body{margin:0;background:#f4f6f8;color:#202124;font-family:Inter,Arial,sans-serif;line-height:1.65}
    main{max-width:780px;margin:0 auto;padding:48px 20px 72px}
    a{color:#1a73e8}
    h1{font-size:30px;line-height:1.2;margin:0 0 18px}
    h2{font-size:18px;margin:30px 0 8px}
    p,li{font-size:15px;color:#3f4652}
    .back{display:inline-block;margin-bottom:28px;font-size:14px;font-weight:700}
  </style>
</head>
<body>
  <main>
    <a class="back" href="/">← Voltar</a>
    <h1>${title}</h1>
    ${body}
  </main>
</body>
</html>`

export const renderTermsPage = () =>
  legalLayout(
    'Termos de Uso',
    `<p>UNS-N e um agregador editorial para ajudar leitores em portugues e japones a descobrir noticias relevantes sobre Japao, Brasil, trabalho, vida diaria e negocios.</p>
    <h2>Conteudo de terceiros</h2>
    <p>Mostramos metadados publicos como titulo, fonte, data, link original e pequenos resumos quando fornecidos por feeds ou metadados publicos. O artigo completo pertence ao publisher original.</p>
    <h2>Links externos</h2>
    <p>Ao abrir uma noticia, voce sera direcionado para o site original. As regras, paywalls e politicas desse site continuam valendo.</p>
    <h2>Uso proibido</h2>
    <p>Nao usamos o servico para burlar paywalls, copiar artigos completos ou remover atribuicao de fonte.</p>`
  )

export const renderPrivacyPage = () =>
  legalLayout(
    'Privacidade',
    `<p>Coletamos apenas dados necessarios para login, seguranca e funcionamento basico do produto.</p>
    <h2>Cookies</h2>
    <p>Usamos cookie de sessao para manter usuarios autenticados na area administrativa.</p>
    <h2>Logs</h2>
    <p>Quando hospedado, o provedor de infraestrutura pode registrar informacoes tecnicas como IP, user agent e horario de acesso para seguranca e operacao.</p>
    <h2>Contato</h2>
    <p>Para solicitacoes de privacidade, use o contato editorial informado no site.</p>`
  )

export const renderCopyrightPage = () =>
  legalLayout(
    'Copyright e Remocao',
    `<p>Respeitamos direitos autorais e direitos dos publishers. O objetivo do UNS-N e enviar trafego para as fontes originais, nao substituir o conteudo delas.</p>
    <h2>Pedido de remocao</h2>
    <p>Se voce representa um publisher e quer remover ou alterar a forma como sua fonte aparece, envie a URL original, a URL no UNS-N e uma breve descricao do pedido.</p>
    <h2>Politica editorial</h2>
    <p>Podemos remover fontes, reduzir trechos exibidos ou trocar o metodo de coleta quando houver pedido do titular, conflito com termos de uso ou risco juridico.</p>`
  )

export const renderPublisherPolicyPage = () =>
  legalLayout(
    'Politica para Publishers',
    `<p>Nosso crawler prioriza RSS, Atom, sitemaps e metadados publicos. Evitamos copiar texto integral, ignorar paywall ou republicar imagens sem permissao clara.</p>
    <h2>Como exibimos noticias</h2>
    <ul>
      <li>Titulo, fonte, data e link canonico.</li>
      <li>Snippet curto quando fornecido pelo feed ou metadados da pagina.</li>
      <li>Resumo proprio em portugues ou japones quando criado pela nossa camada editorial.</li>
    </ul>
    <h2>Atribuicao</h2>
    <p>Cada noticia deve mostrar fonte visivel e botao para abrir o artigo original.</p>`
  )
