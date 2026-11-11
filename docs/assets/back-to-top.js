/* Mobile-only back-to-top control shared by JCSA pages. */
(() => {
  "use strict";
  if (document.getElementById("jcsa-back-to-top")) return;

  const style = document.createElement("style");
  style.textContent = [
    ".jcsa-back-to-top{",
    "position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom, 0px));",
    "z-index:1000;display:flex;flex-direction:column;align-items:center;justify-content:center;",
    "gap:0;width:54px;height:54px;padding:4px;border:1px solid rgba(255,255,255,.3);",
    "border-radius:50%;background:#0b3856;color:#fff;",
    "box-shadow:0 5px 18px rgba(3,28,48,.3);font-family:inherit;font-weight:700;",
    "cursor:pointer;opacity:0;visibility:hidden;pointer-events:none;",
    "transform:translateY(8px);transition:opacity .2s ease,transform .2s ease,visibility .2s;",
    "-webkit-tap-highlight-color:transparent;",
    "}",
    ".jcsa-back-to-top.is-visible{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0)}",
    ".jcsa-back-to-top .jcsa-top-arrow{font-size:22px;line-height:1.05}",
    ".jcsa-back-to-top .jcsa-top-label{font-size:10px;line-height:1.3}",
    ".jcsa-back-to-top:focus-visible{outline:3px solid #59c7ff;outline-offset:3px}",
    "@media(min-width:768px){.jcsa-back-to-top{display:none!important}}",
    "@media(prefers-reduced-motion:reduce){.jcsa-back-to-top{transition:none}}",
    "@media print{.jcsa-back-to-top{display:none!important}}"
  ].join("\n");
  document.head.appendChild(style);

  const button = document.createElement("button");
  button.id = "jcsa-back-to-top";
  button.className = "jcsa-back-to-top";
  button.type = "button";
  button.setAttribute("aria-label", "ページの先頭へ戻る");
  button.title = "ページの先頭へ戻る";
  button.innerHTML = '<span class="jcsa-top-arrow" aria-hidden="true">↑</span><span class="jcsa-top-label" aria-hidden="true">上へ</span>';
  document.body.appendChild(button);

  const mobile = window.matchMedia("(max-width: 767px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function updateVisibility() {
    button.classList.toggle("is-visible", mobile.matches && window.scrollY > 280);
  }
  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
  });
  window.addEventListener("scroll", updateVisibility, { passive: true });
  window.addEventListener("resize", updateVisibility);
  window.addEventListener("pageshow", updateVisibility);
  updateVisibility();
})();
