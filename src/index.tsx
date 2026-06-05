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
  <title>UNS→N（アンシーン） — Bridge Your Career, Empower Your Future</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+JP:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />
  <style>
    :root {
      --primary: #0A0F1E;
      --accent: #FF4500;
      --accent2: #00C2CB;
      --accent3: #FFD700;
      --surface: #111827;
      --surface2: #1A2235;
      --text: #E8EDF5;
      --muted: #6B7A99;
      --border: rgba(255,255,255,0.07);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      background-color: var(--primary);
      color: var(--text);
      font-family: 'Inter', 'Noto Sans JP', sans-serif;
      overflow-x: hidden;
    }

    /* ─── Scrollbar ─── */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--primary); }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }

    /* ─── Utility ─── */
    .gradient-text {
      background: linear-gradient(135deg, #FF4500, #FF8C00, #FFD700);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .gradient-text-cyan {
      background: linear-gradient(135deg, #00C2CB, #0080FF);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .glass-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 16px;
      transition: all 0.3s ease;
    }
    .glass-card:hover {
      background: rgba(255,255,255,0.07);
      border-color: rgba(255,69,0,0.3);
      transform: translateY(-3px);
      box-shadow: 0 20px 60px rgba(255,69,0,0.12);
    }
    .glass-card-cyan:hover {
      border-color: rgba(0,194,203,0.35);
      box-shadow: 0 20px 60px rgba(0,194,203,0.1);
    }
    .glass-card-gold:hover {
      border-color: rgba(255,215,0,0.35);
      box-shadow: 0 20px 60px rgba(255,215,0,0.1);
    }

    /* ─── Nav ─── */
    nav {
      position: fixed; top: 0; width: 100%; z-index: 100;
      background: rgba(10,15,30,0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
    }
    .nav-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex; align-items: center; justify-content: space-between;
      height: 64px;
    }
    .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .logo-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #FF4500, #FF8C00);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: 14px; color: white;
    }
    .logo-text { font-weight: 800; font-size: 17px; letter-spacing: -0.3px; color: white; }
    .logo-sub { font-size: 10px; color: var(--muted); letter-spacing: 1.5px; text-transform: uppercase; }

    /* Language switcher */
    .lang-switcher {
      display: flex; gap: 4px;
      background: rgba(255,255,255,0.06);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 4px;
    }
    .lang-btn {
      padding: 5px 14px;
      border-radius: 5px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      background: transparent;
      color: var(--muted);
      letter-spacing: 0.3px;
    }
    .lang-btn.active {
      background: linear-gradient(135deg, #FF4500, #FF8C00);
      color: white;
    }
    .lang-btn:hover:not(.active) { color: white; background: rgba(255,255,255,0.06); }

    /* Nav links */
    .nav-links { display: flex; gap: 24px; align-items: center; }
    .nav-link {
      color: var(--muted); font-size: 13px; font-weight: 500;
      text-decoration: none; transition: color 0.2s;
      letter-spacing: 0.2px;
    }
    .nav-link:hover { color: white; }
    .nav-cta {
      background: linear-gradient(135deg, #FF4500, #FF8C00);
      color: white; padding: 8px 20px; border-radius: 8px;
      font-size: 13px; font-weight: 600; text-decoration: none;
      transition: opacity 0.2s; letter-spacing: 0.2px;
    }
    .nav-cta:hover { opacity: 0.88; }

    /* ─── Hero ─── */
    .hero {
      min-height: 100vh;
      display: flex; align-items: center;
      padding: 120px 24px 80px;
      position: relative;
      overflow: hidden;
    }
    .hero-bg {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse 80% 60% at 50% 30%,
        rgba(255,69,0,0.12) 0%, transparent 70%),
        radial-gradient(ellipse 60% 50% at 80% 70%,
        rgba(0,194,203,0.08) 0%, transparent 60%),
        radial-gradient(ellipse 40% 40% at 20% 80%,
        rgba(255,215,0,0.05) 0%, transparent 50%);
    }
    .hero-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 60px 60px;
      mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
    }
    .hero-inner { max-width: 1280px; margin: 0 auto; width: 100%; position: relative; z-index: 1; }

    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(255,69,0,0.12); border: 1px solid rgba(255,69,0,0.3);
      color: #FF8C00; padding: 6px 16px; border-radius: 100px;
      font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
      margin-bottom: 28px;
    }
    .hero-title {
      font-size: clamp(42px, 7vw, 88px);
      font-weight: 900;
      line-height: 1.0;
      letter-spacing: -2px;
      margin-bottom: 32px;
    }
    .hero-catchphrase {
      display: flex; flex-direction: column; gap: 8px;
      margin-bottom: 48px;
    }
    .catch-item {
      display: flex; align-items: center; gap: 12px;
    }
    .catch-flag {
      width: 28px; height: 20px;
      border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px;
      flex-shrink: 0;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .catch-text { font-size: clamp(13px, 1.8vw, 17px); font-weight: 500; color: rgba(255,255,255,0.8); }
    .catch-text strong { font-weight: 700; color: white; }

    .hero-actions { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 72px; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 10px;
      background: linear-gradient(135deg, #FF4500, #FF8C00);
      color: white; padding: 14px 28px; border-radius: 10px;
      font-size: 15px; font-weight: 700; text-decoration: none;
      transition: all 0.3s; letter-spacing: 0.2px;
      box-shadow: 0 8px 32px rgba(255,69,0,0.35);
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(255,69,0,0.45); }
    .btn-secondary {
      display: inline-flex; align-items: center; gap: 10px;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
      color: white; padding: 14px 28px; border-radius: 10px;
      font-size: 15px; font-weight: 600; text-decoration: none;
      transition: all 0.3s;
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }

    /* Stats bar */
    .stats-bar {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: 16px; overflow: hidden;
    }
    .stat-item {
      background: rgba(255,255,255,0.03);
      padding: 24px 28px;
      transition: background 0.2s;
    }
    .stat-item:hover { background: rgba(255,255,255,0.06); }
    .stat-number { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin-bottom: 4px; }
    .stat-label { font-size: 12px; color: var(--muted); font-weight: 500; letter-spacing: 0.3px; }

    /* ─── Sections common ─── */
    .section { padding: 96px 24px; position: relative; }
    .section-inner { max-width: 1280px; margin: 0 auto; }
    .section-header { margin-bottom: 56px; }
    .section-eyebrow {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
      margin-bottom: 16px;
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .section-title { font-size: clamp(28px, 4vw, 42px); font-weight: 800; letter-spacing: -1px; margin-bottom: 12px; }
    .section-desc { font-size: 16px; color: var(--muted); line-height: 1.6; max-width: 600px; }

    /* ─── Section 1: News ─── */
    .news-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .news-card { padding: 28px; }
    .news-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .news-tags { display: flex; gap: 8px; flex-wrap: wrap; }
    .tag {
      font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;
      padding: 4px 10px; border-radius: 100px;
    }
    .tag-red { background: rgba(255,69,0,0.15); color: #FF8C00; border: 1px solid rgba(255,69,0,0.25); }
    .tag-cyan { background: rgba(0,194,203,0.12); color: #00C2CB; border: 1px solid rgba(0,194,203,0.25); }
    .tag-gold { background: rgba(255,215,0,0.12); color: #FFD700; border: 1px solid rgba(255,215,0,0.25); }
    .tag-purple { background: rgba(150,80,255,0.12); color: #b47fff; border: 1px solid rgba(150,80,255,0.25); }
    .news-date { font-size: 11px; color: var(--muted); }
    .news-headline { font-size: 18px; font-weight: 700; line-height: 1.35; margin-bottom: 20px; letter-spacing: -0.3px; }
    .news-lang-block { margin-bottom: 14px; }
    .lang-label {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
      color: var(--muted); margin-bottom: 6px;
    }
    .lang-content-ja { font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.85); font-family: 'Noto Sans JP', sans-serif; }
    .lang-content-pt { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.7); }
    .lang-content-en { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.7); }
    .news-divider { height: 1px; background: var(--border); margin: 14px 0; }
    .read-more {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 600; color: #FF8C00;
      margin-top: 8px; cursor: pointer; transition: gap 0.2s;
    }
    .read-more:hover { gap: 10px; }

    /* Featured news full-width */
    .news-featured { grid-column: 1 / -1; display: flex; gap: 32px; }
    .news-featured-content { flex: 1; }
    .news-featured-visual {
      width: 320px; flex-shrink: 0;
      background: linear-gradient(135deg, rgba(255,69,0,0.08), rgba(255,215,0,0.06));
      border: 1px solid rgba(255,69,0,0.2);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-direction: column; gap: 12px; padding: 32px;
      position: relative; overflow: hidden;
    }
    .visual-icon { font-size: 48px; margin-bottom: 8px; }
    .visual-stat { font-size: 36px; font-weight: 900; letter-spacing: -2px; }
    .visual-label { font-size: 11px; color: var(--muted); text-align: center; line-height: 1.4; }

    /* ─── Section 2: Admin Cards ─── */
    .admin-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .admin-card { padding: 32px; }
    .admin-icon {
      width: 52px; height: 52px;
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; margin-bottom: 20px;
    }
    .admin-card-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; line-height: 1.3; }
    .admin-urgency {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
      padding: 3px 10px; border-radius: 100px;
      margin-bottom: 16px;
    }
    .urgency-red { background: rgba(255,60,60,0.12); color: #FF6B6B; border: 1px solid rgba(255,60,60,0.25); }
    .urgency-orange { background: rgba(255,150,0,0.12); color: #FFB74D; border: 1px solid rgba(255,150,0,0.25); }
    .urgency-green { background: rgba(0,200,100,0.12); color: #4CAF50; border: 1px solid rgba(0,200,100,0.25); }
    .admin-body { font-size: 13px; color: rgba(255,255,255,0.72); line-height: 1.7; }
    .admin-checklist { list-style: none; margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
    .admin-checklist li {
      display: flex; align-items: flex-start; gap: 8px;
      font-size: 12px; color: rgba(255,255,255,0.65); line-height: 1.5;
    }
    .check-icon { color: #4CAF50; font-size: 11px; margin-top: 2px; flex-shrink: 0; }
    .alert-icon { color: #FFB74D; font-size: 11px; margin-top: 2px; flex-shrink: 0; }
    .admin-date-badge {
      display: flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.04); border: 1px solid var(--border);
      border-radius: 8px; padding: 10px 14px; margin-top: 16px;
    }
    .admin-date-text { font-size: 12px; color: var(--muted); }
    .admin-date-val { font-size: 13px; font-weight: 700; color: white; }

    /* ─── Section 3: Global Feed ─── */
    .feed-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }
    .feed-card { padding: 28px; }
    .feed-flag-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .flag-emoji { font-size: 24px; }
    .flag-country { font-size: 12px; font-weight: 600; color: var(--muted); letter-spacing: 0.5px; }
    .feed-headline { font-size: 17px; font-weight: 700; line-height: 1.35; margin-bottom: 14px; letter-spacing: -0.2px; }
    .feed-jp-summary {
      background: rgba(0,194,203,0.06);
      border-left: 3px solid #00C2CB;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px; margin-bottom: 16px;
    }
    .feed-jp-label { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #00C2CB; margin-bottom: 4px; }
    .feed-jp-text { font-size: 13px; line-height: 1.65; color: rgba(255,255,255,0.8); font-family: 'Noto Sans JP', sans-serif; }
    .feed-impact { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--muted); }
    .impact-bar { height: 3px; border-radius: 3px; flex: 1; }
    .impact-high { background: linear-gradient(90deg, #FF4500, #FF8C00); }
    .impact-med { background: linear-gradient(90deg, #FFD700, #FF8C00); }

    /* ─── Section 4: UNSEEN Academy ─── */
    .academy-section { background: rgba(0,0,0,0.2); }
    .academy-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-bottom: 56px; }
    .video-card { padding: 0; overflow: hidden; }
    .video-thumb {
      position: relative; height: 180px;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .play-btn {
      width: 52px; height: 52px;
      background: rgba(255,255,255,0.95);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; color: #FF4500;
      position: relative; z-index: 1;
      transition: transform 0.3s;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    .video-card:hover .play-btn { transform: scale(1.1); }
    .video-duration {
      position: absolute; bottom: 12px; right: 12px;
      background: rgba(0,0,0,0.75); color: white;
      font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px;
    }
    .video-ep {
      position: absolute; top: 12px; left: 12px;
      font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
      padding: 3px 10px; border-radius: 100px; z-index: 1;
    }
    .video-body { padding: 20px 24px 24px; }
    .video-series { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
    .video-title { font-size: 16px; font-weight: 700; line-height: 1.35; margin-bottom: 10px; letter-spacing: -0.2px; }
    .video-desc { font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.6; margin-bottom: 14px; }
    .video-meta { display: flex; align-items: center; gap: 12px; font-size: 11px; color: var(--muted); }
    .video-meta-item { display: flex; align-items: center; gap: 4px; }

    /* Jobs */
    .jobs-section { margin-top: 0; }
    .jobs-header { margin-bottom: 28px; }
    .jobs-title { font-size: 22px; font-weight: 700; }
    .jobs-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
    .job-card {
      padding: 24px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border);
      border-radius: 14px;
      transition: all 0.3s;
    }
    .job-card:hover { background: rgba(255,255,255,0.06); transform: translateY(-2px); }
    .job-icon-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .job-icon { font-size: 28px; }
    .job-growth {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; font-weight: 700; color: #4CAF50;
    }
    .job-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
    .job-subtitle { font-size: 12px; color: var(--muted); margin-bottom: 14px; line-height: 1.5; }
    .job-salary {
      font-size: 13px; font-weight: 600; color: #FFD700; margin-bottom: 10px;
    }
    .job-skills { display: flex; flex-wrap: wrap; gap: 6px; }
    .skill-chip {
      font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 4px;
      background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7);
    }

    /* ─── Ticker ─── */
    .ticker-wrap {
      background: rgba(255,69,0,0.08);
      border-top: 1px solid rgba(255,69,0,0.2);
      border-bottom: 1px solid rgba(255,69,0,0.2);
      padding: 12px 0;
      overflow: hidden;
    }
    .ticker-inner { display: flex; align-items: center; white-space: nowrap; }
    .ticker-label {
      background: linear-gradient(135deg, #FF4500, #FF8C00);
      color: white; font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
      padding: 4px 12px; border-radius: 4px; margin-right: 24px;
      flex-shrink: 0;
    }
    .ticker-track {
      display: flex; gap: 48px;
      animation: ticker 35s linear infinite;
      white-space: nowrap;
    }
    .ticker-item { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.75); display: flex; align-items: center; gap: 12px; }
    .ticker-sep { color: rgba(255,69,0,0.5); font-size: 18px; line-height: 1; }
    @keyframes ticker {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    /* ─── Footer ─── */
    footer {
      background: rgba(0,0,0,0.4);
      border-top: 1px solid var(--border);
      padding: 64px 24px 32px;
    }
    .footer-inner { max-width: 1280px; margin: 0 auto; }
    .footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
    .footer-brand-desc { font-size: 13px; color: var(--muted); line-height: 1.7; margin-top: 16px; max-width: 280px; }
    .footer-col-title { font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: white; margin-bottom: 16px; }
    .footer-links { display: flex; flex-direction: column; gap: 10px; }
    .footer-link { font-size: 13px; color: var(--muted); text-decoration: none; transition: color 0.2s; }
    .footer-link:hover { color: white; }
    .footer-bottom {
      border-top: 1px solid var(--border); padding-top: 24px;
      display: flex; align-items: center; justify-content: space-between;
      font-size: 12px; color: var(--muted);
    }

    /* ─── Divider with glow ─── */
    .section-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,69,0,0.3), rgba(0,194,203,0.3), transparent);
      margin: 0 24px;
    }

    /* ─── responsive ─── */
    @media (max-width: 1024px) {
      .news-grid { grid-template-columns: 1fr; }
      .news-featured { flex-direction: column; }
      .news-featured-visual { width: 100%; height: 180px; }
      .admin-grid { grid-template-columns: 1fr; }
      .feed-grid { grid-template-columns: 1fr; }
      .academy-grid { grid-template-columns: 1fr; }
      .jobs-grid { grid-template-columns: 1fr; }
      .footer-top { grid-template-columns: 1fr 1fr; }
      .stats-bar { grid-template-columns: 1fr 1fr; }
      .nav-links { display: none; }
    }
    @media (max-width: 640px) {
      .hero { padding: 100px 16px 60px; }
      .hero-actions { flex-direction: column; }
      .stats-bar { grid-template-columns: 1fr 1fr; }
      .footer-top { grid-template-columns: 1fr; }
      .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
    }

    /* ─── Section color accents ─── */
    .section-bg-1 {
      background: radial-gradient(ellipse 80% 40% at 50% 0%, rgba(255,69,0,0.05), transparent);
    }
    .section-bg-2 {
      background: radial-gradient(ellipse 80% 40% at 50% 0%, rgba(0,194,203,0.05), transparent);
    }
    .section-bg-3 {
      background: radial-gradient(ellipse 80% 40% at 50% 0%, rgba(255,215,0,0.04), transparent);
    }
    .section-bg-4 {
      background: radial-gradient(ellipse 80% 40% at 50% 0%, rgba(150,80,255,0.05), transparent);
    }

    /* Progress pill */
    .progress-pill { height: 3px; border-radius: 3px; background: rgba(255,255,255,0.08); overflow: hidden; margin-top: 12px; }
    .progress-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #FF4500, #FFD700); }

    /* Animate in */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-in { animation: fadeInUp 0.6s ease forwards; }
    .delay-1 { animation-delay: 0.1s; opacity: 0; }
    .delay-2 { animation-delay: 0.2s; opacity: 0; }
    .delay-3 { animation-delay: 0.3s; opacity: 0; }
    .delay-4 { animation-delay: 0.4s; opacity: 0; }
  </style>
</head>
<body>

<!-- ═══════════════════════════════════════ NAVBAR ═══════════════════════════════════════ -->
<nav>
  <div class="nav-inner">
    <a href="#" class="logo">
      <div class="logo-icon" style="font-size:9px;letter-spacing:-0.5px;font-weight:900;">UN→N</div>
      <div>
        <div class="logo-text">UNS→N <span style="font-size:12px;font-weight:400;color:var(--muted);">アンシーン</span></div>
        <div class="logo-sub">Global Talent Media Platform</div>
      </div>
    </a>
    <div class="nav-links">
      <a href="#news" class="nav-link">Business News</a>
      <a href="#admin" class="nav-link">Life in Japan</a>
      <a href="#global" class="nav-link">Global Feed</a>
      <a href="#academy" class="nav-link">UNSEEN Academy</a>
    </div>
    <div style="display:flex;align-items:center;gap:16px;">
      <div class="lang-switcher">
        <button class="lang-btn" onclick="setLang('pt')">PT</button>
        <button class="lang-btn active" onclick="setLang('en')">EN</button>
        <button class="lang-btn" onclick="setLang('ja')">やさしい</button>
      </div>
      <a href="#academy" class="nav-cta">Join Beta</a>
    </div>
  </div>
</nav>

<!-- ══════════════════════════════════════ TICKER ══════════════════════════════════════ -->
<div style="margin-top:64px;" class="ticker-wrap">
  <div class="ticker-inner" style="padding:0 24px;">
    <div class="ticker-label">LIVE</div>
    <div class="ticker-track" id="ticker">
      <span class="ticker-item">🏭 スマート製造市場：2034年に3兆円規模へ（CAGR 15.2%）<span class="ticker-sep">·</span></span>
      <span class="ticker-item">📋 在留カード＋マイナンバー統合カード：2026年6月14日より発行開始<span class="ticker-sep">·</span></span>
      <span class="ticker-item">🇧🇷🇯🇵 日本・メルコスール EPA交渉開始（2026年5月26日）<span class="ticker-sep">·</span></span>
      <span class="ticker-item">🤖 産業用ロボット世界市場：2,210億ドル突破（2026年Q1）<span class="ticker-sep">·</span></span>
      <span class="ticker-item">🚀 SusHi Tech Tokyo 2026：AI・ロボ・宇宙 スタートアップが集結<span class="ticker-sep">·</span></span>
      <span class="ticker-item">💼 特定技能2号：家族帯同可・更新無制限 — 対象分野拡大<span class="ticker-sep">·</span></span>
      <span class="ticker-item">🌐 労働基準法：40年ぶりの大改正案が審議入り（2026年）<span class="ticker-sep">·</span></span>
      <!-- duplicate for seamless loop -->
      <span class="ticker-item">🏭 スマート製造市場：2034年に3兆円規模へ（CAGR 15.2%）<span class="ticker-sep">·</span></span>
      <span class="ticker-item">📋 在留カード＋マイナンバー統合カード：2026年6月14日より発行開始<span class="ticker-sep">·</span></span>
      <span class="ticker-item">🇧🇷🇯🇵 日本・メルコスール EPA交渉開始（2026年5月26日）<span class="ticker-sep">·</span></span>
      <span class="ticker-item">🤖 産業用ロボット世界市場：2,210億ドル突破（2026年Q1）<span class="ticker-sep">·</span></span>
      <span class="ticker-item">🚀 SusHi Tech Tokyo 2026：AI・ロボ・宇宙 スタートアップが集結<span class="ticker-sep">·</span></span>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════ HERO ═══════════════════════════════════════ -->
<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-grid"></div>
  <div class="hero-inner">

    <div class="hero-badge animate-in">
      <i class="fas fa-globe"></i>
      Nikkei Brazilian × Global Talents × Japan Business Media
    </div>

    <h1 class="hero-title animate-in delay-1">
      <span class="gradient-text">UNS→N</span><br/>
      <span style="color:white;font-size:clamp(20px,3.5vw,42px);font-weight:600;letter-spacing:0px;">アンシーン</span>
    </h1>

    <div class="hero-catchphrase animate-in delay-2">
      <div class="catch-item">
        <div class="catch-flag" style="background:linear-gradient(90deg,#009C3B 33%,#FFDF00 33%,#FFDF00 67%,#002776 67%);">
          <span style="font-size:8px;color:transparent;">BR</span>
        </div>
        <span class="catch-text"><strong>Construa sua carreira. Transforme seu futuro no Japão.</strong></span>
      </div>
      <div class="catch-item">
        <div class="catch-flag" style="background:linear-gradient(180deg,#B22234 33%,#fff 33%,#fff 67%,#B22234 67%);">
          <span style="font-size:8px;color:transparent;">US</span>
        </div>
        <span class="catch-text"><strong>Bridge Your Career. Empower Your Future in Japan.</strong></span>
      </div>
      <div class="catch-item">
        <div class="catch-flag" style="background:linear-gradient(180deg,#fff 33%,#DC143C 33%,#DC143C 67%,#fff 67%);">
          <span style="font-size:8px;color:transparent;">JP</span>
        </div>
        <span class="catch-text" style="font-family:'Noto Sans JP',sans-serif;"><strong>日本で働く。自分の未来を開く。やさしい日本語でわかる、世界とつながるニュース。</strong></span>
      </div>
    </div>

    <!-- Language UI Concept Callout -->
    <div class="animate-in delay-2" style="
      background: rgba(0,194,203,0.08);
      border: 1px dashed rgba(0,194,203,0.35);
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 40px;
      display: inline-flex;
      align-items: center;
      gap: 16px;
      max-width: 660px;
    ">
      <i class="fas fa-language" style="color:#00C2CB;font-size:20px;flex-shrink:0;"></i>
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:#00C2CB;text-transform:uppercase;margin-bottom:4px;">Multi-Language Switcher UI Concept</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.75);">
          Every article available in
          <span style="font-weight:700;color:white;">Português</span> ·
          <span style="font-weight:700;color:white;">English</span> ·
          <span style="font-weight:700;color:white;font-family:'Noto Sans JP',sans-serif;">やさしい日本語</span>
          — switch instantly with one tap, no page reload.
        </div>
      </div>
    </div>

    <div class="hero-actions animate-in delay-3">
      <a href="#news" class="btn-primary">
        <i class="fas fa-newspaper"></i>
        Today's Business Briefing
      </a>
      <a href="#academy" class="btn-secondary">
        <i class="fas fa-play-circle"></i>
        UNSEEN Academy
      </a>
      <a href="#admin" class="btn-secondary">
        <i class="fas fa-id-card"></i>
        Life Essentials
      </a>
    </div>

    <!-- Stats Bar -->
    <div class="stats-bar animate-in delay-4">
      <div class="stat-item">
        <div class="stat-number gradient-text">3.2M+</div>
        <div class="stat-label">Foreign Residents in Japan (2026)</div>
      </div>
      <div class="stat-item">
        <div class="stat-number gradient-text-cyan">210K</div>
        <div class="stat-label">Nikkei Brazilian Community</div>
      </div>
      <div class="stat-item">
        <div class="stat-number" style="color:#FFD700;">¥30T</div>
        <div class="stat-label">Smart Manufacturing Market by 2034</div>
      </div>
      <div class="stat-item">
        <div class="stat-number" style="color:#b47fff;">48</div>
        <div class="stat-label">Countries Represented in Japan Workforce</div>
      </div>
    </div>

  </div>
</section>

<div class="section-divider"></div>

<!-- ═══════════════════════════════ SECTION 1: BUSINESS NEWS ═══════════════════════════════ -->
<section class="section section-bg-1" id="news">
  <div class="section-inner">
    <div class="section-header">
      <div class="section-eyebrow" style="color:#FF8C00;">
        <div class="dot" style="background:#FF4500;"></div>
        Section 01
      </div>
      <h2 class="section-title">Japan Business &amp; Tech <span class="gradient-text">Trends</span></h2>
      <p class="section-desc">最新のビジネス・製造・テクノロジーニュースを、やさしい日本語・ポルトガル語・英語でお届けします。</p>
    </div>

    <div class="news-grid">

      <!-- FEATURED: Smart Manufacturing -->
      <article class="glass-card news-card news-featured">
        <div class="news-featured-content">
          <div class="news-card-header">
            <div class="news-tags">
              <span class="tag tag-red">Manufacturing</span>
              <span class="tag tag-gold">DX</span>
              <span class="tag tag-cyan">Smart Factory</span>
            </div>
            <span class="news-date">June 2026 · Source: IMARC Research / METI</span>
          </div>
          <h3 class="news-headline">日本のスマート製造ソフトウェア市場、2034年に3兆円規模へ — 製造DX革命が加速<br><small style="font-size:14px;font-weight:500;color:var(--muted);">Japan's Smart Manufacturing Software Market Set to Reach ¥30 Trillion by 2034</small></h3>

          <div class="news-lang-block">
            <div class="lang-label"><span style="font-size:16px;">🇯🇵</span> やさしい日本語</div>
            <p class="lang-content-ja">日本の工場で、コンピューターやAIを使った新しいシステムが増えています。今は8,400億円の市場ですが、2034年には3兆円になると予想されています。毎年15.2%ずつ大きくなっています。外国人エンジニアにとって、大きなチャンスです。</p>
          </div>
          <div class="news-divider"></div>
          <div class="news-lang-block">
            <div class="lang-label"><span style="font-size:16px;">🇧🇷</span> Português</div>
            <p class="lang-content-pt">O mercado de software para manufatura inteligente no Japão, avaliado em US$ 8,4 bilhões em 2025, deve atingir US$ 30 bilhões até 2034, crescendo a uma CAGR de 15,18%. Fábricas japonesas estão acelerando a adoção de IA, IoT industrial e gêmeos digitais — abrindo uma demanda enorme por engenheiros bilíngues com expertise em automação.</p>
          </div>
          <div class="news-divider"></div>
          <div class="news-lang-block">
            <div class="lang-label"><span style="font-size:16px;">🇺🇸</span> English</div>
            <p class="lang-content-en">Japan's smart manufacturing software market is projected to grow from USD 8.4B (2025) to USD 30B by 2034 at a CAGR of 15.18%. Driven by AI-powered quality control, industrial IoT deployment, and the government's Society 5.0 agenda, this transformation is creating unprecedented demand for multilingual engineers and tech managers across Japan's manufacturing belt.</p>
          </div>
          <span class="read-more">Full Analysis <i class="fas fa-arrow-right" style="font-size:11px;"></i></span>
        </div>
        <div class="news-featured-visual">
          <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,69,0,0.06),rgba(255,215,0,0.04));border-radius:12px;"></div>
          <div class="visual-icon">🏭</div>
          <div class="visual-stat gradient-text">¥30T</div>
          <div class="visual-label">Smart Manufacturing<br>Market by 2034</div>
          <div style="width:100%;margin-top:8px;">
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:4px;"><span>2025</span><span>2034</span></div>
            <div class="progress-pill"><div class="progress-fill" style="width:28%;"></div></div>
            <div style="font-size:10px;color:var(--muted);margin-top:6px;text-align:center;">CAGR 15.18% per year</div>
          </div>
          <div style="display:flex;gap:12px;margin-top:8px;">
            <div style="text-align:center;">
              <div style="font-size:14px;font-weight:700;color:#FF8C00;">¥8.4B</div>
              <div style="font-size:10px;color:var(--muted);">2025 Base</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:14px;font-weight:700;color:#4CAF50;">+257%</div>
              <div style="font-size:10px;color:var(--muted);">Growth</div>
            </div>
          </div>
        </div>
      </article>

      <!-- News Card 2: Japan Startup -->
      <article class="glass-card glass-card-cyan news-card">
        <div class="news-card-header">
          <div class="news-tags">
            <span class="tag tag-cyan">Startup</span>
            <span class="tag tag-purple">Deep Tech</span>
          </div>
          <span class="news-date">May 2026 · SusHi Tech Tokyo</span>
        </div>
        <h3 class="news-headline">SusHi Tech Tokyo 2026：AI・ロボット・宇宙テックで日本スタートアップが世界へ</h3>

        <div class="news-lang-block">
          <div class="lang-label"><span style="font-size:16px;">🇯🇵</span> やさしい日本語</div>
          <p class="lang-content-ja">2026年4月に東京で大きなイベントがありました。日本のスタートアップ（新しい会社）が世界に向けて発表しました。テーマはAI、ロボット、地震などへの強さ、そして宇宙技術の4つです。TechCrunchも参加しました。</p>
        </div>
        <div class="news-divider"></div>
        <div class="news-lang-block">
          <div class="lang-label"><span style="font-size:16px;">🇧🇷</span> Português</div>
          <p class="lang-content-pt">O SusHi Tech Tokyo 2026 (abril/2026) consolidou o Japão como hub global de inovação. Foco em 4 domínios: IA, Robótica, Resiliência e Entretenimento. O governo japonês tem um plano quinquenal com meta de ¥10 trilhões em startups, criando demanda por talentos bilíngues em gestão de inovação.</p>
        </div>
        <div class="news-divider"></div>
        <div class="news-lang-block">
          <div class="lang-label"><span style="font-size:16px;">🇺🇸</span> English</div>
          <p class="lang-content-en">SusHi Tech Tokyo 2026 (Apr 27–29) brought together 500+ global startups across AI, Robotics, Resilience & Entertainment. Japan's government five-year plan targets ¥10 trillion in startup investment, with Tokyo positioning itself as Asia's premier deep-tech hub competing directly with Silicon Valley.</p>
        </div>
        <span class="read-more">Read More <i class="fas fa-arrow-right" style="font-size:11px;"></i></span>
      </article>

      <!-- News Card 3: Labor Standards Reform -->
      <article class="glass-card glass-card-gold news-card">
        <div class="news-card-header">
          <div class="news-tags">
            <span class="tag tag-gold">Labor Law</span>
            <span class="tag tag-red">Urgent</span>
          </div>
          <span class="news-date">Feb 2026 · Paul Hastings / MHLW</span>
        </div>
        <h3 class="news-headline">労働基準法40年ぶりの大改正へ — 外国人労働者の権利と働き方が大きく変わる</h3>

        <div class="news-lang-block">
          <div class="lang-label"><span style="font-size:16px;">🇯🇵</span> やさしい日本語</div>
          <p class="lang-content-ja">日本の「働くルール」（労働基準法）が40年ぶりに大きく変わります。2026年に審議が始まりました。残業の計算方法や休みのルールが新しくなります。外国人も同じルールで守られます。</p>
        </div>
        <div class="news-divider"></div>
        <div class="news-lang-block">
          <div class="lang-label"><span style="font-size:16px;">🇧🇷</span> Português</div>
          <p class="lang-content-pt">O Japão está preparando a primeira grande reforma da Lei de Normas do Trabalho em quase 40 anos, com previsão para 2026. As mudanças incluem revisão dos cálculos de horas extras, novos direitos de descanso e proteções fortalecidas para trabalhadores estrangeiros em todos os setores.</p>
        </div>
        <div class="news-divider"></div>
        <div class="news-lang-block">
          <div class="lang-label"><span style="font-size:16px;">🇺🇸</span> English</div>
          <p class="lang-content-en">Japan's first major overhaul of the Labour Standards Act in nearly 40 years entered parliamentary review in 2026. Targeting rapid shifts in remote work, AI-augmented roles, and gig economy growth, the reform strengthens overtime calculations and rest entitlements — applicable equally to all foreign workers.</p>
        </div>
        <span class="read-more">Read More <i class="fas fa-arrow-right" style="font-size:11px;"></i></span>
      </article>

      <!-- News Card 4: Industrial Automation -->
      <article class="glass-card news-card">
        <div class="news-card-header">
          <div class="news-tags">
            <span class="tag tag-red">Automation</span>
            <span class="tag tag-cyan">AI / Robotics</span>
          </div>
          <span class="news-date">Mar 2026 · JR Automation / LinkedIn</span>
        </div>
        <h3 class="news-headline">2026年の製造自動化トレンド：AIロボット・デジタルツイン・協働ロボットが製造現場を変革</h3>

        <div class="news-lang-block">
          <div class="lang-label"><span style="font-size:16px;">🇯🇵</span> やさしい日本語</div>
          <p class="lang-content-ja">工場でAIやロボットを使う会社が増えています。「デジタルツイン」という技術で、コンピューターの中に工場を作り、問題を前もって見つけられます。人間とロボットが一緒に働く「協働ロボット」も広がっています。</p>
        </div>
        <div class="news-divider"></div>
        <div class="news-lang-block">
          <div class="lang-label"><span style="font-size:16px;">🇧🇷</span> Português</div>
          <p class="lang-content-pt">O mercado global de automação industrial ultrapassou US$ 221 bilhões em 2026. Os principais trends: robôs colaborativos (cobots) com IA, gêmeos digitais para manutenção preditiva, e sistemas de controle adaptativo. Para engenheiros brasileiros no Japão, dominar essas tecnologias é o diferencial competitivo do momento.</p>
        </div>
        <div class="news-divider"></div>
        <div class="news-lang-block">
          <div class="lang-label"><span style="font-size:16px;">🇺🇸</span> English</div>
          <p class="lang-content-en">The global industrial automation market surpassed USD 221B in 2026. Key trends: AI-driven collaborative robotics enabling safer human-machine interaction, digital twin adoption for predictive maintenance, and flexible automation systems that adapt to demand fluctuations — critical skills for foreign engineers in Japan's manufacturing sector.</p>
        </div>
        <span class="read-more">Read More <i class="fas fa-arrow-right" style="font-size:11px;"></i></span>
      </article>

    </div>
  </div>
</section>

<div class="section-divider" style="background:linear-gradient(90deg,transparent,rgba(0,194,203,0.3),rgba(255,215,0,0.2),transparent);"></div>

<!-- ═══════════════════════════════ SECTION 2: LIFE & ADMIN ═══════════════════════════════ -->
<section class="section section-bg-2" id="admin">
  <div class="section-inner">
    <div class="section-header">
      <div class="section-eyebrow" style="color:#00C2CB;">
        <div class="dot" style="background:#00C2CB;"></div>
        Section 02
      </div>
      <h2 class="section-title">Life, Visa &amp; Administrative <span class="gradient-text-cyan">Essentials</span></h2>
      <p class="section-desc">在日外国人のための最新行政・ビザ情報。2026年の重要な変更点をわかりやすくまとめました。</p>
    </div>

    <div class="admin-grid">

      <!-- Card 1: New Residence Card -->
      <div class="glass-card glass-card-cyan admin-card">
        <div class="admin-icon" style="background:rgba(0,194,203,0.12);border:1px solid rgba(0,194,203,0.25);">
          🪪
        </div>
        <div class="urgency-red admin-urgency">
          <i class="fas fa-exclamation-circle" style="font-size:10px;"></i>
          Action Required — June 14, 2026
        </div>
        <h3 class="admin-card-title">在留カード＋マイナンバー統合<br><small style="font-size:12px;font-weight:400;color:var(--muted);">New "Specified Residence Card" Launch</small></h3>
        <p class="admin-body">日本政府は2026年6月14日から、在留カードとマイナンバーカードを1枚に統合した「特定在留カード」の発行を開始します。手続きの簡略化と行政DXの一環です。</p>

        <ul class="admin-checklist">
          <li><span class="check-icon"><i class="fas fa-check-circle"></i></span>現在の在留カード・マイナカードは有効期限まで引き続き利用可能</li>
          <li><span class="check-icon"><i class="fas fa-check-circle"></i></span>新規取得・更新時に統合カードが自動発行される</li>
          <li><span class="alert-icon"><i class="fas fa-exclamation-triangle"></i></span>ICチップに医療・保険データが連携される（オプトアウト可）</li>
          <li><span class="check-icon"><i class="fas fa-check-circle"></i></span>管轄窓口が入管局1ヵ所に一本化される</li>
        </ul>

        <div class="admin-date-badge">
          <i class="fas fa-calendar-alt" style="color:#00C2CB;font-size:14px;"></i>
          <div>
            <div class="admin-date-text">施行日 / Launch Date</div>
            <div class="admin-date-val">June 14, 2026 (令和8年6月14日)</div>
          </div>
        </div>

        <div style="margin-top:14px;padding:10px 14px;background:rgba(0,194,203,0.06);border-radius:8px;border:1px solid rgba(0,194,203,0.15);">
          <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#00C2CB;margin-bottom:4px;">Fonte / Source</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.6);">Immigration Services Agency of Japan · Fragomen (Mar 4, 2026)</div>
        </div>
      </div>

      <!-- Card 2: Labour Standards Reform -->
      <div class="glass-card glass-card-gold admin-card">
        <div class="admin-icon" style="background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.2);">
          ⚖️
        </div>
        <div class="urgency-orange admin-urgency">
          <i class="fas fa-hourglass-half" style="font-size:10px;"></i>
          In Review — Monitor Closely
        </div>
        <h3 class="admin-card-title">労働基準法 大改正（40年ぶり）<br><small style="font-size:12px;font-weight:400;color:var(--muted);">Major Labour Standards Act Overhaul 2026</small></h3>
        <p class="admin-body">AIやリモートワーク、ギグエコノミーへの対応を目的とした労働基準法の大幅改正が2026年に審議入り。外国人労働者の権利保護条項も強化される見通しです。</p>

        <ul class="admin-checklist">
          <li><span class="alert-icon"><i class="fas fa-exclamation-triangle"></i></span>残業代計算ルールの見直し（裁量労働制の対象拡大）</li>
          <li><span class="check-icon"><i class="fas fa-check-circle"></i></span>年次有給休暇の取得義務強化（最低10日→14日案）</li>
          <li><span class="check-icon"><i class="fas fa-check-circle"></i></span>外国人労働者への就業規則・多言語説明義務化へ</li>
          <li><span class="alert-icon"><i class="fas fa-exclamation-triangle"></i></span>技能実習制度廃止→育成就労制度への完全移行（2027年めど）</li>
        </ul>

        <div class="admin-date-badge">
          <i class="fas fa-gavel" style="color:#FFD700;font-size:14px;"></i>
          <div>
            <div class="admin-date-text">審議状況 / Status</div>
            <div class="admin-date-val">国会審議中 — 2026年通常国会</div>
          </div>
        </div>

        <div style="margin-top:14px;padding:10px 14px;background:rgba(255,215,0,0.05);border-radius:8px;border:1px solid rgba(255,215,0,0.15);">
          <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#FFD700;margin-bottom:4px;">Fonte / Source</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.6);">Paul Hastings LLP Japan Practice (Feb 2026) · MHLW</div>
        </div>
      </div>

      <!-- Card 3: Tokutei Ginou SSW -->
      <div class="glass-card admin-card">
        <div class="admin-icon" style="background:rgba(150,80,255,0.1);border:1px solid rgba(150,80,255,0.2);">
          🛂
        </div>
        <div class="urgency-green admin-urgency">
          <i class="fas fa-check-circle" style="font-size:10px;"></i>
          Active — Expanded Categories
        </div>
        <h3 class="admin-card-title">特定技能ビザ（SSW）アップデート 2026<br><small style="font-size:12px;font-weight:400;color:var(--muted);">Specified Skilled Worker Visa — 2026 Updates</small></h3>
        <p class="admin-body">特定技能1号・2号ビザに関する重要なアップデート。2号の対象分野が拡大され、永続的な在留・家族呼び寄せが可能になりました。ブラジル人コミュニティにとって大きなチャンスです。</p>

        <ul class="admin-checklist">
          <li><span class="check-icon"><i class="fas fa-check-circle"></i></span>SSW 1号：最長5年、単身のみ（製造・飲食・建設など16分野）</li>
          <li><span class="check-icon"><i class="fas fa-check-circle"></i></span>SSW 2号：更新無制限 + 家族帯同可（永住への道）</li>
          <li><span class="alert-icon"><i class="fas fa-exclamation-triangle"></i></span>2月時点で飲食分野の外国人枠が限界近くに到達（46,000人）</li>
          <li><span class="check-icon"><i class="fas fa-check-circle"></i></span>ポルトガル語対応の試験センターが名古屋・浜松に増設</li>
        </ul>

        <div class="admin-date-badge">
          <i class="fas fa-users" style="color:#b47fff;font-size:14px;"></i>
          <div>
            <div class="admin-date-text">対象在留人数 / Foreign Workers (SSW)</div>
            <div class="admin-date-val">約 46,000人（飲食分野）2026年2月時点</div>
          </div>
        </div>

        <div style="margin-top:14px;padding:10px 14px;background:rgba(150,80,255,0.06);border-radius:8px;border:1px solid rgba(150,80,255,0.15);">
          <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#b47fff;margin-bottom:4px;">Fonte / Source</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.6);">Global Law Experts (May 2026) · MOFA SSW Portal · GaijinPot (Jan 2026)</div>
        </div>
      </div>

    </div>
  </div>
</section>

<div class="section-divider" style="background:linear-gradient(90deg,transparent,rgba(255,215,0,0.3),rgba(255,69,0,0.2),transparent);"></div>

<!-- ═══════════════════════════════ SECTION 3: GLOBAL FEED ═══════════════════════════════ -->
<section class="section section-bg-3" id="global">
  <div class="section-inner">
    <div class="section-header">
      <div class="section-eyebrow" style="color:#FFD700;">
        <div class="dot" style="background:#FFD700;"></div>
        Section 03
      </div>
      <h2 class="section-title">Home Country Insights — <span style="background:linear-gradient(135deg,#FFD700,#FF8C00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Global Feed</span></h2>
      <p class="section-desc">ブラジル・南米の最新ビジネスニュースを日本語でお届け。日本の職場で活かせる国際情報です。</p>
    </div>

    <div class="feed-grid">

      <!-- Feed 1: Japan-Mercosur EPA -->
      <div class="glass-card glass-card-gold feed-card">
        <div class="feed-flag-row">
          <span class="flag-emoji">🇧🇷🇯🇵</span>
          <div>
            <div style="font-size:13px;font-weight:700;color:white;">Brazil × Japan</div>
            <div class="flag-country">Reuters / Nikkei Asia · May 26, 2026</div>
          </div>
          <div style="margin-left:auto;"><span class="tag tag-gold">Trade</span></div>
        </div>
        <h3 class="feed-headline">日本・メルコスール EPA交渉が正式スタート — ブラジル人財の日本でのキャリアに新たな追い風</h3>

        <div class="feed-jp-summary">
          <div class="feed-jp-label">🇯🇵 日本語サマリー（職場で使える）</div>
          <p class="feed-jp-text">2026年5月26日、日本と南米の経済連合「メルコスール」（ブラジル・アルゼンチン・ウルグアイ・パラグアイ）が経済連携協定（EPA）の交渉を開始しました。日本はブラジルから石油・農産物の輸入拡大を、ブラジルは自動車などの日本製品の関税削減を目指します。この協定が結ばれると、両国間のビジネスが増え、ポルトガル語話者の価値が日本の職場でさらに高まる見通しです。</p>
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.8);margin-bottom:6px;">Summary (EN): </div>
          <p style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.6;">Japan formally launched EPA trade talks with Mercosur (May 26, 2026), seeking expanded oil/agricultural imports. For Japanese companies, Portuguese-speaking professionals bridge this growing bilateral relationship.</p>
        </div>

        <div class="feed-impact">
          <span>Impact Level</span>
          <div class="impact-bar impact-high"></div>
          <span style="font-size:11px;color:#FF8C00;font-weight:700;">HIGH</span>
        </div>
      </div>

      <!-- Feed 2: Brazil Oil Exports -->
      <div class="glass-card feed-card">
        <div class="feed-flag-row">
          <span class="flag-emoji">🇧🇷⚡</span>
          <div>
            <div style="font-size:13px;font-weight:700;color:white;">Brazil Energy</div>
            <div class="flag-country">Kyodo News · May 18–20, 2026</div>
          </div>
          <div style="margin-left:auto;"><span class="tag tag-red">Energy</span></div>
        </div>
        <h3 class="feed-headline">ブラジル、日本への石油輸出拡大を表明 — エネルギー安全保障で日ブラジル関係が急接近</h3>

        <div class="feed-jp-summary">
          <div class="feed-jp-label">🇯🇵 日本語サマリー（職場で使える）</div>
          <p class="feed-jp-text">2026年5月18日、日本とブラジルの外務大臣が会談しました。ブラジルは「日本へもっと石油を輸出する準備ができている」と発表しました。日本はロシアからのエネルギー供給を減らしたいため、ブラジルからの石油を重視しています。また、経済安全保障や先端技術の分野でも両国の協力が深まっています。ポルトガル語ができる専門家への需要が、日本のエネルギー・商社セクターで高まっています。</p>
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.8);margin-bottom:6px;">Summary (EN): </div>
          <p style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.6;">Brazil's Foreign Minister confirmed readiness to boost crude oil exports to Japan (May 2026), deepening strategic ties amid energy security concerns. Japan-Brazil foreign ministers agreed to strengthen economic and defense cooperation frameworks.</p>
        </div>

        <div class="feed-impact">
          <span>Impact Level</span>
          <div class="impact-bar impact-high"></div>
          <span style="font-size:11px;color:#FF8C00;font-weight:700;">HIGH</span>
        </div>
      </div>

      <!-- Feed 3: EU-Mercosur & Brazil Economic Growth -->
      <div class="glass-card feed-card">
        <div class="feed-flag-row">
          <span class="flag-emoji">🌎📈</span>
          <div>
            <div style="font-size:13px;font-weight:700;color:white;">South America</div>
            <div class="flag-country">EY / LinkedIn · May 2026</div>
          </div>
          <div style="margin-left:auto;"><span class="tag tag-cyan">Economy</span></div>
        </div>
        <h3 class="feed-headline">EU・メルコスール貿易協定が発効 — ブラジル再生エネルギー産業の急成長が世界市場を牽引</h3>

        <div class="feed-jp-summary">
          <div class="feed-jp-label">🇯🇵 日本語サマリー（職場で使える）</div>
          <p class="feed-jp-text">2026年5月、EUとメルコスール（ブラジルが中心）の貿易協定が正式に発効しました。7億2,000万人の消費者市場が生まれ、関税の90%以上が撤廃されます。ブラジルは特に再生可能エネルギー（太陽光・風力）や農業テクノロジー分野で急成長しています。日本企業はブラジルの成長市場への参入機会を模索しており、両国を橋渡しできる人材の価値が高まっています。</p>
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.8);margin-bottom:6px;">Summary (EN): </div>
          <p style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.6;">The EU-Mercosur trade deal went live in May 2026, eliminating 90%+ tariffs for 720M consumers. Brazil's renewable energy sector surged, creating investment opportunities for Japanese companies seeking green portfolio diversification in South America.</p>
        </div>

        <div class="feed-impact">
          <span>Impact Level</span>
          <div class="impact-bar impact-med"></div>
          <span style="font-size:11px;color:#FFD700;font-weight:700;">MEDIUM-HIGH</span>
        </div>
      </div>

    </div>
  </div>
</section>

<div class="section-divider" style="background:linear-gradient(90deg,transparent,rgba(150,80,255,0.3),rgba(0,194,203,0.2),transparent);"></div>

<!-- ═══════════════════════════════ SECTION 4: NEXUS ACADEMY ═══════════════════════════════ -->
<section class="section section-bg-4 academy-section" id="academy">
  <div class="section-inner">
    <div class="section-header">
      <div class="section-eyebrow" style="color:#b47fff;">
        <div class="dot" style="background:#b47fff;"></div>
        Section 04 — Platform Vision
      </div>
      <h2 class="section-title">Nexus <span style="background:linear-gradient(135deg,#b47fff,#00C2CB);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Academy</span></h2>
      <p class="section-desc">PIVOT × NewsPicks インスパイアの動画学習プラットフォーム。日本のビジネス・製造現場で即戦力になるためのコンテンツ。</p>
    </div>

    <!-- Video Series -->
    <div class="academy-grid">

      <!-- Video 1 -->
      <div class="glass-card video-card">
        <div class="video-thumb" style="background:linear-gradient(135deg,#1a0a2e,#2d0f54,rgba(150,80,255,0.2));">
          <div class="play-btn"><i class="fas fa-play" style="margin-left:3px;"></i></div>
          <div class="video-ep" style="background:rgba(150,80,255,0.3);color:#b47fff;border:1px solid rgba(150,80,255,0.4);">Series 01 · EP 12</div>
          <div class="video-duration">28:45</div>
          <!-- decorative -->
          <div style="position:absolute;bottom:20px;left:20px;right:20px;display:flex;gap:4px;">
            <div style="height:2px;flex:1;background:rgba(150,80,255,0.4);border-radius:2px;"></div>
            <div style="height:2px;flex:3;background:rgba(255,255,255,0.15);border-radius:2px;"></div>
          </div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:60px;opacity:0.08;">🤝</div>
        </div>
        <div class="video-body">
          <div class="video-series">Mastering Japanese Business Culture</div>
          <h4 class="video-title">Mastering Japanese Business Etiquette for Engineers</h4>
          <p class="video-desc">根回し・ホウレンソウ・会議の作法から名刺交換まで。製造・エンジニアリング現場で即使える日本式ビジネスマナー完全ガイド。(Completo em PT/EN)</p>
          <div class="video-meta">
            <span class="video-meta-item"><i class="fas fa-eye"></i> 24.8K views</span>
            <span class="video-meta-item"><i class="fas fa-clock"></i> 28 min</span>
            <span class="video-meta-item"><i class="fas fa-star" style="color:#FFD700;"></i> 4.9</span>
          </div>
        </div>
      </div>

      <!-- Video 2 -->
      <div class="glass-card video-card">
        <div class="video-thumb" style="background:linear-gradient(135deg,#001a1a,#003344,rgba(0,194,203,0.2));">
          <div class="play-btn"><i class="fas fa-play" style="margin-left:3px;"></i></div>
          <div class="video-ep" style="background:rgba(0,194,203,0.2);color:#00C2CB;border:1px solid rgba(0,194,203,0.35);">Series 02 · EP 8</div>
          <div class="video-duration">35:20</div>
          <div style="position:absolute;bottom:20px;left:20px;right:20px;display:flex;gap:4px;">
            <div style="height:2px;flex:2;background:rgba(0,194,203,0.5);border-radius:2px;"></div>
            <div style="height:2px;flex:2;background:rgba(255,255,255,0.15);border-radius:2px;"></div>
          </div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:60px;opacity:0.08;">🔧</div>
        </div>
        <div class="video-body">
          <div class="video-series">Career Transition Series</div>
          <h4 class="video-title">Career Transition: From Manufacturing to Tech Management</h4>
          <p class="video-desc">製造ライン → プロジェクトマネージャー → DXリード。外国人エンジニアが日本でキャリアアップを実現するロードマップを現役マネージャーが解説。</p>
          <div class="video-meta">
            <span class="video-meta-item"><i class="fas fa-eye"></i> 18.3K views</span>
            <span class="video-meta-item"><i class="fas fa-clock"></i> 35 min</span>
            <span class="video-meta-item"><i class="fas fa-star" style="color:#FFD700;"></i> 4.8</span>
          </div>
        </div>
      </div>

      <!-- Video 3 -->
      <div class="glass-card video-card">
        <div class="video-thumb" style="background:linear-gradient(135deg,#1a1000,#332200,rgba(255,140,0,0.2));">
          <div class="play-btn"><i class="fas fa-play" style="margin-left:3px;"></i></div>
          <div class="video-ep" style="background:rgba(255,140,0,0.2);color:#FF8C00;border:1px solid rgba(255,140,0,0.35);">Series 03 · EP 5</div>
          <div class="video-duration">22:10</div>
          <div style="position:absolute;bottom:20px;left:20px;right:20px;display:flex;gap:4px;">
            <div style="height:2px;flex:1;background:rgba(255,140,0,0.5);border-radius:2px;"></div>
            <div style="height:2px;flex:3;background:rgba(255,255,255,0.15);border-radius:2px;"></div>
          </div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:60px;opacity:0.08;">💰</div>
        </div>
        <div class="video-body">
          <div class="video-series">Financial Literacy in Japan</div>
          <h4 class="video-title">Smart Money: Tax, NISA &amp; Pension for Foreign Residents</h4>
          <p class="video-desc">確定申告・NISAの活用・国民年金と厚生年金の違い・ブラジルへの送金節税術まで。在日外国人のためのマネー完全ガイド（日本語・PT・EN）</p>
          <div class="video-meta">
            <span class="video-meta-item"><i class="fas fa-eye"></i> 31.2K views</span>
            <span class="video-meta-item"><i class="fas fa-clock"></i> 22 min</span>
            <span class="video-meta-item"><i class="fas fa-star" style="color:#FFD700;"></i> 4.95</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Jobs Section -->
    <div class="jobs-section">
      <div class="jobs-header" style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div class="section-eyebrow" style="color:#FF8C00;margin-bottom:8px;">
            <div class="dot" style="background:#FF4500;"></div>
            UNS→N Job Trend Highlights — 2026
          </div>
          <h3 class="jobs-title">外国人タレント向けキャリアトレンド <span class="gradient-text">Top Jobs 2026</span></h3>
        </div>
        <a href="#" class="btn-secondary" style="font-size:13px;padding:10px 20px;">
          全件見る <i class="fas fa-arrow-right"></i>
        </a>
      </div>

      <div class="jobs-grid" style="margin-top:24px;">

        <!-- Job 1 -->
        <div class="job-card">
          <div class="job-icon-row">
            <span class="job-icon">🤖</span>
            <span class="job-growth"><i class="fas fa-arrow-up"></i> +42%</span>
          </div>
          <h4 class="job-title">Manufacturing DX Engineer / スマート工場エンジニア</h4>
          <p class="job-subtitle">IoT・AIを活用した工場DX推進。ものづくり × テクノロジーの融合職種。外国語スキルが高評価。</p>
          <div class="job-salary">¥5.5M – ¥9.0M / year</div>
          <div class="job-skills">
            <span class="skill-chip">Python</span>
            <span class="skill-chip">PLC</span>
            <span class="skill-chip">IoT</span>
            <span class="skill-chip">SCADA</span>
            <span class="skill-chip">日本語N3+</span>
          </div>
          <div class="progress-pill" style="margin-top:14px;"><div class="progress-fill" style="width:85%;"></div></div>
          <div style="font-size:10px;color:var(--muted);margin-top:4px;">需要 / Demand: Very High</div>
        </div>

        <!-- Job 2 -->
        <div class="job-card">
          <div class="job-icon-row">
            <span class="job-icon">🌐</span>
            <span class="job-growth"><i class="fas fa-arrow-up"></i> +38%</span>
          </div>
          <h4 class="job-title">Global Business Developer / 海外事業開拓</h4>
          <p class="job-subtitle">日本企業の海外展開・外資系企業の日本参入を担うブリッジ人材。ポルトガル語話者は特に優遇。</p>
          <div class="job-salary">¥6.0M – ¥12.0M / year</div>
          <div class="job-skills">
            <span class="skill-chip">Português</span>
            <span class="skill-chip">English</span>
            <span class="skill-chip">日本語N2+</span>
            <span class="skill-chip">M&A</span>
            <span class="skill-chip">法人営業</span>
          </div>
          <div class="progress-pill" style="margin-top:14px;"><div class="progress-fill" style="width:78%;"></div></div>
          <div style="font-size:10px;color:var(--muted);margin-top:4px;">需要 / Demand: High</div>
        </div>

        <!-- Job 3 -->
        <div class="job-card">
          <div class="job-icon-row">
            <span class="job-icon">🏗️</span>
            <span class="job-growth"><i class="fas fa-arrow-up"></i> +55%</span>
          </div>
          <h4 class="job-title">Construction Tech PM / 建設DXプロジェクトマネージャー</h4>
          <p class="job-subtitle">BIM・ドローン・AIを活用した建設DX。人手不足が深刻な建設業界で外国人PMへの需要が急増。</p>
          <div class="job-salary">¥5.0M – ¥8.5M / year</div>
          <div class="job-skills">
            <span class="skill-chip">BIM/CIM</span>
            <span class="skill-chip">施工管理</span>
            <span class="skill-chip">日本語N3+</span>
            <span class="skill-chip">AutoCAD</span>
            <span class="skill-chip">SSW 2号</span>
          </div>
          <div class="progress-pill" style="margin-top:14px;"><div class="progress-fill" style="width:92%;background:linear-gradient(90deg,#00C2CB,#0080FF);"></div></div>
          <div style="font-size:10px;color:var(--muted);margin-top:4px;">需要 / Demand: Extremely High</div>
        </div>

      </div>

      <!-- CTA Banner -->
      <div style="
        margin-top:40px;
        background: linear-gradient(135deg, rgba(255,69,0,0.12), rgba(0,194,203,0.08), rgba(150,80,255,0.08));
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 20px;
        padding: 40px 48px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 32px;
        flex-wrap: wrap;
      ">
        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#FF8C00;margin-bottom:10px;">Platform Vision — Beta Launch Q3 2026</div>
          <h3 style="font-size:28px;font-weight:800;letter-spacing:-0.5px;margin-bottom:8px;">Ready to accelerate<br>your career in Japan?</h3>
          <p style="font-size:14px;color:var(--muted);max-width:480px;line-height:1.6;">UNS→N（アンシーン）は、日本で活躍するグローバル人材のための次世代ビジネス・キャリアメディアです。ベータ版の参加登録を受け付けています。</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;min-width:220px;">
          <a href="#" class="btn-primary" style="justify-content:center;">
            <i class="fas fa-rocket"></i> Join Beta Waitlist
          </a>
          <a href="#" class="btn-secondary" style="justify-content:center;font-size:13px;">
            <i class="fas fa-handshake"></i> Partner with Us
          </a>
          <div style="font-size:11px;color:var(--muted);text-align:center;">無料 · Gratuito · Free Beta</div>
        </div>
      </div>

    </div>
  </div>
</section>

<!-- ═══════════════════════════════════════ FOOTER ═══════════════════════════════════════ -->
<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div>
        <a href="#" class="logo" style="margin-bottom:0;">
          <div class="logo-icon" style="font-size:9px;letter-spacing:-0.5px;font-weight:900;">UN→N</div>
          <div>
            <div class="logo-text">UNS→N <span style="font-size:12px;font-weight:400;color:var(--muted);">アンシーン</span></div>
            <div class="logo-sub">Global Talent Media Platform</div>
          </div>
        </a>
        <p class="footer-brand-desc">UNS→N（アンシーン）— 日本のビジネス・製造現場で活躍する日系ブラジル人・外国人プロフェッショナルのための次世代メディアプラットフォーム。NewsPicks / PIVOT インスパイア。</p>
        <div style="display:flex;gap:12px;margin-top:20px;">
          <a href="#" style="width:34px;height:34px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:14px;text-decoration:none;transition:all 0.2s;" onmouseover="this.style.color='white';this.style.background='rgba(255,255,255,0.12)';" onmouseout="this.style.color='#6B7A99';this.style.background='rgba(255,255,255,0.06)';"><i class="fab fa-twitter"></i></a>
          <a href="#" style="width:34px;height:34px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:14px;text-decoration:none;transition:all 0.2s;" onmouseover="this.style.color='white';this.style.background='rgba(255,255,255,0.12)';" onmouseout="this.style.color='#6B7A99';this.style.background='rgba(255,255,255,0.06)';"><i class="fab fa-linkedin"></i></a>
          <a href="#" style="width:34px;height:34px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:14px;text-decoration:none;transition:all 0.2s;" onmouseover="this.style.color='white';this.style.background='rgba(255,255,255,0.12)';" onmouseout="this.style.color='#6B7A99';this.style.background='rgba(255,255,255,0.06)';"><i class="fab fa-instagram"></i></a>
          <a href="#" style="width:34px;height:34px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:14px;text-decoration:none;transition:all 0.2s;" onmouseover="this.style.color='white';this.style.background='rgba(255,255,255,0.12)';" onmouseout="this.style.color='#6B7A99';this.style.background='rgba(255,255,255,0.06)';"><i class="fab fa-youtube"></i></a>
        </div>
      </div>

      <div>
        <div class="footer-col-title">Platform</div>
        <div class="footer-links">
          <a href="#news" class="footer-link">Business News</a>
          <a href="#admin" class="footer-link">Life in Japan</a>
          <a href="#global" class="footer-link">Global Feed</a>
          <a href="#academy" class="footer-link">UNSEEN Academy</a>
          <a href="#" class="footer-link">Job Board</a>
        </div>
      </div>

      <div>
        <div class="footer-col-title">Community</div>
        <div class="footer-links">
          <a href="#" class="footer-link">Nikkei Brazilian Network</a>
          <a href="#" class="footer-link">Global Talent Forum</a>
          <a href="#" class="footer-link">Events & Meetups</a>
          <a href="#" class="footer-link">Mentorship Program</a>
          <a href="#" class="footer-link">Newsletter</a>
        </div>
      </div>

      <div>
        <div class="footer-col-title">Company</div>
        <div class="footer-links">
          <a href="#" class="footer-link">About UNS→N</a>
          <a href="#" class="footer-link">Our Mission</a>
          <a href="#" class="footer-link">Partner with Us</a>
          <a href="#" class="footer-link">Privacy Policy</a>
          <a href="#" class="footer-link">Terms of Use</a>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div>© 2026 UNS→N（アンシーン） — Concept Prototype. All rights reserved.</div>
      <div style="display:flex;gap:16px;align-items:center;">
        <span>🇧🇷 Comunidade Nikkei</span>
        <span style="color:var(--border);">·</span>
        <span>🇯🇵 在日外国人支援</span>
        <span style="color:var(--border);">·</span>
        <span>🌐 Global Talents Japan</span>
      </div>
    </div>
  </div>
</footer>

<script>
  // Language switcher (UI demo)
  function setLang(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    const labels = { pt: 'PT', en: 'EN', ja: 'やさしい' };
    document.querySelectorAll('.lang-btn').forEach(btn => {
      if (btn.textContent.trim() === labels[lang]) btn.classList.add('active');
    });
    // Show a toast notification
    showToast(lang);
  }

  function showToast(lang) {
    const messages = {
      pt: '🇧🇷 Modo Português ativado!',
      en: '🇺🇸 English mode activated!',
      ja: '🇯🇵 やさしい日本語モードになりました！'
    };
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = \`
      position:fixed;bottom:32px;right:32px;z-index:999;
      background:rgba(20,28,45,0.95);border:1px solid rgba(255,255,255,0.12);
      color:white;padding:12px 20px;border-radius:10px;
      font-size:13px;font-weight:600;
      backdrop-filter:blur(20px);
      box-shadow:0 8px 32px rgba(0,0,0,0.4);
      animation: slideIn 0.3s ease;
    \`;
    const style = document.createElement('style');
    style.textContent = '@keyframes slideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }';
    document.head.appendChild(style);
    toast.textContent = messages[lang];
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity='0'; toast.style.transition='opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 2500);
  }

  // Smooth active nav highlight
  const navLinks = document.querySelectorAll('.nav-link');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.style.color = '');
        const id = entry.target.id;
        const active = document.querySelector(\`.nav-link[href="#\${id}"]\`);
        if (active) active.style.color = 'white';
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('#news, #admin, #global, #academy').forEach(s => observer.observe(s));
</script>

</body>
</html>`)
})

export default app
