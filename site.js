/* =========================================================
   站点通用 JS（语言切换 / RTL / 产品渲染）
   约定：
   - HTML 里需要翻译的文字使用 data-i18n="xxx"
   - 可翻译 placeholder 使用 data-i18n-placeholder="xxx"
   - 产品页/分类页需要提前引入：assets/js/products.js
   ========================================================= */

(function () {
  const STORAGE_KEY = "hecoth_lang";
  const DEFAULT_LANG = "en";

  function getLang() {
    const urlLang = new URLSearchParams(location.search).get("lang");
    const saved = localStorage.getItem(STORAGE_KEY);
    const lang = urlLang || saved || DEFAULT_LANG;
    return (window.SUPPORTED_LANGS || []).includes(lang) ? lang : DEFAULT_LANG;
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    const url = new URL(location.href);
    url.searchParams.set("lang", lang);
    history.replaceState({}, "", url.toString());
  }

  function isRTL(lang) {
    return lang === "ar";
  }

  function t(lang, keyPath, fallback = "") {
    const dict = window.I18N?.[lang];
    if (!dict) return fallback;
    const parts = keyPath.split(".");
    let cur = dict;
    for (const p of parts) {
      cur = cur?.[p];
      if (cur === undefined || cur === null) return fallback;
    }
    return typeof cur === "string" ? cur : fallback;
  }

  function applyI18n(lang) {
    const year = String(new Date().getFullYear());

    // RTL / LTR
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL(lang) ? "rtl" : "ltr";
    document.body.classList.toggle("rtl", isRTL(lang));

    // text
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const v = t(lang, key, el.textContent.trim()).replaceAll("{year}", year);
      el.textContent = v;
    });

    // html
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      const v = t(lang, key, el.innerHTML).replaceAll("{year}", year);
      el.innerHTML = v;
    });

    // placeholder
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      const v = t(lang, key, el.getAttribute("placeholder") || "");
      el.setAttribute("placeholder", v);
    });

    // meta keywords (SEO)
    const kw = window.I18N?.[lang]?.seo?.keywords;
    const metaKw = document.querySelector('meta[name="keywords"]');
    if (kw && metaKw) metaKw.setAttribute("content", kw);

    // title (optional)
    const titleKey = document.body.getAttribute("data-title-i18n");
    if (titleKey) document.title = t(lang, titleKey, document.title);

    // optional manual year placeholders
    document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = year));
  }

  function buildLangSelect(lang) {
    const sel = document.getElementById("langSelect");
    if (!sel) return;
    sel.innerHTML = "";
    (window.SUPPORTED_LANGS || []).forEach((code) => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = window.I18N?.[code]?.langName || code;
      sel.appendChild(opt);
    });
    sel.value = lang;
    sel.addEventListener("change", (e) => {
      const next = e.target.value;
      setLang(next);
      applyI18n(next);
      // 重新渲染产品模块（如存在）
      renderAll(next);
    });
  }

  function moneySafe(text) {
    return String(text || "").replace(/[<>]/g, "");
  }

  // ============== 产品渲染 ==============
  function getProductById(id) {
    return (window.PRODUCTS || []).find((p) => p.id === id);
  }

  function renderProductCards(lang) {
    const root = document.getElementById("productCards");
    if (!root) return;

    const filter = new URLSearchParams(location.search).get("cat") || "all";
    const products = (window.PRODUCTS || []).filter((p) => (filter === "all" ? true : p.category === filter));

    root.innerHTML = products
      .map((p) => {
        const img = p.images?.[0] || "";
        const name = p.name?.[lang] || p.name?.en || p.id;
        const short = p.short?.[lang] || p.short?.en || "";
        const catName = window.CATEGORY_NAMES?.[lang]?.[p.category] || p.category;
        return `
          <a href="product.html?id=${encodeURIComponent(p.id)}" class="group block rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg transition">
            <div class="aspect-[16/10] bg-slate-100 overflow-hidden">
              <img src="${moneySafe(img)}" alt="${moneySafe(name)}" class="w-full h-full object-cover group-hover:scale-[1.02] transition"/>
            </div>
            <div class="p-5">
              <div class="text-xs text-slate-500">${moneySafe(catName)}</div>
              <div class="mt-1 text-lg font-semibold text-slate-900">${moneySafe(name)}</div>
              <div class="mt-2 text-sm text-slate-600 leading-relaxed">${moneySafe(short)}</div>
              <div class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <span>${t(lang, "common.ctaQuote", "Get a Quote")}</span>
                <span aria-hidden="true">→</span>
              </div>
            </div>
          </a>
        `;
      })
      .join("");

    // category chips
    const chips = document.getElementById("categoryChips");
    if (chips) {
      const allLabel = t(lang, "categories.filterAll", "All");
      const chip = (key, label) => {
        const active = (filter === "all" && key === "all") || filter === key;
        return `<a href="categories.html?cat=${encodeURIComponent(key)}" class="px-3 py-1.5 rounded-full border ${active ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300"} text-sm transition">${moneySafe(label)}</a>`;
      };
      const list = [chip("all", allLabel)]
        .concat(
          (window.PRODUCT_CATEGORIES || []).map((c) => chip(c.key, (window.CATEGORY_NAMES?.[lang]?.[c.key] || c.key)))
        )
        .join("");
      chips.innerHTML = list;
    }
  }

  function renderProductDetail(lang) {
    const root = document.getElementById("productDetail");
    if (!root) return;

    const id = new URLSearchParams(location.search).get("id") || "";
    const p = getProductById(id) || (window.PRODUCTS || [])[0];
    if (!p) return;

    const name = p.name?.[lang] || p.name?.en || p.id;
    const short = p.short?.[lang] || p.short?.en || "";
    const points = p.points?.[lang] || p.points?.en || [];

    const specsOrder = [
      "modelRange",
      "dimensions",
      "enginePower",
      "pto",
      "frontTread",
      "rearTread",
      "traction",
      "minWeight",
      "transmission",
      "steering",
      "warranty",
      "notes",
    ];

    // 参数表渲染策略：
    // 1) 若产品提供 specPairs（自定义字段，适合农机具/工程机械），则按 specPairs 渲染
    // 2) 否则使用固定结构 specsOrder + specLabels（适合拖拉机）
    const specRows = Array.isArray(p.specPairs) && p.specPairs.length
      ? p.specPairs
          .map((row) => {
            const label = typeof row.label === "string" ? row.label : (row.label?.[lang] || row.label?.en || "");
            const val = row.value ?? "";
            return `<tr><th>${moneySafe(label)}</th><td>${moneySafe(val)}</td></tr>`;
          })
          .join("")
      : specsOrder
          .map((k) => {
            const label = t(lang, "specLabels." + k, k);
            const val = p.specs?.[k] ?? "";
            return `<tr><th>${moneySafe(label)}</th><td>${moneySafe(val)}</td></tr>`;
          })
          .join("");

    const gallery = (p.images || [])
      .map(
        (src) => `
        <div class="aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
          <img src="${moneySafe(src)}" alt="${moneySafe(name)}" class="w-full h-full object-cover"/>
        </div>`
      )
      .join("");

    const list = points.map((x) => `<li class="flex gap-3"><span class="mt-2 h-2 w-2 rounded-full bg-emerald-600 shrink-0"></span><span>${moneySafe(x)}</span></li>`).join("");

    root.innerHTML = `
      <div class="grid lg:grid-cols-2 gap-8">
        <div>
          <div class="grid sm:grid-cols-2 gap-4">${gallery}</div>
        </div>
        <div>
          <a href="categories.html" class="text-sm font-semibold text-slate-600 hover:text-emerald-700">${t(lang, "product.back", "Back")}</a>
          <h1 class="mt-3 text-3xl font-bold text-slate-900">${moneySafe(name)}</h1>
          <p class="mt-3 text-slate-600 leading-relaxed">${moneySafe(short)}</p>

          <div class="mt-6 flex flex-wrap gap-2">
            <span class="badge"><span class="text-emerald-700 font-semibold">${t(lang, "common.badgeOEM", "OEM/ODM")}</span></span>
            <span class="badge"><span class="text-emerald-700 font-semibold">${t(lang, "common.badgeQC", "QC")}</span></span>
            <span class="badge"><span class="text-emerald-700 font-semibold">${t(lang, "common.badgeFast", "Fast")}</span></span>
          </div>

          <div class="mt-8">
            <h2 class="text-lg font-semibold text-slate-900" data-i18n="product.points">${t(lang, "product.points", "Key Selling Points")}</h2>
            <ul class="mt-4 space-y-3 text-slate-700 leading-relaxed">${list}</ul>
          </div>

          <div class="mt-8 flex gap-3">
            <a href="contact.html" class="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition">${t(lang, "product.inquiry", "Send Inquiry")}</a>
            <a href="contact.html#form" class="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold hover:border-emerald-300 transition">${t(lang, "common.ctaContact", "Contact")}</a>
          </div>
        </div>
      </div>

      <div class="mt-12">
        <h2 class="text-xl font-bold text-slate-900" data-i18n="product.specs">${t(lang, "product.specs", "Technical Specifications")}</h2>
        <p class="mt-2 text-sm text-slate-500">${t(lang, "common.editHint", "Editable")}: specs table structure is fixed. You only need to change the cell values in <code>assets/js/products.js</code>.</p>
        <div class="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table class="spec-table">${specRows}</table>
        </div>
      </div>
    `;
  }

  function renderAll(lang) {
    renderProductCards(lang);
    renderProductDetail(lang);
  }

  // ============== Init ==============
  document.addEventListener("DOMContentLoaded", () => {
    const lang = getLang();
    buildLangSelect(lang);
    applyI18n(lang);
    renderAll(lang);

    // Mobile nav toggle (optional)
    const btn = document.getElementById("mobileMenuBtn");
    const panel = document.getElementById("mobileMenu");
    if (btn && panel) {
      btn.addEventListener("click", () => panel.classList.toggle("hidden"));
      panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => panel.classList.add("hidden")));
    }
  });
})();
