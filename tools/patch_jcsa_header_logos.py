from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f"expected block not found: {label}")
    return text.replace(old, new, 1)

# -----------------------------------------------------------------------------
# JCSA top page: logo immediately left of the title block.
# -----------------------------------------------------------------------------
p = Path("docs/index.html")
s = p.read_text(encoding="utf-8")
s = replace_once(
    s,
    '.hero-copy{position:relative;z-index:1;min-width:0}',
    '.hero-brand{position:relative;z-index:1;display:flex;align-items:center;gap:18px}.hero-logo{width:clamp(110px,12vw,180px);height:auto;flex:0 0 auto;object-fit:contain}.hero-copy{min-width:0}',
    "index hero brand css",
)
s = replace_once(
    s,
    '<section class="hero">\n  <div class="hero-copy">',
    '<section class="hero">\n  <div class="hero-brand"><img class="hero-logo" src="assets/jcsa-brush-logo.png" alt="JCSA"><div class="hero-copy">',
    "index hero html start",
)
s = replace_once(
    s,
    '    <div id="status" class="statusline">最新評価を読み込んでいます…</div>\n  </div>\n</section>',
    '    <div id="status" class="statusline">最新評価を読み込んでいます…</div>\n  </div></div>\n</section>',
    "index hero html end",
)
s = replace_once(
    s,
    '@media(max-width:620px){main{width:min(100% - 16px,1240px);padding-top:8px}.hero{padding:13px;border-radius:13px}.title{font-size:1.55rem}',
    '@media(max-width:620px){main{width:min(100% - 16px,1240px);padding-top:8px}.hero{padding:13px;border-radius:13px}.hero-brand{gap:10px;align-items:flex-start}.hero-logo{width:86px;margin-top:3px}.title{font-size:1.55rem}',
    "index mobile logo",
)
p.write_text(s, encoding="utf-8")

# -----------------------------------------------------------------------------
# Category library: same dark JCSA hero, logo to the left of title.
# -----------------------------------------------------------------------------
p = Path("docs/categories.html")
s = p.read_text(encoding="utf-8")
s = replace_once(
    s,
    'main{width:min(1120px,calc(100% - 28px));margin:auto;padding:28px 0 56px}.hero{background:#fff;border:1px solid var(--line);border-radius:16px;padding:24px;box-shadow:var(--shadow);margin-bottom:22px}.hero-row{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap}.eyebrow{margin:0 0 5px;color:#2378b9;font-size:.78rem;font-weight:900;letter-spacing:.12em}h1{margin:0;color:var(--ink);font-size:clamp(1.7rem,4vw,2.5rem);line-height:1.2}.lead{margin:9px 0 0;color:var(--muted)}',
    'main{width:min(1120px,calc(100% - 28px));margin:auto;padding:28px 0 56px}.hero{position:relative;overflow:hidden;background:radial-gradient(circle at 18% 35%,rgba(37,167,228,.22),transparent 32%),linear-gradient(135deg,#061529 0%,#082542 58%,#0b3856 100%);border:0;border-radius:20px;padding:22px;box-shadow:0 14px 40px rgba(3,28,48,.2);margin-bottom:22px;color:#fff}.hero:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(56,184,238,.06) 48%,transparent 100%);pointer-events:none}.hero-row{position:relative;z-index:1;display:flex;justify-content:space-between;gap:18px;align-items:center;flex-wrap:wrap}.hero-brand{display:flex;align-items:center;gap:18px;min-width:0}.hero-logo{width:clamp(110px,12vw,180px);height:auto;flex:0 0 auto;object-fit:contain}.hero-copy{min-width:0}.eyebrow{margin:0 0 5px;color:#63d0ff;font-size:.76rem;font-weight:900;letter-spacing:.14em}h1{margin:0;color:#fff;font-size:clamp(2rem,4vw,3.25rem);line-height:1.04;letter-spacing:-.035em}.lead{margin:9px 0 0;color:#c9dbe8}',
    "categories hero css",
)
s = replace_once(
    s,
    '.btn.primary{background:#1677b8;border-color:#1677b8;color:#fff}',
    '.btn.primary{background:#1677b8;border-color:#1677b8;color:#fff}.hero .btn{border-color:rgba(179,220,240,.42);background:rgba(255,255,255,.09);color:#fff}.hero .btn.primary{background:#1c8dcc;border-color:#1c8dcc;color:#fff}',
    "categories hero buttons",
)
s = replace_once(
    s,
    '<section class="hero"><div class="hero-row"><div><p class="eyebrow">REPORT LIBRARY</p><h1>カテゴリ別インテリジェンス・レポート</h1><p id="updated" class="lead">最新情報を読み込んでいます…</p></div><div class="actions">',
    '<section class="hero"><div class="hero-row"><div class="hero-brand"><img class="hero-logo" src="assets/jcsa-brush-logo.png" alt="JCSA"><div class="hero-copy"><p class="eyebrow">REPORT LIBRARY</p><h1>カテゴリ別インテリジェンス・レポート</h1><p id="updated" class="lead">最新情報を読み込んでいます…</p></div></div><div class="actions">',
    "categories hero html",
)
s = replace_once(
    s,
    '@media(max-width:720px){main{width:min(100% - 18px,1120px);padding-top:14px}.hero{padding:18px}.grid{grid-template-columns:1fr}.btn{flex:1}.hero .actions{width:100%}}',
    '@media(max-width:720px){main{width:min(100% - 18px,1120px);padding-top:14px}.hero{padding:13px;border-radius:13px}.hero-row{align-items:flex-start}.hero-brand{gap:10px;align-items:flex-start}.hero-logo{width:86px;margin-top:3px}.hero h1{font-size:1.55rem}.grid{grid-template-columns:1fr}.btn{flex:1}.hero .actions{width:100%}}',
    "categories mobile logo",
)
p.write_text(s, encoding="utf-8")

# -----------------------------------------------------------------------------
# Category detail report: logo only in the top header. Restore article cards.
# -----------------------------------------------------------------------------
p = Path("docs/report.html")
s = p.read_text(encoding="utf-8")
s = replace_once(
    s,
    '.header>*{position:relative;z-index:1}\n.header .eyebrow',
    '.header>*{position:relative;z-index:1}\n.header-brand{display:flex;align-items:center;gap:18px}.header-logo{width:clamp(110px,12vw,180px);height:auto;flex:0 0 auto;object-fit:contain}.header-copy{min-width:0}\n.header .eyebrow',
    "report header logo css",
)
s = replace_once(
    s,
    '.card{position:relative;min-width:0;padding:18px 19px 18px 116px;border:1px solid var(--line);border-left:5px solid var(--accent);border-radius:10px;background:var(--paper);box-shadow:var(--shadow);scroll-margin-top:16px;overflow:hidden}\n.card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:92px;background:radial-gradient(circle at 35% 30%,rgba(37,167,228,.24),transparent 44%),linear-gradient(165deg,#061529 0%,#082542 58%,#0b3856 100%);pointer-events:none}\n.card:after{content:"";position:absolute;left:9px;top:50%;width:74px;height:52px;transform:translateY(-50%);background:url("assets/jcsa-brush-logo.png") center/contain no-repeat;pointer-events:none}',
    '.card{min-width:0;padding:18px 19px;border:1px solid var(--line);border-left:5px solid var(--accent);border-radius:10px;background:var(--paper);box-shadow:var(--shadow);scroll-margin-top:16px}',
    "restore report article card",
)
s = replace_once(
    s,
    '  .header{padding:16px;border-radius:14px}\n  .header h1{font-size:1.65rem}\n  .card{padding:72px 14px 16px}\n  .card:before{left:0;right:0;top:0;bottom:auto;width:auto;height:56px}\n  .card:after{left:14px;top:7px;width:86px;height:42px;transform:none}',
    '  .header{padding:16px;border-radius:14px}\n  .header-brand{gap:10px;align-items:flex-start}\n  .header-logo{width:86px;margin-top:3px}\n  .header h1{font-size:1.65rem}',
    "restore report mobile card and add header logo",
)
s = replace_once(
    s,
    '<header class="header">\n  <p class="eyebrow">DAILY INTELLIGENCE REPORT</p>',
    '<header class="header">\n  <div class="header-brand"><img class="header-logo" src="assets/jcsa-brush-logo.png" alt="JCSA"><div class="header-copy">\n  <p class="eyebrow">DAILY INTELLIGENCE REPORT</p>',
    "report header html start",
)
s = replace_once(
    s,
    '  <p id="status" class="status">レポートを読み込んでいます…</p>\n</header>',
    '  <p id="status" class="status">レポートを読み込んでいます…</p>\n  </div></div>\n</header>',
    "report header html end",
)
p.write_text(s, encoding="utf-8")

print("patched index.html, categories.html, report.html")
