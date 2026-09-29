/* ==========================================================================
   Matched-Budget Audit — page behaviour
   Reads every number from window.PAGE_DATA (assets/js/data.js) and renders:
   [data-bind] text slots, [data-render] tables, [data-chart] SVG charts.
   Also: theme toggle, section-aware navigation, BibTeX copy.
   ========================================================================== */
(function () {
  "use strict";

  var D = window.PAGE_DATA;
  var MINUS = "−";
  var root = document.documentElement;

  /* ---------- helpers ---------- */
  function fmt(v, d) {
    if (typeof v === "string") return v;
    if (typeof v !== "number" || !isFinite(v)) return "";
    var s = Math.abs(v).toFixed(d == null ? 2 : d);
    return (v < 0 ? MINUS : "") + s;
  }
  /* a value is a number, a string, or { m: mean, sd: std } */
  function mean(v) { return v && typeof v === "object" ? v.m : v; }
  function sdOf(v) { return v && typeof v === "object" && typeof v.sd === "number" ? v.sd : null; }
  function fmtV(v, d, unit) {
    var s = fmt(mean(v), d), sd = sdOf(v);
    if (sd != null) s += '<span class="pm"> ± ' + fmt(sd, d) + "</span>";
    return s + (unit || "");
  }
  function get(path) {
    return path.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, D);
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function dagger(name, flag) { return esc(name) + (flag ? '<span class="dag">†</span>' : ""); }
  /* "a -> b" cell: reference in grey, Ours in accent (or plain for context columns) */
  function pair(a, b, d, plain) {
    var h = '<span class="pr"><span class="a">' + fmt(mean(a), d) + '</span><span class="ar" aria-hidden="true">→</span>' +
      '<span class="sr-only"> to </span><span class="b' + (plain ? " plain" : "") + '">' + fmt(mean(b), d) + "</span></span>";
    if (sdOf(a) != null || sdOf(b) != null) {
      h += '<span class="pr-sd"><span class="sr-only">standard deviations: </span>±' + fmt(sdOf(a) || 0, d) + '<span class="pr-sep" aria-hidden="true">·</span>±' + fmt(sdOf(b) || 0, d) + "</span>";
    }
    return h;
  }
  function th(label, cls, attrs) {
    return "<th" + (cls ? ' class="' + cls + '"' : "") + (attrs ? " " + attrs : "") + ">" + label + "</th>";
  }

  /* ---------- text bindings ---------- */
  function bindText() {
    var nodes = document.querySelectorAll("[data-bind]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var v = get(el.getAttribute("data-bind"));
      if (v === undefined) continue;
      var d = el.getAttribute("data-fmt");
      el.textContent = d != null ? fmt(mean(v), +d) : String(mean(v));
    }
    var links = document.querySelectorAll("[data-href]");
    for (var j = 0; j < links.length; j++) {
      var u = get(links[j].getAttribute("data-href"));
      if (typeof u === "string") links[j].setAttribute("href", u);
    }
  }

  /* ---------- tables ---------- */
  var renderers = {};

  /* Lay summary: paragraphs separated by a blank line, each opening with an emoji */
  renderers.laySummary = function () {
    return String(D.laySummary || "").split(/\n\s*\n/).map(function (para) {
      var m = para.trim().match(/^(\S+)\s+([\s\S]*)$/);
      if (!m) return "<p><span></span><span>" + esc(para) + "</span></p>";
      return '<p><span class="lay-emoji" aria-hidden="true">' + esc(m[1]) + "</span><span>" + esc(m[2]) + "</span></p>";
    }).join("");
  };

  /* Table 1: check matrix, grouped; marks only */
  renderers.relatedTable = function () {
    var cols = D.relatedColumns;
    var h = '<table class="t-matrix"><caption class="sr-only">Closest prior audits and caption metrics: which properties each covers</caption><thead><tr>' +
      th("Work", "stick", 'scope="col"') + th("Target", "", 'scope="col"');
    cols.forEach(function (c) { h += th(esc(c), "c", 'scope="col"'); });
    h += "</tr></thead>";
    var last = null;
    D.relatedWork.forEach(function (r) {
      if (r.group !== last) {
        if (last !== null) h += "</tbody>";
        // a one-row group named after its only row (Ours) gets the rule but no label row
        var solo = D.relatedWork.filter(function (x) { return x.group === r.group; }).length === 1 && r.group === r.work;
        h += solo ? '<tbody class="solo">' : '<tbody><tr class="group-row"><th colspan="' + (cols.length + 2) + '" scope="colgroup">' + esc(r.group) + "</th></tr>";
        last = r.group;
      }
      h += "<tr" + (r.ours ? ' class="ours"' : "") + '><th scope="row">' + esc(r.work) + '<span class="tgt-sub" aria-hidden="true">' + esc(r.target) + '</span></th><td class="tgt">' + esc(r.target) + "</td>";
      r.marks.forEach(function (m, i) {
        var yes = m === "✓";
        h += '<td class="c mk' + (yes ? " yes" : "") + '"><span aria-hidden="true">' + (yes ? "✓" : "–") + '</span><span class="sr-only">' + esc(cols[i]) + ": " + (yes ? "yes" : "no") + "</span></td>";
      });
      h += "</tr>";
    });
    return h + "</tbody></table>";
  };
  renderers.relatedLegend = function () {
    return D.relatedLegend.map(function (x) { return "<span><b>" + esc(x[0]) + "</b> " + esc(x[1]) + "</span>"; }).join("");
  };

  /* Table 4: audit axes */
  renderers.axesTable = function () {
    var h = '<table class="t-axes"><caption class="sr-only">Audit axes: property, input, metric and rows</caption><thead><tr>' +
      th("Axis", "stick", 'scope="col"') + th("Property", "", 'scope="col"') + th("Input", "", 'scope="col"') +
      th("Metric", "", 'scope="col"') + th("Rows", "n", 'scope="col"') + "</tr></thead><tbody>";
    D.axes.forEach(function (r) {
      h += '<tr><th scope="row">' + esc(r.axis) + "</th>" +
        '<td data-label="Property">' + esc(r.des) + '</td><td data-label="Input">' + r.input + "</td>" +
        '<td data-label="Metric">' + r.metric + '</td><td class="n" data-label="Rows">' + esc(D.protocol[r.rows]) + "</td></tr>";
    });
    return h + "</tbody></table>";
  };

  /* Table 5 */
  renderers.crossTable = function () {
    var h = '<table><caption class="sr-only">Cross-corpus headline at B = 64 lexical units, reference to Ours</caption><thead>' +
      '<tr class="grp">' + th("", "blank stick", 'scope="col"') + th("", "blank") + th("", "blank") + th("", "blank") +
      th("Qwen Judge", "span", 'colspan="2" scope="colgroup"') + th("Gemma Judge", "span", 'colspan="2" scope="colgroup"') + "</tr>" +
      "<tr>" + th("Dataset", "stick", 'scope="col"') + th("Avg lex", "n", 'scope="col"') + th("CBU/cap ↑", "n", 'scope="col"') +
      th("Pool-wins ↑", "n", 'scope="col"') + th("Sup. CBU/cap ↑", "n", 'scope="col"') + th("Risk ↓", "n", 'scope="col"') +
      th("Sup. CBU/cap ↑", "n", 'scope="col"') + th("Risk ↓", "n", 'scope="col"') + "</tr></thead><tbody>";
    D.crossCorpus.forEach(function (r) {
      h += "<tr>" +
        '<th scope="row">' + esc(r.pair) + '<span class="ref-name">vs. ' + esc(r.ref) + "</span></th>" +
        '<td class="n">' + pair(r.lex[0], r.lex[1], 1, true) + "</td>" +
        '<td class="n">' + pair(r.cbu[0], r.cbu[1], 2) + "</td>" +
        '<td class="n"><span class="win">' + r.poolWins + '</span><span class="of">/7</span></td>' +
        '<td class="n">' + pair(r.qwen.sup[0], r.qwen.sup[1], 2) + "</td>" +
        '<td class="n">' + pair(r.qwen.risk[0], r.qwen.risk[1], 3) + "</td>" +
        '<td class="n">' + pair(r.gemma.sup[0], r.gemma.sup[1], 2) + "</td>" +
        '<td class="n">' + pair(r.gemma.risk[0], r.gemma.risk[1], 3) + "</td>" +
        "</tr>";
    });
    return h + "</tbody></table>";
  };

  function judgeHead(first) {
    return '<thead><tr class="grp">' + th("", "blank stick", 'scope="col"') + (first || "") +
      th("Surface stats", "span", 'colspan="2" scope="colgroup"') +
      th("Qwen Judge", "span", 'colspan="2" scope="colgroup"') +
      th("Gemma Judge", "span", 'colspan="2" scope="colgroup"') + "</tr>";
  }
  function judgeCols(firstLabel, secondLabel) {
    return "<tr>" + th(firstLabel, "stick", 'scope="col"') + (secondLabel ? th(secondLabel, "", 'scope="col"') : "") +
      th("CBU/cap ↑", "n", 'scope="col"') + th("CBU/100 lex", "n", 'scope="col"') +
      th("Sup. CBU/cap ↑", "n", 'scope="col"') + th("Risk ↓", "n", 'scope="col"') +
      th("Sup. CBU/cap ↑", "n", 'scope="col"') + th("Risk ↓", "n", 'scope="col"') + "</tr></thead>";
  }
  function judgeCells(s, best) {
    function c(v, d, key) { return '<td class="n' + (best && best[key] ? " best" : "") + '">' + fmtV(v, d) + "</td>"; }
    return c(s.cbu, 2, "cbu") + c(s.per100, 2) + c(s.qwen.sup, 2, "sup") + c(s.qwen.risk, 3, "risk") + c(s.gemma.sup, 2, "sup") + c(s.gemma.risk, 3, "risk");
  }

  /* Table 8 (bold marks the column optimum, from each surface's `best` field) */
  renderers.cc12mTable = function () {
    var h = '<table><caption class="sr-only">CC12M frontier at B = 64, four surfaces under both Judges</caption>' +
      judgeHead() + judgeCols("Surface") + "<tbody>";
    D.cc12m.surfaces.forEach(function (s) {
      h += "<tr" + (s.ours ? ' class="ours"' : "") + '><th scope="row">' + dagger(s.name, s.dagger) + "</th>" +
        judgeCells(s, s.best || null) + "</tr>";
    });
    return h + "</tbody></table>";
  };

  /* Table 6 (bold in the paper: Ours on CBU/cap and both supported columns) */
  renderers.controlTable = function () {
    var h = '<table><caption class="sr-only">Captioner control: one captioner, two policies</caption>' +
      judgeHead(th("", "blank")) + judgeCols("Source", "Surface") + "<tbody>";
    D.captionerControl.forEach(function (g, gi) {
      g.rows.forEach(function (s, i) {
        h += "<tr class=\"" + (s.ours ? "ours" : "") + (gi > 0 && i === 0 ? " divider" : "") + "\">" +
          (i === 0 ? '<th scope="row" rowspan="' + g.rows.length + '" class="src">' + esc(g.source) + "</th>" : "") +
          '<td class="surf">' + esc(s.surface) + "</td>" +
          judgeCells(s, s.ours ? { cbu: 1, sup: 1 } : null) + "</tr>";
      });
    });
    return h + "</tbody></table>";
  };

  /* Table 7 */
  renderers.surfaceTable = function () {
    var h = '<table><caption class="sr-only">Surface concentration on the CC12M naive surface</caption><thead><tr>' +
      th("Metric", "stick", 'scope="col"') + th("Ours", "n", 'scope="col"') + th("Naive", "n", 'scope="col"') +
      th("Long-form refs.", "n", 'scope="col"') + "</tr></thead><tbody>";
    D.surfaceControl.forEach(function (r) {
      h += '<tr><th scope="row">' + r.metric + '</th><td class="n">' + esc(r.ours) + '</td><td class="n">' + esc(r.naive) +
        '</td><td class="n">' + esc(r.refs) + "</td></tr>";
    });
    return h + "</tbody></table>";
  };

  /* Figure 2 (right) values */
  renderers.sweepTable = function () {
    var S = D.sweep;
    var h = '<table><caption class="sr-only">Budget sweep on CC12M: claimed CBU per caption and CBU per 100 lex</caption><thead><tr class="grp">' +
      th("", "blank stick", 'scope="col"');
    S.surfaces.forEach(function (s) { h += th(dagger(s.name, s.dagger), "span", 'colspan="2" scope="colgroup"'); });
    h += "</tr><tr>" + th("Budget", "stick", 'scope="col"');
    S.surfaces.forEach(function () { h += th("CBU/cap", "n", 'scope="col"') + th("per 100 lex", "n", 'scope="col"'); });
    h += "</tr></thead><tbody>";
    S.budgets.forEach(function (b, i) {
      h += '<tr><th scope="row"><span class="m"><i>B</i> = ' + b + "</span></th>";
      S.surfaces.forEach(function (s) {
        h += '<td class="n' + (s.ours ? " o" : "") + '">' + fmt(s.cbu[i], 2) + '</td><td class="n' + (s.ours ? " o" : "") + '">' + fmt(s.per100[i], 2) + "</td>";
      });
      h += "</tr>";
    });
    return h + "</tbody></table>";
  };

  /* Table 9a */
  renderers.agreementTable = function () {
    var h = '<table><caption class="sr-only">Judge-human nominal exact agreement</caption><thead><tr>' +
      th("Judge", "stick", 'scope="col"') + th("<i>n</i>", "n", 'scope="col"') + th("Overall", "n", 'scope="col"') +
      th("Ours", "n", 'scope="col"') + th("Pooled refs.", "n", 'scope="col"') + "</tr></thead><tbody>";
    D.human.agreement.forEach(function (r) {
      h += '<tr><th scope="row">' + esc(r.judge) + '</th><td class="n">' + r.n + '</td><td class="n">' + fmtV(r.overall, 1, "%") +
        '</td><td class="n">' + fmtV(r.ours, 1, "%") + '</td><td class="n">' + fmtV(r.refs, 1, "%") + "</td></tr>";
    });
    return h + "</tbody></table>";
  };

  /* Table 9b with an inline distribution bar per surface */
  renderers.directTable = function () {
    var h = '<table><caption class="sr-only">Direct human image-support judgments by CC12M surface</caption><thead><tr>' +
      th("Surface", "stick", 'scope="col"') + th("<i>n</i>", "n", 'scope="col"') + th("Yes", "n", 'scope="col"') +
      th("Uncertain", "n", 'scope="col"') + th("Explicit no", "n", 'scope="col"') + th("Other", "n", 'scope="col"') +
      th("Distribution", "", 'scope="col"') + "</tr></thead><tbody>";
    D.human.direct.forEach(function (r) {
      function cell(x, strong) {
        return '<td class="n' + (strong ? " best" : "") + '">' + x[0] + ' <span class="sm">(' + esc(x[1]) + ")</span></td>";
      }
      function seg(cls, x) {
        var w = (x[0] / r.n) * 100;
        return w > 0 ? '<i class="' + cls + '" style="width:' + w.toFixed(2) + '%"></i>' : "";
      }
      h += "<tr" + (r.ours ? ' class="ours"' : "") + '><th scope="row">' + dagger(r.surface, r.dagger) + "</th>" +
        '<td class="n">' + r.n + "</td>" + cell(r.yes, r.ours) + cell(r.uncertain) + cell(r.no, r.ours) + cell(r.other) +
        '<td class="distc"><span class="dist" aria-hidden="true">' + seg("yes", r.yes) + seg("unc", r.uncertain) + seg("no", r.no) + seg("oth", r.other) + "</span></td></tr>";
    });
    return h + "</tbody></table>";
  };

  /* Table 2 */
  renderers.releaseTable = function () {
    var R = D.release;
    var h = '<table class="t-release"><caption class="sr-only">Released caption surfaces by source family</caption><thead><tr>' +
      th("Source family", "stick", 'scope="col"') + th("Original supervision", "", 'scope="col"') + th("Ours scale", "n", 'scope="col"') +
      th("Paired reference surface(s)", "", 'scope="col"') + "</tr></thead><tbody>";
    R.groups.forEach(function (g) {
      h += '<tr class="group-row"><th colspan="4" scope="colgroup">' + esc(g.label) + "</th></tr>";
      g.rows.forEach(function (r) {
        var url = "https://huggingface.co/datasets/BootsofLagrangian/" + r.repo;
        var refs = r.refs.length ? r.refs.map(function (x) {
          return esc(x.replace("†", "")) + (x.indexOf("†") >= 0 ? '<span class="dag">†</span>' : "");
        }).join(", ") : "—";
        h += '<tr><th scope="row" class="fam"><a href="' + url + '">' + esc(r.family) + '</a><span class="repo">' + esc(r.repo) + "</span></th>" +
          '<td data-label="Original supervision">' + esc(r.original) + '</td><td class="n scale" data-label="Ours scale">' + esc(r.scale) + "</td>" +
          '<td class="refs' + (r.refs.length ? "" : " none") + '" data-label="Paired reference surface(s)">' + refs + (r.refs.length ? "" : ' <span class="sr-only">release only, no paired audit</span>') + "</td></tr>";
      });
    });
    h += '<tr class="total"><th scope="row">Total</th><td>sum over families</td><td class="n scale" data-label="Ours scale">' + esc(R.total) + '</td><td class="refs none"></td></tr>';
    return h + "</tbody></table>";
  };

  function renderTables() {
    var nodes = document.querySelectorAll("[data-render]");
    for (var i = 0; i < nodes.length; i++) {
      var fn = renderers[nodes[i].getAttribute("data-render")];
      if (fn) nodes[i].innerHTML = fn();
    }
  }

  /* ---------- dumbbell chart (Table 5, reference -> Ours) ---------- */
  var SVGNS = "http://www.w3.org/2000/svg";
  function el(name, attrs, text) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  var CHARTS = {
    sup:  { title: "Supported CBU per caption", dir: "higher is better →", domain: [2.5, 17], ticks: [4, 8, 12, 16], dec: 2 },
    risk: { title: "Unsupported risk", dir: "← lower is better", domain: [-0.035, 0.28], ticks: [0, 0.05, 0.1, 0.15, 0.2, 0.25], dec: 3, tickDec: 2 }
  };

  function drawDumbbell(host) {
    var cfg = CHARTS[host.getAttribute("data-metric")];
    var W = Math.max(280, Math.round(host.clientWidth));
    var L = 62, R = 10, T = 54, headH = 26, rowH = 22, gap = 12, axisH = 26;
    var rows = [];
    D.crossCorpus.forEach(function (p) {
      rows.push({ kind: "head", pair: p.pair, ref: p.ref });
      rows.push({ kind: "row", judge: "Qwen", v: p.qwen[host.getAttribute("data-metric")] });
      rows.push({ kind: "row", judge: "Gemma", v: p.gemma[host.getAttribute("data-metric")] });
    });
    var y = T, pos = [];
    rows.forEach(function (r, i) {
      if (r.kind === "head") { if (i > 0) y += gap; pos.push(y + 16); y += headH; }
      else { pos.push(y + rowH / 2); y += rowH; }
    });
    var H = y + axisH;
    var x0 = L, x1 = W - R;
    function sx(v) { return x0 + (v - cfg.domain[0]) / (cfg.domain[1] - cfg.domain[0]) * (x1 - x0); }

    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, "aria-hidden": "true", focusable: "false" });
    svg.appendChild(el("text", { x: 0, y: 20, "class": "c-title" }, cfg.title));
    var dir = el("text", { x: x1, y: 20, "class": "c-dir", "text-anchor": "end" }, cfg.dir);
    svg.appendChild(dir);

    // grid + ticks (bottom axis)
    cfg.ticks.forEach(function (t) {
      var x = sx(t);
      svg.appendChild(el("line", { x1: x, x2: x, y1: T - 8, y2: H - axisH + 4, "class": t === 0 ? "c-base" : "c-grid" }));
      svg.appendChild(el("text", { x: x, y: H - 6, "class": "c-tick", "text-anchor": "middle" }, fmt(t, cfg.tickDec != null ? cfg.tickDec : 0)));
    });
    svg.appendChild(el("line", { x1: x0, x2: x1, y1: H - axisH + 4, y2: H - axisH + 4, "class": "c-base" }));

    rows.forEach(function (r, i) {
      var cy = pos[i];
      if (r.kind === "head") {
        var t = el("text", { x: 0, y: cy, "class": "c-group" }, r.pair);
        svg.appendChild(t);
        var ref = el("tspan", { "class": "c-groupref", dx: "8" }, "vs. " + r.ref);
        t.appendChild(ref);
        return;
      }
      svg.appendChild(el("text", { x: L - 12, y: cy + 3.5, "class": "c-judge", "text-anchor": "end" }, r.judge));
      var a = mean(r.v[0]), b = mean(r.v[1]);   // a = reference, b = Ours
      var xa = sx(a), xb = sx(b);
      svg.appendChild(el("line", { x1: xa, x2: xb, y1: cy, y2: cy, "class": "c-link" }));
      [[a, sdOf(r.v[0])], [b, sdOf(r.v[1])]].forEach(function (p) {
        if (p[1] == null) return;
        var l = sx(p[0] - p[1]), rr = sx(p[0] + p[1]);
        if (rr - l < 12) return;                 // hidden under the marker at this scale
        svg.appendChild(el("path", { d: "M" + l + " " + (cy - 4) + "v8M" + l + " " + cy + "H" + rr + "M" + rr + " " + (cy - 4) + "v8", "class": "c-sd" }));
      });
      svg.appendChild(el("circle", { cx: xa, cy: cy, r: 4.6, "class": "c-ref" }));
      svg.appendChild(el("circle", { cx: xb, cy: cy, r: 5.2, "class": "c-ours" }));
      // labels on the outer side of each end
      var lo = Math.min(xa, xb), hi = Math.max(xa, xb);
      var aIsLo = xa <= xb;
      svg.appendChild(el("text", { x: lo - 9, y: cy + 3.6, "text-anchor": "end", "class": "c-val" + (aIsLo ? "" : " o") }, fmt(aIsLo ? a : b, cfg.dec)));
      svg.appendChild(el("text", { x: hi + 9, y: cy + 3.6, "text-anchor": "start", "class": "c-val" + (aIsLo ? " o" : "") }, fmt(aIsLo ? b : a, cfg.dec)));
    });
    host.innerHTML = "";
    host.appendChild(svg);
    host._w = Math.round(host.clientWidth);
  }

  function renderCharts() {
    var hosts = document.querySelectorAll('[data-chart="dumbbell"]');
    for (var i = 0; i < hosts.length; i++) drawDumbbell(hosts[i]);
  }

  /* ---------- theme ---------- */
  function effectiveTheme() {
    var t = root.getAttribute("data-theme");
    if (t === "light" || t === "dark") return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function syncToggle(btn) {
    var dark = effectiveTheme() === "dark";
    btn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
    btn.title = dark ? "Light theme" : "Dark theme";
  }
  function initTheme() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    syncToggle(btn);
    btn.addEventListener("click", function () {
      var next = effectiveTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) { /* storage unavailable */ }
      syncToggle(btn);
    });
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function () { syncToggle(btn); };
      if (mq.addEventListener) mq.addEventListener("change", onChange); else if (mq.addListener) mq.addListener(onChange);
    }
  }

  /* ---------- navigation ---------- */
  function initNav() {
    var bar = document.getElementById("topbar");
    var onScroll = function () { if (bar) bar.classList.toggle("is-scrolled", window.scrollY > 4); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var links = Array.prototype.slice.call(document.querySelectorAll(".navlinks a"));
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var sections = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean);
    if (!sections.length) return;
    var current = null, ticking = false;
    function update() {
      ticking = false;
      var line = window.innerHeight * 0.4;
      var id = null;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].getBoundingClientRect().top <= line) id = sections[i].id;
      }
      // at the very bottom of the page, the last section is current
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) id = sections[sections.length - 1].id;
      if (id === current) return;
      current = id;
      links.forEach(function (a) { a.removeAttribute("aria-current"); });
      if (id && map[id]) {
        map[id].setAttribute("aria-current", "true");
        var list = map[id].parentNode.parentNode;
        var li = map[id].parentNode;
        if (list.scrollWidth > list.clientWidth) {
          list.scrollLeft = li.offsetLeft - (list.clientWidth - li.offsetWidth) / 2;
        }
      }
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- BibTeX copy ---------- */
  function initCopy() {
    var btn = document.getElementById("copy-bib");
    var pre = document.getElementById("bib-text");
    var status = document.getElementById("copy-status");
    if (!btn || !pre) return;
    var label = btn.querySelector(".copy-label");
    var timer = null;
    function done(ok) {
      btn.classList.toggle("is-done", ok);
      label.textContent = ok ? "Copied" : "Select and copy";
      if (status) status.textContent = ok ? "BibTeX copied to clipboard." : "Copy failed; the BibTeX text is selected.";
      clearTimeout(timer);
      timer = setTimeout(function () { btn.classList.remove("is-done"); label.textContent = "Copy"; if (status) status.textContent = ""; }, 2200);
    }
    function fallback(text) {
      var sel = window.getSelection();
      var range = document.createRange();
      range.selectNodeContents(pre);
      sel.removeAllRanges();
      sel.addRange(range);
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      if (ok) sel.removeAllRanges();
      done(ok);
    }
    btn.addEventListener("click", function () {
      var text = pre.textContent;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallback(text); });
      } else {
        fallback(text);
      }
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    if (D) {
      bindText();
      renderTables();
      renderCharts();
      var raf = 0;
      var onResize = function () {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          var hosts = document.querySelectorAll("[data-chart]");
          for (var k = 0; k < hosts.length; k++) {
            if (Math.round(hosts[k].clientWidth) !== hosts[k]._w) drawDumbbell(hosts[k]);
          }
        });
      };
      if ("ResizeObserver" in window) {
        var ro = new ResizeObserver(onResize);
        var hosts = document.querySelectorAll('[data-chart]');
        for (var i = 0; i < hosts.length; i++) ro.observe(hosts[i]);
      } else {
        window.addEventListener("resize", onResize);
      }
    }
    initTheme();
    initNav();
    initCopy();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
