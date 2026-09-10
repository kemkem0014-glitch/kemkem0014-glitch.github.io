from pathlib import Path
import re

p = Path('docs/index.html')
s = p.read_text(encoding='utf-8')

old_css = '.impact-card p{margin:0;font-size:.9rem;line-height:1.5}.impact-card .assessment{font-weight:750;color:#1e3b64}'
new_css = '.impact-card p{margin:0;font-size:.9rem;line-height:1.5}.impact-card .assessment{font-weight:850;color:#17345f;font-size:.96rem;line-height:1.5;margin-bottom:8px}.impact-pathway,.impact-rationale{font-size:.84rem!important;line-height:1.55!important;color:#405873}.impact-pathway{margin-top:7px!important}.impact-rationale{margin-top:8px!important;padding-top:8px;border-top:1px solid rgba(55,103,151,.14)}.impact-pathway b,.impact-rationale b{color:#183c66;font-weight:900}.impact-more{grid-column:1/-1;border:1px solid rgba(55,103,151,.2);border-radius:10px;background:rgba(255,255,255,.62);padding:8px 11px}.impact-more summary{cursor:pointer;color:#17345f;font-size:.86rem;font-weight:900}.impact-extra{padding:11px 2px 7px;border-top:1px solid rgba(55,103,151,.14)}.impact-extra:first-of-type{margin-top:7px}'
if old_css not in s:
    raise SystemExit('impact card CSS block not found')
s = s.replace(old_css, new_css, 1)

pattern = re.compile(r'function renderImpacts\(items\)\{.*?\}\nfunction appendSourceMeta', re.S)
replacement = r'''function renderImpactCard(item){
  const card=document.createElement("article");
  card.className="impact-card";
  card.appendChild(textEl("h3","impact-title",val(item.impact_domain,impactTitle(item))));
  const badges=document.createElement("div");badges.className="badges";
  badges.append(textEl("span","badge",`影響度: ${val(item.impact_level)}`),textEl("span","badge conf",`確度: ${val(item.confidence)}`));
  card.appendChild(badges);
  card.appendChild(textEl("p","assessment",item.assessment));
  if(String(item.impact_pathway||"").trim()){
    const p=document.createElement("p");p.className="impact-pathway";
    const b=document.createElement("b");b.textContent="影響経路: ";p.append(b,document.createTextNode(String(item.impact_pathway).trim()));card.appendChild(p);
  }
  if(String(item.rationale_summary||"").trim()){
    const p=document.createElement("p");p.className="impact-rationale";
    const b=document.createElement("b");b.textContent="判断理由: ";p.append(b,document.createTextNode(String(item.rationale_summary).trim()));card.appendChild(p);
  }
  return card;
}
function renderImpacts(items){
  const root=$("impactGrid");root.replaceChildren();
  const rows=(Array.isArray(items)?items:[]).filter(x=>x&&String(x.impact_domain||"")!=="攻撃主体");
  if(!rows.length){root.appendChild(textEl("p","","個別影響評価はありません。"));return}
  for(const item of rows.slice(0,4))root.appendChild(renderImpactCard(item));
  if(rows.length>4){
    const details=document.createElement("details");details.className="impact-more";
    const summary=document.createElement("summary");summary.textContent=`その他の影響評価（${rows.length-4}件）`;details.appendChild(summary);
    for(const item of rows.slice(4)){
      const wrap=document.createElement("div");wrap.className="impact-extra";
      const title=document.createElement("p");title.className="assessment";title.textContent=`${val(item.impact_domain)}｜${val(item.assessment)}`;wrap.appendChild(title);
      const badges=document.createElement("div");badges.className="badges";badges.append(textEl("span","badge",`影響度: ${val(item.impact_level)}`),textEl("span","badge conf",`確度: ${val(item.confidence)}`));wrap.appendChild(badges);
      if(String(item.impact_pathway||"").trim()){const p=document.createElement("p");p.className="impact-pathway";const b=document.createElement("b");b.textContent="影響経路: ";p.append(b,document.createTextNode(String(item.impact_pathway).trim()));wrap.appendChild(p)}
      if(String(item.rationale_summary||"").trim()){const p=document.createElement("p");p.className="impact-rationale";const b=document.createElement("b");b.textContent="判断理由: ";p.append(b,document.createTextNode(String(item.rationale_summary).trim()));wrap.appendChild(p)}
      details.appendChild(wrap);
    }
    root.appendChild(details);
  }
}
function appendSourceMeta'''
ns, count = pattern.subn(replacement, s, count=1)
if count != 1:
    raise SystemExit(f'renderImpacts replacement count={count}')
p.write_text(ns, encoding='utf-8')
print('patched detailed Japan impact rendering')
