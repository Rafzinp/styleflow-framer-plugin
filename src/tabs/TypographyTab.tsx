import { framer } from "framer-plugin"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"

interface Props {
  showToast: (msg: string, type?: "success" | "error" | "info") => void
}

interface TStyle {
  id: string
  name: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  lineHeight: string
  letterSpacing: string
}

interface EditForm {
  fontFamily: string
  fontSize: number
  fontWeight: number
  lineHeight: string
  letterSpacing: string
}

const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const

function toWeight(n: number) {
  return n as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
}

const POPULAR_FONTS = [
  // Modern Sans
  "Inter", "Geist", "Plus Jakarta Sans", "DM Sans", "Manrope",
  "Syne", "Space Grotesk", "Outfit", "Urbanist", "Lexend",
  "Bricolage Grotesque", "Instrument Sans", "Switzer", "Figtree",
  "Be Vietnam Pro", "Nunito", "Raleway", "Poppins", "Lato",
  "Work Sans", "Jost", "Mulish", "Barlow", "Onest",
  "Source Sans 3", "IBM Plex Sans", "Libre Franklin", "Hanken Grotesk",
  // Display
  "Cabinet Grotesk", "Neue Montreal", "General Sans",
  "Clash Display", "Clash Grotesk",
  // Serif
  "Playfair Display", "Lora", "Merriweather", "EB Garamond",
  "Cormorant", "Libre Baskerville", "Source Serif 4",
  "DM Serif Display", "Fraunces", "Instrument Serif",
  // Mono
  "JetBrains Mono", "Fira Code", "Geist Mono",
  "IBM Plex Mono", "Space Mono",
]

// ── FontPicker ──────────────────────────────────────────────────────────────
function FontPicker({
  value,
  onChange,
  onHover,
  usedFonts = [],
  placeholder = "Font family…",
}: {
  value: string
  onChange: (f: string) => void
  onHover?: (f: string | null) => void
  usedFonts?: string[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [hi, setHi] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // keep query in sync when value changes externally
  useEffect(() => {
    if (!open) setQuery(value)
  }, [value, open])

  // close on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery(value)
        onHover?.(null)
      }
    }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [value, onHover])

  const q = query.toLowerCase()
  const inProject = usedFonts.filter((f) => f.toLowerCase().includes(q))
  const popular = POPULAR_FONTS.filter(
    (f) => !usedFonts.includes(f) && f.toLowerCase().includes(q),
  )
  const allOpts = [...inProject, ...popular]

  const select = (f: string) => {
    onChange(f)
    setQuery(f)
    setOpen(false)
    setHi(-1)
    onHover?.(null)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true)
        setHi(0)
      }
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHi((h) => Math.min(h + 1, allOpts.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHi((h) => Math.max(h - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (allOpts[hi]) select(allOpts[hi])
    } else if (e.key === "Escape") {
      setOpen(false)
      setQuery(value)
      onHover?.(null)
    }
  }

  return (
    <div ref={wrapRef} className="font-picker">
      <div
        className={`fp-trigger ${open ? "fp-open" : ""}`}
        onClick={() => {
          setOpen(true)
          inputRef.current?.focus()
        }}
      >
        <input
          ref={inputRef}
          className="fp-input"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setHi(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <svg
          className={`fp-chevron ${open ? "fp-chevron--open" : ""}`}
          viewBox="0 0 16 16"
          fill="none"
          width="10"
          height="10"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {open && allOpts.length > 0 && (
        <div className="fdrop">
          {inProject.length > 0 && (
            <>
              <div className="fdrop-label">In project</div>
              {inProject.map((f, i) => (
                <div
                  key={f}
                  className={`fdrop-opt ${hi === i ? "fdrop-opt--hi" : ""}`}
                  onMouseDown={() => select(f)}
                  onMouseEnter={() => {
                    setHi(i)
                    onHover?.(f)
                  }}
                  onMouseLeave={() => onHover?.(null)}
                >
                  <span>{f}</span>
                  <span className="fdrop-badge">in use</span>
                </div>
              ))}
            </>
          )}
          {popular.length > 0 && (
            <>
              <div className="fdrop-label">Popular</div>
              {popular.map((f, i) => {
                const idx = inProject.length + i
                return (
                  <div
                    key={f}
                    className={`fdrop-opt ${hi === idx ? "fdrop-opt--hi" : ""}`}
                    onMouseDown={() => select(f)}
                    onMouseEnter={() => {
                      setHi(idx)
                      onHover?.(f)
                    }}
                    onMouseLeave={() => onHover?.(null)}
                  >
                    {f}
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── TypographyTab ────────────────────────────────────────────────────────────
export function TypographyTab({ showToast }: Props) {
  const [styles, setStyles] = useState<TStyle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [hoveredFont, setHoveredFont] = useState<string | null>(null)
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkFont, setBulkFont] = useState("")
  const [bulkApplying, setBulkApplying] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newStyle, setNewStyle] = useState({
    name: "",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: 400,
    lineHeight: "150%",
    letterSpacing: "0em",
  })
  const [creating, setCreating] = useState(false)
  const [showReplace, setShowReplace] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const fetchStyles = useCallback(async () => {
    try {
      const raw = await framer.getTextStyles()
      setStyles(
        raw.map((s) => ({
          id: s.id,
          name: s.name,
          fontFamily: s.font?.family ?? "Unknown",
          fontSize: parseFloat(String(s.fontSize)) || 16,
          fontWeight: s.font?.weight ?? 400,
          lineHeight: s.lineHeight ?? "normal",
          letterSpacing: s.letterSpacing ?? "0em",
        })),
      )
    } catch {
      showToast("Failed to load styles", "error")
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchStyles()
  }, [fetchStyles])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExpandedId(null)
        setShowAdd(false)
        setShowReplace(false)
        setBulkMode(false)
        setSelected(new Set())
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

  const usedFonts = useMemo(
    () => [...new Set(styles.map((s) => s.fontFamily))].sort(),
    [styles],
  )

  const fontCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const s of styles) m[s.fontFamily] = (m[s.fontFamily] ?? 0) + 1
    return m
  }, [styles])

  const filtered = styles.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.fontFamily.toLowerCase().includes(search.toLowerCase()),
  )

  const groups: Record<string, TStyle[]> = {}
  for (const s of filtered) {
    const key = s.name.includes("/") ? s.name.split("/")[0] : "Ungrouped"
    if (!groups[key]) groups[key] = []
    groups[key].push(s)
  }

  const openEdit = (style: TStyle) => {
    if (bulkMode) {
      const next = new Set(selected)
      next.has(style.id) ? next.delete(style.id) : next.add(style.id)
      setSelected(next)
      return
    }
    if (expandedId === style.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(style.id)
    setHoveredFont(null)
    setEditForm({
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
    })
  }

  // One-click font apply — immediately writes to Framer on dropdown select
  const applyFont = async (style: TStyle, fontFamily: string) => {
    setApplyingId(style.id)
    // Optimistic local update
    setStyles((prev) =>
      prev.map((s) => (s.id === style.id ? { ...s, fontFamily } : s)),
    )
    if (editForm) setEditForm((p) => p && { ...p, fontFamily })

    try {
      const raw = await framer.getTextStyles()
      const target = raw.find((s) => s.id === style.id)
      if (!target) return
      const font = await framer.getFont(fontFamily, {
        weight: toWeight(editForm?.fontWeight ?? style.fontWeight),
      })
      if (!font) {
        showToast(`"${fontFamily}" not found in Framer`, "error")
        fetchStyles()
        return
      }
      await target.setAttributes({ font })
      showToast(`Applied ${fontFamily}`, "success")
    } catch {
      showToast("Apply failed", "error")
      fetchStyles()
    } finally {
      setApplyingId(null)
    }
  }

  // Replace a font family across all styles that use it
  const replaceFont = async (oldFont: string, newFont: string) => {
    if (!newFont.trim()) return
    try {
      const raw = await framer.getTextStyles()
      let count = 0
      for (const style of raw) {
        if ((style.font?.family ?? "Unknown") !== oldFont) continue
        const font = await framer.getFont(newFont, {
          weight: toWeight(style.font?.weight ?? 400),
        })
        if (!font) continue
        await style.setAttributes({ font })
        count++
      }
      showToast(
        `${oldFont} → ${newFont} · ${count} style${count !== 1 ? "s" : ""}`,
        "success",
      )
      fetchStyles()
    } catch {
      showToast("Replace failed", "error")
    }
  }

  const handleSave = async (style: TStyle) => {
    if (!editForm) return
    setSaving(true)
    try {
      const raw = await framer.getTextStyles()
      const target = raw.find((s) => s.id === style.id)
      if (!target) return
      const font = await framer.getFont(editForm.fontFamily, {
        weight: toWeight(editForm.fontWeight),
      })
      if (!font) {
        showToast(`"${editForm.fontFamily}" not found`, "error")
        return
      }
      await target.setAttributes({
        font,
        fontSize: `${editForm.fontSize}px` as `${number}px`,
        lineHeight: editForm.lineHeight as `${number}%`,
        letterSpacing: editForm.letterSpacing as `${number}em`,
      })
      showToast("Updated", "success")
      setExpandedId(null)
      fetchStyles()
    } catch {
      showToast("Save failed", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (style: TStyle) => {
    try {
      const raw = await framer.getTextStyles()
      const target = raw.find((s) => s.id === style.id)
      if (target) {
        await target.remove()
        showToast(`Removed "${style.name}"`, "info")
        setExpandedId(null)
        fetchStyles()
      }
    } catch {
      showToast("Remove failed", "error")
    }
  }

  const handleBulkApply = async () => {
    if (!bulkFont.trim() || !selected.size) return
    setBulkApplying(true)
    try {
      const raw = await framer.getTextStyles()
      let count = 0
      for (const id of selected) {
        const target = raw.find((s) => s.id === id)
        if (!target) continue
        const font = await framer.getFont(bulkFont.trim(), {
          weight: toWeight(target.font?.weight ?? 400),
        })
        if (!font) continue
        await target.setAttributes({ font })
        count++
      }
      showToast(`Updated ${count} style${count !== 1 ? "s" : ""}`, "success")
      setBulkMode(false)
      setSelected(new Set())
      setBulkFont("")
      fetchStyles()
    } catch {
      showToast("Bulk apply failed", "error")
    } finally {
      setBulkApplying(false)
    }
  }

  const handleCreate = async () => {
    if (!newStyle.name.trim()) return
    setCreating(true)
    try {
      const font = await framer.getFont(newStyle.fontFamily, {
        weight: toWeight(newStyle.fontWeight),
      })
      if (!font) {
        showToast(`"${newStyle.fontFamily}" not found`, "error")
        return
      }
      await framer.createTextStyle({
        name: newStyle.name.trim(),
        font,
        fontSize: `${newStyle.fontSize}px` as `${number}px`,
        lineHeight: newStyle.lineHeight as `${number}%`,
        letterSpacing: newStyle.letterSpacing as `${number}em`,
      })
      showToast(`Created "${newStyle.name}"`, "success")
      setShowAdd(false)
      setNewStyle({
        name: "",
        fontFamily: "Inter",
        fontSize: 16,
        fontWeight: 400,
        lineHeight: "150%",
        letterSpacing: "0em",
      })
      fetchStyles()
    } catch {
      showToast("Create failed", "error")
    } finally {
      setCreating(false)
    }
  }

  const multipleGroups = Object.keys(groups).length > 1

  return (
    <div className="tab-pane">
      {/* Search + toolbar */}
      <div className="search-bar">
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="M10.5 10.5L13 13"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={searchRef}
            className="search-input"
            placeholder="Search styles… (/)"
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
          <button
            className={`icon-btn ${showReplace ? "on" : ""}`}
            title="Quick font replace"
            onClick={() => {
              setShowReplace((v) => !v)
              setShowAdd(false)
            }}
          >
            {/* swap icon */}
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
              <path
                d="M2 5h9M2 11h9"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M13 3v10M11 5l2-2 2 2M11 13l2-2 2 2"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className={`icon-btn ${bulkMode ? "on" : ""}`}
            title="Bulk edit"
            onClick={() => {
              setBulkMode((v) => !v)
              setSelected(new Set())
            }}
          >
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
              <rect x="2" y="3" width="12" height="1.8" rx="0.9" fill="currentColor" />
              <rect x="2" y="7.1" width="12" height="1.8" rx="0.9" fill="currentColor" />
              <rect x="2" y="11.2" width="7" height="1.8" rx="0.9" fill="currentColor" />
            </svg>
          </button>
          <button className="icon-btn" title="Refresh" onClick={fetchStyles}>
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
              <path
                d="M13 8A5 5 0 1 1 8 3c1.4 0 2.6.5 3.5 1.4L13 6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M9.5 6H13V2.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className={`icon-btn ${showAdd ? "on" : "primary"}`}
            title="New style"
            onClick={() => {
              setShowAdd((v) => !v)
              setShowReplace(false)
            }}
          >
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
              <path
                d="M8 3v10M3 8h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Replace panel */}
      {showReplace && (
        <div className="replace-panel">
          <div className="replace-panel-head">
            <span className="replace-panel-title">
              Quick Replace
            </span>
            <span className="replace-panel-hint">
              {usedFonts.length} font{usedFonts.length !== 1 ? "s" : ""} in use
            </span>
          </div>
          {usedFonts.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: 11, color: "var(--text-2)" }}>
              No styles loaded — click refresh first.
            </div>
          ) : (
            <div className="replace-body">
              {usedFonts.map((font) => (
                <div key={font} className="replace-row">
                  <div className="replace-from">
                    <span className="replace-font-name">{font}</span>
                    <span className="replace-count">{fontCounts[font]}×</span>
                  </div>
                  <span className="replace-arrow">→</span>
                  <div className="replace-to">
                    <FontPicker
                      value=""
                      onChange={(newFont) => replaceFont(font, newFont)}
                      usedFonts={usedFonts}
                      placeholder="Replace with…"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bulk bar */}
      {bulkMode && (
        <div className="bulk-bar">
          <span className="bulk-count">{selected.size} selected</span>
          <div style={{ flex: 1 }}>
            <FontPicker
              value={bulkFont}
              onChange={(f) => setBulkFont(f)}
              usedFonts={usedFonts}
              placeholder="Replace with font…"
            />
          </div>
          <button
            className="bulk-btn"
            onClick={handleBulkApply}
            disabled={!bulkFont.trim() || !selected.size || bulkApplying}
          >
            {bulkApplying ? "…" : "Apply"}
          </button>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="inline-form">
          <div className="form-title">New Text Style</div>
          <input
            className="f-input"
            placeholder="Name — e.g. Brand/Heading L"
            value={newStyle.name}
            onChange={(e) => setNewStyle((p) => ({ ...p, name: e.target.value }))}
          />
          <div className="f-row">
            <div className="f-col">
              <label className="f-label">Font family</label>
              <FontPicker
                value={newStyle.fontFamily}
                onChange={(f) => setNewStyle((p) => ({ ...p, fontFamily: f }))}
                usedFonts={usedFonts}
              />
            </div>
            <div className="f-col-sm">
              <label className="f-label">Size</label>
              <input
                className="f-input"
                type="number"
                value={newStyle.fontSize}
                onChange={(e) =>
                  setNewStyle((p) => ({ ...p, fontSize: Number(e.target.value) }))
                }
              />
            </div>
          </div>
          <div className="f-row">
            <div className="f-col">
              <label className="f-label">Weight</label>
              <select
                className="f-select"
                value={newStyle.fontWeight}
                onChange={(e) =>
                  setNewStyle((p) => ({ ...p, fontWeight: Number(e.target.value) }))
                }
              >
                {WEIGHTS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
            <div className="f-col">
              <label className="f-label">Line height</label>
              <input
                className="f-input"
                value={newStyle.lineHeight}
                onChange={(e) =>
                  setNewStyle((p) => ({ ...p, lineHeight: e.target.value }))
                }
                placeholder="150%"
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
            <button
              className="btn-accent"
              onClick={handleCreate}
              disabled={creating || !newStyle.name.trim()}
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Style list */}
      <div className="style-list">
        {loading ? (
          <div className="empty-state">
            <span className="spinner" />
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg
              className="empty-icon"
              viewBox="0 0 24 24"
              fill="none"
              width="28"
              height="28"
            >
              <path
                d="M4 7h16M7 12h10M9 17h6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            {search ? `No match for "${search}"` : "No text styles yet"}
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
              {list.map((style) => (
                <div key={style.id}>
                  <div
                    className={`srow ${expandedId === style.id ? "expanded" : ""} ${selected.has(style.id) ? "selected" : ""}`}
                    onClick={() => openEdit(style)}
                  >
                    {bulkMode && (
                      <div className={`check ${selected.has(style.id) ? "on" : ""}`} />
                    )}
                    <div
                      className="srow-preview"
                      style={{
                        fontFamily: style.fontFamily,
                        fontWeight: style.fontWeight,
                      }}
                    >
                      Aa
                    </div>
                    <div className="srow-info">
                      <div className="srow-name">
                        {style.name.includes("/")
                          ? style.name.split("/").slice(1).join("/")
                          : style.name}
                      </div>
                      <div className="srow-meta">
                        {style.fontFamily} · {style.fontWeight}
                      </div>
                    </div>
                    <span className="srow-tag">{style.fontSize}px</span>
                  </div>

                  {expandedId === style.id && editForm && (
                    <div className="editor">
                      {/* Live preview — updates on dropdown hover */}
                      <div
                        className="editor-preview"
                        style={{
                          fontFamily: hoveredFont ?? editForm.fontFamily,
                          fontWeight: editForm.fontWeight,
                          fontSize: Math.min(editForm.fontSize, 40),
                          lineHeight: editForm.lineHeight,
                        }}
                      >
                        The quick brown fox
                      </div>

                      {/* Font picker — one-click apply on select */}
                      <div style={{ marginBottom: 6, position: "relative" }}>
                        <label className="f-label">
                          Font family
                          {applyingId === style.id && (
                            <span
                              className="spinner"
                              style={{
                                width: 10,
                                height: 10,
                                borderWidth: 1.5,
                                marginLeft: 6,
                                verticalAlign: "middle",
                              }}
                            />
                          )}
                        </label>
                        <FontPicker
                          value={editForm.fontFamily}
                          onChange={(f) => applyFont(style, f)}
                          onHover={setHoveredFont}
                          usedFonts={usedFonts}
                        />
                      </div>

                      <div className="f-row">
                        <div className="f-col-sm">
                          <label className="f-label">Size</label>
                          <input
                            className="f-input"
                            type="number"
                            value={editForm.fontSize}
                            onChange={(e) =>
                              setEditForm(
                                (p) => p && { ...p, fontSize: Number(e.target.value) },
                              )
                            }
                          />
                        </div>
                        <div className="f-col">
                          <label className="f-label">Weight</label>
                          <select
                            className="f-select"
                            value={editForm.fontWeight}
                            onChange={(e) =>
                              setEditForm(
                                (p) =>
                                  p && { ...p, fontWeight: Number(e.target.value) },
                              )
                            }
                          >
                            {WEIGHTS.map((w) => (
                              <option key={w} value={w}>
                                {w}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="f-col">
                          <label className="f-label">Line height</label>
                          <input
                            className="f-input"
                            value={editForm.lineHeight}
                            onChange={(e) =>
                              setEditForm((p) => p && { ...p, lineHeight: e.target.value })
                            }
                            placeholder="150%"
                          />
                        </div>
                      </div>

                      <div className="editor-footer">
                        <button
                          className="btn-danger"
                          onClick={() => handleDelete(style)}
                        >
                          Delete
                        </button>
                        <div className="editor-footer-r">
                          <button
                            className="btn-ghost"
                            onClick={() => setExpandedId(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn-accent"
                            onClick={() => handleSave(style)}
                            disabled={saving}
                          >
                            {saving ? "Saving…" : "Apply All"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div className="list-footer">
        <span>
          {filtered.length} of {styles.length} style{styles.length !== 1 ? "s" : ""}
        </span>
        {bulkMode && selected.size > 0 && (
          <span style={{ color: "var(--accent)" }}>{selected.size} selected</span>
        )}
      </div>
    </div>
  )
}
