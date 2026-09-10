from pathlib import Path

p = Path('docs/report.html')
s = p.read_text(encoding='utf-8')

pairs = [
    (
        '.analysis-title{margin:0 0 8px;color:var(--accent2);font-size:.86rem;font-weight:900;letter-spacing:.02em}',
        '.analysis-title{margin:0 0 8px;color:var(--accent2);font-size:1.05rem;font-weight:900;letter-spacing:.02em}',
    ),
    ('.card:target{', '.card.is-referenced{'),
    ('.card:target .back-analysis{display:inline-flex}', '.card.is-referenced .back-analysis{display:inline-flex}'),
    (
        '  .card:target{background:#3a3108;outline-color:#ffd84d;box-shadow:0 0 0 8px rgba(255,216,77,.2)}',
        '  .card.is-referenced{background:#3a3108;outline-color:#ffd84d;box-shadow:0 0 0 8px rgba(255,216,77,.2)}',
    ),
]
for old, new in pairs:
    if old not in s:
        raise SystemExit(f'expected text not found: {old[:80]}')
    s = s.replace(old, new, 1)

old_clear = '''function clearArticleHighlight(){
  history.replaceState(null,"",`${location.pathname}${location.search}`);
  requestAnimationFrame(()=>analystPanel.scrollIntoView({behavior:"smooth",block:"start"}));
}'''
new_clear = '''function clearArticleHighlight(){
  document.querySelectorAll(".card.is-referenced").forEach(card=>card.classList.remove("is-referenced"));
  history.replaceState(null,"",`${location.pathname}${location.search}`);
  requestAnimationFrame(()=>analystPanel.scrollIntoView({behavior:"smooth",block:"start"}));
}'''
if old_clear not in s:
    raise SystemExit('clearArticleHighlight block not found')
s = s.replace(old_clear, new_clear, 1)

old_entry = '''    if(entry){
      a.href=`#${entry.anchor}`;
      a.title=`Web掲載記事 ${entry.number} へ移動`;
    }else if(url){'''
new_entry = '''    if(entry){
      a.href=`#${entry.anchor}`;
      a.title=`Web掲載記事 ${entry.number} へ移動`;
      a.addEventListener("click",e=>{
        e.preventDefault();
        document.querySelectorAll(".card.is-referenced").forEach(card=>card.classList.remove("is-referenced"));
        const target=document.getElementById(entry.anchor);
        if(!target)return;
        target.classList.add("is-referenced");
        history.replaceState(null,"",`${location.pathname}${location.search}#${entry.anchor}`);
        target.scrollIntoView({behavior:"smooth",block:"start"});
      });
    }else if(url){'''
if old_entry not in s:
    raise SystemExit('article reference entry block not found')
s = s.replace(old_entry, new_entry, 1)

p.write_text(s, encoding='utf-8')
