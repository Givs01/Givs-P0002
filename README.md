# SLB Data Validation Portal

A static web page that does what `merge_slb_sheets.py` and `validate_slb.py` do, entirely in the browser:

1. Choose the ULB report (`.xls`, sheets S-1 to S-4).
2. Review or edit the KPI rules (or upload your own `kpi_rules.xlsx`).
3. **Combine sheets** → download `<report>_combined.xlsx`.
4. **Proceed with validation?** → download `<report>_validated.xlsx` and browse the issues on screen.

The output files are the same as the Python scripts produce (checked cell by cell: values,
red/gray highlights, comments, merged headers and the Issues sheet).

**Privacy:** files are read and processed in the user's browser. Nothing is uploaded to a server,
including on GitHub Pages. The page only downloads two open-source libraries (SheetJS and ExcelJS) from public CDNs.

## Files

| File | Purpose |
|---|---|
| `index.html` | The page |
| `assets/slb.js` | Merge + validation logic (port of the Python scripts) |
| `assets/app.js` | Page behaviour (upload, rules editor, results table) |
| `assets/default-rules.js` | Built-in KPI rules and district → region list |
| `assets/style.css` | Styles (light and dark mode) |

## Rules

- The built-in rules are in `assets/default-rules.js`, exported from `kpi_rules.xlsx`.
- On the page, users can edit rules in the table (remembered in their own browser only),
  **Upload rules workbook** (`KPI Rules` sheet + optional `District and Regions` sheet),
  **Download rules workbook** to save the current rules, or **Reset to built-in rules**.
- To change the built-in rules for everyone, edit `assets/default-rules.js` and push.
  KPI numbers are section codes as text: `"1.1"` … `"1.9"`, `"2.1"` … `"2.11"`, `"3.1"` … `"3.8"`.

## Deploy on GitHub Pages

1. Create a new repository on GitHub, e.g. `slb-validation-portal`.
2. From this folder:
   ```bash
   git init
   git add .
   git commit -m "SLB data validation portal"
   git branch -M main
   git remote add origin https://github.com/<your-account>/slb-validation-portal.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   choose **main** and **/ (root)**, then **Save**.
4. After a minute the portal is live at `https://<your-account>.github.io/slb-validation-portal/`.

**Note:** on a free GitHub account, Pages works only from a public repository, and the site itself is
public. Paid plans can publish from a private repository, but the site is still public unless you have
GitHub Enterprise Cloud with access control (check GitHub's current Pages documentation).
That is fine here because the page holds no report data; only the built-in rules and the
district → region list are visible in `assets/default-rules.js`.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
```

then go to http://localhost:8000.
