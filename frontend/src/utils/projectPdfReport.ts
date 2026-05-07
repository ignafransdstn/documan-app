import { jsPDF } from 'jspdf'
import type { ApiProjectReport, ApiProjectReportItem } from '../api'

// ─── Color palette ────────────────────────────────────────────────────────────
const COLORS = {
  primary: [99, 102, 241] as [number, number, number],    // indigo
  success: [34, 197, 94] as [number, number, number],     // green
  warning: [234, 179, 8] as [number, number, number],     // yellow
  danger: [239, 68, 68] as [number, number, number],      // red
  purple: [168, 85, 247] as [number, number, number],
  cyan: [6, 182, 212] as [number, number, number],
  orange: [249, 115, 22] as [number, number, number],
  slate: [100, 116, 139] as [number, number, number],
  bgDark: [15, 23, 42] as [number, number, number],
  bgCard: [30, 41, 59] as [number, number, number],
  border: [51, 65, 85] as [number, number, number],
  textPrimary: [226, 232, 240] as [number, number, number],
  textMuted: [148, 163, 184] as [number, number, number],
}

const STATUS_COLORS: Record<string, [number, number, number]> = {
  active: COLORS.success,
  closed: COLORS.slate,
  on_hold: COLORS.warning,
}

const TYPE_COLORS: [number, number, number][] = [COLORS.primary, COLORS.purple]
const INST_COLORS: [number, number, number][] = [COLORS.cyan, COLORS.primary, COLORS.purple, COLORS.orange]
const MONTH_COLOR: [number, number, number] = COLORS.primary

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rgb(doc: jsPDF, color: [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2])
  doc.setDrawColor(color[0], color[1], color[2])
  doc.setTextColor(color[0], color[1], color[2])
}

function setFill(doc: jsPDF, color: [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2])
}

function setDraw(doc: jsPDF, color: [number, number, number]) {
  doc.setDrawColor(color[0], color[1], color[2])
}

function setTextColor(doc: jsPDF, color: [number, number, number]) {
  doc.setTextColor(color[0], color[1], color[2])
}

function pageFill(doc: jsPDF) {
  setFill(doc, COLORS.bgDark)
  doc.rect(0, 0, 210, 297, 'F')
}

function card(doc: jsPDF, x: number, y: number, w: number, h: number) {
  setFill(doc, COLORS.bgCard)
  setDraw(doc, COLORS.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, w, h, 3, 3, 'FD')
}

function sectionTitle(doc: jsPDF, x: number, y: number, text: string) {
  setTextColor(doc, COLORS.textPrimary)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(text, x, y)
  setFill(doc, COLORS.primary)
  doc.rect(x, y + 1.5, 30, 0.5, 'F')
}

function statusLabel(status: string) {
  return status === 'on_hold' ? 'On Hold' : status.charAt(0).toUpperCase() + status.slice(1)
}

// ─── Pie Chart ────────────────────────────────────────────────────────────────
function drawPie(doc: jsPDF, cx: number, cy: number, r: number, data: { label: string; value: number; color: [number, number, number] }[]) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return
  let startAngle = -Math.PI / 2
  for (const slice of data) {
    const sweep = (slice.value / total) * Math.PI * 2
    if (sweep <= 0) continue
    const endAngle = startAngle + sweep
    const steps = Math.max(8, Math.ceil(sweep * 20))
    const pts: [number, number][] = [[cx, cy]]
    for (let i = 0; i <= steps; i++) {
      const a = startAngle + (sweep * i) / steps
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
    }
    setFill(doc, slice.color)
    doc.lines(pts.slice(1).map(([px, py], i) => [px - (i === 0 ? cx : pts[i][0]), py - (i === 0 ? cy : pts[i][1])] as [number, number]), cx, cy, [1, 1], 'F')
    startAngle = endAngle
  }
}

// ─── Bar Chart (vertical) ─────────────────────────────────────────────────────
function drawBarV(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  data: { label: string; value: number; color: [number, number, number] }[]
) {
  const max = Math.max(...data.map(d => d.value), 1)
  const barW = Math.min((w - 10) / data.length - 4, 22)
  const startX = x + (w - (barW + 4) * data.length) / 2

  // Baseline
  setDraw(doc, COLORS.border)
  doc.setLineWidth(0.3)
  doc.line(x, y + h - 6, x + w, y + h - 6)

  data.forEach((d, i) => {
    const bh = d.value > 0 ? Math.max(2, ((d.value / max) * (h - 16))) : 0
    const bx = startX + i * (barW + 4)
    const by = y + h - 6 - bh
    setFill(doc, d.color)
    doc.roundedRect(bx, by, barW, bh, 1, 1, 'F')

    // value label above bar
    setTextColor(doc, COLORS.textPrimary)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text(String(d.value), bx + barW / 2, by - 1, { align: 'center' })

    // x-axis label
    setTextColor(doc, COLORS.textMuted)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    const label = d.label.length > 10 ? d.label.slice(0, 9) + '…' : d.label
    doc.text(label, bx + barW / 2, y + h - 1, { align: 'center' })
  })
}

// ─── Horizontal Bar Chart ─────────────────────────────────────────────────────
function drawBarH(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  data: { label: string; value: number; color: [number, number, number] }[]
) {
  const max = Math.max(...data.map(d => d.value), 1)
  const rowH = Math.min((h - 4) / data.length, 10)
  const labelW = 52
  const barAreaW = w - labelW - 16

  data.forEach((d, i) => {
    const by = y + 4 + i * rowH
    const bw = d.value > 0 ? Math.max(2, (d.value / max) * barAreaW) : 0

    // label
    setTextColor(doc, COLORS.textMuted)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    const label = d.label.length > 28 ? d.label.slice(0, 27) + '…' : d.label
    doc.text(label, x + labelW - 2, by + rowH * 0.55, { align: 'right' })

    // bar
    setFill(doc, d.color)
    doc.roundedRect(x + labelW, by + rowH * 0.1, bw, rowH * 0.7, 0.8, 0.8, 'F')

    // value
    setTextColor(doc, COLORS.textPrimary)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.text(String(d.value), x + labelW + bw + 2, by + rowH * 0.55)
  })
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function drawLegend(doc: jsPDF, x: number, y: number, items: { label: string; value: number; color: [number, number, number] }[]) {
  items.forEach((item, i) => {
    const lx = x + (i % 2) * 42
    const ly = y + Math.floor(i / 2) * 7
    setFill(doc, item.color)
    doc.roundedRect(lx, ly - 2.5, 4, 4, 0.5, 0.5, 'F')
    setTextColor(doc, COLORS.textMuted)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`${item.label}: ${item.value}`, lx + 5.5, ly)
  })
}

// ─── Summary Stat Box ─────────────────────────────────────────────────────────
function statBox(doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value: string | number, color: [number, number, number]) {
  card(doc, x, y, w, h)
  rgb(doc, color)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(String(value), x + w / 2, y + h / 2 + 1, { align: 'center' })
  setTextColor(doc, COLORS.textMuted)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(label, x + w / 2, y + h / 2 + 6, { align: 'center' })
}

// ─── Data Table ───────────────────────────────────────────────────────────────
function drawTable(doc: jsPDF, data: ApiProjectReportItem[], startY: number): number {
  const cols = [
    { key: 'number', label: 'Number', w: 22 },
    { key: 'name', label: 'Name', w: 54 },
    { key: 'type', label: 'Type', w: 20 },
    { key: 'status', label: 'Status', w: 18 },
    { key: 'institution', label: 'Institution', w: 22 },
    { key: 'startDate', label: 'Start Date', w: 22 },
    { key: 'linkedDocCount', label: 'Docs', w: 12 },
    { key: 'durationDays', label: 'Days', w: 12 },
  ]
  const totalW = cols.reduce((s, c) => s + c.w, 0)
  const marginL = (210 - totalW) / 2
  const rowH = 7
  let cy = startY
  const pageH = 297
  const marginBottom = 15

  function header() {
    setFill(doc, COLORS.primary)
    doc.rect(marginL, cy, totalW, rowH, 'F')
    setTextColor(doc, [255, 255, 255])
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    let cx = marginL
    for (const col of cols) {
      doc.text(col.label, cx + col.w / 2, cy + 4.8, { align: 'center' })
      cx += col.w
    }
    cy += rowH
  }

  header()

  data.forEach((row, idx) => {
    if (cy + rowH > pageH - marginBottom) {
      doc.addPage()
      pageFill(doc)
      cy = 15
      header()
    }

    const bg = idx % 2 === 0 ? COLORS.bgCard : COLORS.bgDark
    setFill(doc, bg)
    doc.rect(marginL, cy, totalW, rowH, 'F')

    // row border
    setDraw(doc, COLORS.border)
    doc.setLineWidth(0.2)
    doc.line(marginL, cy + rowH, marginL + totalW, cy + rowH)

    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')

    const values: Record<string, string> = {
      number: row.number,
      name: row.name.length > 28 ? row.name.slice(0, 27) + '…' : row.name,
      type: row.type === 'dispute' ? 'Dispute' : 'Project',
      status: statusLabel(row.status),
      institution: row.institution || '-',
      startDate: row.startDate ? row.startDate.slice(0, 10) : '-',
      linkedDocCount: String(row.linkedDocCount),
      durationDays: String(row.durationDays),
    }

    let cx = marginL
    for (const col of cols) {
      const val = values[col.key] || '-'
      // color code status
      if (col.key === 'status') {
        setTextColor(doc, STATUS_COLORS[row.status] || COLORS.textPrimary)
      } else if (col.key === 'type') {
        setTextColor(doc, row.type === 'dispute' ? COLORS.purple : COLORS.primary)
      } else {
        setTextColor(doc, COLORS.textPrimary)
      }
      doc.text(val, cx + col.w / 2, cy + 4.5, { align: 'center' })
      cx += col.w
    }
    cy += rowH
  })

  return cy
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function generateProjectPDF(data: ApiProjectReport) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const { summary, institutionBreakdown, monthlyTrend, projects } = data
  const now = new Date()
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  // ── PAGE 1: Cover + Executive Summary ──────────────────────────────────────
  pageFill(doc)

  // Header stripe
  setFill(doc, COLORS.primary)
  doc.rect(0, 0, 210, 42, 'F')

  // Title
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  setTextColor(doc, [255, 255, 255])
  doc.text('Project & Dispute Case Report', 105, 18, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('DocuMan — Document Management System', 105, 27, { align: 'center' })

  doc.setFontSize(8)
  setTextColor(doc, [196, 181, 253])
  doc.text(`Generated: ${dateStr}`, 105, 35, { align: 'center' })

  // ── Executive Summary stat boxes ──
  const stats = [
    { label: 'Total Records', value: summary.total, color: COLORS.primary },
    { label: 'Projects', value: summary.byType.project, color: COLORS.cyan },
    { label: 'Dispute Cases', value: summary.byType.dispute, color: COLORS.purple },
    { label: 'Active', value: summary.byStatus.active, color: COLORS.success },
    { label: 'Closed', value: summary.byStatus.closed, color: COLORS.slate },
    { label: 'On Hold', value: summary.byStatus.on_hold, color: COLORS.warning },
    { label: 'Linked Docs', value: summary.totalLinkedDocs, color: COLORS.orange },
    { label: 'Supporting Docs', value: summary.totalSupportingDocs, color: COLORS.danger },
  ]

  const boxW = 44, boxH = 22, gapX = 4
  const startX = (210 - (boxW * 4 + gapX * 3)) / 2
  stats.forEach((s, i) => {
    const row = Math.floor(i / 4)
    const col = i % 4
    statBox(doc, startX + col * (boxW + gapX), 50 + row * (boxH + 4), boxW, boxH, s.label, s.value, s.color)
  })

  // ── Section: Type + Status chart ──
  sectionTitle(doc, 14, 106, 'Distribution by Type & Status')

  // Type pie chart
  card(doc, 14, 112, 85, 62)
  setTextColor(doc, COLORS.textMuted)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('By Type', 56, 120, { align: 'center' })

  const typeData = [
    { label: 'Project', value: summary.byType.project, color: TYPE_COLORS[0] },
    { label: 'Dispute Case', value: summary.byType.dispute, color: TYPE_COLORS[1] },
  ]
  drawPie(doc, 56, 138, 16, typeData)

  // Legend below pie, with enough spacing
  typeData.forEach((item, i) => {
    const lx = 18
    const ly = 158 + i * 8
    setFill(doc, item.color)
    doc.roundedRect(lx, ly - 2.5, 4, 4, 0.5, 0.5, 'F')
    setTextColor(doc, COLORS.textMuted)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`${item.label}: ${item.value}`, lx + 5.5, ly)
  })

  // Status bar chart
  card(doc, 111, 112, 85, 62)
  setTextColor(doc, COLORS.textMuted)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('By Status', 153, 120, { align: 'center' })

  const statusData = [
    { label: 'Active', value: summary.byStatus.active, color: COLORS.success },
    { label: 'Closed', value: summary.byStatus.closed, color: COLORS.slate },
    { label: 'On Hold', value: summary.byStatus.on_hold, color: COLORS.warning },
  ]
  drawBarV(doc, 111, 122, 85, 48, statusData)

  // ── Section: Institution breakdown (disputes) ──
  const disputeProjects = projects.filter(p => p.type === 'dispute')
  sectionTitle(doc, 14, 182, 'Dispute Case — Institution Breakdown')
  card(doc, 14, 188, 182, 42)

  const instEntries = Object.entries(institutionBreakdown) as [string, number][]
  const instData = instEntries.map(([k, v], i) => ({ label: k, value: v, color: INST_COLORS[i] || COLORS.slate }))
  drawBarV(doc, 14, 190, 182, 38, instData)

  setTextColor(doc, COLORS.textMuted)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total dispute cases: ${disputeProjects.length}`, 105, 232, { align: 'center' })

  // ── Footer page 1 ──
  setTextColor(doc, COLORS.textMuted)
  doc.setFontSize(6.5)
  doc.text('Page 1 of 3', 105, 290, { align: 'center' })
  doc.text('DocuMan — Confidential', 14, 290)

  // ── PAGE 2: Monthly Trend + Document Distribution ──────────────────────────
  doc.addPage()
  pageFill(doc)

  setFill(doc, COLORS.primary)
  doc.rect(0, 0, 210, 14, 'F')
  setTextColor(doc, [255, 255, 255])
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Project & Dispute Case Report', 14, 9)
  setTextColor(doc, [196, 181, 253])
  doc.setFontSize(7)
  doc.text(dateStr, 196, 9, { align: 'right' })

  // Monthly trend
  sectionTitle(doc, 14, 24, 'Monthly Creation Trend')
  card(doc, 14, 30, 182, 52)

  const last12 = (() => {
    const result: { label: string; value: number; color: [number, number, number] }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const found = monthlyTrend.find(m => m.month === key)
      result.push({ label: key.slice(5) + '/' + key.slice(2, 4), value: found ? found.count : 0, color: MONTH_COLOR })
    }
    return result
  })()
  drawBarV(doc, 14, 32, 182, 46, last12)

  // Document distribution per project (horizontal bar)
  sectionTitle(doc, 14, 92, 'Document Distribution per Project / Dispute Case')

  // Sort by total docs descending, take top 20
  const docDist = [...projects]
    .sort((a, b) => (b.linkedDocCount + b.supportingDocCount) - (a.linkedDocCount + a.supportingDocCount))
    .slice(0, 20)

  const chartH = Math.max(docDist.length * 10 + 12, 40)
  card(doc, 14, 98, 182, chartH)

  const distData = docDist.map((p, i) => ({
    label: p.name,
    value: p.linkedDocCount,
    color: [TYPE_COLORS[p.type === 'dispute' ? 1 : 0][0], TYPE_COLORS[p.type === 'dispute' ? 1 : 0][1], TYPE_COLORS[p.type === 'dispute' ? 1 : 0][2]] as [number, number, number]
  }))
  drawBarH(doc, 14, 98, 182, chartH, distData)

  // Legend for doc dist
  const distLegendY = 98 + chartH + 4
  setFill(doc, TYPE_COLORS[0])
  doc.roundedRect(14, distLegendY, 3.5, 3.5, 0.5, 0.5, 'F')
  setTextColor(doc, COLORS.textMuted)
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Project', 19, distLegendY + 2.8)
  setFill(doc, TYPE_COLORS[1])
  doc.roundedRect(36, distLegendY, 3.5, 3.5, 0.5, 0.5, 'F')
  doc.text('Dispute Case', 41, distLegendY + 2.8)
  doc.text('(showing linked document count; top 20 by total docs)', 14, distLegendY + 9)

  setTextColor(doc, COLORS.textMuted)
  doc.setFontSize(6.5)
  doc.text('Page 2 of 3', 105, 290, { align: 'center' })
  doc.text('DocuMan — Confidential', 14, 290)

  // ── PAGE 3: Full Data Table ────────────────────────────────────────────────
  doc.addPage()
  pageFill(doc)

  setFill(doc, COLORS.primary)
  doc.rect(0, 0, 210, 14, 'F')
  setTextColor(doc, [255, 255, 255])
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Complete Data — All Projects & Dispute Cases', 14, 9)
  setTextColor(doc, [196, 181, 253])
  doc.setFontSize(7)
  doc.text(dateStr, 196, 9, { align: 'right' })

  drawTable(doc, projects, 20)

  // Footer on last page
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    setTextColor(doc, COLORS.textMuted)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    if (p >= 3) {
      doc.text(`Page ${p} of ${totalPages}`, 105, 290, { align: 'center' })
      doc.text('DocuMan — Confidential', 14, 290)
    }
  }

  const fileName = `DocuMan_Project_Report_${now.toISOString().slice(0, 10)}.pdf`
  doc.save(fileName)
}
