
# Pocket C++ IDE

**Pocket C++ IDE** is a high-performance, offline-first personal C and C++ programming environment designed specifically for the Apple iPad Air M3 (and all modern iPads, iPhones, and desktop browsers).

Inspired by **USACO Guide's compiler**, **OnlineGDB**, and **VS Code**, Pocket C++ delivers a distraction-free, professional coding experience with genuine local WebAssembly compilation, isolated execution, infinite-loop watchdog protection, draggable workspace splitters, 11 editor themes, 8 programming fonts, and competitive programming tooling.

---

## Architecture & Technology Stack

- **Frontend Core**: React 18, TypeScript, Vite
- **Styling & Design Tokens**: Tailwind CSS, PostCSS (High-contrast deep charcoal theme `#121214` matching USACO Guide / VS Code)
- **Code Editor**: CodeMirror 6 with C/C++ language extensions, auto-closing brackets, syntax highlighting, search/replace, code folding, and diagnostic line markers
- **Compiler Engine**: Clang / LLVM WebAssembly toolchain (`@yowasp/clang`) running inside a dedicated Web Worker
- **Execution Runtime**: WebAssembly System Interface (WASI snapshot preview 1 via `@bjorn3/browser_wasi_shim`) inside an isolated Web Worker
- **Storage & State**: IndexedDB (`idb`) for projects, files, settings, recovery snapshots, and workspace layouts; Cache Storage for compiler assets
- **PWA & Offline**: Service Worker with Cache-First strategy for compiler assets and offline application shell

---

## Key Features

### 1. Genuine WebAssembly C/C++ Compiler
- **Real Compilation**: No simulation, no fake outputs. Compiles C11, C17, C++17, and C++20 directly to WebAssembly bytecode locally on your iPad.
- **`<bits/stdc++.h>` Competitive Programming Compatibility**: Built-in umbrella header includes all standard headers (`<iostream>`, `<vector>`, `<string>`, `<algorithm>`, `<map>`, `<set>`, `<unordered_map>`, `<queue>`, `<stack>`, `<deque>`, `<cmath>`, `<cstring>`, `<array>`, `<limits>`, `<bitset>`, `<tuple>`, `<functional>`, `<sstream>`, etc.).
- **Standard Input / Output**: Full support for `cin`, `cout`, `scanf`, `printf`, `getline`, multiple inputs, and EOF handling.

### 2. Resizable Workspace Layout & Splitters
- **Horizontal Workspace Splitter (Editor vs I/O)**:
  - Draggable vertical divider in landscape mode.
  - Mouse, touch, trackpad, and keyboard arrow interaction with pointer capture.
  - Adjustable editor width: 35% to 85% (default: 65%).
- **Vertical I/O Splitter (Input vs Output)**:
  - Draggable horizontal divider between Standard Input and Output panels.
  - Adjustable input panel height: 20% to 80% (default: 40%).
- **Reset Workspace Layout**:
  - One-click restore to recommended defaults (Editor: 65%, I/O: 35%, Input: 40%, Output: 60%).
- **Automatic Persistence**:
  - Custom splitter dimensions are automatically saved to IndexedDB.

### 3. Advanced Editor Customization & Themes
- **11 Professional Themes**:
  - **Dark**: One Dark, Dracula, Nord, Monokai, GitHub Dark, Solarized Dark, Midnight Dark (custom).
  - **Light**: GitHub Light, Solarized Light, One Light, Clean Light (custom).
  - Interactive theme preview cards in Settings.
  - Zero-reload dynamic switching via CodeMirror Compartments.
- **8 Programming Monospace Fonts**:
  - JetBrains Mono, Fira Code, IBM Plex Mono, Source Code Pro, Cascadia Code, Consolas, SF Mono, System Monospace.
  - Typography controls: font size, line height, font weight, font ligatures (enable/disable), and letter spacing.
- **Rich Editor Controls**:
  - Line numbers, active line highlight, soft word wrapping, auto-closing brackets, bracket matching, indentation guides, code folding, cursor styles (line, block, underline).

### 4. Developer Profile
Accessible directly from the header navigation bar, File menu, and Settings modal:
- **Developer**: Minhajul Islam
- **Academic Affiliation**: CSE, Daffodil International University
- **Development Tool**: Developed with Antigravity
- **GitHub**: [Minhajulcse](https://github.com/Minhajulcse)
- **Codeforces**: [NoObMin](https://codeforces.com/profile/NoObMin)

### 5. Infinite Loop & Execution Protection (Non-Negotiable)
- **Independent Main-Thread Watchdog**: Configurable execution time limit (default 5s; presets: 1s, 3s, 5s, 10s, 15s, 30s).
- **Hard Worker Termination**: `while(true) {}` loops or deep recursive traps are forcibly terminated via `Worker.terminate()`.
- **Manual Stop Button**: Instantly terminates active execution or compilation.
- **Output Limit Watchdog**: Monitors byte output on `stdout`/`stderr` and halts execution if output exceeds 1 MB (`Output Limit Exceeded`).

### 6. iPad-First UX & Typing Reliability
- **Typing Reliability**: CodeMirror 6 state is held in persistent references—no dropped keystrokes or cursor jumps.
- **Native Selection & Clipboard**: Full support for native iPadOS selection handles, loupe, Cmd+C, Cmd+V, and Cmd+X.
- **iPad Programming Accessory Bar**: Quick-access touch toolbar with `{ } ( ) [ ] ; : " ' < > # / = ! & | \`, Tab, Outdent, Undo, Redo, Copy, and Paste. Focus is maintained without dismissing the on-screen keyboard.
- **External Keyboard Shortcuts**:
  - `⌘ / Ctrl + Enter`: Compile and Run
  - `⌘ / Ctrl + ⇧ + Enter`: Compile only
  - `⌘ / Ctrl + S`: Save
  - `⌘ / Ctrl + N`: New File
  - `⌘ / Ctrl + F`: Find
  - `⌘ / Ctrl + H`: Replace

### 7. 100% Offline Mode (PWA)
- **Prepare Your Offline Compiler**: Download and cache all ~105 MB of compiler binaries and headers locally into Cache Storage with a single tap.
- **Airplane Mode Ready**: Open the Home Screen app, edit code, save projects, compile, and execute with zero internet connectivity.
- **Crash Recovery**: Unsaved drafts are continuously snapshotted to IndexedDB.

### 8. Competitive Programming Test Case Manager
- Add multiple test cases with custom inputs and expected outputs.
- Run single tests or "Run All" sequentially with automated Pass/Fail comparison.

---

## Quick Start & Local Development

### Prerequisites
- Node.js 18+ (tested on Node v22)
- npm 9+

### Installation & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run automated test suite (verifies compilation, stdin, vector sorting, themes, fonts, layout)
npm test

# Build production bundle
npm run build
```

---

## Automated Test Results

Run `npm test` to verify the 13 core automated tests:

```text
✓ tests/themes_layout.test.ts (5)
  ✓ Verify all 11 required themes are present with valid palettes
  ✓ Verify getThemeDefinition returns fallback for unknown theme ID
  ✓ Verify all 8 required programming fonts are present
  ✓ Verify default settings include required defaults
  ✓ Verify layout clamping boundaries

✓ tests/compiler.test.ts (8)
  ✓ Test 1: Hello World with bits/stdc++.h
  ✓ Test 2: Standard Input (cin >> a >> b >> c)
  ✓ Test 3: Vector and std::sort
  ✓ Test 4: Standard C Program with scanf & printf
  ✓ Test 5: Compilation Error & Diagnostics Parsing
  ✓ Test 6: Diagnostics line and col extraction
  ✓ Test 7: Output Limit Enforcement Logic
  ✓ Test 8: Consecutive Compilations (No Memory Leak / Overlap)
```

For device-specific testing details, see [IPAD_TESTING_REPORT.md](file:///home/minhajul/Downloads/IDE/IPAD_TESTING_REPORT.md).
# PocketCpp
