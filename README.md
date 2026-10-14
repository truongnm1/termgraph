# TermGraph

A minimal, high-performance hierarchical knowledge graph for structured terms and concepts.

![TermGraph Preview](demo.png)

## Quick Start

On Windows, double-click `start.bat` to launch the dev server and open your browser automatically.

Or run manually:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Features

- **Orthogonal Tree Routing**: Linear-time layout powered by `d3-hierarchy` with non-scaling 1px vector lines.
- **Drafting Aesthetic**: Strict 0px border-radius, zero drop-shadows, and dynamic inverted root node.
- **Left Outline / List View**: Quick pre-order tree explorer (`L`) with depth indentation and instant click-to-locate navigation.
- **Term Detail & I/O Model**: Description editor with an optional structured execution block (`Inputs` → `Processing` → `Outputs` → `Example`).
- **Permanent Local Storage**: Syncs directly to `data/knowledge-base.json` on disk with instant browser mirror.
- **Themes & Font Packs**: 6 color presets (Dark, Light, Parchment, Nordic, Solarized, Monochrome) and 5 curated typography pairings.
- **Undo / Redo**: Lightweight snapshot history (`Ctrl+Z` / `Ctrl+Y`) with debounced typing.

## Shortcuts

| Key | Action |
| :--- | :--- |
| `Ctrl+K` or `/` | Focus search |
| `L` | Toggle Left Outline / List View |
| `Ctrl+Z` / `Ctrl+Y` | Undo / Redo |
| `Tab` | Add child node |
| `Enter` | Add sibling node |
| `F2` | Edit term name |
| `Delete` / `Backspace` | Delete selected node |
| `0` / `1` | Fit entire tree / Reset zoom (1:1) |
| `+` / `-` | Zoom in / Zoom out |
| `↑` `↓` `←` `→` | Navigate tree nodes |
| `Esc` | Close panels |

## Production Build

Compile to a lightweight, standalone bundle (under 120 KB, zero runtime dependencies):

```bash
npm run build
```

The output will be in `dist/`.

## License

[MIT](LICENSE)
