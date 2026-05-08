"""
Shared CSS styles for all QuoteForge PDF templates.
Self-contained — only external reference is Google Fonts @import.
"""

PDF_CSS = """
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

@page {
  size: A4 landscape;
  margin: 15mm;
  @bottom-left {
    content: "";
  }
  @bottom-right {
    content: "Page " counter(page) " of " counter(pages);
    font-size: 8px;
    color: #bbb;
  }
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  color: #1a1a1a;
  line-height: 1.45;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.page {
  padding: 32px;
  page-break-after: always;
}
.page:last-child {
  page-break-after: avoid;
}

/* ─── Header ─── */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #F5A623;
  padding-bottom: 14px;
  margin-bottom: 20px;
}
.header-left h1 {
  font-size: 26px;
  font-weight: 700;
  color: #0f0f0f;
  margin-bottom: 4px;
}
.header-left .sub {
  font-size: 13px;
  color: #555;
  font-weight: 500;
}
.header-right {
  text-align: right;
}
.header-right .label {
  font-size: 20px;
  font-weight: 800;
  color: #F5A623;
  letter-spacing: 2px;
}
.header-right .meta {
  font-size: 10px;
  color: #777;
  margin-top: 2px;
}

/* ─── Client ─── */
.client-row {
  font-size: 12px;
  margin-bottom: 18px;
  color: #333;
}
.client-row strong {
  color: #0f0f0f;
}

/* ─── Tables ─── */
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 15px;
}
th {
  background: #1a1a1a;
  color: #fff;
  padding: 8px 6px;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-align: left;
  font-weight: 600;
}
th.text-right { text-align: right; }
th.text-center { text-align: center; }
td {
  padding: 7px 6px;
  border-bottom: 1px solid #eeeeee;
  font-size: 10px;
  vertical-align: middle;
}
tr:nth-child(even) td {
  background: #f9f9f9;
}
tr {
  page-break-inside: avoid;
}

.mono {
  font-family: 'IBM Plex Mono', 'Consolas', monospace;
}
.text-right { text-align: right; }
.text-center { text-align: center; }

.best {
  background: #f0fdf4 !important;
  color: #15803d;
  font-weight: 700;
}
.best-cell {
  background: #f0fdf4 !important;
  color: #15803d;
  font-weight: 600;
}

.total-row td {
  font-weight: 700;
  border-top: 2px solid #1a1a1a;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  background: #f3f4f6 !important;
}

.subtotal-row td {
  background: #f5f5f5 !important;
  font-weight: 600;
  font-size: 10px;
  color: #555;
}

.gst-row td {
  font-size: 10px;
  font-style: italic;
  color: #555;
  background: #fafafa !important;
}

.payable-row td {
  border-top: 2px solid #F5A623;
  font-weight: 800;
  font-size: 12px;
  background: #FEF3C7 !important;
  font-family: 'IBM Plex Mono', monospace;
}

/* ─── Badges ─── */
.badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 3px;
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
}
.badge-pipe { background: #dbeafe; color: #1d4ed8; }
.badge-fitting { background: #ffedd5; color: #c2410c; }
.badge-solvent { background: #dcfce7; color: #15803d; }
.badge-pvc { background: #cffafe; color: #0e7490; }
.badge-cpvc { background: #ede9fe; color: #7c3aed; }
.badge-best {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}

/* ─── Footer ─── */
.footer {
  margin-top: 20px;
  padding-top: 8px;
  border-top: 1px solid #eeeeee;
  font-size: 9px;
  color: #999999;
  display: flex;
  justify-content: space-between;
}

/* ─── Utilities ─── */
.amber-accent { color: #F5A623; }

.discount-box {
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 12px;
  margin-top: 20px;
  background: #fafafa;
}
.discount-box h4 {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #555;
  margin-bottom: 8px;
}

.company-header-apollo th { background: #DC2626 !important; }
.company-header-supreme th { background: #2563EB !important; }
.company-header-astral th { background: #16A34A !important; }
.company-header-ashirvad th { background: #D97706 !important; }

.grand-total-accent {
  border-left: 3px solid #F5A623;
}

/* ─── Branding ─── */
.branding {
  text-align: center;
  margin-top: 14px;
  padding-top: 10px;
  font-size: 13px;
  color: #999;
  letter-spacing: 0.5px;
}
.branding-name {
  font-weight: 800;
  color: #F5A623;
  letter-spacing: 1.5px;
}
"""
