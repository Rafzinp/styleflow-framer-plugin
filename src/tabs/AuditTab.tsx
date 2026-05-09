import { framer } from "framer-plugin"
import { useState } from "react"

interface Props {
  showToast: (msg: string, type?: "success" | "error" | "info") => void
}

interface StyleInfo {
  id: string
  name: string
  fontFamily: string
  fontSize: string
  fontWeight: number | null
}

interface DuplicateGroup {
  key: string
  styles: StyleInfo[]
}

interface HealthReport {
  total: number
  duplicateGroups: DuplicateGroup[]
  noNamePrefix: StyleInfo[]
  score: number
}

function scoreClass(score: number) {
  if (score >= 75) return "good"
  if (score >= 50) return "warn"
  return "bad"
}

function parsePx(val: unknown): number {
  if (typeof val === "number") return val
  if (typeof val === "string") return parseFloat(val) || 0
  return 0
}

export function AuditTab({ showToast }: Props) {
  const [report, setReport] = useState<HealthReport | null>(null)
  const [loading, setLoading] = useState(false)

  const runAudit = async () => {
    setLoading(true)
    try {
      const styles = await framer.getTextStyles()

      const infos: StyleInfo[] = styles.map((s) => ({
        id: s.id,
        name: s.name,
        fontFamily: s.font?.family ?? "Unknown",
        fontSize: String(s.fontSize),
        fontWeight: s.font?.weight ?? null,
      }))

      const groups: Record<string, StyleInfo[]> = {}
      for (const s of infos) {
        const key = `${s.fontFamily}|${parsePx(s.fontSize).toFixed(0)}px|w${s.fontWeight ?? "?"}`
        if (!groups[key]) groups[key] = []
        groups[key].push(s)
      }

      const duplicateGroups: DuplicateGroup[] = Object.entries(groups)
        .filter(([, v]) => v.length > 1)
        .map(([key, styles]) => ({ key, styles }))

      const noNamePrefix = infos.filter((s) => !s.name.includes("/"))

      const issues = duplicateGroups.length + Math.floor(noNamePrefix.length / 2)
      const score = Math.max(0, Math.min(100, Math.round(100 - (issues / Math.max(infos.length, 1)) * 100)))

      setReport({ total: infos.length, duplicateGroups, noNamePrefix, score })
    } catch {
      showToast("Failed to scan styles", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStyle = async (name: string) => {
    try {
      const styles = await framer.getTextStyles()
      const match = styles.find((s) => s.name === name)
      if (match) {
        await match.remove()
        showToast(`Removed "${name}"`, "success")
        runAudit()
      }
    } catch {
      showToast("Could not remove style", "error")
    }
  }

  return (
    <>
      <div className="section">
        <div className="section-title">Typography Health</div>
        <button className="btn-primary" onClick={runAudit} disabled={loading}>
          {loading ? <><span className="spinner" style={{ marginRight: 6 }} />Scanning...</> : "Scan Current Project"}
        </button>
      </div>

      {report && (
        <>
          <div className="section">
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className={`score-circle ${scoreClass(report.score)}`}>{report.score}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Health Score</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {report.total} text styles total<br />
                    {report.duplicateGroups.length} duplicate group{report.duplicateGroups.length !== 1 ? "s" : ""}<br />
                    {report.noNamePrefix.length} unorganized style{report.noNamePrefix.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {report.duplicateGroups.length > 0 && (
            <div className="section">
              <div className="section-title">Duplicate Styles ({report.duplicateGroups.length})</div>
              {report.duplicateGroups.map((group) => (
                <div className="card" key={group.key} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 8 }}>
                    {group.key.replace(/\|/g, " · ")}
                    <span className="badge badge-yellow" style={{ marginLeft: 6 }}>
                      {group.styles.length}×
                    </span>
                  </div>
                  {group.styles.map((s) => (
                    <div
                      key={s.name}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}
                    >
                      <span style={{ fontSize: 12 }}>{s.name}</span>
                      <button className="btn-sm danger" onClick={() => handleDeleteStyle(s.name)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {report.noNamePrefix.length > 0 && (
            <div className="section">
              <div className="section-title">Unorganized Styles ({report.noNamePrefix.length})</div>
              <div className="card" style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>
                  Add a group prefix — e.g. rename "Heading" to "Brand/Heading"
                </div>
                {report.noNamePrefix.map((s) => (
                  <div key={s.name} className="style-row">
                    <span style={{ fontSize: 12 }}>{s.name}</span>
                    <span className="badge badge-yellow">No prefix</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.duplicateGroups.length === 0 && report.noNamePrefix.length === 0 && (
            <div className="empty-state">
              <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
              Your typography is clean!
            </div>
          )}
        </>
      )}

      {!report && !loading && (
        <div className="empty-state">Run a scan to check your project's typography health.</div>
      )}
    </>
  )
}
