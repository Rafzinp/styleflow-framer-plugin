import { framer } from "framer-plugin"
import { useState, useEffect } from "react"

interface Props {
  showToast: (msg: string, type?: "success" | "error" | "info") => void
}

interface Preset {
  id: string
  name: string
  styles: SavedStyle[]
  createdAt: number
}

interface SavedStyle {
  name: string
  fontFamily: string
  fontWeight: number | null
  fontSize: string
  lineHeight: string
  letterSpacing: string
}

const STORAGE_KEY = "styleflow_presets_v2"

function loadPresets(): Preset[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch {
    return []
  }
}

export function PresetsTab({ showToast }: Props) {
  const [presets, setPresets] = useState<Preset[]>(loadPresets)
  const [presetName, setPresetName] = useState("")
  const [loading, setLoading] = useState(false)
  const [applyingId, setApplyingId] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  }, [presets])

  const handleSave = async () => {
    if (!presetName.trim()) return
    setLoading(true)
    try {
      const styles = await framer.getTextStyles()
      if (styles.length === 0) {
        showToast("No text styles to save", "error")
        return
      }

      const saved: SavedStyle[] = styles.map((s) => ({
        name: s.name,
        fontFamily: s.font?.family ?? "Inter",
        fontWeight: s.font?.weight ?? 400,
        fontSize: String(s.fontSize),
        lineHeight: String(s.lineHeight),
        letterSpacing: String(s.letterSpacing),
      }))

      const preset: Preset = {
        id: Date.now().toString(),
        name: presetName.trim(),
        styles: saved,
        createdAt: Date.now(),
      }

      setPresets((prev) => [preset, ...prev])
      setPresetName("")
      showToast(`Saved "${preset.name}" — ${saved.length} styles`, "success")
    } catch {
      showToast("Failed to save preset", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (preset: Preset) => {
    setApplyingId(preset.id)
    let count = 0
    try {
      for (const s of preset.styles) {
        const weight = (s.fontWeight ?? 400) as 100|200|300|400|500|600|700|800|900
        const font = await framer.getFont(s.fontFamily, { weight })
        if (!font) continue
        await framer.createTextStyle({
          name: s.name,
          font,
          fontSize: s.fontSize as `${number}px`,
          lineHeight: s.lineHeight as `${number}%`,
          letterSpacing: s.letterSpacing as `${number}em`,
        })
        count++
      }
      showToast(`Applied ${count} styles from "${preset.name}"`, "success")
    } catch {
      showToast(`Applied ${count} styles (some failed)`, count > 0 ? "info" : "error")
    } finally {
      setApplyingId(null)
    }
  }

  const handleDelete = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id))
    showToast("Preset deleted", "info")
  }

  const handleExportJSON = (preset: Preset) => {
    const json = JSON.stringify(preset.styles, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${preset.name.replace(/\s+/g, "-")}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast("Exported JSON", "success")
  }

  const handleExportCSS = (preset: Preset) => {
    const lines = [":root {"]
    for (const s of preset.styles) {
      const varName = s.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-")
      lines.push(`  --type-${varName}-size: ${s.fontSize};`)
      lines.push(`  --type-${varName}-weight: ${s.fontWeight ?? 400};`)
      lines.push(`  --type-${varName}-family: "${s.fontFamily}";`)
      lines.push(`  --type-${varName}-line-height: ${s.lineHeight};`)
      lines.push(`  --type-${varName}-letter-spacing: ${s.letterSpacing};`)
    }
    lines.push("}")
    const blob = new Blob([lines.join("\n")], { type: "text/css" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${preset.name.replace(/\s+/g, "-")}.css`
    a.click()
    URL.revokeObjectURL(url)
    showToast("Exported CSS variables", "success")
  }

  return (
    <>
      <div className="section">
        <div className="section-title">Save Current Styles as Preset</div>
        <div className="card">
          <div style={{ marginBottom: 10 }}>
            <label className="label">Preset Name</label>
            <input
              className="input"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Brand 2025, Dark SaaS, Minimal..."
            />
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={loading || !presetName.trim()}>
            {loading ? <><span className="spinner" style={{ marginRight: 6 }} />Saving...</> : "Save Snapshot"}
          </button>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Saved Presets ({presets.length})</div>

        {presets.length === 0 && (
          <div className="empty-state">No presets yet. Save your current styles above.</div>
        )}

        {presets.map((preset) => (
          <div className="card" key={preset.id} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{preset.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  {preset.styles.length} styles · {new Date(preset.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button className="btn-sm danger" onClick={() => handleDelete(preset.id)}>Delete</button>
            </div>
            <div style={{ marginBottom: 8, maxHeight: 80, overflowY: "auto" }}>
              {preset.styles.slice(0, 5).map((s) => (
                <div key={s.name} style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 2 }}>
                  {s.name} — {s.fontFamily} {s.fontSize} w{s.fontWeight}
                </div>
              ))}
              {preset.styles.length > 5 && (
                <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                  +{preset.styles.length - 5} more...
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                className="btn-sm success"
                disabled={applyingId === preset.id}
                onClick={() => handleApply(preset)}
              >
                {applyingId === preset.id ? "Applying..." : "Apply"}
              </button>
              <button className="btn-sm neutral" onClick={() => handleExportJSON(preset)}>JSON</button>
              <button className="btn-sm neutral" onClick={() => handleExportCSS(preset)}>CSS Vars</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
