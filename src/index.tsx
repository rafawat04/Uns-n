import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

app.use('/static/*', serveStatic({ root: './' }))

app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>UNS→N（アンシーン） — 日本で働く、世界とつながる</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+JP:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />
  <style>
    :root {
      --ink:        #0D0D0D;
      --ink-2:      #3A3A3A;
      --ink-3:      #767676;
      --ink-4:      #ABABAB;
      --border:     #E4E4E4;
      --border-2:   #F0F0F0;
      --surface:    #FAFAFA;
      --white:      #FFFFFF;
      --accent:     #D94F00;   /* 赤橙 — 新聞的な赤 */
      --accent-sub: #1A56A0;   /* 深い青 */
      --tag-bg:     #F3F3F3;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; font-size: 15px; }

    body {
      background: var(--white);
      color: var(--ink);
      font-family: 'Inter', 'Noto Sans JP', sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: var(--white); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

    /* ── Utility ── */
    a { text-decoration: none; color: inherit; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); }

    /* ── NAV ── */
    nav {
      position: sticky; top: 0; z-index: 200;
      background: var(--white);
      border-bottom: 1px solid var(--border);
    }
    .nav-top {
      display: flex; align-items: center; justify-content: space-between;
      height: 56px;
    }
    .logo {
      display: flex; align-items: baseline; gap: 6px;
    }
    .logo-mark {
      font-size: 18px; font-weight: 800; letter-spacing: -0.5px;
      color: var(--ink);
      border-bottom: 2.5px solid var(--accent);
      padding-bottom: 1px;
      line-height: 1;
    }
    .logo-kana {
      font-size: 11px; font-weight: 500; color: var(--ink-3);
      font-family: 'Noto Sans JP', sans-serif;
      letter-spacing: 1px;
    }
    .nav-right {
      display: flex; align-items: center; gap: 20px;
    }
    .lang-switcher {
      display: flex; gap: 2px;
      border: 1px solid var(--border);
      border-radius: 6px; padding: 3px;
    }
    .lang-btn {
      padding: 4px 12px; border-radius: 4px;
      font-size: 11px; font-weight: 600;
      cursor: pointer; border: none;
      background: transparent; color: var(--ink-3);
      letter-spacing: 0.3px; transition: all 0.15s;
    }
    .lang-btn.active { background: var(--ink); color: white; }
    .lang-btn:hover:not(.active) { background: var(--border-2); color: var(--ink); }

    /* NAV sub-bar (categories) */
    .nav-sub {
      border-top: 1px solid var(--border-2);
      overflow-x: auto;
      scrollbar-width: none;
    }
    .nav-sub::-webkit-scrollbar { display: none; }
    .nav-sub-inner {
      display: flex; align-items: center; gap: 0;
      height: 40px; white-space: nowrap;
    }
    .nav-cat {
      padding: 0 16px; height: 100%;
      display: flex; align-items: center;
      font-size: 12px; font-weight: 600;
      color: var(--ink-3); cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.15s; flex-shrink: 0;
      letter-spacing: 0.3px;
    }
    .nav-cat:hover { color: var(--ink); border-bottom-color: var(--ink); }
    .nav-cat.active { color: var(--accent); border-bottom-color: var(--accent); }
    .nav-cat-divider { width: 1px; height: 14px; background: var(--border); flex-shrink: 0; }

    /* ── HERO / TODAY'S EDITION ── */
    .edition-bar {
      background: var(--ink);
      color: white;
      padding: 8px 0;
    }
    .edition-bar-inner {
      display: flex; align-items: center; justify-content: space-between;
      font-size: 11px; letter-spacing: 0.5px;
    }
    .edition-date { font-weight: 600; opacity: 0.9; }
    .edition-langs {
      display: flex; gap: 16px; font-size: 10px; opacity: 0.6;
    }

    /* Breaking ticker */
    .ticker-bar {
      background: var(--accent);
      color: white;
      display: flex; align-items: center;
      overflow: hidden; height: 34px;
    }
    .ticker-label {
      background: rgba(0,0,0,0.25);
      font-size: 10px; font-weight: 800; letter-spacing: 2px;
      padding: 0 14px; height: 100%;
      display: flex; align-items: center; flex-shrink: 0;
      white-space: nowrap;
    }
    .ticker-scroll { overflow: hidden; flex: 1; }
    .ticker-track {
      display: flex; gap: 60px;
      animation: ticker 40s linear infinite;
      white-space: nowrap;
    }
    .ticker-item { font-size: 12px; font-weight: 500; opacity: 0.95; }
    @keyframes ticker {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    /* ── MAIN GRID LAYOUT ── */
    .page-layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 0;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .main-col { padding: 32px 32px 32px 0; border-right: 1px solid var(--border); }
    .side-col { padding: 32px 0 32px 28px; }

    /* ── SECTION HEADERS ── */
    .section-head {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid var(--ink);
    }
    .section-head-label {
      font-size: 13px; font-weight: 800;
      letter-spacing: 1.5px; text-transform: uppercase;
      color: var(--ink);
    }
    .section-head-sub {
      font-size: 11px; color: var(--ink-3);
      font-family: 'Noto Sans JP', sans-serif;
    }
    .section-head-line { flex: 1; height: 1px; background: var(--border); }

    .section-head-accent {
      border-bottom-color: var(--accent);
    }
    .section-head-accent .section-head-label { color: var(--accent); }

    .section-head-blue {
      border-bottom-color: var(--accent-sub);
    }
    .section-head-blue .section-head-label { color: var(--accent-sub); }

    /* ── TOP STORY ── */
    .top-story {
      padding-bottom: 24px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--border);
    }
    .top-story-category {
      font-size: 10px; font-weight: 700; letter-spacing: 2px;
      text-transform: uppercase; color: var(--accent);
      margin-bottom: 10px;
      display: flex; align-items: center; gap: 8px;
    }
    .top-story-category::after {
      content: ''; flex: none;
      display: inline-block; width: 24px; height: 1.5px;
      background: var(--accent); vertical-align: middle;
    }
    .top-story h1 {
      font-size: 26px; font-weight: 800;
      line-height: 1.25; letter-spacing: -0.5px;
      color: var(--ink); margin-bottom: 10px;
    }
    .top-story-meta {
      display: flex; align-items: center; gap: 10px;
      font-size: 11px; color: var(--ink-3); margin-bottom: 14px;
    }
    .top-story-meta-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--ink-4); }
    .top-story-body { font-size: 14px; line-height: 1.75; color: var(--ink-2); }

    .lang-block { margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border); }
    .lang-tag {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 10px; font-weight: 700; letter-spacing: 1px;
      text-transform: uppercase; color: var(--ink-4);
      margin-bottom: 6px;
    }
    .lang-tag-flag { font-size: 13px; }
    .lang-text-ja { font-family: 'Noto Sans JP', sans-serif; font-size: 13.5px; line-height: 1.8; color: var(--ink-2); }
    .lang-text-pt { font-size: 13px; line-height: 1.7; color: var(--ink-2); }
    .lang-text-en { font-size: 13px; line-height: 1.7; color: var(--ink-2); }

    /* ── NEWS CARD (list) ── */
    .news-list { display: flex; flex-direction: column; gap: 0; }
    .news-item {
      display: grid; grid-template-columns: 1fr auto;
      gap: 16px; align-items: start;
      padding: 18px 0;
      border-bottom: 1px solid var(--border-2);
      cursor: pointer;
      transition: background 0.1s;
    }
    .news-item:last-child { border-bottom: none; }
    .news-item:hover { background: var(--surface); margin: 0 -12px; padding-left: 12px; padding-right: 12px; }
    .news-item-cat {
      font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
      text-transform: uppercase; margin-bottom: 5px;
    }
    .news-item-title {
      font-size: 15px; font-weight: 700;
      line-height: 1.35; color: var(--ink); margin-bottom: 6px;
      letter-spacing: -0.2px;
    }
    .news-item-lead {
      font-size: 12.5px; color: var(--ink-3); line-height: 1.6;
      margin-bottom: 6px;
    }
    .news-item-meta {
      font-size: 11px; color: var(--ink-4);
      display: flex; align-items: center; gap: 8px;
    }
    .news-item-source {
      font-weight: 600; color: var(--ink-3);
    }
    .news-item-num {
      font-size: 32px; font-weight: 900; color: var(--border);
      line-height: 1; user-select: none; align-self: center;
      min-width: 36px; text-align: right;
    }

    /* ── MEDIA SOURCE GRID ── */
    .source-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .source-card {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
      background: var(--white);
    }
    .source-card:hover {
      border-color: var(--ink);
      background: var(--surface);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .source-icon {
      width: 32px; height: 32px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; flex-shrink: 0;
      font-weight: 900;
    }
    .source-info { min-width: 0; }
    .source-name {
      font-size: 12px; font-weight: 700; color: var(--ink);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .source-lang { font-size: 10px; color: var(--ink-4); letter-spacing: 0.3px; }
    .source-arrow {
      margin-left: auto; font-size: 10px; color: var(--ink-4); flex-shrink: 0;
    }
    .source-grid-full { grid-template-columns: 1fr; }
    .source-grid-3 { grid-template-columns: 1fr 1fr 1fr; }

    /* ── GUIDE CARD ── */
    .guide-card {
      border: 1px solid var(--border);
      border-radius: 10px; overflow: hidden;
      margin-bottom: 12px; transition: box-shadow 0.15s;
      background: var(--white);
    }
    .guide-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .guide-card-head {
      padding: 14px 16px 12px;
      border-bottom: 1px solid var(--border-2);
      display: flex; align-items: flex-start; gap: 12px;
    }
    .guide-card-icon {
      width: 38px; height: 38px; border-radius: 8px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }
    .guide-card-title {
      font-size: 13px; font-weight: 700; color: var(--ink); line-height: 1.35;
      margin-bottom: 3px;
    }
    .guide-card-title-en {
      font-size: 11px; color: var(--ink-3); font-weight: 500;
    }
    .guide-badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 9px; font-weight: 700; letter-spacing: 1px;
      text-transform: uppercase; padding: 2px 8px;
      border-radius: 100px; margin-bottom: 8px;
    }
    .badge-red    { background: #FEE2E2; color: #B91C1C; }
    .badge-orange { background: #FEF3C7; color: #92400E; }
    .badge-green  { background: #D1FAE5; color: #065F46; }
    .badge-blue   { background: #DBEAFE; color: #1D4ED8; }
    .guide-card-body { padding: 12px 16px; font-size: 12px; color: var(--ink-2); line-height: 1.7; }
    .guide-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
    .guide-list li {
      display: flex; align-items: flex-start; gap: 7px;
      font-size: 11.5px; color: var(--ink-2);
    }
    .guide-list-dot {
      width: 5px; height: 5px; border-radius: 50%;
      flex-shrink: 0; margin-top: 5px;
    }
    .guide-source {
      padding: 8px 16px;
      font-size: 10px; color: var(--ink-4);
      border-top: 1px solid var(--border-2);
      background: var(--surface);
    }

    /* ── GLOBAL FEED ITEM ── */
    .global-item {
      padding: 16px 0;
      border-bottom: 1px solid var(--border-2);
    }
    .global-item:last-child { border-bottom: none; }
    .global-item-flag {
      display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
    }
    .global-item-country { font-size: 11px; font-weight: 700; color: var(--ink-3); letter-spacing: 0.3px; }
    .global-item-title { font-size: 14px; font-weight: 700; color: var(--ink); line-height: 1.35; margin-bottom: 8px; }
    .global-jp-summary {
      background: #F0F4FF; border-left: 3px solid var(--accent-sub);
      padding: 10px 12px; border-radius: 0 6px 6px 0; margin-bottom: 8px;
    }
    .global-jp-label {
      font-size: 9px; font-weight: 700; letter-spacing: 1px;
      text-transform: uppercase; color: var(--accent-sub); margin-bottom: 4px;
    }
    .global-jp-text {
      font-size: 12.5px; line-height: 1.7; color: var(--ink-2);
      font-family: 'Noto Sans JP', sans-serif;
    }
    .global-source { font-size: 11px; color: var(--ink-4); }

    /* ── SIDEBAR components ── */
    .side-section { margin-bottom: 36px; }

    /* Quick Access grid */
    .quick-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .quick-btn {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 5px; padding: 12px 8px;
      border: 1px solid var(--border); border-radius: 8px;
      cursor: pointer; transition: all 0.15s; background: var(--white);
      text-align: center;
    }
    .quick-btn:hover { border-color: var(--ink); background: var(--surface); }
    .quick-btn-icon { font-size: 20px; }
    .quick-btn-label { font-size: 10px; font-weight: 700; color: var(--ink); line-height: 1.3; }
    .quick-btn-sub { font-size: 9px; color: var(--ink-4); }

    /* Sidebar news mini */
    .mini-news-item {
      display: flex; gap: 10px; align-items: flex-start;
      padding: 10px 0; border-bottom: 1px solid var(--border-2);
    }
    .mini-news-item:last-child { border-bottom: none; }
    .mini-news-num {
      font-size: 18px; font-weight: 900; color: var(--border);
      line-height: 1; flex-shrink: 0; width: 20px; text-align: center;
    }
    .mini-news-title { font-size: 12.5px; font-weight: 600; color: var(--ink); line-height: 1.4; }
    .mini-news-src { font-size: 10px; color: var(--ink-4); margin-top: 2px; }

    /* Jobs snippet (sidebar) */
    .job-snippet {
      padding: 12px 14px;
      border: 1px solid var(--border); border-radius: 8px;
      margin-bottom: 8px; transition: all 0.15s; background: var(--white);
    }
    .job-snippet:hover { border-color: var(--ink-2); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .job-snippet-title { font-size: 13px; font-weight: 700; color: var(--ink); margin-bottom: 4px; }
    .job-snippet-company { font-size: 11px; color: var(--ink-3); margin-bottom: 6px; }
    .job-snippet-tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .job-tag {
      font-size: 10px; font-weight: 600; padding: 2px 7px;
      border-radius: 4px; background: var(--tag-bg); color: var(--ink-3);
    }
    .job-tag-hot { background: #FEF3C7; color: #92400E; }

    /* ── FOOTER ── */
    footer {
      background: var(--ink);
      color: rgba(255,255,255,0.6);
      padding: 40px 0 24px;
      margin-top: 48px;
    }
    .footer-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 32px; }
    .footer-logo-mark { font-size: 20px; font-weight: 800; color: white; border-bottom: 2px solid var(--accent); display: inline-block; padding-bottom: 2px; margin-bottom: 10px; }
    .footer-desc { font-size: 12px; line-height: 1.7; max-width: 260px; }
    .footer-col-title { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: white; margin-bottom: 14px; }
    .footer-links { display: flex; flex-direction: column; gap: 8px; }
    .footer-link { font-size: 12px; color: rgba(255,255,255,0.5); transition: color 0.15s; }
    .footer-link:hover { color: white; }
    .footer-bottom {
      border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;
      display: flex; align-items: center; justify-content: space-between;
      font-size: 11px;
    }

    /* ── Tags ── */
    .tag {
      display: inline-block;
      font-size: 10px; font-weight: 700; letter-spacing: 0.8px;
      text-transform: uppercase; padding: 2px 8px; border-radius: 3px;
    }
    .tag-red    { background: #FEE2E2; color: #B91C1C; }
    .tag-blue   { background: #DBEAFE; color: #1D4ED8; }
    .tag-green  { background: #D1FAE5; color: #065F46; }
    .tag-amber  { background: #FEF3C7; color: #92400E; }
    .tag-slate  { background: var(--tag-bg); color: var(--ink-3); }
    .tag-accent { background: var(--ink); color: white; }

    /* ── Dividers ── */
    hr { border: none; border-top: 1px solid var(--border); }

    /* ── Responsive ── */
    @media (max-width: 960px) {
      .page-layout { grid-template-columns: 1fr; padding: 0 16px; }
      .main-col { padding: 24px 0; border-right: none; }
      .side-col { padding: 0 0 24px; border-top: 1px solid var(--border); }
      .source-grid-3 { grid-template-columns: 1fr 1fr; }
      .footer-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 600px) {
      .nav-right .lang-switcher { display: none; }
      .source-grid { grid-template-columns: 1fr; }
      .footer-grid { grid-template-columns: 1fr; gap: 24px; }
      .footer-bottom { flex-direction: column; gap: 6px; text-align: center; }
    }

    /* ── Animations ── */
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(10px); }
      to   { opacity:1; transform:translateY(0); }
    }
    .fade-in { animation: fadeUp 0.4s ease both; }
    .delay-1 { animation-delay: 0.05s; }
    .delay-2 { animation-delay: 0.1s; }
    .delay-3 { animation-delay: 0.15s; }
  </style>
</head>
<body>

<!-- ═══════════════ NAV ═══════════════ -->
<nav>
  <div class="container">
    <div class="nav-top">
      <div class="logo">
        <span class="logo-mark">UNS→N</span>
        <span class="logo-kana">アンシーン</span>
      </div>
      <div class="nav-right">
        <div class="lang-switcher">
          <button class="lang-btn" onclick="setLang('pt')">PT</button>
          <button class="lang-btn active" onclick="setLang('en')">EN</button>
          <button class="lang-btn" onclick="setLang('ja')">やさしい</button>
        </div>
      </div>
    </div>
  </div>
  <div class="nav-sub">
    <div class="container">
      <div class="nav-sub-inner">
        <span class="nav-cat active">全て</span>
        <div class="nav-cat-divider"></div>
        <span class="nav-cat" onclick="scrollToSection('business')">ビジネス</span>
        <div class="nav-cat-divider"></div>
        <span class="nav-cat" onclick="scrollToSection('life')">生活・行政</span>
        <div class="nav-cat-divider"></div>
        <span class="nav-cat" onclick="scrollToSection('global')">ブラジル・南米</span>
        <div class="nav-cat-divider"></div>
        <span class="nav-cat" onclick="scrollToSection('sources')">メディア一覧</span>
        <div class="nav-cat-divider"></div>
        <span class="nav-cat" onclick="scrollToSection('municipality')">自治体情報</span>
      </div>
    </div>
  </div>
</nav>

<!-- EDITION BAR -->
<div class="edition-bar">
  <div class="container">
    <div class="edition-bar-inner">
      <span class="edition-date">2026年6月5日（木） — 今日のブリーフィング</span>
      <span class="edition-langs">Português · English · やさしい日本語</span>
    </div>
  </div>
</div>

<!-- TICKER -->
<div class="ticker-bar">
  <div class="ticker-label">速報</div>
  <div class="ticker-scroll">
    <div class="ticker-track" id="ticker">
      <span class="ticker-item">在留カード＋マイナ統合「特定在留カード」6月14日より発行開始</span>
      <span class="ticker-item">　·　</span>
      <span class="ticker-item">日本・メルコスールEPA交渉スタート（5月26日）</span>
      <span class="ticker-item">　·　</span>
      <span class="ticker-item">労働基準法40年ぶり大改正案が国会審議入り</span>
      <span class="ticker-item">　·　</span>
      <span class="ticker-item">スマート製造市場、2034年に3兆円へ（CAGR 15.2%）</span>
      <span class="ticker-item">　·　</span>
      <span class="ticker-item">特定技能2号 対象分野さらに拡大、家族帯同・更新無制限</span>
      <span class="ticker-item">　·　</span>
      <span class="ticker-item">EU・メルコスール協定発効 — ブラジル再生エネルギー産業が急成長</span>
      <span class="ticker-item">　·　</span>
      <!-- dup for loop -->
      <span class="ticker-item">在留カード＋マイナ統合「特定在留カード」6月14日より発行開始</span>
      <span class="ticker-item">　·　</span>
      <span class="ticker-item">日本・メルコスールEPA交渉スタート（5月26日）</span>
      <span class="ticker-item">　·　</span>
      <span class="ticker-item">労働基準法40年ぶり大改正案が国会審議入り</span>
      <span class="ticker-item">　·　</span>
      <span class="ticker-item">スマート製造市場、2034年に3兆円へ（CAGR 15.2%）</span>
      <span class="ticker-item">　·　</span>
    </div>
  </div>
</div>

<!-- ═══════════════ MAIN LAYOUT ═══════════════ -->
<div class="page-layout">

  <!-- ━━━━━━━━━━━━━━━ MAIN COLUMN ━━━━━━━━━━━━━━━ -->
  <main class="main-col">

    <!-- ── TOP STORY ── -->
    <section class="top-story fade-in" id="business">
      <div class="top-story-category">特集 · ビジネス</div>
      <h1>在留カードとマイナンバーが1枚に統合<br><span style="font-size:18px;font-weight:600;color:var(--ink-2);">2026年6月14日、新「特定在留カード」発行開始</span></h1>
      <div class="top-story-meta">
        <span class="news-item-source">出典：法務省入管庁 / Fragomen</span>
        <span class="top-story-meta-dot"></span>
        <span>2026年6月 施行</span>
        <span class="top-story-meta-dot"></span>
        <span class="tag tag-red">要確認</span>
        <span class="tag tag-blue">行政</span>
      </div>

      <div class="lang-block">
        <div class="lang-tag"><span class="lang-tag-flag">🇯🇵</span> やさしい日本語</div>
        <p class="lang-text-ja">日本政府は2026年6月14日から、在留カードとマイナンバーカードを1枚にまとめた「特定在留カード」の発行を始めます。今持っているカードは有効期限まで使えます。新しくカードをもらうとき（ビザ更新など）から、統合カードに変わります。手続きは入管局1か所でできるようになります。</p>
      </div>
      <div class="lang-block">
        <div class="lang-tag"><span class="lang-tag-flag">🇧🇷</span> Português</div>
        <p class="lang-text-pt">A partir de 14 de junho de 2026, o Japão lançará o novo "Cartão de Residência Especificado", que unifica o Residence Card (Zairyu Card) e o My Number Card em um único documento. Os cartões atuais continuam válidos até o vencimento. A mudança entra em vigor na próxima renovação de visto ou emissão. Procedimentos administrativos poderão ser feitos em um único balcão da Agência de Serviços de Imigração.</p>
      </div>
      <div class="lang-block">
        <div class="lang-tag"><span class="lang-tag-flag">🇺🇸</span> English</div>
        <p class="lang-text-en">Effective June 14, 2026, Japan introduces the "Specified Residence Card" — a single document combining the current Residence Card and My Number Card. Existing cards remain valid until expiry. The integrated card will be issued upon next renewal. All administrative procedures are consolidated at a single Immigration Services Agency counter. Source: Fragomen, Mar 4 2026.</p>
      </div>
    </section>

    <!-- ── BUSINESS NEWS LIST ── -->
    <div class="section-head">
      <span class="section-head-label">ビジネス・テクノロジー</span>
      <span class="section-head-sub">Business & Tech</span>
      <div class="section-head-line"></div>
    </div>

    <div class="news-list fade-in delay-1">

      <article class="news-item">
        <div>
          <div class="news-item-cat" style="color:#D94F00;">製造DX</div>
          <div class="news-item-title">スマート製造ソフト市場、2034年に3兆円規模へ — 日本の工場DX革命が加速</div>
          <div class="news-item-lead">AIとIoTで動く工場が増えています。2025年に8,400億円の市場が、2034年には3兆円になると予想されています（年成長率15.2%）。外国人エンジニアに大きなチャンスです。</div>
          <div style="margin-top:6px;">
            <span class="tag tag-amber">製造</span>&nbsp;
            <span class="tag tag-slate">AI</span>&nbsp;
            <span class="tag tag-slate">IoT</span>
          </div>
          <div class="news-item-meta" style="margin-top:8px;">
            <span class="news-item-source">IMARC Research</span>
            <span class="top-story-meta-dot"></span>
            <span>2026年6月</span>
          </div>
          <div class="lang-block" style="margin-top:10px;">
            <div class="lang-tag"><span class="lang-tag-flag">🇧🇷</span> Português</div>
            <p class="lang-text-pt">O mercado de software para manufatura inteligente no Japão deve crescer de US$ 8,4B (2025) para US$ 30B até 2034, CAGR de 15,18%. Fábricas japonesas aceleram adoção de IA, gêmeos digitais e IIoT — criando demanda por engenheiros bilíngues com expertise em automação.</p>
          </div>
        </div>
        <div class="news-item-num">01</div>
      </article>

      <article class="news-item">
        <div>
          <div class="news-item-cat" style="color:#1A56A0;">スタートアップ</div>
          <div class="news-item-title">SusHi Tech Tokyo 2026：AI・ロボット・宇宙で日本スタートアップが世界へ</div>
          <div class="news-item-lead">4月27〜29日に開催。テーマはAI・ロボット・レジリエンス・エンタメ。政府は5年で10兆円規模のスタートアップ投資計画を進行中。</div>
          <div style="margin-top:6px;">
            <span class="tag tag-blue">スタートアップ</span>&nbsp;
            <span class="tag tag-slate">ロボット</span>&nbsp;
            <span class="tag tag-slate">宇宙</span>
          </div>
          <div class="news-item-meta" style="margin-top:8px;">
            <span class="news-item-source">TechCrunch / 東京都</span>
            <span class="top-story-meta-dot"></span>
            <span>2026年4月</span>
          </div>
          <div class="lang-block" style="margin-top:10px;">
            <div class="lang-tag"><span class="lang-tag-flag">🇧🇷</span> Português</div>
            <p class="lang-text-pt">SusHi Tech Tokyo 2026 (abr/27-29) reuniu 500+ startups globais em IA, Robótica, Resiliência e Entretenimento. O plano quinquenal do governo japonês visa ¥10 trilhões em investimento em startups, criando oportunidades para talentos bilíngues em gestão de inovação.</p>
          </div>
        </div>
        <div class="news-item-num">02</div>
      </article>

      <article class="news-item">
        <div>
          <div class="news-item-cat" style="color:#D94F00;">労働法</div>
          <div class="news-item-title">労働基準法 40年ぶりの大改正へ — 外国人労働者の権利も強化</div>
          <div class="news-item-lead">AI・リモートワーク・ギグ経済への対応を目的とした大改正。残業規制・休暇義務・多言語説明義務化などが盛り込まれる見通しです。</div>
          <div style="margin-top:6px;">
            <span class="tag tag-red">要注目</span>&nbsp;
            <span class="tag tag-slate">労働法</span>&nbsp;
            <span class="tag tag-slate">外国人</span>
          </div>
          <div class="news-item-meta" style="margin-top:8px;">
            <span class="news-item-source">Paul Hastings / 厚生労働省</span>
            <span class="top-story-meta-dot"></span>
            <span>2026年2月〜</span>
          </div>
          <div class="lang-block" style="margin-top:10px;">
            <div class="lang-tag"><span class="lang-tag-flag">🇧🇷</span> Português</div>
            <p class="lang-text-pt">O Japão prepara a primeira grande reforma da Lei de Normas do Trabalho em 40 anos. Mudanças incluem revisão de horas extras, novos direitos de descanso e obrigatoriedade de explicar regras em múltiplos idiomas para trabalhadores estrangeiros.</p>
          </div>
        </div>
        <div class="news-item-num">03</div>
      </article>

      <article class="news-item">
        <div>
          <div class="news-item-cat" style="color:#1A56A0;">製造・自動化</div>
          <div class="news-item-title">産業用ロボット・AIで工場が変わる：2026年の自動化5大トレンド</div>
          <div class="news-item-lead">グローバル産業用自動化市場が2,210億ドル突破。協働ロボット（コボット）、デジタルツイン、AI予測保全が製造現場の標準になりつつあります。</div>
          <div style="margin-top:6px;">
            <span class="tag tag-amber">自動化</span>&nbsp;
            <span class="tag tag-slate">コボット</span>&nbsp;
            <span class="tag tag-slate">デジタルツイン</span>
          </div>
          <div class="news-item-meta" style="margin-top:8px;">
            <span class="news-item-source">JR Automation / LinkedIn</span>
            <span class="top-story-meta-dot"></span>
            <span>2026年3月</span>
          </div>
          <div class="lang-block" style="margin-top:10px;">
            <div class="lang-tag"><span class="lang-tag-flag">🇺🇸</span> English</div>
            <p class="lang-text-en">Industrial automation market surpassed USD 221B in 2026. Key drivers: AI-driven collaborative robotics, digital twin adoption for predictive maintenance, and flexible automation adapting to demand fluctuations. Critical skill set for foreign engineers in Japan.</p>
          </div>
        </div>
        <div class="news-item-num">04</div>
      </article>

    </div><!-- /news-list -->

    <!-- ── MEDIA SOURCES: 全国紙・経済紙 ── -->
    <div style="margin-top:40px;" id="sources">
      <div class="section-head section-head-accent">
        <span class="section-head-label">ニュースソース — 全国紙・経済紙</span>
        <div class="section-head-line"></div>
      </div>
      <div class="source-grid source-grid-3 fade-in">

        <a href="https://www.nikkei.com" target="_blank" rel="noopener" class="source-card">
          <div class="source-icon" style="background:#FEF9C3;color:#78350F;font-size:10px;letter-spacing:-0.5px;font-weight:900;">日経</div>
          <div class="source-info">
            <div class="source-name">日本経済新聞</div>
            <div class="source-lang">経済・ビジネス · JA</div>
          </div>
          <span class="source-arrow">↗</span>
        </a>

        <a href="https://asia.nikkei.com" target="_blank" rel="noopener" class="source-card">
          <div class="source-icon" style="background:#EFF6FF;color:#1D4ED8;font-size:10px;letter-spacing:-0.5px;font-weight:900;">NAR</div>
          <div class="source-info">
            <div class="source-name">Nikkei Asia</div>
            <div class="source-lang">経済・アジア · EN</div>
          </div>
          <span class="source-arrow">↗</span>
        </a>

        <a href="https://www.asahi.com" target="_blank" rel="noopener" class="source-card">
          <div class="source-icon" style="background:#FEE2E2;color:#B91C1C;font-size:10px;font-weight:900;">朝日</div>
          <div class="source-info">
            <div class="source-name">朝日新聞</div>
            <div class="source-lang">総合ニュース · JA</div>
          </div>
          <span class="source-arrow">↗</span>
        </a>

        <a href="https://www.yomiuri.co.jp" target="_blank" rel="noopener" class="source-card">
          <div class="source-icon" style="background:#F3F4F6;color:#374151;font-size:10px;font-weight:900;">読売</div>
          <div class="source-info">
            <div class="source-name">読売新聞</div>
            <div class="source-lang">総合ニュース · JA</div>
          </div>
          <span class="source-arrow">↗</span>
        </a>

        <a href="https://mainichi.jp" target="_blank" rel="noopener" class="source-card">
          <div class="source-icon" style="background:#FEF3C7;color:#92400E;font-size:10px;font-weight:900;">毎日</div>
          <div class="source-info">
            <div class="source-name">毎日新聞</div>
            <div class="source-lang">総合ニュース · JA</div>
          </div>
          <span class="source-arrow">↗</span>
        </a>

        <a href="https://www.sankei.com" target="_blank" rel="noopener" class="source-card">
          <div class="source-icon" style="background:#F0FDF4;color:#166534;font-size:10px;font-weight:900;">産経</div>
          <div class="source-info">
            <div class="source-name">産経新聞</div>
            <div class="source-lang">総合ニュース · JA</div>
          </div>
          <span class="source-arrow">↗</span>
        </a>

        <a href="https://www.japantimes.co.jp" target="_blank" rel="noopener" class="source-card">
          <div class="source-icon" style="background:#EFF6FF;color:#1D4ED8;font-size:10px;font-weight:900;letter-spacing:-0.5px;">JT</div>
          <div class="source-info">
            <div class="source-name">The Japan Times</div>
            <div class="source-lang">外国人向け · EN</div>
          </div>
          <span class="source-arrow">↗</span>
        </a>

        <a href="https://nhkworld.nhk.or.jp" target="_blank" rel="noopener" class="source-card">
          <div class="source-icon" style="background:#F5F3FF;color:#5B21B6;font-size:10px;font-weight:900;">NHK</div>
          <div class="source-info">
            <div class="source-name">NHK World</div>
            <div class="source-lang">多言語放送 · EN/PT</div>
          </div>
          <span class="source-arrow">↗</span>
        </a>

        <a href="https://www3.nhk.or.jp/news/easy/" target="_blank" rel="noopener" class="source-card">
          <div class="source-icon" style="background:#FFF7ED;color:#C2410C;font-size:9px;font-weight:900;">やさしい</div>
          <div class="source-info">
            <div class="source-name">NHK やさしい日本語</div>
            <div class="source-lang">易しい日本語 · JA-Easy</div>
          </div>
          <span class="source-arrow">↗</span>
        </a>

      </div>

      <!-- ── 経済・業界紙 ── -->
      <div style="margin-top:20px;">
        <div style="font-size:11px;font-weight:700;color:var(--ink-3);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">経済・産業・業界紙</div>
        <div class="source-grid source-grid-3">

          <a href="https://toyokeizai.net" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#FEF2F2;color:#991B1B;font-size:9px;font-weight:900;">東洋経</div>
            <div class="source-info">
              <div class="source-name">東洋経済オンライン</div>
              <div class="source-lang">経済・企業 · JA</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

          <a href="https://diamond.jp" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#FFF7ED;color:#C2410C;font-size:9px;font-weight:900;">ダイヤ</div>
            <div class="source-info">
              <div class="source-name">ダイヤモンド・オンライン</div>
              <div class="source-lang">経営・マネー · JA</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

          <a href="https://newspicks.com" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#F0FDF4;color:#166534;font-size:9px;font-weight:900;">NP</div>
            <div class="source-info">
              <div class="source-name">NewsPicks</div>
              <div class="source-lang">ビジネス · JA/EN</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

          <a href="https://techcrunch.com/tag/japan" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#F5F3FF;color:#5B21B6;font-size:9px;font-weight:900;">TC</div>
            <div class="source-info">
              <div class="source-name">TechCrunch Japan</div>
              <div class="source-lang">スタートアップ · JA</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

          <a href="https://jp.reuters.com" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#EFF6FF;color:#1E40AF;font-size:9px;font-weight:900;">Reuters</div>
            <div class="source-info">
              <div class="source-name">ロイター日本語版</div>
              <div class="source-lang">国際経済 · JA</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

          <a href="https://www.bloomberg.co.jp" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#F8FAFC;color:#0F172A;font-size:9px;font-weight:900;">BB</div>
            <div class="source-info">
              <div class="source-name">Bloomberg Japan</div>
              <div class="source-lang">金融・マーケット · JA</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

        </div>
      </div>

      <!-- ── ブラジル・ポルトガル語メディア ── -->
      <div style="margin-top:20px;">
        <div style="font-size:11px;font-weight:700;color:var(--ink-3);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">🇧🇷 ブラジル・ポルトガル語メディア</div>
        <div class="source-grid">

          <a href="https://www.folha.uol.com.br" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#EFF6FF;color:#1D4ED8;font-size:9px;font-weight:900;">Folha</div>
            <div class="source-info">
              <div class="source-name">Folha de S.Paulo</div>
              <div class="source-lang">総合ニュース · PT</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

          <a href="https://oglobo.globo.com" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#FEF2F2;color:#991B1B;font-size:9px;font-weight:900;">O Globo</div>
            <div class="source-info">
              <div class="source-name">O Globo</div>
              <div class="source-lang">総合ニュース · PT</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

          <a href="https://valor.globo.com" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#F0FDF4;color:#166534;font-size:9px;font-weight:900;">Valor</div>
            <div class="source-info">
              <div class="source-name">Valor Econômico</div>
              <div class="source-lang">経済・金融 · PT</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

          <a href="https://www.estadao.com.br" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#FFF7ED;color:#C2410C;font-size:9px;font-weight:900;">Estadão</div>
            <div class="source-info">
              <div class="source-name">O Estado de S. Paulo</div>
              <div class="source-lang">総合ニュース · PT</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

          <a href="https://www.infomoney.com.br" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#EFF6FF;color:#1E40AF;font-size:9px;font-weight:900;">IM</div>
            <div class="source-info">
              <div class="source-name">InfoMoney</div>
              <div class="source-lang">投資・マーケット · PT</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

          <a href="https://international.istoedinheiro.com.br" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#FEF9C3;color:#78350F;font-size:9px;font-weight:900;">IstoÉ</div>
            <div class="source-info">
              <div class="source-name">IstoÉ Dinheiro</div>
              <div class="source-lang">経済週刊誌 · PT</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

        </div>
      </div>
    </div><!-- /sources -->

    <!-- ── LIFE / ADMIN ── -->
    <div style="margin-top:40px;" id="life">
      <div class="section-head section-head-blue">
        <span class="section-head-label">生活・行政・ビザ</span>
        <span class="section-head-sub">Life &amp; Admin Essentials</span>
        <div class="section-head-line"></div>
      </div>

      <div class="guide-card fade-in">
        <div class="guide-card-head">
          <div class="guide-card-icon" style="background:#FEE2E2;">🪪</div>
          <div>
            <div class="guide-badge badge-red">⚠ 6月14日施行</div>
            <div class="guide-card-title">在留カード＋マイナンバー 統合カード発行開始</div>
            <div class="guide-card-title-en">New Specified Residence Card — Launch June 14, 2026</div>
          </div>
        </div>
        <div class="guide-card-body">
          <p>在留カードとマイナンバーカードが1枚に統合されます。現行カードは有効期限まで使用可能。次回の更新・新規取得から統合カードに切替わります。</p>
          <ul class="guide-list">
            <li><span class="guide-list-dot" style="background:#10B981;"></span>現在のカードは有効期限まで継続利用OK</li>
            <li><span class="guide-list-dot" style="background:#10B981;"></span>入管局1か所で両カードの手続きが完結</li>
            <li><span class="guide-list-dot" style="background:#F59E0B;"></span>ICチップに保険・医療情報が連携（オプトアウト可）</li>
            <li><span class="guide-list-dot" style="background:#10B981;"></span>雇用主への通知手続きも簡素化</li>
          </ul>
        </div>
        <div class="guide-source">出典：法務省入管庁 / Fragomen (Mar 4, 2026) ·
          <a href="https://www.fragomen.com/insights/japan-new-integrated-specified-residence-card-to-launch.html" target="_blank" style="color:var(--accent-sub);text-decoration:underline;">原文を読む ↗</a>
        </div>
      </div>

      <div class="guide-card fade-in delay-1">
        <div class="guide-card-head">
          <div class="guide-card-icon" style="background:#FEF3C7;">⚖️</div>
          <div>
            <div class="guide-badge badge-orange">国会審議中</div>
            <div class="guide-card-title">労働基準法 大改正（40年ぶり）</div>
            <div class="guide-card-title-en">Major Labour Standards Act Reform — 2026</div>
          </div>
        </div>
        <div class="guide-card-body">
          <p>AI・リモートワーク・ギグ経済への対応を目的とした大改正が2026年審議入り。外国人労働者への就業規則の多言語説明義務化も検討中。</p>
          <ul class="guide-list">
            <li><span class="guide-list-dot" style="background:#F59E0B;"></span>残業代計算ルールの見直し（裁量労働拡大案）</li>
            <li><span class="guide-list-dot" style="background:#10B981;"></span>年次有給休暇の取得義務強化（案：10日→14日）</li>
            <li><span class="guide-list-dot" style="background:#10B981;"></span>外国人労働者への多言語説明義務化</li>
            <li><span class="guide-list-dot" style="background:#F59E0B;"></span>技能実習制度→育成就労制度への完全移行（2027年めど）</li>
          </ul>
        </div>
        <div class="guide-source">出典：Paul Hastings LLP (Feb 2026) / 厚生労働省 ·
          <a href="https://www.paulhastings.com/insights/practice-area-articles/japan" target="_blank" style="color:var(--accent-sub);text-decoration:underline;">原文を読む ↗</a>
        </div>
      </div>

      <div class="guide-card fade-in delay-2">
        <div class="guide-card-head">
          <div class="guide-card-icon" style="background:#D1FAE5;">🛂</div>
          <div>
            <div class="guide-badge badge-green">拡大中</div>
            <div class="guide-card-title">特定技能ビザ（SSW）2026年最新動向</div>
            <div class="guide-card-title-en">Specified Skilled Worker Visa — 2026 Updates</div>
          </div>
        </div>
        <div class="guide-card-body">
          <p>特定技能1号・2号の対象分野が拡大。2号は更新無制限・家族帯同可能で、永住への有力なルートになっています。ブラジル人向け試験センターも増設。</p>
          <ul class="guide-list">
            <li><span class="guide-list-dot" style="background:#10B981;"></span>1号：最長5年、16分野（製造・飲食・建設など）</li>
            <li><span class="guide-list-dot" style="background:#10B981;"></span>2号：更新無制限＋家族帯同可（永住への道）</li>
            <li><span class="guide-list-dot" style="background:#10B981;"></span>ポルトガル語対応試験センター：名古屋・浜松に増設</li>
            <li><span class="guide-list-dot" style="background:#F59E0B;"></span>飲食分野の外国人枠が上限に接近（約46,000人 2月時点）</li>
          </ul>
        </div>
        <div class="guide-source">出典：Global Law Experts (May 2026) / 出入国在留管理庁 ·
          <a href="https://www.ssw.go.jp/en/" target="_blank" style="color:var(--accent-sub);text-decoration:underline;">公式サイト ↗</a>
        </div>
      </div>

      <!-- 行政リンク集 -->
      <div style="margin-top:20px;" id="municipality">
        <div style="font-size:11px;font-weight:700;color:var(--ink-3);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">🏛 主要行政窓口・公式サイト</div>
        <div class="source-grid">

          <a href="https://www.moj.go.jp/isa/index.html" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#EFF6FF;color:#1D4ED8;font-size:12px;">🛂</div>
            <div class="source-info">
              <div class="source-name">出入国在留管理庁</div>
              <div class="source-lang">ビザ・在留 · JA/EN</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

          <a href="https://www.mhlw.go.jp/english/" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#F0FDF4;color:#166534;font-size:12px;">🏥</div>
            <div class="source-info">
              <div class="source-name">厚生労働省</div>
              <div class="source-lang">労働・医療・保険 · EN</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

          <a href="https://www.nta.go.jp/english/" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#FEF3C7;color:#92400E;font-size:12px;">💴</div>
            <div class="source-info">
              <div class="source-name">国税庁（税務）</div>
              <div class="source-lang">税金・確定申告 · EN</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

          <a href="https://www.digital.go.jp/en/policies/mynumber/" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#F5F3FF;color:#5B21B6;font-size:12px;">🪪</div>
            <div class="source-info">
              <div class="source-name">デジタル庁（マイナ）</div>
              <div class="source-lang">マイナンバー · EN</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

          <a href="https://www.nenkin.go.jp/international/index.html" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#FEF2F2;color:#991B1B;font-size:12px;">👴</div>
            <div class="source-info">
              <div class="source-name">日本年金機構</div>
              <div class="source-lang">年金・社会保険 · EN/PT</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

          <a href="https://www.hellowork.mhlw.go.jp" target="_blank" rel="noopener" class="source-card">
            <div class="source-icon" style="background:#FFF7ED;color:#C2410C;font-size:12px;">💼</div>
            <div class="source-info">
              <div class="source-name">ハローワーク</div>
              <div class="source-lang">雇用・求職 · JA</div>
            </div>
            <span class="source-arrow">↗</span>
          </a>

        </div>

        <!-- 主要都市・自治体 -->
        <div style="margin-top:16px;">
          <div style="font-size:11px;font-weight:700;color:var(--ink-3);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">🏙 主要都市・自治体（外国人向け窓口）</div>
          <div class="source-grid source-grid-3">

            <a href="https://www.tokyo-icc.jp" target="_blank" rel="noopener" class="source-card">
              <div class="source-icon" style="background:#EFF6FF;color:#1E40AF;font-size:12px;">🗼</div>
              <div class="source-info">
                <div class="source-name">東京都国際交流委員会</div>
                <div class="source-lang">東京 · JA/EN/PT</div>
              </div>
              <span class="source-arrow">↗</span>
            </a>

            <a href="https://www.city.hamamatsu.shizuoka.jp/foreign/" target="_blank" rel="noopener" class="source-card">
              <div class="source-icon" style="background:#FEF3C7;color:#92400E;font-size:12px;">🏭</div>
              <div class="source-info">
                <div class="source-name">浜松市国際課</div>
                <div class="source-lang">浜松 · JA/PT/EN</div>
              </div>
              <span class="source-arrow">↗</span>
            </a>

            <a href="https://www.city.toyohashi.lg.jp/foreigners" target="_blank" rel="noopener" class="source-card">
              <div class="source-icon" style="background:#F0FDF4;color:#166534;font-size:12px;">🏘</div>
              <div class="source-info">
                <div class="source-name">豊橋市外国人支援</div>
                <div class="source-lang">愛知 · JA/PT</div>
              </div>
              <span class="source-arrow">↗</span>
            </a>

            <a href="https://www.pref.aichi.jp/soshiki/tabunka/" target="_blank" rel="noopener" class="source-card">
              <div class="source-icon" style="background:#FEF2F2;color:#991B1B;font-size:12px;">🚗</div>
              <div class="source-info">
                <div class="source-name">愛知県多文化共生推進</div>
                <div class="source-lang">愛知 · JA/PT/EN</div>
              </div>
              <span class="source-arrow">↗</span>
            </a>

            <a href="https://www.pref.shizuoka.jp/kurashikankyo/tabunka/" target="_blank" rel="noopener" class="source-card">
              <div class="source-icon" style="background:#F5F3FF;color:#5B21B6;font-size:12px;">🗻</div>
              <div class="source-info">
                <div class="source-name">静岡県多文化共生</div>
                <div class="source-lang">静岡 · JA/PT</div>
              </div>
              <span class="source-arrow">↗</span>
            </a>

            <a href="https://www.city.nagoya.jp/en/category/828-0-0-0-0-0-0-0-0-0.html" target="_blank" rel="noopener" class="source-card">
              <div class="source-icon" style="background:#FFF7ED;color:#C2410C;font-size:12px;">🏯</div>
              <div class="source-info">
                <div class="source-name">名古屋市国際課</div>
                <div class="source-lang">名古屋 · EN/PT</div>
              </div>
              <span class="source-arrow">↗</span>
            </a>

          </div>
        </div>
      </div>
    </div><!-- /life -->

    <!-- ── GLOBAL FEED ── -->
    <div style="margin-top:40px;" id="global">
      <div class="section-head">
        <span class="section-head-label">ブラジル・南米グローバルフィード</span>
        <span class="section-head-sub">Global Feed</span>
        <div class="section-head-line"></div>
      </div>

      <div class="global-item fade-in">
        <div class="global-item-flag">
          <span style="font-size:20px;">🇧🇷🇯🇵</span>
          <span class="global-item-country">Brazil × Japan Trade</span>
          <span class="top-story-meta-dot"></span>
          <span style="font-size:11px;color:var(--ink-4);">Reuters / Nikkei Asia · 2026年5月26日</span>
          <span class="tag tag-blue" style="margin-left:4px;">通商</span>
        </div>
        <div class="global-item-title">日本・メルコスール EPA交渉が正式スタート — ブラジル・アルゼンチン・ウルグアイ・パラグアイと協定交渉へ</div>
        <div class="global-jp-summary">
          <div class="global-jp-label">🇯🇵 日本語サマリー（職場・ビジネスで使える）</div>
          <p class="global-jp-text">2026年5月26日、日本と南米の経済連合「メルコスール」が経済連携協定（EPA）の交渉を正式に開始しました。日本はブラジルからの石油・農産物の輸入増加を、ブラジルは日本製自動車・電機の関税引き下げを目指します。協定が締結されると日本とブラジルのビジネスがさらに活発になり、ポルトガル語を話せる人材の需要が日本の商社・エネルギー業界で高まると見られています。</p>
        </div>
        <div style="font-size:12px;color:var(--ink-2);line-height:1.6;">
          <strong>EN:</strong> Japan formally launched EPA trade talks with Mercosur (May 26, 2026), seeking expanded oil and agricultural imports. For Japanese companies, Portuguese-speaking professionals become even more strategically valuable as a bridge in this growing bilateral relationship.
        </div>
        <div class="global-source" style="margin-top:8px;">
          <a href="https://www.reuters.com/world/asia-pacific/japan-mercosur-start-epa-trade-talks-kyodo-says-2026-05-26/" target="_blank" style="color:var(--accent-sub);">Reuters原文 ↗</a>
          &nbsp;·&nbsp;
          <a href="https://asia.nikkei.com/economy/trade/japan-poised-to-start-mercosur-trade-talks-seeking-oil-more-car-exports" target="_blank" style="color:var(--accent-sub);">Nikkei Asia ↗</a>
        </div>
      </div>

      <div class="global-item fade-in delay-1">
        <div class="global-item-flag">
          <span style="font-size:20px;">🇧🇷⚡</span>
          <span class="global-item-country">Brazil Energy</span>
          <span class="top-story-meta-dot"></span>
          <span style="font-size:11px;color:var(--ink-4);">Kyodo News · 2026年5月18〜20日</span>
          <span class="tag tag-amber" style="margin-left:4px;">エネルギー</span>
        </div>
        <div class="global-item-title">ブラジル外相「日本への石油輸出拡大の準備ができている」— エネルギー安保で日ブラジルが急接近</div>
        <div class="global-jp-summary">
          <div class="global-jp-label">🇯🇵 日本語サマリー（職場・ビジネスで使える）</div>
          <p class="global-jp-text">2026年5月、日本とブラジルの外務大臣が会談し、ブラジルが日本への原油輸出を増やす意向を表明しました。日本はロシアへのエネルギー依存を減らす必要があり、ブラジルからの安定した石油供給を重視しています。また、経済安全保障・先端半導体・防衛分野での協力枠組みも合意されました。商社・エネルギー会社でポルトガル語専門職の採用意欲が高まっています。</p>
        </div>
        <div class="global-source" style="margin-top:8px;">
          <a href="https://english.kyodonews.net/articles/-/76236" target="_blank" style="color:var(--accent-sub);">Kyodo News原文 ↗</a>
        </div>
      </div>

      <div class="global-item fade-in delay-2">
        <div class="global-item-flag">
          <span style="font-size:20px;">🌎📈</span>
          <span class="global-item-country">South America / EU-Mercosur</span>
          <span class="top-story-meta-dot"></span>
          <span style="font-size:11px;color:var(--ink-4);">EY / EU Trade · 2026年5月</span>
          <span class="tag tag-green" style="margin-left:4px;">経済</span>
        </div>
        <div class="global-item-title">EU・メルコスール協定発効 — ブラジルの再生エネルギー・農業テクノロジー産業が世界市場を牽引</div>
        <div class="global-jp-summary">
          <div class="global-jp-label">🇯🇵 日本語サマリー（職場・ビジネスで使える）</div>
          <p class="global-jp-text">2026年5月、EUとメルコスールの間の貿易協定が正式に発効しました。7億2,000万人規模の巨大市場が生まれ、関税の90%以上が撤廃されます。ブラジルは特に再生可能エネルギー（太陽光・バイオ燃料）と農業テクノロジー分野で急成長しており、日本企業が南米市場への参入を加速させています。両国間のビジネスを橋渡しできる人材の価値がさらに高まっています。</p>
        </div>
        <div class="global-source" style="margin-top:8px;">
          <a href="https://policy.trade.ec.europa.eu/eu-trade-relationships-country-and-region/countries-and-regions/mercosur/eu-mercosur-agreement_en" target="_blank" style="color:var(--accent-sub);">EU Trade原文 ↗</a>
        </div>
      </div>

    </div><!-- /global -->

  </main>

  <!-- ━━━━━━━━━━━━━━━ SIDEBAR ━━━━━━━━━━━━━━━ -->
  <aside class="side-col">

    <!-- Quick Access -->
    <div class="side-section">
      <div class="section-head" style="margin-bottom:14px;">
        <span class="section-head-label" style="font-size:11px;">クイックアクセス</span>
        <div class="section-head-line"></div>
      </div>
      <div class="quick-grid">
        <a href="https://www.moj.go.jp/isa/index.html" target="_blank" rel="noopener" class="quick-btn">
          <span class="quick-btn-icon">🛂</span>
          <span class="quick-btn-label">入管庁</span>
          <span class="quick-btn-sub">ビザ・在留</span>
        </a>
        <a href="https://www3.nhk.or.jp/news/easy/" target="_blank" rel="noopener" class="quick-btn">
          <span class="quick-btn-icon">📺</span>
          <span class="quick-btn-label">NHKやさしい</span>
          <span class="quick-btn-sub">易しい日本語</span>
        </a>
        <a href="https://www.nta.go.jp/english/" target="_blank" rel="noopener" class="quick-btn">
          <span class="quick-btn-icon">💴</span>
          <span class="quick-btn-label">国税庁</span>
          <span class="quick-btn-sub">税金・申告</span>
        </a>
        <a href="https://www.nenkin.go.jp/international/index.html" target="_blank" rel="noopener" class="quick-btn">
          <span class="quick-btn-icon">👴</span>
          <span class="quick-btn-label">年金機構</span>
          <span class="quick-btn-sub">年金・保険</span>
        </a>
        <a href="https://www.ssw.go.jp/en/" target="_blank" rel="noopener" class="quick-btn">
          <span class="quick-btn-icon">🛂</span>
          <span class="quick-btn-label">特定技能SSW</span>
          <span class="quick-btn-sub">就労ビザ</span>
        </a>
        <a href="https://nhkworld.nhk.or.jp/pt/" target="_blank" rel="noopener" class="quick-btn">
          <span class="quick-btn-icon">🇧🇷</span>
          <span class="quick-btn-label">NHK Brasil</span>
          <span class="quick-btn-sub">Português</span>
        </a>
      </div>
    </div>

    <!-- 今週注目ニュース -->
    <div class="side-section">
      <div class="section-head" style="margin-bottom:14px;">
        <span class="section-head-label" style="font-size:11px;">今週の注目</span>
        <div class="section-head-line"></div>
      </div>
      <div>
        <div class="mini-news-item">
          <div class="mini-news-num">1</div>
          <div>
            <div class="mini-news-title">特定在留カード6月14日発行開始 — 手続き変更点まとめ</div>
            <div class="mini-news-src">入管庁 · 2026.06</div>
          </div>
        </div>
        <div class="mini-news-item">
          <div class="mini-news-num">2</div>
          <div>
            <div class="mini-news-title">メルコスールEPA交渉開始 — 商社・エネルギー業界に影響</div>
            <div class="mini-news-src">Reuters · 2026.05</div>
          </div>
        </div>
        <div class="mini-news-item">
          <div class="mini-news-num">3</div>
          <div>
            <div class="mini-news-title">日本の産業用ロボット出荷台数、過去最高を更新</div>
            <div class="mini-news-src">日本経済新聞 · 2026.06</div>
          </div>
        </div>
        <div class="mini-news-item">
          <div class="mini-news-num">4</div>
          <div>
            <div class="mini-news-title">労働基準法改正：外国人就労者への説明義務化へ</div>
            <div class="mini-news-src">朝日新聞 · 2026.05</div>
          </div>
        </div>
        <div class="mini-news-item">
          <div class="mini-news-num">5</div>
          <div>
            <div class="mini-news-title">特定技能2号：対象12分野に拡大後の最新動向</div>
            <div class="mini-news-src">Global Law Experts · 2026.05</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 求人トレンド -->
    <div class="side-section">
      <div class="section-head" style="margin-bottom:14px;">
        <span class="section-head-label" style="font-size:11px;">求人トレンド 2026</span>
        <div class="section-head-line"></div>
      </div>
      <div class="job-snippet">
        <div class="job-snippet-title">製造DXエンジニア</div>
        <div class="job-snippet-company">自動車・電機メーカー各社 / 愛知・静岡</div>
        <div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:6px;">¥5.5M – ¥9.0M</div>
        <div class="job-snippet-tags">
          <span class="job-tag job-tag-hot">需要急増 +42%</span>
          <span class="job-tag">IoT</span>
          <span class="job-tag">AI</span>
          <span class="job-tag">日本語N3+</span>
        </div>
      </div>
      <div class="job-snippet">
        <div class="job-snippet-title">海外事業開拓（ポルトガル語）</div>
        <div class="job-snippet-company">総合商社・エネルギー系 / 東京</div>
        <div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:6px;">¥6.0M – ¥12.0M</div>
        <div class="job-snippet-tags">
          <span class="job-tag job-tag-hot">需要急増 +38%</span>
          <span class="job-tag">Português</span>
          <span class="job-tag">日本語N2+</span>
        </div>
      </div>
      <div class="job-snippet">
        <div class="job-snippet-title">建設DXプロジェクトマネージャー</div>
        <div class="job-snippet-company">ゼネコン・建設テック / 全国</div>
        <div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:6px;">¥5.0M – ¥8.5M</div>
        <div class="job-snippet-tags">
          <span class="job-tag job-tag-hot">最高需要 +55%</span>
          <span class="job-tag">BIM</span>
          <span class="job-tag">SSW2号</span>
        </div>
      </div>
      <div style="font-size:10px;color:var(--ink-4);margin-top:8px;text-align:center;">求人データは今後のUNS→N Jobsで拡充予定</div>
    </div>

    <!-- 言語設定メモ -->
    <div class="side-section">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink-3);margin-bottom:10px;">🌐 言語切替について</div>
        <p style="font-size:12px;color:var(--ink-2);line-height:1.65;">UNS→Nでは全ての記事を<strong>やさしい日本語・ポルトガル語・英語</strong>の3言語でお届けすることを目指しています。</p>
        <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">
          <span class="tag tag-slate">🇯🇵 やさしい日本語</span>
          <span class="tag tag-slate">🇧🇷 Português</span>
          <span class="tag tag-slate">🇺🇸 English</span>
        </div>
      </div>
    </div>

  </aside>

</div><!-- /page-layout -->

<!-- ═══════════════ FOOTER ═══════════════ -->
<footer>
  <div class="footer-inner">
    <div class="footer-grid">
      <div>
        <div class="footer-logo-mark">UNS→N</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:10px;">アンシーン — Global Talent Media Platform</div>
        <p class="footer-desc">日本で働く・暮らす日系ブラジル人・外国人プロフェッショナルのための次世代ビジネスメディア。ビジネス・行政・母国情報を3言語で届けます。</p>
      </div>
      <div>
        <div class="footer-col-title">メディア</div>
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
          <a href="https://www.digital.go.jp" target="_blank" class="footer-link">デジタル庁</a>
        </div>
      </div>
      <div>
        <div class="footer-col-title">UNS→N</div>
        <div class="footer-links">
          <a href="#" class="footer-link">サービス概要</a>
          <a href="#" class="footer-link">コンセプト</a>
          <a href="#" class="footer-link">パートナー募集</a>
          <a href="#" class="footer-link">プライバシーポリシー</a>
          <a href="#" class="footer-link">お問い合わせ</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div>© 2026 UNS→N（アンシーン） — Concept Prototype</div>
      <div style="display:flex;gap:16px;">
        <span>🇧🇷 Comunidade Nikkei no Japão</span>
        <span style="opacity:0.3;">·</span>
        <span>🇯🇵 日本で働く外国人を支援する</span>
      </div>
    </div>
  </div>
</footer>

<script>
  // Language switcher
  function setLang(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    const map = { pt:'PT', en:'EN', ja:'やさしい' };
    document.querySelectorAll('.lang-btn').forEach(btn => {
      if (btn.textContent.trim() === map[lang]) btn.classList.add('active');
    });
    const msgs = {
      pt: '🇧🇷 Modo Português ativado!',
      en: '🇺🇸 English mode activated!',
      ja: '🇯🇵 やさしい日本語モードになりました！'
    };
    showToast(msgs[lang]);
  }

  function showToast(msg) {
    const old = document.querySelector('.gn-toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = 'gn-toast';
    Object.assign(t.style, {
      position:'fixed', bottom:'24px', right:'24px', zIndex:'999',
      background:'#0D0D0D', color:'white',
      padding:'10px 18px', borderRadius:'8px',
      fontSize:'13px', fontWeight:'600',
      boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
      animation:'fadeUp 0.25s ease'
    });
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 2200);
  }

  // Nav category scroll + active
  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.nav-cat').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
  }

  // Intersection observer for nav highlight
  const sections = document.querySelectorAll('#business, #life, #global, #sources, #municipality');
  const cats = document.querySelectorAll('.nav-cat');
  const sectionMap = { business:1, sources:3, life:2, global:3, municipality:4 };
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const idx = sectionMap[e.target.id];
        if (idx !== undefined) {
          cats.forEach((c, i) => c.classList.toggle('active', i === idx));
        }
      }
    });
  }, { threshold: 0.3 }).observe && sections.forEach(s =>
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = sectionMap[e.target.id];
          if (idx !== undefined) cats.forEach((c,i) => c.classList.toggle('active', i === idx));
        }
      });
    }, { threshold: 0.3 }).observe(s)
  );
</script>

</body>
</html>`)
})

export default app
