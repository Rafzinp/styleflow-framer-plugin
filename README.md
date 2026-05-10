# StyleFlow — Framer Plugin

A fast, focused Framer plugin for managing **typography** and **color styles** directly inside your project — without touching multiple panels.

Built for designers who want a Linear / Raycast-style workflow inside Framer.

---

## Features

### Typography Tab
| Feature | Description |
|---|---|
| **Auto-fetch styles** | Loads all text styles from the current Framer project on open |
| **FontPicker dropdown** | Searchable combobox — shows fonts already *In Project* and a curated list of 40+ popular Google Fonts |
| **One-click font apply** | Select a font from the dropdown → instantly writes to Framer, no "Save" button needed |
| **Live hover preview** | Hovering any font option updates the preview text in real time before you commit |
| **Quick Replace panel** | Swap an entire font family across all styles in one action (e.g. Inter → Geist) |
| **Inline editor** | Edit font, size, weight, and line-height per style without leaving the list |
| **Bulk edit mode** | Select multiple styles → replace font family across all of them at once |
| **Add new style** | Create a text style from scratch with name, font, size, weight, and line-height |
| **Delete style** | Remove any text style directly from the editor |
| **Search & filter** | Sticky search bar filters by style name or font family (`/` shortcut to focus) |
| **Grouped by prefix** | Styles are automatically grouped by their name prefix (`Brand/`, `SF/`, etc.) |

### Colors Tab
| Feature | Description |
|---|---|
| **Auto-fetch colors** | Loads all color styles from the current Framer project |
| **Light / Dark toggle** | Switch between light-mode and dark-mode preview for every color |
| **Color picker** | Native color picker + HEX text input for both light and dark values |
| **Copy HEX** | One-click copy button (appears on hover, turns ✓ on success) |
| **HEX + RGB display** | Shows both values in the list view |
| **Recently used** | Collapsible "Recent" bar stores your last 10 used colors in localStorage |
| **Add new color** | Create a color style with name, light, and dark values |
| **Inline editor** | Split preview bar + per-mode color picker for quick edits |
| **Delete color** | Remove any color style from the inline editor |
| **Search & filter** | Filter by style name or HEX value |
| **Grouped by prefix** | Colors grouped by name prefix (`Brand/`, `Core/`, etc.) |

---

## Screenshots

> Place plugin screenshots here after capturing from Framer.

```
/docs/typography-tab.png
/docs/colors-tab.png
/docs/font-picker.png
/docs/quick-replace.png
```

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 + custom CSS variables |
| Plugin API | framer-plugin v3 |
| HTTPS (dev) | vite-plugin-mkcert |

---

## Project Structure

```
styleflow-framer-plugin/
├── src/
│   ├── App.tsx               # Root component — title bar, segmented tabs, toast
│   ├── App.css               # Full design system (dark theme, all component styles)
│   ├── main.tsx              # Entry point
│   └── tabs/
│       ├── TypographyTab.tsx # Typography management + FontPicker component
│       └── ColorTab.tsx      # Color styles management
├── public/
│   └── icon.svg              # Plugin icon
├── framer.json               # Plugin manifest (id, name, modes)
├── vite.config.ts            # Vite config with Framer, Tailwind, mkcert plugins
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Framer account (canvas mode access)

### Install

```bash
git clone https://github.com/Rafzinp/styleflow-framer-plugin.git
cd styleflow-framer-plugin
npm install
```

### Development

```bash
npm run dev
```

Starts the Vite dev server at **`https://localhost:5173`** (with HTTPS via mkcert).  
Every file save triggers HMR — the plugin updates instantly inside Framer.

**Load in Framer:**
1. Open Framer → **Plugins → Development → New Plugin**
2. Enter URL: `https://localhost:5173`
3. The plugin appears in the top-right corner of the canvas

### Build

```bash
npm run build
```

Outputs production-ready files to `dist/`.

### Pack for submission

```bash
npm run pack
```

Uses `framer-plugin-tools` to bundle the plugin for the Framer Plugin Store.

---

## Framer Plugin API Usage

StyleFlow uses the following Framer Plugin API methods:

```ts
// Text styles
framer.getTextStyles()                          // fetch all text styles
framer.createTextStyle({ name, font, fontSize, lineHeight, letterSpacing })
textStyle.setAttributes({ font, fontSize, lineHeight, letterSpacing })
textStyle.remove()

// Fonts
framer.getFont(family, { weight })             // resolve a font by name + weight

// Color styles
framer.getColorStyles()                         // fetch all color styles
framer.createColorStyle({ name, light, dark })
colorStyle.setAttributes({ light, dark })
colorStyle.remove()

// UI
framer.showUI({ position, width, height, resizable })
```

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `/` | Focus the search bar |
| `Escape` | Close open editor / form / panel |
| `↑ / ↓` | Navigate FontPicker dropdown |
| `Enter` | Select highlighted font |

---

## FontPicker — How It Works

The `FontPicker` component is a fully custom combobox built in React:

1. **Input triggers the dropdown** on focus or typing
2. **Two grouped sections:**
   - *In project* — font families extracted from the current Framer text styles (badged "in use")
   - *Popular* — curated list of 40+ widely-used Google Fonts not yet in the project
3. **Hover = live preview** — `onHover` callback updates the preview text without committing
4. **Select = instant apply** — calls `framer.getFont()` + `style.setAttributes()` immediately
5. **Keyboard navigation** — `↑`/`↓` moves highlight, `Enter` selects, `Escape` closes

---

## Design System

All styles live in `src/App.css` using CSS custom properties:

```css
--bg          #0f0f0f   /* base background */
--bg-2        #161616   /* surface */
--bg-3        #1e1e1e   /* elevated surface */
--accent      #5b69f7   /* primary action color */
--text        #ededed   /* primary text */
--text-2      #6b6b6b   /* secondary text */
--text-3      #3d3d3d   /* muted / labels */
--success     #22c55e
--danger      #f04040
```

Inspired by **Linear**, **Raycast**, and **Framer's native UI**.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes
4. Open a pull request

---

## License

MIT © [Rafzinp](https://github.com/Rafzinp)
