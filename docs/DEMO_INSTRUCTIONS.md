# Demo Screenshots & GIF Instructions

This document provides instructions for creating demo screenshots and animated GIFs for the Don't Die project.

## Required Screenshots

Create the following screenshots to showcase the app's features:

### 1. Main Interface (Light Mode)
- **File**: `screenshots/main-interface-light.png`
- **Content**: Show the main task list with a few tasks, the gamification bar showing points and lava guy in "safe" state
- **Size**: 1920x1080 or higher
- **Instructions**:
  1. Set theme to light mode
  2. Add 3-5 sample tasks (mix of root and sub-tasks)
  3. Show the gamification bar with progress toward daily goal
  4. Capture full browser window or just the app content

### 2. Main Interface (Dark Mode)
- **File**: `screenshots/main-interface-dark.png`
- **Content**: Same as light mode but in dark theme
- **Size**: 1920x1080 or higher
- **Instructions**:
  1. Click dark mode toggle to switch to dark theme
  2. Same content as light mode screenshot

### 3. Expandable Notepad
- **File**: `screenshots/notepad-expanded.png`
- **Content**: Show a task with expanded notepad containing notes and extracted links
- **Instructions**:
  1. Click on a task to expand it
  2. Add some sample notes with a URL (e.g., "Check https://example.com for more info")
  3. Show the extracted links section below the notes

### 4. Lava Guy States
Create 4 screenshots showing different lava guy states:

- **File**: `screenshots/lava-guy-safe.png` - Safe state (0-3 zero days)
- **File**: `screenshots/lava-guy-warning.png` - Warning state (4-6 zero days)
- **File**: `screenshots/lava-guy-danger.png` - Danger state (7-9 zero days)
- **File**: `screenshots/lava-guy-drowning.png` - Drowning state (10+ zero days)

**Instructions**:
1. Use browser DevTools to modify IndexedDB gamification record
2. Set `consecutiveZeroDays` to appropriate values (0, 5, 8, 10)
3. Refresh page to see lava guy state change
4. Capture just the gamification bar section

### 5. Archive View
- **File**: `screenshots/archive-view.png`
- **Content**: Show the archive with completed tasks
- **Instructions**:
  1. Complete several tasks (check them off)
  2. Click "Completed Tasks" to expand archive
  3. Capture the expanded archive section

### 6. Export/Import
- **File**: `screenshots/export-import.png`
- **Content**: Show the export/import section
- **Instructions**:
  1. Scroll to bottom of app
  2. Capture the Export/Import section

## Animated GIF Demo

Create an animated GIF showing key interactions:

### Main Demo GIF
- **File**: `screenshots/demo.gif`
- **Duration**: 15-20 seconds
- **Content**: Show the complete workflow:
  1. Add a new task (type "Buy groceries", click Add)
  2. Add a sub-task (click "Add sub-task", type "Get milk", click Add)
  3. Click to expand the parent task's notepad
  4. Type some notes with a URL
  5. Check off the sub-task (watch points increment)
  6. Check off the parent task (watch points increment)
  7. Show task moving to archive

**Recording Tools**:
- **ScreenToGif** (Windows): https://www.screentogif.com/
- **Kap** (macOS): https://getkap.co/
- **Peek** (Linux): https://github.com/phw/peek
- **LICEcap** (Cross-platform): https://www.cockos.com/licecap/

**GIF Settings**:
- Frame rate: 10-15 FPS
- Dimensions: 800-1000px width
- File size: Under 5MB (optimize if needed)

## Organization

Create a `screenshots/` directory in the project root:

```
dont-die/
├── screenshots/
│   ├── demo.gif
│   ├── main-interface-light.png
│   ├── main-interface-dark.png
│   ├── notepad-expanded.png
│   ├── lava-guy-safe.png
│   ├── lava-guy-warning.png
│   ├── lava-guy-danger.png
│   ├── lava-guy-drowning.png
│   ├── archive-view.png
│   └── export-import.png
```

## Adding to README

Once screenshots are created, update README.md to include them:

```markdown
## Screenshots

### Main Interface
![Main Interface - Light Mode](screenshots/main-interface-light.png)
![Main Interface - Dark Mode](screenshots/main-interface-dark.png)

### Features
![Expandable Notepad](screenshots/notepad-expanded.png)
![Archive View](screenshots/archive-view.png)

### Gamification - Lava Guy States
![Safe](screenshots/lava-guy-safe.png) ![Warning](screenshots/lava-guy-warning.png) ![Danger](screenshots/lava-guy-danger.png) ![Drowning](screenshots/lava-guy-drowning.png)

## Demo

![Demo](screenshots/demo.gif)
```

## Tips

- **Clean browser**: Use incognito/private mode for clean screenshots (no extensions, bookmarks)
- **Consistent sample data**: Use the same sample tasks across screenshots for consistency
- **High resolution**: Capture at 2x or higher resolution for retina displays
- **Compress images**: Use tools like TinyPNG or ImageOptim to reduce file sizes
- **Git LFS** (optional): For very large images, consider using Git Large File Storage

## Checklist

Before publishing v1.0.0:

- [ ] Create screenshots/ directory
- [ ] Capture all 9 screenshots listed above
- [ ] Record demo GIF
- [ ] Optimize all images (compress without quality loss)
- [ ] Update README.md with screenshot links
- [ ] Commit screenshots to repository
- [ ] Test that all images display correctly on GitHub
