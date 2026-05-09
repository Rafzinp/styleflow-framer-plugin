import { framer } from "framer-plugin"
import { useState, useEffect, useCallback, useRef } from "react"

interface Props {
  showToast: (msg: string, type?: "success" | "error" | "info") => void
}

interface CStyle {
  id: string
  name: string
  light: string
  dark: string
}

const RECENT_KEY = "sf_recent_colors"
const MAX_RECENT = 10

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]")
  } catch {
    return []
  }
}

function saveRecent(color: string) {
  const list = loadRecent()
  const next = [color, ...list.filter((c) => c !== color)].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
}

function toHex(color: string): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color.toUpperCase()
  if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
    const [r, g, b] = color.slice(1).split("")
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return color
}

function toPickerHex(color: string): string {
  const h = toHex(color)
  return /^#[0-9A-Fa-f]{6}$/.test(h) ? h : "#000000"
}

function hexToRgb(hex: string): string {
  const h = toHex(hex)
  if (!/^#[0-9A-Fa-f]{6}$/.test(h)) return "—"
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  return `${r} ${g} ${b}`
}

function contrastColor(hex: string): string {
  const h = toHex(hex)
  if (!/^#[0-9A-Fa-f]{6}$/.test(h)) return "#fff"
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.55 ? "#000" : "#fff"
}

export function ColorTab({ showToast }: Props) {
  const [colors, setColors] = useState<CStyle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLight, setEditLight] = useState("#000000")
  const [editDark, setEditDark] = useState("#000000")
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [recent, setRecent] = useState<string[]>(loadRecent)
  const [showRecent, setShowRecent] = useState(false)
  const [mode, setMode] = useState<"light" | "dark">("light")
  const [showAdd, setShowAdd] = useState(false)
  const [newColor, setNewColor] = useState({
    name: "",
    light: "#000000",
    dark: "#ffffff",
  })
  const [creating, setCreating] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const fetchColors = useCallback(async () => {
    try {
      const raw = await framer.getColorStyles()
      setColors(
        raw.map((c) => ({
          id: c.id,
          name: c.name,
          light: c.light ?? "#000000",
          dark: c.dark ?? "#000000",
        })),
      )
    } catch {
      showToast("Failed to load colors", "error")
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchColors()
  }, [fetchColors])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditingId(null)
        setShowAdd(false)
      }
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const filtered = colors.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.light.toLowerCase().includes(search.toLowerCase()) ||
      c.dark.toLowerCase().includes(search.toLowerCase()),
  )

  const groups: Record<string, CStyle[]> = {}
  for (const c of filtered) {
    const key = c.name.includes("/") ? c.name.split("/")[0] : "Ungrouped"
    if (!groups[key]) groups[key] = []
    groups[key].push(c)
  }

  const openEdit = (color: CStyle) => {
    if (editingId === color.id) {
      setEditingId(null)
      return
    }
    setEditingId(color.id)
    setEditLight(color.light)
    setEditDark(color.dark)
  }

  const handleSave = async (color: CStyle) => {
    setSaving(true)
    try {
      const raw = await framer.getColorStyles()
      const target = raw.find((c) => c.id === color.id)
      if (!target) return
      await target.setAttributes({ light: editLight, dark: editDark })
      saveRecent(editLight)
      setRecent(loadRecent())
      showToast("Updated", "success")
      setEditingId(null)
      fetchColors()
    } catch {
      showToast("Save failed", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (color: CStyle) => {
    try {
      const raw = await framer.getColorStyles()
      const target = raw.find((c) => c.id === color.id)
      if (target) {
        await target.remove()
        showToast(`Removed "${color.name}"`, "info")
        setEditingId(null)
        fetchColors()
      }
    } catch {
      showToast("Remove failed", "error")
    }
  }

  const handleCreate = async () => {
    if (!newColor.name.trim()) return
    setCreating(true)
    try {
      await framer.createColorStyle({
        name: newColor.name.trim(),
        light: newColor.light,
        dark: newColor.dark,
      })
      showToast(`Created "${newColor.name}"`, "success")
      setShowAdd(false)
      setNewColor({ name: "", light: "#000000", dark: "#ffffff" })
      fetchColors()
    } catch {
      showToast("Create failed", "error")
    } finally {
      setCreating(false)
    }
  }

  const copyHex = (color: CStyle, e: React.MouseEvent) => {
    e.stopPropagation()
    const hex = toHex(mode === "light" ? color.light : color.dark)
    navigator.clipboard.writeText(hex).then(() => {
      setCopiedId(color.id)
      setTimeout(() => setCopiedId(null), 1400)
    })
  }

  const multipleGroups = Object.keys(groups).length > 1

  return (
    <div className="tab-pane">
      {/* Search + toolbar */}
      <div className="search-bar">
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            ref={searchRef}
            className="search-input"
            placeholder="Search colors… (/)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}>
              ✕
            </button>
          )}
        </div>
        <div className="toolbar">
          {/* Light/dark mode toggle */}
          <div className="mode-pill">
            <button
              className={`mode-option ${mode === "light" ? "active" : ""}`}
              onClick={() => setMode("light")}
            >
              L
            </button>
            <button
              className={`mode-option ${mode === "dark" ? "active" : ""}`}
              onClick={() => setMode("dark")}
            >
              D
            </button>
          </div>
          <button className="icon-btn" title="Refresh" onClick={fetchColors}>
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
              <path d="M13 8A5 5 0 1 1 8 3c1.4 0 2.6.5 3.5 1.4L13 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M9.5 6H13V2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className={`icon-btn ${showAdd ? "on" : "primary"}`}
            title="Add color"
            onClick={() => setShowAdd((v) => !v)}
          >
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="inline-form">
          <div className="form-title">New Color Style</div>
          <input
            className="f-input"
            placeholder="Name — e.g. Brand/Primary"
            value={newColor.name}
            onChange={(e) => setNewColor((p) => ({ ...p, name: e.target.value }))}
          />
          <div className="f-row" style={{ marginTop: 8 }}>
            <div className="f-col">
              <label className="f-label">Light</label>
              <div className="color-input-row">
                <input
                  type="color"
                  className="color-picker"
                  value={toPickerHex(newColor.light)}
                  onChange={(e) => setNewColor((p) => ({ ...p, light: e.target.value }))}
                />
                <input
                  className="f-input mono"
                  value={newColor.light}
                  onChange={(e) => setNewColor((p) => ({ ...p, light: e.target.value }))}
                  placeholder="#000000"
                />
              </div>
            </div>
            <div className="f-col">
              <label className="f-label">Dark</label>
              <div className="color-input-row">
                <input
                  type="color"
                  className="color-picker"
                  value={toPickerHex(newColor.dark)}
                  onChange={(e) => setNewColor((p) => ({ ...p, dark: e.target.value }))}
                />
                <input
                  className="f-input mono"
                  value={newColor.dark}
                  onChange={(e) => setNewColor((p) => ({ ...p, dark: e.target.value }))}
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
            <button
              className="btn-accent"
              onClick={handleCreate}
              disabled={creating || !newColor.name.trim()}
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Recent colors */}
      {recent.length > 0 && (
        <div className="recent-bar">
          <div className="recent-header" onClick={() => setShowRecent((v) => !v)}>
            <span className="recent-label">Recent</span>
            <svg
              className={`recent-chevron ${showRecent ? "open" : ""}`}
              viewBox="0 0 16 16"
              fill="none"
              width="10"
              height="10"
            >
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          {showRecent && (
            <div className="recent-swatches">
              {recent.map((c, i) => (
                <button
                  key={i}
                  className="rswatch"
                  style={{ background: c }}
                  title={toHex(c)}
                  onClick={() => {
                    if (editingId) setEditLight(c)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* List */}
      <div className="style-list">
        {loading ? (
          <div className="empty-state">
            <span className="spinner" />
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" viewBox="0 0 24 24" fill="none" width="28" height="28">
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 4v8l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {search ? `No match for "${search}"` : "No color styles yet"}
          </div>
        ) : (
          Object.entries(groups).map(([group, list]) => (
            <div key={group}>
              {multipleGroups && (
                <div className="group-header">
                  {group}
                  <span className="group-count">{list.length}</span>
                </div>
              )}
              {list.map((color) => {
                const displayColor = mode === "light" ? color.light : color.dark
                const hex = toHex(displayColor)

                return (
                  <div key={color.id}>
                    {editingId !== color.id ? (
                      <div
                        className={`crow ${editingId === color.id ? "expanded" : ""}`}
                        onClick={() => openEdit(color)}
                      >
                        <div className="swatch" style={{ background: displayColor }} />
                        <div className="crow-info">
                          <div className="crow-name">
                            {color.name.includes("/")
                              ? color.name.split("/").slice(1).join("/")
                              : color.name}
                          </div>
                          <div>
                            <span className="crow-hex">{hex}</span>
                            <span className="crow-rgb"> · {hexToRgb(displayColor)}</span>
                          </div>
                        </div>
                        <button
                          className={`copy-btn ${copiedId === color.id ? "done" : ""}`}
                          onClick={(e) => copyHex(color, e)}
                          title="Copy HEX"
                        >
                          {copiedId === color.id ? (
                            "✓"
                          ) : (
                            <svg viewBox="0 0 16 16" fill="none" width="11" height="11">
                              <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                              <path d="M3 11V3h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="color-editor">
                        <div className="color-editor-head">
                          <div className="color-editor-name">{color.name}</div>
                          <button className="btn-ghost" onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </div>

                        {/* Preview bar */}
                        <div className="preview-bar">
                          <div
                            className="preview-half"
                            style={{ background: editLight }}
                          >
                            <span
                              className="preview-half-label"
                              style={{ color: contrastColor(editLight) }}
                            >
                              Light
                            </span>
                          </div>
                          <div
                            className="preview-half"
                            style={{ background: editDark }}
                          >
                            <span
                              className="preview-half-label"
                              style={{ color: contrastColor(editDark) }}
                            >
                              Dark
                            </span>
                          </div>
                        </div>

                        <div className="color-fields">
                          <div className="color-field">
                            <label className="f-label">Light mode</label>
                            <div className="color-input-row">
                              <input
                                type="color"
                                className="color-picker"
                                value={toPickerHex(editLight)}
                                onChange={(e) => setEditLight(e.target.value)}
                              />
                              <input
                                className="f-input mono"
                                value={editLight}
                                onChange={(e) => setEditLight(e.target.value)}
                                placeholder="#000000"
                              />
                            </div>
                          </div>
                          <div className="color-field">
                            <label className="f-label">Dark mode</label>
                            <div className="color-input-row">
                              <input
                                type="color"
                                className="color-picker"
                                value={toPickerHex(editDark)}
                                onChange={(e) => setEditDark(e.target.value)}
                              />
                              <input
                                className="f-input mono"
                                value={editDark}
                                onChange={(e) => setEditDark(e.target.value)}
                                placeholder="#ffffff"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="editor-footer" style={{ marginTop: 10 }}>
                          <button className="btn-danger" onClick={() => handleDelete(color)}>
                            Delete
                          </button>
                          <button
                            className="btn-accent"
                            onClick={() => handleSave(color)}
                            disabled={saving}
                          >
                            {saving ? "Saving…" : "Apply"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      <div className="list-footer">
        <span>
          {filtered.length} of {colors.length} color{colors.length !== 1 ? "s" : ""}
        </span>
        <span style={{ color: "var(--text-3)" }}>
          {mode === "light" ? "Light mode" : "Dark mode"}
        </span>
      </div>
    </div>
  )
}
