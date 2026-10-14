# TermGraph • Minimal Tree Knowledge Base

> A high-performance, distraction-free hierarchical knowledge graph designed for fast term lookups, top-to-bottom tree exploration, and permanent local storage.

TermGraph delivers sub-100ms startup, a ~56KB bundle, zero Electron bloat, and smooth 60fps canvas navigation across hundreds of nodes with a strict technical drafting aesthetic.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build optimized standalone production bundle
npm run build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧭 Key Features & Architecture

### 1. Technical Drafting Design System
- **Strict Minimal Blueprint Aesthetic**: Global enforcement of `border-radius: 0` and zero drop-shadows across all cards, modals, dropdowns, and inputs.
- **Dynamic Inverted Root Node**: The root anchor node automatically inverts its colors relative to the active theme (e.g., solid black with white typography in Paper White; solid white with charcoal typography in Obsidian Minimal).
- **Uniform 1px Vector Hairlines**: Links utilize `vector-effect: non-scaling-stroke` and `shape-rendering: geometricPrecision` with integer-snapped orthogonal coordinates, ensuring hair-thin 1px line thickness at any zoom scale without pixel-rounding distortion.
- **Clean Native Scrollbars**: Hidden Windows stepper buttons (`▲▼`) with micro scrollbars.

### 2. Permanent Local Disk Storage & API
- **Direct File System Persistence**: Automatically syncs node additions, edits, and deletions directly to disk at `data/knowledge-base.json` via a Vite dev middleware endpoint (`/api/data`).
- **Offline Mirror Fallback**: Seamlessly mirrors data to browser `localStorage` if running in static or offline environments.
- **Instant Data Portability**: Export and import complete knowledge trees via JSON or Markdown outlines (`# Heading`, `## Sub-heading`).

### 3. Top-to-Bottom Orthogonal Tree Routing
- Clean orthogonal hierarchy connector routing (vertical stem → horizontal bus crossbar → vertical child drops).
- Powered by `d3-hierarchy`'s linear-time $O(N)$ tidy-tree layout algorithm.
- Collapsible subtrees with quick toggling badge counts.

### 4. Curated Color Themes & Typography Font Packs
- **6 Built-in Color Themes**:
  - *Obsidian Minimal* (Deep Slate / Dark)
  - *Paper White* (Pure Stark Contrast / Light)
  - *Warm Parchment* (Analog Sepia)
  - *Nordic Frost* (Glacier Cyan & Polar Night)
  - *Solarized Teal* (Deep Midnight Ocean)
  - *OLED Monochrome* (Absolute True Black & White)
- **5 Font Packs**:
  - *Oswald + Inter*
  - *JetBrains Mono*
  - *Space Grotesk + Inter*
  - *Playfair Display + Inter*
  - *Barlow Condensed + Plus Jakarta Sans*
- Instant zero-reload switching via the Settings modal (`gear` icon).

### 5. Memory-Safe Undo / Redo Engine
- Full history undo (`Ctrl+Z`) and redo (`Ctrl+Y`) with dedicated navigation bar buttons.
- Serialized JSON snapshot buffer capped at 25 entries (<200KB RAM overhead) with debounced typing batching to prevent memory churn during rapid text editing.

### 6. Search & Keyboard-First Navigation
- **Global Fast Search (`Ctrl+K` or `/`)**: Instant filtering across all term names and briefs with full breadcrumb hierarchy paths. Selecting a result automatically pans and selects the node.
- **Smart Expand/Collapse Toggle**: Single button in the navigation bar that dynamically expands all branches if any are hidden, or collapses all when fully opened.
- **Keyboard Shortcuts**:
  - `Ctrl+Z` / `Ctrl+Y`: Undo / Redo
  - `Ctrl+K` or `/`: Open global search
  - `0`: Fit entire tree to screen
  - `1`: Reset zoom to 1:1 scale (100%)
  - `+` / `-`: Zoom in / Zoom out
  - `Tab`: Add child term to selected node
  - `Enter`: Add sibling term to selected node
  - `Delete` / `Backspace`: Delete selected term
  - `Esc`: Close inspector panel / search / modal

---

## 🛠 Tech Stack

- **Runtime & Bundler**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Tree Computation**: [d3-hierarchy](https://github.com/d3/d3-hierarchy)
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Styling**: Pure CSS3 Variables & SVG vector rendering (Zero external UI frameworks)

---

## 📄 License

[MIT](LICENSE)
