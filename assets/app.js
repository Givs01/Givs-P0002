/* Page behaviour: file picking, rules editor, combine -> "Proceed with validation?" -> results. */
(function () {
  "use strict";

  const STORE_KEY = "slb-validation-rules-v1";
  const $ = (id) => document.getElementById(id);

  const state = {
    reportBuffer: null,
    reportStem: "",
    rules: [],
    regions: [],
    rulesSource: "Built-in rules",
    merged: null,
    result: null,
  };

  // ---------------------------------------------------------------- storage (per-browser convenience only)
  function saveLocal() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ rules: state.rules, regions: state.regions, source: state.rulesSource }));
    } catch (e) { /* storage unavailable - edits just won't be remembered */ }
  }

  function loadLocal() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (saved && Array.isArray(saved.rules) && saved.rules.length) return saved;
    } catch (e) { /* ignore */ }
    return null;
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  function useBuiltIn() {
    state.rules = clone(window.DEFAULT_RULES);
    state.regions = clone(window.DEFAULT_REGIONS);
    state.rulesSource = "Built-in rules";
  }

  // ---------------------------------------------------------------- messages / downloads
  function showMsg(el, text, kind) {
    el.textContent = text;
    el.className = "msg" + (kind ? " " + kind : "");
    el.hidden = !text;
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  }

  // ---------------------------------------------------------------- rules editor
  const isYes = (v) => String(v).trim().toLowerCase() === "yes";

  function renderRules() {
    const body = $("rules-table").querySelector("tbody");
    body.innerHTML = state.rules.map((r, i) => `
      <tr data-i="${i}" class="${isYes(r.check) ? "" : "off"}">
        <td class="code">${esc(r.code)}</td>
        <td class="name">${esc(r.name)}</td>
        <td>${esc(r.unit)}</td>
        <td><input type="checkbox" data-f="check" ${isYes(r.check) ? "checked" : ""} aria-label="Check KPI ${esc(r.code)}"></td>
        <td class="w-num"><input type="number" step="any" data-f="min" value="${r.min == null ? "" : esc(r.min)}"></td>
        <td class="w-num"><input type="number" step="any" data-f="max" value="${r.max == null ? "" : esc(r.max)}"></td>
        <td><input type="text" data-f="allowed" value="${esc(r.allowed)}"></td>
        <td><input type="text" data-f="notAllowed" value="${esc(r.notAllowed)}"></td>
        <td><input type="checkbox" data-f="blankAllowed" ${isYes(r.blankAllowed) ? "checked" : ""} aria-label="Blank allowed for KPI ${esc(r.code)}"></td>
        <td class="w-desc"><input type="text" data-f="description" value="${esc(r.description)}" placeholder="${esc(SLB.describe(SLB.compileRules([r])[r.code] || {allowed: [], notAllowed: []}))}"></td>
      </tr>`).join("");
    $("rules-total").textContent = state.rules.length;
    $("rules-active").textContent = state.rules.filter((r) => isYes(r.check)).length;
    $("rules-source").textContent = state.rulesSource;

    $("regions-table").querySelector("tbody").innerHTML = state.regions
      .map((r) => `<tr><td>${esc(r.district)}</td><td>${esc(r.region)}</td></tr>`).join("");
    $("regions-count").textContent = state.regions.length;
  }

  function onRuleEdit(e) {
    const input = e.target;
    const field = input.dataset.f;
    if (!field) return;
    const tr = input.closest("tr");
    const rule = state.rules[Number(tr.dataset.i)];
    if (input.type === "checkbox") {
      rule[field] = input.checked ? "Yes" : "No";
      if (field === "check") {
        tr.classList.toggle("off", !input.checked);
        $("rules-active").textContent = state.rules.filter((r) => isYes(r.check)).length;
      }
    } else if (input.type === "number") {
      rule[field] = input.value === "" ? null : Number(input.value);
    } else {
      rule[field] = input.value;
    }
    if (state.rulesSource.indexOf("(edited)") < 0) {
      state.rulesSource += " (edited)";
      $("rules-source").textContent = state.rulesSource;
    }
    saveLocal();
  }

  async function onRulesUpload(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const parsed = SLB.parseRulesWorkbook(await file.arrayBuffer());
      state.rules = parsed.rules;
      if (parsed.regions) state.regions = parsed.regions;
      state.rulesSource = file.name;
      saveLocal();
      renderRules();
      showMsg($("rules-msg"), `Loaded ${parsed.rules.length} KPI rules` +
        (parsed.regions ? ` and ${parsed.regions.length} districts` : " (no \"District and Regions\" sheet - kept the current district list)") +
        ` from ${file.name}.`);
    } catch (err) {
      showMsg($("rules-msg"), "Could not read the rules file: " + err.message, "error");
    }
  }

  // ---------------------------------------------------------------- report
  async function setReport(file) {
    if (!file) return;
    state.reportBuffer = await file.arrayBuffer();
    state.reportStem = file.name.replace(/\.[^.]+$/, "");
    state.merged = null;
    state.result = null;
    $("report-name").textContent = "Selected: " + file.name;
    $("report-name").hidden = false;
    $("merge-btn").disabled = false;
    $("merge-result").hidden = true;
    $("results").hidden = true;
    showMsg($("merge-msg"), "");
  }

  function runMerge() {
    showMsg($("merge-msg"), "");
    $("results").hidden = true;
    try {
      state.merged = SLB.mergeReport(state.reportBuffer, state.regions);
    } catch (err) {
      state.merged = null;
      $("merge-result").hidden = true;
      showMsg($("merge-msg"), err.message, "error");
      return;
    }
    const m = state.merged;
    $("merge-summary").innerHTML = `<b>Combined:</b> ${m.rows.length} ULBs × ${m.cols.length} columns`;
    const lines = m.log.map((l) => `<li>${esc(l)}</li>`);
    if (!m.regionsLoaded) lines.push(`<li class="warn">No district-region list loaded - Region shows "Not mapped".</li>`);
    if (m.missingDistricts.length) {
      lines.push(`<li class="warn">No region for district(s): ${esc(m.missingDistricts.join(", "))}. ` +
        `Add them to the "District and Regions" sheet and upload the rules workbook again.</li>`);
    }
    $("merge-log").innerHTML = lines.join("");
    $("merge-result").hidden = false;
    $("ask-validate").hidden = false;
    $("validate-skipped").hidden = true;
  }

  // ---------------------------------------------------------------- validation results
  function runValidation() {
    if (!state.merged) return;
    state.result = SLB.validate(state.merged, state.rules);
    const res = state.result;
    $("ask-validate").hidden = true;
    $("validate-skipped").hidden = true;
    $("stat-issues").textContent = res.issueCount;
    $("stat-cities").textContent = res.issueCityCount;
    $("stat-zero").textContent = res.zeroRows.size;
    $("stat-total").textContent = state.merged.rows.length;

    const regions = [...new Set(res.cities.map((c) => c.region).filter(Boolean))].sort();
    $("f-region").innerHTML = `<option value="">All</option>` + regions.map((r) => `<option>${esc(r)}</option>`).join("");
    const kpiOpts = [["All", "All KPIs are zero"]].concat(res.codes.filter((c) => res.rules[c] && res.rules[c].check)
      .map((c) => [c, `${c} ${res.kpis[c].name}`]));
    $("f-kpi").innerHTML = `<option value="">All</option>` + kpiOpts.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join("");
    $("f-search").value = "";
    renderIssues();
    $("results").hidden = false;
    $("results").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderIssues() {
    const res = state.result;
    if (!res) return;
    const region = $("f-region").value;
    const kpi = $("f-kpi").value;
    const q = $("f-search").value.trim().toLowerCase();
    const rows = [];
    let count = 0;
    for (const c of res.cities) {
      if (region && c.region !== region) continue;
      if (q && !String(c.city).toLowerCase().includes(q) && !String(c.district).toLowerCase().includes(q)) continue;
      const list = kpi ? c.issues.filter((i) => i.code === kpi) : c.issues;
      list.forEach((i, n) => {
        count++;
        const cls = [c.allZero ? "gray" : "red", n === 0 ? "first" : ""].join(" ");
        rows.push(`<tr class="${cls}">
          <td class="num">${esc(c.srNo)}</td><td>${esc(c.district)}</td><td>${esc(c.region)}</td><td>${esc(c.city)}</td>
          <td>${esc(i.code)}</td><td>${esc(i.name)}</td><td class="num val">${esc(i.value)}</td><td>${esc(i.reason)}</td></tr>`);
      });
    }
    $("issues-table").querySelector("tbody").innerHTML = rows.join("") ||
      `<tr><td colspan="8" class="muted">No issues match these filters.</td></tr>`;
    $("filter-count").textContent = `${count} row(s) shown`;
  }

  // ---------------------------------------------------------------- wire up
  function busy(btn, fn) {
    return async () => {
      const label = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Working…";
      try { await fn(); } catch (err) { alert("Something went wrong: " + err.message); }
      finally { btn.disabled = false; btn.textContent = label; }
    };
  }

  function init() {
    if (!window.XLSX || !window.ExcelJS) {
      showMsg($("merge-msg"), "The spreadsheet libraries did not load. Check your internet connection and reload the page.", "error");
    }
    const saved = loadLocal();
    if (saved) {
      state.rules = saved.rules;
      state.regions = saved.regions || clone(window.DEFAULT_REGIONS);
      state.rulesSource = saved.source || "Saved rules";
    } else {
      useBuiltIn();
    }
    renderRules();

    const drop = $("drop");
    $("report-input").addEventListener("change", (e) => setReport(e.target.files[0]));
    ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("over"); }));
    ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, () => drop.classList.remove("over")));
    drop.addEventListener("drop", (e) => { e.preventDefault(); setReport(e.dataTransfer.files[0]); });

    $("rules-table").addEventListener("change", onRuleEdit);
    $("rules-input").addEventListener("change", onRulesUpload);
    $("rules-download").addEventListener("click", busy($("rules-download"), async () => {
      download(await SLB.buildRulesWorkbook(state.rules, state.regions), "kpi_rules.xlsx");
    }));
    $("rules-reset").addEventListener("click", () => {
      if (!confirm("Replace the current rules and district list with the built-in ones?")) return;
      useBuiltIn();
      saveLocal();
      renderRules();
      showMsg($("rules-msg"), "Built-in rules restored.");
    });

    $("merge-btn").addEventListener("click", runMerge);
    $("combined-download").addEventListener("click", busy($("combined-download"), async () => {
      download(await SLB.buildCombinedWorkbook(state.merged), state.reportStem + "_combined.xlsx");
    }));
    $("validate-yes").addEventListener("click", runValidation);
    $("validate-no").addEventListener("click", () => {
      $("ask-validate").hidden = true;
      $("validate-skipped").hidden = false;
      $("validate-skipped").innerHTML = 'Validation skipped. <button class="btn" type="button" id="validate-later">Validate now</button>';
      $("validate-later").addEventListener("click", runValidation);
    });
    // Re-combine first so district/region changes are picked up too
    $("revalidate-btn").addEventListener("click", () => { runMerge(); if (state.merged) runValidation(); });
    $("validated-download").addEventListener("click", busy($("validated-download"), async () => {
      download(await SLB.buildValidatedWorkbook(state.merged, state.result), state.reportStem + "_validated.xlsx");
    }));
    ["f-region", "f-kpi"].forEach((id) => $(id).addEventListener("change", renderIssues));
    $("f-search").addEventListener("input", renderIssues);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
