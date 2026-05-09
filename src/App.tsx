import { framer } from "framer-plugin"
import { useState, useCallback } from "react"
import "./App.css"
import { TypographyTab } from "./tabs/TypographyTab"
import { ColorTab } from "./tabs/ColorTab"

framer.showUI({
  position: "top right",
  width: 340,
  height: 620,
  resizable: true,
})

type Tab = "typography" | "colors"

export type Toast = {
  message: string
  type: "success" | "error" | "info"
} | null

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("typography")
  const [toast, setToast] = useState<Toast>(null)

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      setToast({ message, type })
      setTimeout(() => setToast(null), 2200)
    },
    [],
  )

  return (
    <div className="app">
      {/* Title bar */}
      <div className="title-bar">
        <div className="title-bar-logo">
          <svg viewBox="0 0 18 18" fill="none" width="16" height="16">
            <rect x="1" y="1" width="16" height="16" rx="4" fill="var(--accent)" />
            <path d="M5 9h8M9 5v8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="title-bar-name">StyleFlow</span>
        </div>
      </div>

      {/* Segmented tabs — full-width like the reference */}
      <div className="seg-tabs">
        <button
          className={`seg-tab ${activeTab === "typography" ? "seg-tab--active" : ""}`}
          onClick={() => setActiveTab("typography")}
        >
          Typography
        </button>
        <button
          className={`seg-tab ${activeTab === "colors" ? "seg-tab--active" : ""}`}
          onClick={() => setActiveTab("colors")}
        >
          Colors
        </button>
      </div>

      {/* Content */}
      <main className="main">
        {activeTab === "typography" && <TypographyTab showToast={showToast} />}
        {activeTab === "colors" && <ColorTab showToast={showToast} />}
      </main>

      {toast && (
        <div className={`toast toast--${toast.type}`}>{toast.message}</div>
      )}
    </div>
  )
}
