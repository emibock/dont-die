# Don't Die 🔥

A gamified to-do list app where you earn points by completing tasks — or your little guy drowns in lava.

**Local-first. No backend. Just you, your tasks, and rising lava.**

🌐 **[Try it now](https://emibock.github.io/dont-die/)** - Install as an app on any device!

**DISCLAIMER:** This app was created entirely with AI as an exercise in learning to vibe-code. I have no claim to glory, only blame :) 

---

## ✨ Features

- **Hierarchical Tasks**: Organize tasks with sub-tasks (1 level deep)
- **Drag-and-Drop Reordering**: Intuitive task organization with keyboard support
- **Expandable Notepads**: Click any task to add detailed notes with automatic URL extraction
- **Gamification Mechanics**: 
  - Earn 1 point per completed task
  - Daily goal: 5 points
  - Miss a day? Your lava guy gets closer to drowning
  - 10 consecutive zero-point days = Game Over
  - **Animated Lava**: Watch the lava rise as danger increases
  - **State-Specific Character**: Your little guy's expression changes based on danger level
- **Dark Mode**: Auto, light, or dark themes with system preference detection
- **Backup & Restore**: Export/import your data as JSON
- **Fully Local**: All data stored in your browser's IndexedDB (no cloud, no tracking)
- **Accessible**: WCAG AA compliant with full keyboard navigation and screen reader support
- **Progressive Web App (PWA)**: Install on any device for offline access and app-like experience

---

## 🚀 Quick Start

### Option 1: Use the Hosted App (Recommended)

Visit **[https://emibock.github.io/dont-die/](https://emibock.github.io/dont-die/)** in any modern browser.

**Install as an App (Mobile Only):**
- **iOS Safari**: Tap Share → Add to Home Screen
- **Android Chrome**: Tap the three dots menu (⋮) → Add to Home screen or Install app
- **Android Firefox**: Tap the three dots menu (⋮) → More → Add app to Home screen

The app works offline after your first visit and stores all data locally in your browser.

### Option 2: Run Locally

### Prerequisites
- **Node.js 22+** (or use nvm: `nvm use`)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/emibock/dont-die.git
cd dont-die

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview  # Preview the production build
```

### Option 3: Deploy Your Own Instance

Fork this repository and enable GitHub Pages to host your own version:

1. **Fork the repository** on GitHub
2. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: "GitHub Actions"
3. **Push to main** - The app automatically deploys via GitHub Actions
4. **Access your deployment** at `https://YOUR-USERNAME.github.io/dont-die/`

The deployment workflow (`.github/workflows/deploy.yml`) runs automatically on every push to `main`.

**Manual deployment trigger:**
```bash
gh workflow run deploy.yml
```

---


## Screenshots

### Main Interface

Light Mode
![Main Interface - Light Mode](screenshots/main-interface-light.png)

Dark Mode
![Main Interface - Dark Mode](screenshots/main-interface-dark.png)

### Features

Expandable Notepad
![Expandable Notepad](screenshots/notepad-expanded.png)

Archive View
![Archive View](screenshots/archive-view.png)


### Gamification - Lava Guy States

Safe

![Safe](screenshots/lava-guy-safe.png) 

Warning
![Warning](screenshots/lava-guy-warning.png) 

Danger
![Danger](screenshots/lava-guy-danger.png) 

Drowning
![Drowning](screenshots/lava-guy-drowning.png)



## 📖 How to Use

### Adding Tasks

1. Click **"Add task"** at the bottom of the task list
2. Type your task name and press **Enter** or click **"Add"**
3. Click on a task to expand its notepad and add detailed notes
4. Add sub-tasks by clicking **"Add sub-task"** under any **top-level task**
   - **Note**: Sub-tasks can only be 1 level deep (sub-tasks cannot have their own sub-tasks)

### Earning Points

- Check off a task to earn **1 point** and move it to the archive
- Daily goal: **5 points**
- Complete your daily goal to keep your guy safe!

### The Lava System

Your "lava guy" status depends on consecutive zero-point days:

- **0-3 days**: ✅ **Safe** - Happy character, no lava visible
- **4-6 days**: ⚠️ **Warning** - Concerned expression, lava at 30%, gentle wobbling
- **7-9 days**: 🚨 **Danger** - Scared expression, lava at 60%, rapid shaking
- **10+ days**: 💀 **Drowning** - Defeated expression, lava at 95%, character sinking and faded

Each state features:
- **Custom character design** reflecting emotional state
- **Animated lava background** that rises progressively
- **Motion animations** (wobble, shake, sink) for visual feedback

**Recovery**: Complete tasks to reset your countdown and save your guy!

### Drag-and-Drop

- **Mouse**: Click and drag the `⋮⋮` handle to reorder tasks
- **Keyboard**: 
  - Focus a task with **Tab**
  - Press **Space** to grab
  - Use **Arrow keys** to move
  - Press **Space** again to drop
  - Press **Escape** to cancel

### Backup & Restore

1. Click **"Export Backup"** to download your data as `dont-die-backup-YYYY-MM-DD.json`
2. Store the file safely (recommended: weekly backups)
3. Click **"Import Backup"** to restore from a JSON file
4. **Warning**: Importing replaces all current data (confirmation required)

### Archive

- Completed tasks (including subtasks) are automatically moved to the **Archive** section
- Click **"Completed Tasks"** to expand and view your accomplishments
- Archived tasks still count toward your total points

### Testing Lava States (Development)

A test harness is available in development mode:
1. Click the **"🧪 Test Lava States"** button in the bottom-right corner
2. Switch between all four states (Safe, Warning, Danger, Drowning) instantly
3. Verify character expressions, lava heights, and animations

---

## 🛠️ Tech Stack

- **[React 19](https://react.dev/)**: UI framework
- **[TypeScript 5.9+](https://www.typescriptlang.org/)**: Type safety
- **[Vite 7](https://vite.dev/)**: Build tool and dev server
- **[Zustand](https://zustand.docs.pmnd.rs/)**: Lightweight state management (~1KB)
- **[Dexie.js](https://dexie.org/)**: IndexedDB wrapper for persistence
- **[@dnd-kit](https://dndkit.com/)**: Modern drag-and-drop library
- **[Motion](https://motion.dev/)**: Declarative animations for lava guy states
- **[Vitest](https://vitest.dev/)**: Fast unit testing
- **[@testing-library/react](https://testing-library.com/react)**: Component testing
- **[vitest-axe](https://github.com/chaance/vitest-axe)**: Accessibility testing
- **PWA**: Service Worker for offline support, Web App Manifest for installability
- **GitHub Pages**: Automated deployment via GitHub Actions

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Current test coverage**: 173 tests across 15 test files, 80%+ coverage

---

## 🏗️ Project Structure

```
dont-die/
├── src/
│   ├── components/          # React components
│   │   ├── TaskList.tsx     # Root task container
│   │   ├── TaskItem.tsx     # Draggable task row
│   │   ├── TaskItemExpanded.tsx  # Notepad view
│   │   ├── SubTaskList.tsx  # Recursive sub-tasks
│   │   ├── GamificationBar.tsx   # Points + lava guy
│   │   ├── ArchiveView.tsx  # Completed tasks
│   │   ├── ExportImport.tsx # Backup controls
│   │   ├── DarkModeToggle.tsx    # Theme switcher
│   │   └── ErrorBoundary.tsx     # Error handling
│   ├── stores/
│   │   ├── useTaskStore.ts  # Task CRUD + hierarchy
│   │   └── useGameStore.ts  # Points + lava logic
│   ├── db/
│   │   └── schema.ts        # Dexie IndexedDB schema
│   ├── utils/
│   │   ├── points.ts        # Point calculation
│   │   ├── lavaLogic.ts     # Lava state machine
│   │   └── taskTree.ts      # Hierarchy helpers
│   └── types/
│       ├── task.ts          # Task interfaces
│       └── game.ts          # Gamification interfaces
├── public/
│   ├── lava-guy-safe.svg    # Happy character
│   ├── lava-guy-warning.svg # Concerned character
│   ├── lava-guy-danger.svg  # Scared character
│   ├── lava-guy-dead.svg    # Defeated character
│   └── lava.svg             # Animated lava background
├── vite.config.ts
├── tsconfig.json
├── package.json
├── LICENSE                   # MIT License
└── README.md                 # This file
```

---

## 🚢 Deployment

The app automatically deploys to GitHub Pages when changes are pushed to the `main` branch.

**Deployment Pipeline:**
1. Push to `main` triggers GitHub Actions workflow
2. Build step: `npm ci` → `npm run build` (outputs to `dist/`)
3. Deploy step: Publishes `dist/` to GitHub Pages
4. Live site updates at https://emibock.github.io/dont-die/

**Manual Deployment:**
```bash
# Trigger workflow manually via GitHub CLI
gh workflow run deploy.yml
```

**Configuration Files:**
- `.github/workflows/deploy.yml` - CI/CD workflow
- `vite.config.ts` - Sets `base: '/dont-die/'` for GitHub Pages routing
- `public/manifest.json` - PWA manifest with `start_url: '/dont-die/'`

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Development setup
- Code style guidelines
- Testing requirements
- Pull request process

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](./LICENSE) file for details.

---

## 💡 Why "Don't Die"?

Because nothing motivates productivity like watching a tiny guy slowly sink into lava. 🔥

Built with ❤️ by [Emily Bock](https://github.com/emibock)
