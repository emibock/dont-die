# Don't Die: Local-First Gamified To-Do List

## Context

This is a new side project to build a to-do list application with gamification mechanics. The user wants a local-first app (no hosting, no backend) where users earn points by completing tasks, and must maintain a daily point goal or their "little guy" drowns in lava. The app should be open-source, publicly available on GitHub, and have a simple UI that supports hierarchical tasks, drag-and-drop reordering, and expandable notepads.

**Problem**: Existing to-do apps are either cloud-based (user doesn't want to host), bloated with features, or lack engaging gamification.

**Intended outcome**: A lightweight, fun, local-first productivity tool that runs entirely in the browser and can be easily shared via GitHub.

## Tech Stack

**Core Framework**
- **React 19** + **TypeScript 5.9+** + **Vite 7**
- **Node.js 22+**

**Rationale**: Matches your existing nexus-ui stack. You're already proficient with React/TS/Vite, so productivity gains outweigh "beginner-friendly vanilla JS" alternatives. React's component model naturally fits hierarchical task structures.

**State & Storage**
- **Zustand** for application state (tasks, gamification)
- **Dexie.js** wrapper around **IndexedDB** for persistence

**Rationale**: Zustand is lightweight (~1KB) and you already use it effectively in nexus-ui. IndexedDB supports hundreds of MB (vs localStorage's 5-10MB limit) and enables structured queries. Dexie wraps IndexedDB's complex API with a simple, typed interface.

**UI & Styling**
- **Plain CSS with CSS Variables** (no framework)
- Semantic HTML with minimal class names

**Rationale**: PatternFly is enterprise-heavy (perfect for nexus-ui, overkill here). Vanilla CSS keeps bundle tiny (~5KB) and eliminates framework learning curve for contributors.

**Drag-and-Drop**
- **@dnd-kit/core** + **@dnd-kit/sortable**

**Rationale**: Modern, accessible (keyboard support), excellent React integration. ~15KB gzipped.

**Animations**
- **Motion** (motion.dev) - modern animation library for React

**Rationale**: User-requested. Motion is the successor to Framer Motion, providing declarative animations with spring physics. Lightweight and performant for lava guy animations.

**Testing**
- **Vitest** + **@testing-library/react** + **vitest-axe**

**Rationale**: Matches your nexus-ui setup. Fast, TypeScript-native, built into Vite.

**License**
- **MIT License** (most permissive, widely recognized)

## Data Model

### Task Structure
```typescript
interface Task {
  id: TaskId                    // UUID v4 from crypto.randomUUID()
  content: string               // Task title
  notes: string                 // Notepad content (expandable)
  links: string[]              // URLs extracted from notes
  completed: boolean
  completedAt: number | null   // Unix timestamp (ms)
  createdAt: number
  updatedAt: number
  parentId: TaskId | null      // null = root-level task
  orderIndex: number           // Float for drag-and-drop ordering
}
```

### Gamification State
```typescript
interface DailyProgress {
  date: string                 // YYYY-MM-DD
  pointsEarned: number
  tasksCompleted: TaskId[]
}

interface GamificationState {
  consecutiveZeroDays: number  // Lava countdown
  lastActivityDate: string | null
  totalPoints: number
}
```

**Key Decisions**:
- **UUIDs** for TaskId (avoid ID conflicts in import/export)
- **orderIndex as float** (allows inserting between items without renumbering)
- **Hierarchical via parentId** (tree structure, max 3 levels deep)
- **Singleton gamification record** (always fetch/update record with `id: 1`)

## Architecture

### Directory Structure
```
dont-die/
├── src/
│   ├── components/
│   │   ├── TaskList.tsx           # Root task container
│   │   ├── TaskItem.tsx           # Draggable task row
│   │   ├── TaskItemExpanded.tsx   # Notepad view
│   │   ├── SubTaskList.tsx        # Recursive sub-tasks
│   │   ├── GamificationBar.tsx    # Points + lava guy
│   │   ├── ArchiveView.tsx        # Completed tasks
│   │   └── ExportImport.tsx       # Backup controls
│   ├── stores/
│   │   ├── useTaskStore.ts        # Task CRUD + hierarchy
│   │   └── useGameStore.ts        # Points + lava logic
│   ├── db/
│   │   └── schema.ts              # Dexie IndexedDB schema
│   ├── hooks/
│   │   ├── useTasks.ts
│   │   ├── useDailyProgress.ts
│   │   └── useExportImport.ts
│   ├── utils/
│   │   ├── points.ts              # Point calculation
│   │   ├── lavaLogic.ts           # Lava state machine
│   │   └── taskTree.ts            # Hierarchy helpers
│   └── types/
│       ├── task.ts
│       └── game.ts
├── public/
│   └── lava-guy.svg              # Simple SVG character
├── vite.config.ts
├── tsconfig.json
├── package.json
├── LICENSE                        # MIT
└── README.md
```

### State Management Pattern

**Zustand Stores** (2 separate stores):

1. **useTaskStore**: Task CRUD + hierarchy
   - Actions: `addTask`, `updateTask`, `deleteTask`, `toggleComplete`, `reorderTasks`
   - Selectors: `getRootTasks`, `getSubTasks(parentId)`

2. **useGameStore**: Gamification
   - Actions: `addPoints`, `resetDay`, `checkLavaStatus`
   - Selectors: `getTodayPoints`, `getLavaState`

**IndexedDB Sync Pattern**:
- All mutations write to IndexedDB first (persistence), then update Zustand (UI reactivity)
- On app load, call `hydrate()` to populate Zustand from IndexedDB
- Matches your nexus-ui approach

## Key Features Implementation

### 1. Hierarchical Tasks with Drag-and-Drop

**@dnd-kit Integration**:
- Wrap `TaskList` in `<DndContext>`
- Use `<SortableContext>` for each level
- Implement `reorderTasks` action with hierarchy constraints:
  - Prevent circular parent-child relationships (detect with `isDescendant` helper)
  - Calculate `orderIndex` as midpoint between siblings (e.g., insert between 1.0 and 2.0 → new index 1.5)
  - Enforce max depth of 3 levels

**Accessibility**: @dnd-kit provides keyboard navigation:
- **Space** to grab, **Arrow keys** to move, **Escape** to cancel
- Add `aria-label="Drag to reorder"` to drag handles

### 2. Notepad Expansion

**Interaction**:
- Click task content to toggle `expandedTaskId` in store
- Render `<TaskItemExpanded>` with `<textarea>` for notes
- Auto-save on blur (debounced 500ms)
- Extract URLs from notes with regex, render as clickable links

**Data**: Store notes in `Task.notes` field (persisted to IndexedDB)

### 3. Gamification System

**Point Mechanics**:
- Checking off task: awards 1 point, sets `completedAt`, moves to archive
- Daily goal: 5 points
- Zero-point days: increment `consecutiveZeroDays`
- Lava drowning: at 10 consecutive zero-point days
- Recovery: when points resume, reset `consecutiveZeroDays` to 0

**Daily Reset Logic**:
- Check for new day on app load AND hourly interval
- If midnight rollover detected, check yesterday's points
- If yesterday had 0 points, increment lava countdown

**Lava Guy Animation** (Motion-based):
- **Safe** (0 zero days): Guy stands upright, no lava
- **Warning** (4-6 days): Guy wobbles with spring animation
- **Danger** (7-9 days): Guy panics with rapid shake animation
- **Drowning** (10+ days): Guy submerged, grayscale, faded

```tsx
import { motion } from 'motion/react'

// Example animation states
const animationVariants = {
  safe: { y: 0, rotate: 0, opacity: 1, filter: 'none' },
  warning: { 
    y: 10, 
    rotate: [0, -2, 2, -2, 2, 0],
    transition: { 
      rotate: { repeat: Infinity, duration: 2 },
      y: { type: 'spring' }
    }
  },
  danger: { 
    y: 30, 
    rotate: [-5, 5, -5, 5, 0],
    scale: [1.05, 0.95, 1.05],
    transition: { 
      repeat: Infinity, 
      duration: 1 
    }
  },
  drowning: { 
    y: 60, 
    rotate: 15, 
    opacity: 0.3, 
    filter: 'grayscale(1)',
    transition: { type: 'spring', damping: 20 }
  }
}

<motion.div
  variants={animationVariants}
  animate={lavaState.warningLevel}
  className="lava-guy"
/>
```

### 4. Backup & Export

**Export Format** (JSON):
```typescript
interface BackupData {
  version: 1                     // Schema version
  exportedAt: number             // Timestamp
  tasks: Task[]
  dailyProgress: DailyProgress[]
  gamification: GamificationState
}
```

**Implementation**:
- **Export**: Serialize IndexedDB to JSON, download as `dont-die-backup-YYYY-MM-DD.json`
- **Import**: Parse JSON, validate version, clear DB, restore data, reload stores
- **Auto-backup reminder**: Show notification if no backup in 30 days

## Git Workflow

**Repository Initialization**:
- Initialize git repo in new `dont-die` directory
- Create initial commit with project scaffolding
- Make frequent, self-contained commits as functionality is built

**Commit Strategy**:
- **One feature per commit**: Each commit should add or modify one complete, testable piece of functionality
- **Atomic commits**: Changes should be self-contained and leave the codebase in a working state
- **Descriptive messages**: Use conventional commit format
  ```
  feat: add task creation with UUID generation
  feat: implement IndexedDB schema with Dexie
  feat: create Zustand store for task management
  test: add unit tests for point calculation
  fix: prevent circular hierarchy in drag-and-drop
  docs: update README with installation steps
  ```

**Commit Frequency Examples**:
- After setting up Vite project → commit
- After defining TypeScript types → commit
- After implementing each store action (addTask, updateTask, etc.) → commit
- After creating each component (TaskList, TaskItem, etc.) → commit
- After writing test suite for a module → commit
- After fixing a bug → commit

**Branch Strategy** (for later phases):
- `main` branch for stable releases
- Feature branches for major new features
- Merge to main when feature is complete and tested

## Development Phases

### Phase 1: Foundation (Week 1) ✅ COMPLETE
**Tasks**:
1. Create `dont-die` directory and initialize git repo → ✅ **commit: "feat: initialize Vite + React + TypeScript project"**
2. Initialize Vite + React + TypeScript project → ✅ **commit: "feat: initialize Vite + React + TypeScript project"**
3. Install dependencies (zustand, dexie, @dnd-kit, motion, vitest) → ✅ **commit: "feat: add core dependencies"**
4. Configure TypeScript strict mode and Vite config → ✅ **commit: "feat: configure TypeScript and Vite"**
5. Define TypeScript types (`src/types/task.ts`, `src/types/game.ts`) → ✅ **commit: "feat: define core TypeScript types"**
6. Set up IndexedDB schema with Dexie (`src/db/schema.ts`) → ✅ **commit: "feat: implement IndexedDB schema with Dexie"**
7. Create Zustand stores (`useTaskStore`, `useGameStore`) → ✅ **commit per store**
8. Write unit tests for store actions and DB operations → ✅ **commit: "test: add unit tests for stores and DB"**

**Validation**: ✅ Tests pass, data persists to IndexedDB, TypeScript compiles with zero errors

**Expected commits**: ~8-10 commits for foundation (9 commits completed)

### Phase 2: Basic UI (Week 2) ✅ COMPLETE
**Tasks**:
1. ✅ Create `TaskList`, `TaskItem`, `AddTaskButton` components
2. ✅ Implement checkbox to complete tasks
3. ✅ Add basic CSS styling (semantic HTML, CSS variables)
4. ✅ Implement hierarchical rendering (sub-tasks nested)
5. ✅ Add vitest-axe accessibility tests

**Validation**: ✅ Can create/check tasks, data reloads on refresh, a11y tests pass

### Phase 3: Drag-and-Drop (Week 3) ✅ COMPLETE
**Tasks**:
1. ✅ Integrate @dnd-kit into `TaskList` and `SubTaskList`
2. ✅ Implement `reorderTasks` with hierarchy constraints
3. ✅ Add drag handles with accessible labels
4. ✅ Test keyboard navigation
5. ✅ Prevent circular references (show error if attempted)

**Validation**: ✅ Drag works, keyboard nav functional, hierarchy preserved

### Phase 4: Notepad Expansion (Week 4) ⬅️ CURRENT
**Tasks**:
1. Create `TaskItemExpanded` component (textarea)
2. Add expand/collapse state to store
3. Implement click-to-expand interaction
4. Extract URLs with regex, render as links
5. Auto-save notes on blur (debounced)

**Validation**: Notes persist, URLs clickable, auto-save works

### Phase 5: Gamification (Week 5)
**Tasks**:
1. Update `toggleComplete` to award points → **commit**
2. Implement daily progress tracking → **commit**
3. Create `GamificationBar` component → **commit**
4. Implement daily reset logic (new day detection) → **commit**
5. Track consecutive zero-point days → **commit**
6. Create lava guy SVG → **commit**
7. Implement Motion animations for lava guy states (safe/warning/danger/drowning) → **commit**

**Validation**: Checking tasks awards points, daily goal shows progress, lava drowns at 10 days, recovery works, animations smooth

**Expected commits**: ~7-10 commits for gamification

### Phase 6: Archive & Polish (Week 6)
**Tasks**:
1. Create `ArchiveView` component (toggle completed tasks)
2. Implement export/import (`ExportImport` component)
3. Add light/dark mode toggle (CSS variables)
4. Run full vitest-axe suite, fix issues
5. Add error boundaries
6. Write comprehensive README

**Validation**: Export/import works, a11y compliant, dark mode functional

### Phase 7: Documentation & Release (Week 7)
**Tasks**:
1. Write CONTRIBUTING.md (setup, code style, PR process)
2. Add MIT LICENSE file
3. Create GitHub repo with issue templates
4. Write clear README (features, installation, usage)
5. Set up GitHub Actions CI (lint, test, build)
6. Create demo screenshots/GIF
7. Publish v1.0.0 release

**Validation**: Repo public, CI passes, contributors can clone and run

**Total Timeline**: **7 weeks part-time** (~10 hours/week) or **2-3 weeks full-time**

## Critical Files

These files form the foundation and should be created first:

1. **`src/db/schema.ts`** - IndexedDB schema with Dexie (defines entire data structure) ✅
2. **`src/types/task.ts`** - Core TypeScript interfaces (used in 90%+ of files) ✅
3. **`src/stores/useTaskStore.ts`** - Zustand store for task operations (orchestrates CRUD + IndexedDB sync) ✅
4. **`src/stores/useGameStore.ts`** - Zustand store for gamification (points, lava countdown) ✅
5. **`vite.config.ts`** - Build configuration (React plugin, code splitting, dev server) ✅

## Testing Strategy

**Unit Tests** (Vitest):
- Store actions and DB operations ✅
- Utilities (point calculation, lava state machine, hierarchy helpers)

**Component Tests** (@testing-library/react):
- Task CRUD interactions
- Drag-and-drop behavior
- Notepad expansion
- Gamification bar

**Accessibility Tests** (vitest-axe):
- All components checked for WCAG AA compliance
- Keyboard navigation tested
- Screen reader compatibility

**Coverage Target**: 80% (match nexus-ui standard)

## Risk Mitigation

1. **IndexedDB quota limits**: Show storage usage indicator, auto-suggest export at 80% quota
2. **Drag-and-drop on mobile**: @dnd-kit supports touch by default, test on iOS/Android
3. **Day rollover while app closed**: Check for new day on load AND hourly interval
4. **Circular hierarchy**: Detect in `reorderTasks` with `isDescendant` helper, show error
5. **Data corruption**: Dexie transactions are atomic, encourage regular backups

## Success Metrics

**Development Quality**:
- ✅ TypeScript compiles with zero errors (strict mode)
- ✅ 80%+ test coverage
- ✅ All vitest-axe checks pass
- ✅ Build size <200KB (excluding code splits)
- ✅ Lighthouse accessibility score 95+

**User-Facing**:
- ✅ First contributor PR within 2 weeks of release
- ✅ 50 GitHub stars in first month
- ✅ No critical bugs in first release
- ✅ Clear documentation (README + CONTRIBUTING)

## Repository Setup

**New Repository**: `github.com/emibock/dont-die` (or your preferred name)

**README.md** highlights:
- **Features**: Hierarchical tasks, drag-and-drop, notepad, gamification, local-first
- **Quick Start**: Clone, install, run dev server
- **Usage**: How to add tasks, earn points, avoid lava
- **Tech Stack**: React 19, TypeScript, Vite, Zustand, Dexie, @dnd-kit
- **Contributing**: Link to CONTRIBUTING.md

**CONTRIBUTING.md** includes:
- Development setup (Node 22+, npm install, dev server)
- Code style (strict TypeScript, no `any`, named exports)
- Testing requirements (unit + component + a11y)
- PR process (fork, feature branch, tests pass, descriptive commits)

## Verification

After implementation:

1. **Run the app**: `npm run dev`, test full user flow:
   - Create root task
   - Add sub-task
   - Drag to reorder
   - Click to expand notepad
   - Check off 5 tasks (verify daily goal met)
   - Set date to tomorrow (manual DB edit), verify lava countdown increments

2. **Test suite**: `npm test` (verify 80%+ coverage, all a11y tests pass)

3. **Build**: `npm run build` (verify <200KB bundle size, no TypeScript errors)

4. **Export/Import**: 
   - Create tasks, earn points
   - Export backup (download JSON)
   - Clear IndexedDB (DevTools)
   - Import backup (restore data)
   - Verify tasks and points restored

5. **Accessibility**:
   - Navigate entire app with keyboard only (Tab, Space, Enter, Arrows, Escape)
   - Test with screen reader (VoiceOver/NVDA)
   - Run Lighthouse audit (95+ accessibility score)
