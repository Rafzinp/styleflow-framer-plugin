import { framer } from "framer-plugin";
import { useState, useEffect } from "react";

interface Props {
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

interface ColorToken {
  name: string;
  light: string;
  dark: string;
}

interface TextStyleInfo {
  name: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: number | null;
}

interface ExistingColorStyle {
  id: string;
  name: string;
  light: string;
  dark: string;
}

interface EditingColorStyle extends ExistingColorStyle {
  isEditing: boolean;
}

const PALETTES: Record<string, ColorToken[]> = {
  "Modern SaaS": [
    { name: "Primary", light: "#0066FF", dark: "#3385FF" },
    { name: "Primary Foreground", light: "#FFFFFF", dark: "#FFFFFF" },
    { name: "Background", light: "#FFFFFF", dark: "#0A0A0A" },
    { name: "Surface", light: "#F5F5F5", dark: "#1A1A1A" },
    { name: "Border", light: "#E0E0E0", dark: "#2A2A2A" },
    { name: "Text Primary", light: "#0A0A0A", dark: "#F0F0F0" },
    { name: "Text Secondary", light: "#666666", dark: "#999999" },
    { name: "Success", light: "#22C55E", dark: "#22C55E" },
    { name: "Warning", light: "#F59E0B", dark: "#F59E0B" },
    { name: "Danger", light: "#EF4444", dark: "#EF4444" },
  ],
  "Luxury Portfolio": [
    { name: "Primary", light: "#C9A96E", dark: "#D4B483" },
    { name: "Background", light: "#FAFAF8", dark: "#0D0D0B" },
    { name: "Surface", light: "#F0EEE8", dark: "#1A1917" },
    { name: "Border", light: "#DDD9D0", dark: "#2A2825" },
    { name: "Text Primary", light: "#1A1917", dark: "#F5F4F0" },
    { name: "Text Secondary", light: "#7A7570", dark: "#A09890" },
  ],
  "Startup Dark": [
    { name: "Primary", light: "#7C3AED", dark: "#8B5CF6" },
    { name: "Background", light: "#FAFAFA", dark: "#09090B" },
    { name: "Surface", light: "#F4F4F5", dark: "#18181B" },
    { name: "Border", light: "#E4E4E7", dark: "#27272A" },
    { name: "Text Primary", light: "#09090B", dark: "#FAFAFA" },
    { name: "Text Secondary", light: "#71717A", dark: "#A1A1AA" },
    { name: "Accent", light: "#06B6D4", dark: "#22D3EE" },
  ],
  "Warm Minimal": [
    { name: "Primary", light: "#D97706", dark: "#FBBF24" },
    { name: "Background", light: "#FFFBF5", dark: "#0C0A07" },
    { name: "Surface", light: "#FFF7ED", dark: "#1C1712" },
    { name: "Border", light: "#FDE68A", dark: "#2C2515" },
    { name: "Text Primary", light: "#1C1712", dark: "#FDF8F0" },
    { name: "Text Secondary", light: "#92400E", dark: "#D6A96A" },
  ],
};

export function TokensTab({ showToast }: Props) {
  const [selectedPalette, setSelectedPalette] = useState("Modern SaaS");
  const [colorPrefix, setColorPrefix] = useState("Brand/");
  const [textStyles, setTextStyles] = useState<TextStyleInfo[]>([]);
  const [loadingColors, setLoadingColors] = useState(false);
  const [loadingStyles, setLoadingStyles] = useState(false);
  const [newFont, setNewFont] = useState("");
  const [existingColors, setExistingColors] = useState<EditingColorStyle[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    loadExistingColors();
  }, []);

  const loadExistingColors = async () => {
    setLoadingExisting(true);
    try {
      const colors = await framer.getColorStyles();
      setExistingColors(
        colors.map((c) => ({
          id: c.id,
          name: c.name,
          light: c.light ?? "#000000",
          dark: c.dark ?? "#000000",
          isEditing: false,
        })),
      );
    } catch {
      showToast("Failed to load existing color styles", "error");
    } finally {
      setLoadingExisting(false);
    }
  };

  const updateColorStyle = async (style: EditingColorStyle) => {
    try {
      const colors = await framer.getColorStyles();
      const targetStyle = colors.find((c) => c.id === style.id);
      if (targetStyle) {
        await targetStyle.setAttributes({
          light: style.light,
          dark: style.dark,
        });
        showToast(`Updated "${style.name}"`, "success");
      }
    } catch {
      showToast("Failed to update color style", "error");
    }
  };

  const updateExistingColor = (
    index: number,
    field: "light" | "dark",
    value: string,
  ) => {
    const updated = [...existingColors];
    updated[index] = { ...updated[index], [field]: value };
    setExistingColors(updated);
  };

  const saveExistingColor = async (index: number) => {
    const style = existingColors[index];
    await updateColorStyle(style);
    const updated = [...existingColors];
    updated[index] = { ...updated[index], isEditing: false };
    setExistingColors(updated);
  };

  const toggleEditColor = (index: number) => {
    const updated = [...existingColors];
    updated[index] = {
      ...updated[index],
      isEditing: !updated[index].isEditing,
    };
    setExistingColors(updated);
  };

  const palette = PALETTES[selectedPalette];

  const handleApplyColors = async () => {
    setLoadingColors(true);
    try {
      let count = 0;
      for (const token of palette) {
        await framer.createColorStyle({
          name: `${colorPrefix}${token.name}`,
          light: token.light,
          dark: token.dark,
        });
        count++;
      }
      showToast(`Created ${count} color styles`, "success");
      loadExistingColors();
    } catch {
      showToast("Failed to create color styles", "error");
    } finally {
      setLoadingColors(false);
    }
  };

  const handleScanStyles = async () => {
    setLoadingStyles(true);
    try {
      const styles = await framer.getTextStyles();
      setTextStyles(
        styles.map((s) => ({
          name: s.name,
          fontFamily: s.font?.family ?? "Unknown",
          fontSize: String(s.fontSize),
          fontWeight: s.font?.weight ?? null,
        })),
      );
    } catch {
      showToast("Failed to scan styles", "error");
    } finally {
      setLoadingStyles(false);
    }
  };

  const handleSwapFont = async () => {
    if (!newFont.trim()) return;
    setLoadingStyles(true);
    try {
      const styles = await framer.getTextStyles();
      let count = 0;
      for (const s of styles) {
        const weight = (s.font?.weight ?? 400) as
          | 100
          | 200
          | 300
          | 400
          | 500
          | 600
          | 700
          | 800
          | 900;
        const font = await framer.getFont(newFont.trim(), { weight });
        if (!font) continue;
        await s.setAttributes({ font });
        count++;
      }
      showToast(`Swapped font to "${newFont}" on ${count} styles`, "success");
      handleScanStyles();
    } catch {
      showToast("Failed to swap fonts", "error");
    } finally {
      setLoadingStyles(false);
    }
  };

  return (
    <>
      <div className="section">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 7,
          }}
        >
          <div className="section-title" style={{ marginBottom: 0 }}>
            Existing Color Styles
          </div>
          <button
            className="btn-sm neutral"
            onClick={loadExistingColors}
            disabled={loadingExisting}
          >
            {loadingExisting ? "..." : "Refresh"}
          </button>
        </div>

        {existingColors.length === 0 ? (
          <div
            className="card"
            style={{ color: "var(--text-secondary)", fontSize: 12 }}
          >
            No color styles found. Create some from a palette below.
          </div>
        ) : (
          <div className="card">
            {existingColors.map((style, idx) => (
              <div
                key={style.id}
                style={{
                  marginBottom: idx < existingColors.length - 1 ? 10 : 0,
                }}
              >
                {!style.isEditing ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 0",
                    }}
                  >
                    <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          background: style.light,
                          border: "1px solid rgba(255,255,255,0.15)",
                          cursor: "pointer",
                        }}
                        title="Light mode color"
                      />
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          background: style.dark,
                          border: "1px solid rgba(255,255,255,0.1)",
                          cursor: "pointer",
                        }}
                        title="Dark mode color"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          marginBottom: 2,
                        }}
                      >
                        {style.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-secondary)",
                          fontFamily: "monospace",
                        }}
                      >
                        {style.light} / {style.dark}
                      </div>
                    </div>
                    <button
                      className="btn-sm neutral"
                      onClick={() => toggleEditColor(idx)}
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: "8px 0" }}>
                    <div
                      style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}
                    >
                      {style.name}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            fontSize: 10,
                            color: "var(--text-secondary)",
                            display: "block",
                            marginBottom: 3,
                          }}
                        >
                          Light
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={style.light}
                          onChange={(e) =>
                            updateExistingColor(idx, "light", e.target.value)
                          }
                          style={{ fontSize: 11 }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            fontSize: 10,
                            color: "var(--text-secondary)",
                            display: "block",
                            marginBottom: 3,
                          }}
                        >
                          Dark
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={style.dark}
                          onChange={(e) =>
                            updateExistingColor(idx, "dark", e.target.value)
                          }
                          style={{ fontSize: 11 }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn-secondary"
                        style={{ flex: 1, fontSize: 11 }}
                        onClick={() => toggleEditColor(idx)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-primary"
                        style={{ flex: 1, fontSize: 11 }}
                        onClick={() => saveExistingColor(idx)}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
                {idx < existingColors.length - 1 && (
                  <hr className="divider" style={{ margin: "10px 0 0" }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-title">Create from Palette</div>
        <div className="card">
          <div style={{ marginBottom: 10 }}>
            <label className="label">Theme</label>
            <select
              className="select"
              value={selectedPalette}
              onChange={(e) => setSelectedPalette(e.target.value)}
            >
              {Object.keys(PALETTES).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label className="label">Group Prefix</label>
            <input
              className="input"
              value={colorPrefix}
              onChange={(e) => setColorPrefix(e.target.value)}
              placeholder="Brand/, Colors/, etc."
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            {palette.map((token) => (
              <div
                key={token.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 5,
                }}
              >
                <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: token.light,
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  />
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: token.dark,
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, flex: 1 }}>{token.name}</span>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--text-secondary)",
                    fontFamily: "monospace",
                  }}
                >
                  {token.light}
                </span>
              </div>
            ))}
          </div>

          <button
            className="btn-primary"
            onClick={handleApplyColors}
            disabled={loadingColors}
          >
            {loadingColors ? (
              <>
                <span className="spinner" style={{ marginRight: 6 }} />
                Creating...
              </>
            ) : (
              `Apply ${palette.length} Color Styles`
            )}
          </button>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Global Font Swap</div>
        <div className="card">
          <div
            style={{
              fontSize: 11,
              color: "var(--text-secondary)",
              marginBottom: 10,
            }}
          >
            Replace the font family across all text styles at once.
          </div>
          <div style={{ marginBottom: 10 }}>
            <label className="label">New Font Family</label>
            <input
              className="input"
              value={newFont}
              onChange={(e) => setNewFont(e.target.value)}
              placeholder="Geist, Satoshi, Plus Jakarta Sans..."
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn-secondary"
              style={{ flex: 1 }}
              onClick={handleScanStyles}
              disabled={loadingStyles}
            >
              {loadingStyles ? "..." : "Scan"}
            </button>
            <button
              className="btn-primary"
              style={{ flex: 2 }}
              onClick={handleSwapFont}
              disabled={loadingStyles || !newFont.trim()}
            >
              {loadingStyles ? (
                <>
                  <span className="spinner" style={{ marginRight: 6 }} />
                  Swapping...
                </>
              ) : (
                "Swap Font"
              )}
            </button>
          </div>
        </div>
      </div>

      {textStyles.length > 0 && (
        <div className="section">
          <div className="section-title">
            Current Styles ({textStyles.length})
          </div>
          <div className="card" style={{ padding: "8px 10px" }}>
            {textStyles.map((s) => (
              <div key={s.name} className="style-row">
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                    {s.fontFamily}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span
                    style={{ fontSize: 11, color: "var(--text-secondary)" }}
                  >
                    {s.fontSize}
                  </span>
                  {s.fontWeight && (
                    <span
                      className="badge badge-blue"
                      style={{ marginLeft: 5 }}
                    >
                      w{s.fontWeight}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
