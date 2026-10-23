/*
 * SLB merge + validation logic (browser port of merge_slb_sheets.py and validate_slb.py).
 * Reads the ULB report with SheetJS (XLSX) and writes the output workbooks with ExcelJS.
 * Everything runs in the browser - no file leaves the user's computer.
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------- settings
  // Sheet name -> [first column, last column]; null = all used columns from B.
  // Listed in output order: S-4 (storm water, KPI 2.10-2.11) follows S-2 (section 2)
  const SHEET_RANGES = [
    ["S-1", "B", null],
    ["S-2", "H", "AH"],
    ["S-4", "H", "M"],
    ["S-3", "H", "AE"],
  ];
  const HEADER_ROWS = [2, 3, 4]; // 0-based: indicator name, indicator no., sub-header
  const DATA_START = 5;          // 0-based first data row
  const ULB_COL = 3;             // column D = ULB name, used to check rows line up
  const FIRST_KPI_SRC_COL = 7;   // indicators start at column H in every sheet
  const DROP_TEXT = "target till";
  const NOT_MAPPED = "Not mapped";

  const RULE_COLUMNS = ["KPI No", "KPI Name", "Unit", "Check (Yes/No)", "Min", "Max",
    "Allowed text", "Not allowed values", "Blank allowed (Yes/No)", "Rule description"];

  const COLOURS = {
    header: "FFDDEBF7",
    red: "FFFFC7CE",
    gray: "FFBFBFBF",
    rule: "FFFFF2CC",
    border: "FF999999",
  };

  // ---------------------------------------------------------------- helpers
  function colIdx(letter) {
    return XLSX.utils.decode_col(letter); // 0-based
  }

  function cellValue(ws, r, c) {
    const cell = ws[XLSX.utils.encode_cell({ r, c })];
    return cell && cell.v !== undefined ? cell.v : "";
  }

  const NUMBER_RE = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;

  /** Turn numeric-looking text ('95.70') into numbers; leave NA/ND/text as is. */
  function toNumber(v) {
    if (typeof v === "string") {
      const s = v.trim();
      if (s === "") return null;
      return NUMBER_RE.test(s) ? Number(s) : s;
    }
    return v === "" ? null : v;
  }

  /** Python-style '%g' (6 significant digits) for messages. */
  function fmtG(x) {
    return String(Number(Number(x).toPrecision(6)));
  }

  function splitList(text) {
    return String(text == null ? "" : text).split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  }

  /** Normalise a cell value for comparison with the text lists (0.0 -> '0'). */
  function asText(v) {
    return String(v).trim().toLowerCase();
  }

  function yes(v, dflt) {
    if (v === true) return true;
    if (v === false) return false;
    const s = String(v == null || v === "" ? dflt : v).trim().toLowerCase();
    return s === "yes" || s === "y" || s === "true";
  }

  function solid(argb) {
    return { type: "pattern", pattern: "solid", fgColor: { argb } };
  }

  // ---------------------------------------------------------------- KPI codes
  /** Report KPI no. (1-28) -> section code: 1-9 -> 1.1-1.9, 10-18 -> 2.1-2.9,
   *  19-26 -> 3.1-3.8, and 27, 28 (storm water) -> 2.10, 2.11. */
  function kpiCode(no) {
    if (no <= 9) return `1.${no}`;
    if (no <= 18) return `2.${no - 9}`;
    if (no <= 26) return `3.${no - 18}`;
    return `2.${no - 17}`;
  }

  const CODE_TO_NO = {};
  for (let n = 1; n <= 28; n++) CODE_TO_NO[kpiCode(n)] = n;

  function codeSortKey(code) {
    const [s, i] = String(code).split(".").map(Number);
    return s * 1000 + i;
  }

  /** Read a KPI No from a rules file: a code like '1.1' / '2.10', or an old plain number. */
  function parseKpiCode(v) {
    if (v == null || v === "") return null;
    const text = String(v).trim();
    if (CODE_TO_NO[text]) return text;
    if (typeof v === "number" && !Number.isInteger(v)) {
      // Excel turned the code into a number (e.g. 2.10 -> 2.1); codes should be stored as text
      return CODE_TO_NO[String(v)] ? String(v) : null;
    }
    const n = parseInt(text, 10);
    return n >= 1 && n <= 28 ? kpiCode(n) : null;
  }

  // ---------------------------------------------------------------- rules
  function describe(rule) {
    const parts = [];
    const lo = rule.min, hi = rule.max;
    if (lo != null && hi != null) parts.push(`Between ${fmtG(lo)} and ${fmtG(hi)}`);
    else if (lo != null) parts.push(`Not less than ${fmtG(lo)}`);
    else if (hi != null) parts.push(`Not more than ${fmtG(hi)}`);
    if (rule.allowed.length) parts.push("Allowed: " + rule.allowed.map((a) => a.toUpperCase()).join(", "));
    if (rule.notAllowed.length) parts.push("Not allowed: " + rule.notAllowed.join(", "));
    parts.push(rule.blankOk ? "Blank allowed" : "Blank not allowed");
    return parts.join("; ");
  }

  function num(v) {
    if (v == null || String(v).trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  /** Editable rule rows (as shown in the portal) -> compiled rules keyed by KPI code. */
  function compileRules(rows) {
    const rules = {};
    for (const row of rows) {
      const code = parseKpiCode(row.code);
      if (!code) continue;
      const rule = {
        name: row.name,
        check: yes(row.check, "Yes"),
        min: num(row.min),
        max: num(row.max),
        allowed: splitList(row.allowed),
        notAllowed: splitList(row.notAllowed),
        blankOk: yes(row.blankAllowed, "No"),
      };
      const desc = row.description == null ? "" : String(row.description).trim();
      rule.desc = desc || describe(rule);
      rules[code] = rule;
    }
    return rules;
  }

  /** Return the reason the value breaks the rule, or null if it is fine. */
  function checkValue(v, rule) {
    if (v == null || String(v).trim() === "") return rule.blankOk ? null : "Blank value";
    const t = asText(v);
    if (rule.notAllowed.includes(t)) return `Value '${v}' is not allowed`;
    if (rule.allowed.includes(t)) return null;
    if (typeof v === "string") {
      if (!NUMBER_RE.test(v.trim())) return `Text '${v}' is not allowed`;
      v = Number(v.trim());
    }
    if (rule.min != null && v < rule.min) return `${fmtG(v)} is less than ${fmtG(rule.min)}`;
    if (rule.max != null && v > rule.max) return `${fmtG(v)} is more than ${fmtG(rule.max)}`;
    return null;
  }

  /** Parse an uploaded kpi_rules.xlsx: "KPI Rules" sheet (+ optional "District and Regions"). */
  function parseRulesWorkbook(arrayBuffer) {
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    const ruleSheet = wb.Sheets["KPI Rules"] || wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ruleSheet, { header: 1, defval: null, raw: true });
    const rules = [];
    for (const r of rows.slice(1)) {
      const code = parseKpiCode(r[0]);
      if (!code) continue;
      rules.push({
        code, name: r[1] || "", unit: r[2] || "", check: r[3] || "Yes",
        min: r[4], max: r[5], allowed: r[6] || "", notAllowed: r[7] || "",
        blankAllowed: r[8] || "No", description: r[9] || "",
      });
    }
    if (!rules.length) throw new Error("No KPI rules found. The first column must hold KPI numbers such as 1.1, 2.10.");
    rules.sort((a, b) => codeSortKey(a.code) - codeSortKey(b.code));

    let regions = null;
    const regionSheet = wb.Sheets["District and Regions"];
    if (regionSheet) {
      regions = XLSX.utils.sheet_to_json(regionSheet, { header: 1, defval: null, raw: true })
        .slice(1)
        .filter((r) => r[0] && r[1])
        .map((r) => ({ district: String(r[0]).trim(), region: String(r[1]).trim() }));
    }
    return { rules, regions };
  }

  // ---------------------------------------------------------------- merge
  function readBlock(ws, first, last) {
    const range = XLSX.utils.decode_range(ws["!ref"]);
    const nrows = range.e.r + 1;
    // The sheet range can include empty formatted columns; stop at the last column with data
    let ncols = range.e.c + 1;
    const colEmpty = (c) => {
      for (let r = 0; r < nrows; r++) if (String(cellValue(ws, r, c)).trim() !== "") return false;
      return true;
    };
    while (ncols > 1 && colEmpty(ncols - 1)) ncols--;
    const c0 = colIdx(first);
    const c1 = last == null ? ncols - 1 : colIdx(last);

    // Carry indicator name / number across the columns each indicator spans
    const headers = {};
    for (const r of HEADER_ROWS) {
      headers[r] = [];
      for (let c = 0; c < ncols; c++) headers[r][c] = cellValue(ws, r, c);
    }
    for (const r of HEADER_ROWS.slice(0, 2)) {
      let carry = "";
      for (let c = FIRST_KPI_SRC_COL; c < ncols; c++) {
        if (String(headers[r][c]).trim()) carry = headers[r][c];
        else headers[r][c] = carry;
      }
    }

    const keep = [];
    for (let c = c0; c <= c1; c++) {
      if (!String(headers[4][c]).toLowerCase().includes(DROP_TEXT)) keep.push(c);
    }

    const cols = keep.map((c) => {
      const name = String(headers[2][c]).trim();
      let no = toNumber(String(headers[3][c]).trim());
      if (typeof no === "number") no = Math.trunc(no);
      const sub = String(headers[4][c]).trim();
      const kpi = c >= FIRST_KPI_SRC_COL && typeof no === "number" ? { no, name } : null;
      return { h1: name, h2: kpi ? no : null, h3: sub || null, kpi, isCurrent: !!kpi && sub.toLowerCase().includes("current") };
    });
    const data = [], ulbs = [];
    for (let r = DATA_START; r < nrows; r++) {
      data.push(keep.map((c) => toNumber(cellValue(ws, r, c))));
      ulbs.push(String(cellValue(ws, r, ULB_COL)).trim());
    }
    return { cols, data, ulbs };
  }

  /**
   * Combine S-1..S-4 into one table and add Region after District.
   * Returns { cols, rows, log[], missingDistricts[] }.
   */
  function mergeReport(arrayBuffer, regionList) {
    const book = XLSX.read(arrayBuffer, { type: "array" });
    const log = [];
    let cols = [], rows = null, baseUlbs = null;

    for (const [name, first, last] of SHEET_RANGES) {
      const ws = book.Sheets[name];
      if (!ws) throw new Error(`Sheet "${name}" not found in this file. Is this the ULB report (S-1 to S-4)?`);
      const block = readBlock(ws, first, last);
      if (baseUlbs === null) {
        baseUlbs = block.ulbs;
        rows = block.data;
      } else {
        if (block.ulbs.length !== baseUlbs.length) {
          throw new Error(`ULB rows in ${name} do not match S-1 (row count differs).`);
        }
        const bad = block.ulbs.findIndex((u, i) => u !== baseUlbs[i]);
        if (bad >= 0) {
          throw new Error(`ULB rows in ${name} do not match S-1 (first mismatch: "${baseUlbs[bad]}" vs "${block.ulbs[bad]}").`);
        }
        rows = rows.map((row, i) => row.concat(block.data[i]));
      }
      cols = cols.concat(block.cols);
      log.push(`${name}: ${block.cols.length} columns taken`);
    }

    // Add Region after District (column B), looked up from the district name
    const regions = {};
    for (const { district, region } of regionList || []) regions[district.trim().toLowerCase()] = region;
    cols.splice(2, 0, { h1: "Region", h2: null, h3: null, kpi: null, isCurrent: false });
    const missing = new Set();
    for (const row of rows) {
      const district = String(row[1] == null ? "" : row[1]).trim();
      const region = regions[district.toLowerCase()];
      if (region === undefined) missing.add(district);
      row.splice(2, 0, region || NOT_MAPPED);
    }
    const missingDistricts = Object.keys(regions).length ? [...missing].sort() : [];
    return { cols, rows, log, missingDistricts, regionsLoaded: Object.keys(regions).length > 0 };
  }

  // ---------------------------------------------------------------- validate
  function findCol(cols, text) {
    const i = cols.findIndex((c) => String(c.h1 || "").toLowerCase().includes(text.toLowerCase()));
    return i < 0 ? null : i;
  }

  /** KPI code -> { col (current value), name, start (first column of the KPI) }. */
  function kpiColumns(cols) {
    const kpis = {};
    cols.forEach((c, i) => {
      if (!c.isCurrent) return;
      let start = i;
      while (start > 0 && cols[start - 1].kpi && cols[start - 1].kpi.no === c.kpi.no) start--;
      kpis[kpiCode(c.kpi.no)] = { col: i, name: c.kpi.name, start };
    });
    return kpis;
  }

  function validate(merged, ruleRows) {
    const { cols, rows } = merged;
    const rules = compileRules(ruleRows);
    const kpis = kpiColumns(cols);
    const codes = Object.keys(kpis).sort((a, b) => codeSortKey(a) - codeSortKey(b));
    const cityCol = findCol(cols, "Corporation");
    const districtCol = findCol(cols, "District");
    const regionCol = findCol(cols, "Region");

    const issues = []; // { row, col, code, name, value, reason }
    rows.forEach((row, r) => {
      for (const code of codes) {
        const rule = rules[code];
        if (!rule || !rule.check) continue;
        const { col, name } = kpis[code];
        const reason = checkValue(row[col], rule);
        if (reason) issues.push({ row: r, col, code, name, value: row[col], reason });
      }
    });

    // Cities whose every numeric KPI value is 0 (NA/ND/blank are ignored)
    const zeroRows = new Set();
    rows.forEach((row, r) => {
      const nums = codes.map((code) => row[kpis[code].col]).filter((v) => typeof v === "number");
      if (nums.length && nums.every((v) => v === 0)) zeroRows.add(r);
    });

    // Per-city list, all-zero first
    const byRow = new Map();
    for (const iss of issues) {
      if (!byRow.has(iss.row)) byRow.set(iss.row, []);
      byRow.get(iss.row).push(iss);
    }
    for (const r of zeroRows) {
      if (!byRow.has(r)) byRow.set(r, []);
      byRow.get(r).unshift({ row: r, col: null, code: "All", name: "All KPIs", value: 0, reason: "All KPIs are zero" });
    }

    const cities = [...byRow.keys()].sort((a, b) => a - b).map((r) => {
      const found = byRow.get(r);
      const row = rows[r];
      return {
        row: r,
        srNo: row[0],
        district: districtCol == null ? "" : row[districtCol],
        region: regionCol == null ? "" : row[regionCol],
        city: row[cityCol],
        allZero: zeroRows.has(r),
        issues: found,
        details: found.map((i) => (i.code === "All" ? i.reason : `KPI ${i.code}: ${i.reason}`)).join("; "),
      };
    });

    return {
      rules, kpis, codes, cityCol, districtCol, regionCol, issues, zeroRows, cities,
      issueCount: issues.length,
      issueCityCount: new Set(issues.map((i) => i.row)).size,
    };
  }

  // ---------------------------------------------------------------- Excel output
  const FIRST_KPI_COL = 8; // 1-based: A Sr. No., B District, C Region, D ULB, E Class, F-G Submit Status

  function styleHeaderRows(ws, nHeaderRows, ncols) {
    const thin = { style: "thin", color: { argb: COLOURS.border } };
    for (let r = 1; r <= nHeaderRows; r++) {
      for (let c = 1; c <= ncols; c++) {
        const cell = ws.getCell(r, c);
        cell.font = { bold: true };
        cell.fill = solid(COLOURS.header);
        cell.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
        cell.border = { top: thin, bottom: thin, left: thin, right: thin };
      }
    }
  }

  /** Header rows 1-3: identifier columns span all 3 rows, each KPI's name/number spans its columns. */
  function writeHeader(ws, cols, numberFor) {
    const ncols = cols.length;
    const r1 = [], r2 = [], r3 = [];
    let prev = null;
    cols.forEach((c, i) => {
      const first = !c.kpi || !prev || !prev.kpi || prev.kpi.no !== c.kpi.no;
      r1.push(first ? c.h1 : null);
      r2.push(c.kpi ? (first ? numberFor(c.kpi.no) : null) : null);
      r3.push(c.kpi ? c.h3 : null);
      prev = c;
    });
    ws.addRow(r1);
    ws.addRow(r2);
    ws.addRow(r3);

    for (let c = 1; c < FIRST_KPI_COL && c <= ncols; c++) ws.mergeCells(1, c, 3, c);
    let c = FIRST_KPI_COL;
    while (c <= ncols) {
      let end = c;
      const no = cols[c - 1].kpi && cols[c - 1].kpi.no;
      while (end + 1 <= ncols && cols[end].kpi && cols[end].kpi.no === no) end++;
      if (end > c) {
        ws.mergeCells(1, c, 1, end);
        ws.mergeCells(2, c, 2, end);
      }
      c = end + 1;
    }
    styleHeaderRows(ws, 3, ncols);
    ws.getRow(1).height = 75;
    ws.getRow(3).height = 60;
    for (let i = 1; i <= ncols; i++) ws.getColumn(i).width = 14;
    ws.getColumn(4).width = 22;
  }

  async function workbookBlob(wb) {
    const buf = await wb.xlsx.writeBuffer();
    return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }

  async function buildCombinedWorkbook(merged) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("SLB Combined", {
      views: [{ state: "frozen", xSplit: FIRST_KPI_COL - 1, ySplit: 3 }],
    });
    writeHeader(ws, merged.cols, (no) => no);
    for (const row of merged.rows) ws.addRow(row);
    return workbookBlob(wb);
  }

  async function buildValidatedWorkbook(merged, result) {
    const { cols, rows } = merged;
    const { rules, kpis, cityCol, zeroRows, cities, issues } = result;
    const ncols = cols.length;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("SLB Combined", {
      views: [{ state: "frozen", xSplit: FIRST_KPI_COL - 1, ySplit: 4 }],
    });
    // Section codes (1.1, 2.1, 3.1 ...) in the KPI number header row
    writeHeader(ws, cols, (no) => kpiCode(no));

    // "Validation rule" row under the headers
    const ruleRow = new Array(ncols).fill(null);
    ruleRow[0] = "Validation rule";
    ws.addRow(ruleRow);
    ws.getCell(4, 1).font = { bold: true };
    for (const [code, k] of Object.entries(kpis)) {
      const rule = rules[code];
      if (rule && !rule.check) continue; // KPI switched off - leave its rule cell empty
      const cell = ws.getCell(4, k.col + 1);
      cell.value = rule ? rule.desc : "No rule defined";
      cell.fill = solid(COLOURS.rule);
      cell.alignment = { wrapText: true, vertical: "top" };
      cell.font = { italic: true, size: 9 };
    }
    ws.getRow(4).height = 80;

    for (const row of rows) ws.addRow(row);
    const excelRow = (r) => r + 5; // data starts on row 5

    // Highlight cells and cities
    const red = new Set();
    for (const iss of issues) {
      const cell = ws.getCell(excelRow(iss.row), iss.col + 1);
      cell.fill = solid(COLOURS.red);
      cell.note = `KPI ${iss.code}: ${iss.reason}`;
      red.add(`${iss.row}:${iss.col}`);
      ws.getCell(excelRow(iss.row), cityCol + 1).fill = solid(COLOURS.red);
    }
    for (const r of zeroRows) {
      for (let c = 0; c < ncols; c++) {
        if (!red.has(`${r}:${c}`)) ws.getCell(excelRow(r), c + 1).fill = solid(COLOURS.gray);
      }
      ws.getCell(excelRow(r), cityCol + 1).fill = solid(COLOURS.gray);
    }

    // Issues sheet: one row per problem, grouped by city; the city's first row
    // also carries its "No. of issues" and "Issue details"
    const log = wb.addWorksheet("Issues", { views: [{ state: "frozen", ySplit: 1 }] });
    const idHeads = ["Sr. No.", "District"];
    const idWidths = [8, 16];
    if (result.regionCol != null) { idHeads.push("Region"); idWidths.push(14); }
    idHeads.push("Corporation/ Municipal Council"); idWidths.push(26);
    const heads = idHeads.concat(["KPI No", "KPI Name", "Value", "Problem", "No. of issues", "Issue details"]);
    log.addRow(heads);
    for (const city of cities) {
      const ids = [city.srNo, city.district];
      if (result.regionCol != null) ids.push(city.region);
      ids.push(city.city);
      city.issues.forEach((iss, i) => {
        const r = log.addRow(ids.concat([iss.code, iss.name, iss.value, iss.reason],
          i === 0 ? [city.issues.length, city.details] : []));
        if (city.allZero) for (let c = 1; c <= heads.length; c++) r.getCell(c).fill = solid(COLOURS.gray);
      });
    }
    log.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = solid(COLOURS.header);
      cell.alignment = { wrapText: true, vertical: "middle" };
    });
    idWidths.concat([8, 50, 10, 30, 10, 80]).forEach((w, i) => { log.getColumn(i + 1).width = w; });
    log.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(log.rowCount, 1), column: heads.length } };

    return workbookBlob(wb);
  }

  /** The current rules (with any edits) as a kpi_rules.xlsx workbook. */
  async function buildRulesWorkbook(ruleRows, regionRows) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("KPI Rules", { views: [{ state: "frozen", xSplit: 2, ySplit: 1 }] });
    ws.addRow(RULE_COLUMNS);
    for (const r of ruleRows) {
      const row = ws.addRow([r.code, r.name, r.unit, yes(r.check, "Yes") ? "Yes" : "No", num(r.min), num(r.max),
        r.allowed, r.notAllowed, yes(r.blankAllowed, "No") ? "Yes" : "No", r.description || null]);
      row.getCell(1).numFmt = "@"; // keep 2.10 as text
      for (const c of [4, 9]) {
        row.getCell(c).dataValidation = { type: "list", allowBlank: false, formulae: ['"Yes,No"'] };
      }
    }
    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = solid(COLOURS.header);
      cell.alignment = { wrapText: true, vertical: "middle" };
    });
    [8, 50, 9, 10, 8, 8, 14, 18, 12, 45].forEach((w, i) => { ws.getColumn(i + 1).width = w; });

    const reg = wb.addWorksheet("District and Regions");
    reg.addRow(["District", "Regions"]);
    for (const r of regionRows) reg.addRow([r.district, r.region]);
    reg.getRow(1).font = { bold: true };
    reg.getColumn(1).width = 22;
    reg.getColumn(2).width = 18;
    return workbookBlob(wb);
  }

  window.SLB = {
    mergeReport, validate, buildCombinedWorkbook, buildValidatedWorkbook,
    buildRulesWorkbook, parseRulesWorkbook, kpiCode, codeSortKey, describe, compileRules,
  };
})();
