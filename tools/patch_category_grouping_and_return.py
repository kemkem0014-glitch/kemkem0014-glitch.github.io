from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f"expected block not found: {label}")
    return text.replace(old, new, 1)

# -----------------------------------------------------------------------------
# categories.html
# - Group space + cyber tech under one top-level "テック" category.
# - Rename the cyber_tech child card to "サイバー・テック".
# - Pass the normalized display name into report.html.
# -----------------------------------------------------------------------------
p = Path("docs/categories.html")
s = p.read_text(encoding="utf-8")

s = replace_once(
    s,
    '''const GROUPS=[\n  {name:"各国",types:["cyber_iran","cyber_china","cyber_russia","cyber_north_korea"]},\n  {name:"宇宙",types:["space"]},\n  {name:"テック",types:["cyber_tech"]},\n  {name:"軍事・防衛",types:["cyber_military"]}\n];''',
    '''const GROUPS=[\n  {name:"各国",types:["cyber_iran","cyber_china","cyber_russia","cyber_north_korea"]},\n  {name:"テック",types:["space","cyber_tech"]},\n  {name:"軍事・防衛",types:["cyber_military"]}\n];''',
    "category grouping",
)

s = replace_once(
    s,
    'function reportPageUrl(r,date){const p=new URLSearchParams();p.set("type",String(r.report_type||""));p.set("name",String(r.display_name||r.report_type||"レポート"));p.set("date",String(date||""));',
    'function reportDisplayName(r){const rt=String(r.report_type||"");if(rt==="cyber_tech")return "サイバー・テック";return String(r.display_name||rt||"レポート")}\nfunction reportPageUrl(r,date){const p=new URLSearchParams();p.set("type",String(r.report_type||""));p.set("name",reportDisplayName(r));p.set("date",String(date||""));',
    "report display name helper",
)

s = replace_once(
    s,
    'const title=document.createElement("h2");title.textContent=String(r.display_name||rt);',
    'const title=document.createElement("h2");title.textContent=reportDisplayName(r);',
    "main category card title",
)

s = replace_once(
    s,
    'const title=document.createElement("h2");title.textContent=String(r.display_name||r.report_type||"レポート");',
    'const title=document.createElement("h2");title.textContent=reportDisplayName(r);',
    "other category card title",
)

p.write_text(s, encoding="utf-8")

# -----------------------------------------------------------------------------
# report.html
# - Add a radio-like navigation button back to categories.html on every detail.
# -----------------------------------------------------------------------------
p = Path("docs/report.html")
s = p.read_text(encoding="utf-8")

s = replace_once(
    s,
    '.btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}',
    '.btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}\n.btn.category-return{border-color:#8fb7cf;background:#eaf5fb;color:#075f86;font-weight:850}.btn.category-return:before{content:"";width:10px;height:10px;border:2px solid #087cab;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 2px #eaf5fb;margin-right:7px}.btn.category-return:hover{background:#d9eef8;color:#044d6e}',
    "category return button css",
)

s = replace_once(
    s,
    '<nav class="toolbar">\n  <a class="btn" href="index.html">一覧へ戻る</a>\n  <a class="btn" href="downloads.html">ダウンロード一覧</a>',
    '<nav class="toolbar">\n  <a class="btn" href="index.html">日本向けへ戻る</a>\n  <a class="btn category-return" href="categories.html">カテゴリ別へ戻る</a>\n  <a class="btn" href="downloads.html">ダウンロード一覧</a>',
    "category return button html",
)

p.write_text(s, encoding="utf-8")
print("patched categories.html and report.html")
