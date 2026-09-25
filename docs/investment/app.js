const DATA_URL = "./data/latest.json";

let state = {
  data: null,
  sort: "up",
  search: "",
  newsFilter: "all",
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function signalClass(value) {
  const v = String(value || "").toLowerCase();
  if (["positive", "bullish", "pass"].includes(v)) return "pos";
  if (["negative", "bearish", "fail"].includes(v)) return "neg";
  if (["mixed", "neutral"].includes(v)) return "mix";
  return "";
}

function signalLabel(value) {
  const map = {
    positive: "Positive",
    negative: "Negative",
    mixed: "Mixed",
    neutral: "Neutral",
    uncertain: "Uncertain",
    PASS: "PASS",
    FAIL: "FAIL",
    UNKNOWN: "UNKNOWN",
  };
  return map[value] || value || "—";
}

function gateClass(value) {
  const v = String(value || "UNKNOWN").toLowerCase();
  if (v === "pass") return "pass";
  if (v === "fail") return "fail";
  return "unknown";
}

function fmtPrice(company) {
  if (company.price == null) return "—";
  const currency = company.currency || "";
  const decimals = Math.abs(company.price) >= 100 ? 0 : 2;
  return `${currency} ${Number(company.price).toLocaleString("ja-JP", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`.trim();
}

function fmtPct(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function fmtAxisPrice(value, currency = "") {
  if (!Number.isFinite(Number(value))) return "—";
  const n = Number(value);
  const digits = Math.abs(n) >= 100 ? 0 : 2;
  const prefix = currency === "USD" ? "$" : currency === "JPY" ? "¥" : "";
  return prefix + n.toLocaleString("ja-JP", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function sparkline(points, positive = true, currency = "") {
  const clean = (points || [])
    .map((p) => ({ date: p.date || "", close: Number(p.close) }))
    .filter((p) => Number.isFinite(p.close));
  if (clean.length < 2) {
    return '<div class="empty-state"><span>株価系列なし</span></div>';
  }

  const width = 430;
  const height = 132;
  const left = 48;
  const right = 10;
  const top = 10;
  const bottom = 24;
  const values = clean.map((p) => p.close);
  const minRaw = Math.min(...values);
  const maxRaw = Math.max(...values);
  const margin = Math.max((maxRaw - minRaw) * 0.08, Math.abs(maxRaw) * 0.01, 0.01);
  const min = minRaw - margin;
  const max = maxRaw + margin;
  const mid = (min + max) / 2;
  const span = max - min || 1;

  const x = (i) => left + ((width - left - right) * i) / (clean.length - 1);
  const y = (value) => top + (height - top - bottom) * (1 - (value - min) / span);
  const coords = clean.map((p, i) => `${x(i).toFixed(1)},${y(p.close).toFixed(1)}`);
  const stroke = positive ? "#2c7c68" : "#b45a5a";
  const grid = [max, mid, min].map((value) => {
    const yy = y(value);
    return `
      <line x1="${left}" y1="${yy.toFixed(1)}" x2="${width-right}" y2="${yy.toFixed(1)}" stroke="#e6edf4" stroke-width="1"/>
      <text x="${left-6}" y="${(yy+3).toFixed(1)}" text-anchor="end" class="chart-label">${escapeHtml(fmtAxisPrice(value, currency))}</text>
    `;
  }).join("");

  const first = clean[0];
  const last = clean[clean.length - 1];
  return `
    <svg class="sparkline" viewBox="0 0 ${width} ${height}" aria-label="3か月株価">
      ${grid}
      <polyline points="${coords.join(" ")}" fill="none" stroke="${stroke}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${x(0).toFixed(1)}" cy="${y(first.close).toFixed(1)}" r="3" fill="${stroke}"/>
      <circle cx="${x(clean.length-1).toFixed(1)}" cy="${y(last.close).toFixed(1)}" r="3.5" fill="${stroke}"/>
      <text x="${left}" y="${height-5}" text-anchor="start" class="chart-date">${escapeHtml(first.date)}</text>
      <text x="${width-right}" y="${height-5}" text-anchor="end" class="chart-date">${escapeHtml(last.date)}</text>
      <text x="${x(0).toFixed(1)}" y="${Math.max(10,y(first.close)-7).toFixed(1)}" text-anchor="start" class="chart-value">${escapeHtml(fmtAxisPrice(first.close, currency))}</text>
      <text x="${x(clean.length-1).toFixed(1)}" y="${Math.max(10,y(last.close)-7).toFixed(1)}" text-anchor="end" class="chart-value">${escapeHtml(fmtAxisPrice(last.close, currency))}</text>
    </svg>
  `;
}

function hypothesisProbabilities(company) {
  const p = company.probabilities_7d || company.hypothesis_support_7d?.probabilities || {};
  return {
    up: Number(p.up ?? 0),
    flat: Number(p.flat ?? 0),
    down: Number(p.down ?? 0),
  };
}

function hypothesisBars(company, compact = false) {
  const p = hypothesisProbabilities(company);
  const rows = [
    ["up", "↑ 上昇", p.up],
    ["flat", "→ 横ばい", p.flat],
    ["down", "↓ 下落", p.down],
  ];
  return `
    <div class="hypothesis-bars ${compact ? "compact" : ""}">
      ${rows.map(([key,label,value]) => `
        <div class="hypothesis-row">
          <span class="hypothesis-label">${label}</span>
          <div class="hypothesis-track"><i class="${key}" style="width:${Math.max(0,Math.min(100,value))}%"></i></div>
          <b>${Number(value).toFixed(1)}%</b>
        </div>
      `).join("")}
    </div>
  `;
}

function achScoreClass(score) {
  const n = Number(score);
  if (n >= 1) return "support";
  if (n <= -1) return "conflict";
  return "neutral";
}

function achScoreLabel(score) {
  const n = Number(score);
  return Number.isFinite(n) ? (n > 0 ? `+${n}` : String(n)) : "0";
}

function achTable(company) {
  const rows = company.ach_matrix || [];
  if (!rows.length) {
    return '<div class="empty-state"><span>ACH行列はまだありません。</span></div>';
  }
  return `
    <div class="ach-wrap">
      <div class="ach-legend">+2 強く支持 / +1 支持 / 0 中立・不明 / -1 矛盾 / -2 強く矛盾</div>
      <div class="ach-table-wrap">
        <table class="ach-table">
          <thead>
            <tr><th>Evidence</th><th>Weight</th><th>UP</th><th>FLAT</th><th>DOWN</th><th>評価理由</th></tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td><code>${escapeHtml(row.evidence_id || "")}</code></td>
                <td>${escapeHtml(row.weight ?? "—")}</td>
                <td><span class="ach-score ${achScoreClass(row.up)}">${achScoreLabel(row.up)}</span></td>
                <td><span class="ach-score ${achScoreClass(row.flat)}">${achScoreLabel(row.flat)}</span></td>
                <td><span class="ach-score ${achScoreClass(row.down)}">${achScoreLabel(row.down)}</span></td>
                <td>${escapeHtml(row.rationale || "")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSummary() {
  const container = $("#summaryGrid");
  const rows = state.data?.summary || [];
  container.innerHTML = rows.map((row) => `
    <article class="summary-card ${escapeHtml(row.key)}">
      <div class="summary-top">
        <div class="summary-label">${escapeHtml(row.label)}</div>
        <div class="summary-count">${Number(row.count || 0)}件</div>
      </div>
      <p>${escapeHtml(row.text)}</p>
    </article>
  `).join("");
}

function companyRank(company, type) {
  if (type === "change") return Number(company.change_3m ?? -9999);
  if (type === "mentions") return Number(company.article_count || 0);
  return Number(hypothesisProbabilities(company).up || 0);
}

function filteredCompanies() {
  const q = state.search.trim().toLowerCase();
  return [...(state.data?.companies || [])]
    .filter((company) => {
      if (!q) return true;
      return [
        company.name,
        company.ticker,
        company.reason,
        ...(company.risks || []),
      ].join(" ").toLowerCase().includes(q);
    })
    .sort((a, b) => companyRank(b, state.sort) - companyRank(a, state.sort));
}

function companyCard(company) {
  const positive = Number(company.change_3m || 0) >= 0;
  const p = hypothesisProbabilities(company);
  return `
    <article class="company-card" data-company-id="${escapeHtml(company.id)}">
      <div class="company-top">
        <div>
          <div class="company-name">${escapeHtml(company.name)}</div>
          <div class="ticker">${escapeHtml(company.ticker)}</div>
        </div>
        <div class="price">
          <strong>${escapeHtml(fmtPrice(company))}</strong>
          <span class="${positive ? "pos" : "neg"}">${escapeHtml(fmtPct(company.change_3m))} / 3か月</span>
        </div>
      </div>
      <div class="spark-wrap numeric-chart">${sparkline(company.prices, positive, company.currency)}</div>
      <div class="chart-summary">
        <span>始値 ${escapeHtml(fmtAxisPrice(company.prices?.[0]?.close, company.currency))}</span>
        <span>終値 ${escapeHtml(fmtAxisPrice(company.prices?.[company.prices.length-1]?.close, company.currency))}</span>
        <span>変化 ${escapeHtml(fmtPct(company.change_3m))}</span>
      </div>
      <p class="company-reason">${escapeHtml(company.reason || "材料の要約はまだありません。")}</p>
      <div class="probability-title">7日競合仮説 <small>±3%基準・暫定</small></div>
      ${hypothesisBars(company, true)}
      <div class="card-foot">
        <span>↑ ${p.up.toFixed(1)}% · 関連記事 ${Number(company.article_count || 0)}件 · Gate ${escapeHtml(company.gate || "UNKNOWN")}</span>
        <button type="button">ACH分析を見る →</button>
      </div>
    </article>
  `;
}

function renderCompanies() {
  const companies = filteredCompanies();
  $("#companyGrid").innerHTML = companies.length
    ? companies.map(companyCard).join("")
    : $("#emptyTemplate").innerHTML;

  $$(".company-card").forEach((card) => {
    card.addEventListener("click", () => openCompany(card.dataset.companyId));
  });

  const privates = state.data?.private_companies || [];
  $("#privateCompanies").innerHTML = privates.length
    ? `<span class="status-badge private-badge">非上場・株価なし</span> ${privates.map(escapeHtml).join(" / ")}`
    : "";

  const tbody = $("#companyTable");
  tbody.innerHTML = companies.map((c) => `
    <tr data-company-id="${escapeHtml(c.id)}">
      <td><strong>${escapeHtml(c.name)}</strong></td>
      <td>${escapeHtml(c.ticker)}</td>
      <td class="pos">${hypothesisProbabilities(c).up.toFixed(1)}%</td>
      <td class="mix">${hypothesisProbabilities(c).flat.toFixed(1)}%</td>
      <td class="neg">${hypothesisProbabilities(c).down.toFixed(1)}%</td>
      <td class="${Number(c.change_3m || 0) >= 0 ? "pos" : "neg"}">${escapeHtml(fmtPct(c.change_3m))}</td>
      <td><span class="gate-badge ${gateClass(c.gate)}">${escapeHtml(c.gate || "UNKNOWN")}</span></td>
    </tr>
  `).join("");

  $$("tr[data-company-id]", tbody).forEach((row) => {
    row.addEventListener("click", () => openCompany(row.dataset.companyId));
  });
}

function filteredNews(filter = state.newsFilter) {
  const q = state.search.trim().toLowerCase();
  return (state.data?.news || []).filter((row) => {
    if (filter !== "all" && row.category !== filter) return false;
    if (!q) return true;
    return [row.title, row.summary, row.source, row.company].join(" ").toLowerCase().includes(q);
  });
}

function newsHtml(filter = state.newsFilter, limit = null) {
  let rows = filteredNews(filter);
  if (limit) rows = rows.slice(0, limit);
  if (!rows.length) return $("#emptyTemplate").innerHTML;
  return rows.map((row) => `
    <article class="news-row">
      <div class="news-meta">
        <b>${escapeHtml(row.source || "—")}</b>
        <span>${escapeHtml(row.date || "")}</span>
        <span class="news-tag ${escapeHtml(row.category)}">${escapeHtml(row.category_label || row.category)}</span>
      </div>
      <div class="news-copy">
        <h3>${escapeHtml(row.title)}</h3>
        <p>${escapeHtml(row.summary)}</p>
      </div>
      ${row.url ? `<a class="news-link" href="${escapeHtml(row.url)}" target="_blank" rel="noopener noreferrer">元記事 →</a>` : ""}
    </article>
  `).join("");
}

function renderNews() {
  $("#newsList").innerHTML = newsHtml(state.newsFilter, 8);
  $("#allNewsList").innerHTML = newsHtml(state.newsFilter);
}

function renderPipeline() {
  const rows = state.data?.pipeline || [];
  $("#aiPipeline").innerHTML = `
    <div class="pipeline-list">
      ${rows.map((row, i) => `
        <div class="pipeline-step">
          <div class="pipeline-index">${String(i + 1).padStart(2, "0")}</div>
          <div>
            <b>${escapeHtml(row.label)}</b>
            <small>${escapeHtml(row.detail || "")}</small>
          </div>
          <span class="state ${escapeHtml(row.status || "wait")}">${escapeHtml((row.status || "wait").toUpperCase())}</span>
        </div>
      `).join("")}
    </div>
  `;

  const mode = state.data?.meta?.mode || "unknown";
  const modeLabel = mode === "demo" ? "DEMO DATA" : "LIVE";
  const modeClass = mode === "demo" ? "warn" : "ok";
  $("#heroStatus").innerHTML = `
    <span class="status-badge ${modeClass}">${modeLabel}</span>
    <span class="status-badge">US × SPACE</span>
    <span class="status-badge">更新 ${escapeHtml(state.data?.meta?.generated_at || "—")}</span>
  `;

  $("#pipelineStatus").innerHTML = `
    <b>DATA PIPELINE</b><br>
    ${rows.filter((r) => r.status === "ok").length}/${rows.length} stages ready<br>
    Mode: ${escapeHtml(modeLabel)}
  `;
}

function renderAnalysis() {
  const companies = filteredCompanies();
  $("#analysisGrid").innerHTML = companies.length ? companies.map((company) => {
    const p = hypothesisProbabilities(company);
    const audit = company.audit || [];
    return `
      <article class="audit-card ach-card">
        <div class="ach-card-head">
          <div>
            <h3>${escapeHtml(company.name)} <span class="ticker">${escapeHtml(company.ticker)}</span></h3>
            <div class="audit-meta">7日後：上昇=+3%以上 / 横ばい=-3%〜+3% / 下落=-3%以下</div>
          </div>
          <span class="gate-badge ${gateClass(company.gate)}">${escapeHtml(company.gate || "UNKNOWN")}</span>
        </div>
        <div class="probability-panel">
          ${hypothesisBars(company)}
          <div class="probability-method">
            ACH重み付き支持率 · ${escapeHtml(company.probability_method || "weighted_ach_softmax_v0.1")} ·
            ${company.probability_calibrated ? "校正済み" : "未校正（試行）"}
          </div>
        </div>
        <h4>ACH 証拠比較表</h4>
        ${achTable(company)}
        <h4>分析監査ログ</h4>
        <div class="audit-timeline">
          ${audit.map((item) => `
            <div class="audit-item">
              <b>${escapeHtml(item.role || item.event || "analysis")}</b>
              <p>${escapeHtml(item.summary || item.result || item.detail || "")}</p>
            </div>
          `).join("") || '<div class="audit-item"><p>監査ログはまだありません。</p></div>'}
        </div>
        <div class="ach-total">UP ${p.up.toFixed(1)}% / FLAT ${p.flat.toFixed(1)}% / DOWN ${p.down.toFixed(1)}%</div>
      </article>
    `;
  }).join("") : $("#emptyTemplate").innerHTML;
}

function openCompany(id) {
  const company = (state.data?.companies || []).find((c) => c.id === id);
  if (!company) return;
  $("#drawerTitle").textContent = `${company.name} (${company.ticker})`;

  const risks = company.risks || [];
  const evidence = company.evidence || [];
  const audit = company.audit || [];

  $("#drawerContent").innerHTML = `
    <section class="drawer-section">
      <h3>7日競合仮説</h3>
      <p class="drawer-note">上昇=+3%以上 / 横ばい=-3%〜+3% / 下落=-3%以下。現在はACH証拠評価から算出した未校正の支持率です。</p>
      ${hypothesisBars(company)}
      <div class="metric-row" style="margin-top:10px">
        <div class="metric"><span>Final Gate</span><b>${escapeHtml(company.gate || "UNKNOWN")}</b></div>
        <div class="metric"><span>方式</span><b>ACH</b></div>
        <div class="metric"><span>校正</span><b>${company.probability_calibrated ? "済" : "未"}</b></div>
      </div>
    </section>

    <section class="drawer-section">
      <h3>本日の材料</h3>
      <p>${escapeHtml(company.reason || "—")}</p>
    </section>

    <section class="drawer-section">
      <h3>3か月株価</h3>
      <div class="spark-wrap drawer-chart">${sparkline(company.prices, Number(company.change_3m || 0) >= 0, company.currency)}</div>
      <div class="metric-row">
        <div class="metric"><span>始値</span><b>${escapeHtml(fmtAxisPrice(company.prices?.[0]?.close, company.currency))}</b></div>
        <div class="metric"><span>終値</span><b>${escapeHtml(fmtAxisPrice(company.prices?.[company.prices.length-1]?.close, company.currency))}</b></div>
        <div class="metric"><span>3か月</span><b class="${Number(company.change_3m || 0) >= 0 ? "pos" : "neg"}">${escapeHtml(fmtPct(company.change_3m))}</b></div>
      </div>
    </section>

    <section class="drawer-section">
      <h3>ACH 証拠比較表</h3>
      ${achTable(company)}
    </section>

    <section class="drawer-section">
      <h3>反対材料 / リスク</h3>
      ${risks.length ? `<ul>${risks.map((risk) => `<li>${escapeHtml(risk)}</li>`).join("")}</ul>` : "<p>登録なし</p>"}
    </section>

    <section class="drawer-section">
      <h3>根拠</h3>
      <div class="evidence-list">
        ${evidence.length ? evidence.map((item) => `
          <div class="evidence-item">
            <b>${escapeHtml(item.id || item.source || "evidence")}</b>
            <span>${escapeHtml(item.label || item.summary || "")}</span>
          </div>
        `).join("") : "<p>根拠データはまだありません。</p>"}
      </div>
    </section>

    <section class="drawer-section">
      <h3>分析監査ログ</h3>
      <div class="audit-timeline">
        ${audit.length ? audit.map((item) => `
          <div class="audit-item">
            <b>${escapeHtml(item.role || item.event || "analysis")}</b>
            <p>${escapeHtml(item.summary || item.result || item.detail || "")}</p>
          </div>
        `).join("") : "<p>監査ログはまだありません。</p>"}
      </div>
    </section>
  `;

  $("#companyDrawer").classList.add("open");
  $("#drawerBackdrop").classList.add("open");
  $("#companyDrawer").setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  $("#companyDrawer").classList.remove("open");
  $("#drawerBackdrop").classList.remove("open");
  $("#companyDrawer").setAttribute("aria-hidden", "true");
}

function bindNavigation() {
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".nav-item").forEach((b) => b.classList.toggle("active", b === button));
      $$(".view").forEach((view) => view.classList.remove("active"));
      $("#view-" + button.dataset.view)?.classList.add("active");
    });
  });

  $$(".chip[data-sort]").forEach((button) => {
    button.addEventListener("click", () => {
      state.sort = button.dataset.sort;
      $$(".chip[data-sort]").forEach((b) => b.classList.toggle("active", b === button));
      renderCompanies();
      renderAnalysis();
    });
  });

  $$("[data-news-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.newsFilter = button.dataset.newsFilter;
      $$("[data-news-filter]").forEach((b) => b.classList.toggle("active", b.dataset.newsFilter === state.newsFilter));
      renderNews();
    });
  });

  $("#searchInput").addEventListener("input", (event) => {
    state.search = event.target.value;
    renderCompanies();
    renderNews();
    renderAnalysis();
  });

  $("#closeDrawer").addEventListener("click", closeDrawer);
  $("#drawerBackdrop").addEventListener("click", closeDrawer);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDrawer();
  });
}

function renderAll() {
  const date = state.data?.meta?.date || "—";
  $("#reportDate").textContent = date;
  renderSummary();
  renderCompanies();
  renderNews();
  renderPipeline();
  renderAnalysis();
}

async function loadData() {
  try {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
    renderAll();
  } catch (error) {
    console.error("dashboard data load failed", error);
    document.body.innerHTML = `
      <main style="max-width:760px;margin:80px auto;padding:24px;font-family:sans-serif">
        <h1>Dashboard data could not be loaded</h1>
        <p>${escapeHtml(error.message)}</p>
        <p><code>dashboard/data/latest.json</code> を確認してください。</p>
      </main>
    `;
  }
}

bindNavigation();
loadData();
