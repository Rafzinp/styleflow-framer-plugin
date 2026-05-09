import { framer } from "framer-plugin";
import { useState } from "react";

interface Props {
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

interface StyleInfo {
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
}

interface DetectedFont {
  family: string;
  styles: StyleInfo[];
  replacement: string;
}

export function FontsTab({ showToast }: Props) {
  const [detectedFonts, setDetectedFonts] = useState<DetectedFont[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const scanFonts = async () => {
    setIsScanning(true);
    setShowPreview(false);
    try {
      const styles = await framer.getTextStyles();
      const fontMap = new Map<string, StyleInfo[]>();

      for (const s of styles) {
        const family = s.font?.family ?? "Unknown";
        if (!fontMap.has(family)) fontMap.set(family, []);
        fontMap.get(family)!.push({
          name: s.name,
          fontFamily: family,
          fontSize: s.fontSize ?? 16,
          fontWeight: s.font?.weight ?? 400,
        });
      }

      setDetectedFonts(
        Array.from(fontMap.entries())
          .sort((a, b) => b[1].length - a[1].length)
          .map(([family, styleList]) => ({
            family,
            styles: styleList,
            replacement: "",
          })),
      );
    } catch {
      showToast("Failed to scan fonts", "error");
    } finally {
      setIsScanning(false);
    }
  };

  const updateReplacement = (family: string, value: string) => {
    setDetectedFonts((prev) =>
      prev.map((f) => (f.family === family ? { ...f, replacement: value } : f)),
    );
    setShowPreview(false);
  };

  const pendingMappings = detectedFonts.filter((f) => f.replacement.trim());
  const totalAffected = pendingMappings.reduce((s, f) => s + f.styles.length, 0);
  const totalStyles = detectedFonts.reduce((s, f) => s + f.styles.length, 0);

  const handleApply = async () => {
    if (!pendingMappings.length) return;
    setIsApplying(true);
    try {
      const fontReplacementMap = new Map(
        pendingMappings.map((m) => [m.family, m.replacement.trim()]),
      );
      const allStyles = await framer.getTextStyles();
      let count = 0;

      for (const style of allStyles) {
        const currentFamily = style.font?.family ?? "Unknown";
        const newFamily = fontReplacementMap.get(currentFamily);
        if (!newFamily) continue;

        const weight = (style.font?.weight ?? 400) as
          | 100
          | 200
          | 300
          | 400
          | 500
          | 600
          | 700
          | 800
          | 900;

        const font = await framer.getFont(newFamily, { weight });
        if (!font) continue;

        await style.setAttributes({ font });
        count++;
      }

      showToast(
        `Replaced fonts across ${count} text style${count !== 1 ? "s" : ""}`,
        "success",
      );
      await scanFonts();
    } catch {
      showToast("Failed to apply font replacements", "error");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      {/* Detection */}
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
            Font Detection
          </div>
          <button
            className="btn-sm neutral"
            onClick={scanFonts}
            disabled={isScanning}
          >
            {isScanning ? "Scanning…" : detectedFonts.length ? "Re-scan" : "Scan Fonts"}
          </button>
        </div>

        {detectedFonts.length === 0 ? (
          <div
            className="card"
            style={{ color: "var(--text-secondary)", fontSize: 12 }}
          >
            Scan your project to detect all font families used across text
            styles.
          </div>
        ) : (
          <div
            className="card"
            style={{ fontSize: 11, color: "var(--text-secondary)" }}
          >
            Found{" "}
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {detectedFonts.length}
            </span>{" "}
            font {detectedFonts.length === 1 ? "family" : "families"} across{" "}
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {totalStyles}
            </span>{" "}
            text {totalStyles === 1 ? "style" : "styles"}.
          </div>
        )}
      </div>

      {/* Mapping */}
      {detectedFonts.length > 0 && (
        <div className="section">
          <div className="section-title">Font Mapping</div>
          <div className="card" style={{ padding: "10px 12px" }}>
            {detectedFonts.map((font, idx) => (
              <div
                key={font.family}
                style={{
                  marginBottom: idx < detectedFonts.length - 1 ? 14 : 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600 }}>
                    {font.family}
                  </span>
                  <span className="badge badge-blue">
                    {font.styles.length}{" "}
                    {font.styles.length === 1 ? "style" : "styles"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      flexShrink: 0,
                    }}
                  >
                    →
                  </span>
                  <input
                    className="input"
                    style={{ fontSize: 12 }}
                    value={font.replacement}
                    onChange={(e) =>
                      updateReplacement(font.family, e.target.value)
                    }
                    placeholder="Replacement font name…"
                  />
                </div>
                {idx < detectedFonts.length - 1 && (
                  <hr className="divider" style={{ margin: "14px 0 0" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {pendingMappings.length > 0 && (
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
              Preview Changes
            </div>
            <button
              className="btn-sm neutral"
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? "Hide" : "Show"}
            </button>
          </div>

          {!showPreview ? (
            <div
              className="card"
              style={{ fontSize: 11, color: "var(--text-secondary)" }}
            >
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {totalAffected}
              </span>{" "}
              text {totalAffected === 1 ? "style" : "styles"} across{" "}
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {pendingMappings.length}
              </span>{" "}
              font {pendingMappings.length === 1 ? "family" : "families"} will
              be updated.
            </div>
          ) : (
            <div className="card" style={{ padding: "8px 10px" }}>
              {pendingMappings.flatMap((mapping) =>
                mapping.styles.map((s, i) => (
                  <div
                    key={`${mapping.family}-${i}`}
                    className="style-row"
                    style={{ cursor: "default" }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          marginBottom: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.name}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                        <span style={{ textDecoration: "line-through" }}>
                          {s.fontFamily}
                        </span>
                        {" → "}
                        <span style={{ color: "var(--accent)" }}>
                          {mapping.replacement}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        flexShrink: 0,
                        fontSize: 10,
                        color: "var(--text-secondary)",
                        textAlign: "right",
                      }}
                    >
                      {s.fontSize}px
                      <br />
                      w{s.fontWeight}
                    </div>
                  </div>
                )),
              )}
            </div>
          )}
        </div>
      )}

      {/* Apply */}
      {detectedFonts.length > 0 && (
        <div className="section">
          <button
            className="btn-primary"
            onClick={handleApply}
            disabled={isApplying || pendingMappings.length === 0}
          >
            {isApplying ? (
              <>
                <span className="spinner" style={{ marginRight: 6 }} />
                Applying…
              </>
            ) : pendingMappings.length === 0 ? (
              "Map fonts above to apply"
            ) : (
              `Replace Fonts — ${totalAffected} Style${totalAffected !== 1 ? "s" : ""}`
            )}
          </button>
        </div>
      )}
    </>
  );
}
