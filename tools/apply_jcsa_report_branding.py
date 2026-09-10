from pathlib import Path

p = Path('docs/report.html')
s = p.read_text(encoding='utf-8')

old = '.header,.analyst-panel{padding:clamp(22px,4vw,38px);border-radius:14px;background:var(--paper);box-shadow:var(--shadow);margin-bottom:22px}'
new = '''.header{position:relative;overflow:hidden;display:block;padding:22px;border-radius:20px;background:radial-gradient(circle at 18% 35%,rgba(37,167,228,.22),transparent 32%),linear-gradient(135deg,#061529 0%,#082542 58%,#0b3856 100%);box-shadow:0 14px 40px rgba(3,28,48,.2);color:#fff;margin-bottom:22px}
.header:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(56,184,238,.06) 48%,transparent 100%);pointer-events:none}
.header>*{position:relative;z-index:1}
.header .eyebrow{color:#63d0ff;font-size:.76rem;font-weight:900;letter-spacing:.14em}
.header h1{color:#fff;font-size:clamp(2rem,4vw,3.25rem);line-height:1.04;letter-spacing:-.035em}
.header .meta{margin-top:15px}
.header .pill{border:1px solid rgba(113,210,255,.34);background:rgba(13,68,102,.55);color:#d7f3ff}
.header .status{margin-top:13px;padding-top:11px;border-top:1px solid rgba(180,218,238,.2);color:#bad0df}
.header .status.error{color:#ffb7ac}
.analyst-panel{padding:clamp(22px,4vw,38px);border-radius:14px;background:var(--paper);box-shadow:var(--shadow);margin-bottom:22px}'''
if old not in s:
    raise SystemExit('header style anchor not found')
s = s.replace(old, new, 1)

old_card = '.card{min-width:0;padding:18px 19px;border:1px solid var(--line);border-left:5px solid var(--accent);border-radius:10px;background:var(--paper);box-shadow:var(--shadow);scroll-margin-top:16px}'
new_card = '''.card{position:relative;min-width:0;padding:18px 19px 18px 116px;border:1px solid var(--line);border-left:5px solid var(--accent);border-radius:10px;background:var(--paper);box-shadow:var(--shadow);scroll-margin-top:16px;overflow:hidden}
.card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:92px;background:radial-gradient(circle at 35% 30%,rgba(37,167,228,.24),transparent 44%),linear-gradient(165deg,#061529 0%,#082542 58%,#0b3856 100%);pointer-events:none}
.card:after{content:"";position:absolute;left:9px;top:50%;width:74px;height:52px;transform:translateY(-50%);background:url("assets/jcsa-brush-logo.png") center/contain no-repeat;pointer-events:none}'''
if old_card not in s:
    raise SystemExit('card style anchor not found')
s = s.replace(old_card, new_card, 1)

old_mobile = '''  .analysis-block{padding:12px}
  .ref-link{width:100%}'''
new_mobile = '''  .analysis-block{padding:12px}
  .ref-link{width:100%}
  .header{padding:16px;border-radius:14px}
  .header h1{font-size:1.65rem}
  .card{padding:72px 14px 16px}
  .card:before{left:0;right:0;top:0;bottom:auto;width:auto;height:56px}
  .card:after{left:14px;top:7px;width:86px;height:42px;transform:none}'''
if old_mobile not in s:
    raise SystemExit('mobile style anchor not found')
s = s.replace(old_mobile, new_mobile, 1)

old_eyebrow = '<p class="eyebrow">PUBLIC NEWS REPORT</p>'
new_eyebrow = '<p class="eyebrow">DAILY INTELLIGENCE REPORT</p>'
if old_eyebrow not in s:
    raise SystemExit('eyebrow anchor not found')
s = s.replace(old_eyebrow, new_eyebrow, 1)

p.write_text(s, encoding='utf-8')
