const DATA_URL = "./data/latest.json";

let state = {
  data: null,
  sort: "signal",
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

function sparkline(points, positive = true) {
  const values = (points || []).map((p) => Number(p.close)).filter(Number.isFinite);
  if (values.length < 2) {
    return '<div class="empty-state"><span>株価系列なし</span></div>';
  }
  const width = 420;
  const height = 100;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const coords = values.map((value, i) => {
    const x = pad + ((width - pad * 2) * i) / (values.length - 1);
    const y = pad + (height - pad * 2) * (1 - (value - min) / span);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const stroke = positive ? "#2c7c68" : "#b45a5a";
  return `
    <svg class="sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="3か月株価">
      <defs>
        <linearGradient id="g-${Math.random().toString(36).slice(2)}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${stroke}" stop-opacity=".16"/>
          <stop offset="100%" stop-color="${stroke}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polyline points="${coords.join(" ")}" fill="none" stroke="${stroke}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
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
  if (type === "change") return Number(company.change_3m || -9999);
  if (type === "mentions") return Number(company.article_count || 0);
  const signal = String(company.signal_7d || "").toLowerCase();
  const base = signal === "positive" ? 3 : signal === "mixed" ? 2 : signal === "neutral" ? 1 : signal === "negative" ? 0 : .5;
  return base * 100 + Number(company.confidence || 0);
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
      <div class="spark-wrap">${sparkline(company.prices, positive)}</div>
      <p class="company-reason">${escapeHtml(company.reason || "材料の要約はまだありません。")}</p>
      <div class="signal-grid">
        <div class="signal-cell">
          <span>7日</span>
          <b class="${signalClass(company.signal_7d)}">${escapeHtml(signalLabel(company.signal_7d))}</b>
        </div>
        <div class="signal-cell">
          <span>1か月</span>
          <b class="${signalClass(company.signal_1m)}">${escapeHtml(signalLabel(company.signal_1m))}</b>
        </div>
        <div class="signal-cell">
          <span>確度</span>
          <b>${escapeHtml(company.confidence == null ? "—" : company.confidence + "/100")}</b>
        </div>
      </div>
      <div class="card-foot">
        <span>関連記事 ${Number(company.article_count || 0)}件 · Gate ${escapeHtml(company.gate || "UNKNOWN")}</span>
        <button type="button">分析を見る →</button>
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
      <td class="${signalClass(c.signal_7d)}">${escapeHtml(signalLabel(c.signal_7d))}</td>
      <td class="${signalClass(c.signal_1m)}">${escapeHtml(signalLabel(c.signal_1m))}</td>
      <td class="${Number(c.change_3m || 0) >= 0 ? "pos" : "neg"}">${escapeHtml(fmtPct(c.change_3m))}</td>
      <td>${escapeHtml(c.confidence == null ? "—" : c.confidence + "/100")}</td>
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
    const audit = company.audit || [];
    return `
      <article class="audit-card">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
          <h3>${escapeHtml(company.name)} <span class="ticker">${escapeHtml(company.ticker)}</span></h3>
          <span class="gate-badge ${gateClass(company.gate)}">${escapeHtml(company.gate || "UNKNOWN")}</span>
        </div>
        <div class="audit-meta">Evidence ${Number(company.evidence?.length || 0)} · Confidence ${escapeHtml(company.confidence ?? "—")}/100</div>
        <div class="audit-timeline">
          ${audit.map((item) => `
            <div class="audit-item">
              <b>${escapeHtml(item.role || item.event || "analysis")}</b>
              <p>${escapeHtml(item.summary || item.result || item.detail || "")}</p>
            </div>
          `).join("") || '<div class="audit-item"><p>監査ログはまだありません。</p></div>'}
        </div>
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
      <div class="metric-row">
        <div class="metric"><span>7日シグナル</span><b class="${signalClass(company.signal_7d)}">${escapeHtml(signalLabel(company.signal_7d))}</b></div>
        <div class="metric"><span>1か月</span><b class="${signalClass(company.signal_1m)}">${escapeHtml(signalLabel(company.signal_1m))}</b></div>
        <div class="metric"><span>Final Gate</span><b>${escapeHtml(company.gate || "UNKNOWN")}</b></div>
      </div>
    </section>

    <section class="drawer-section">
      <h3>本日の材料</h3>
      <p>${escapeHtml(company.reason || "—")}</p>
    </section>

    <section class="drawer-section">
      <h3>3か月株価</h3>
      <div class="spark-wrap">${sparkline(company.prices, Number(company.change_3m || 0) >= 0)}</div>
      <div class="metric-row">
        <div class="metric"><span>価格</span><b>${escapeHtml(fmtPrice(company))}</b></div>
        <div class="metric"><span>3か月</span><b class="${Number(company.change_3m || 0) >= 0 ? "pos" : "neg"}">${escapeHtml(fmtPct(company.change_3m))}</b></div>
        <div class="metric"><span>確度</span><b>${escapeHtml(company.confidence ?? "—")}/100</b></div>
      </div>
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
      <h3>AI監査ログ</h3>
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
