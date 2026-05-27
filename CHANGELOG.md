# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-27

### Initial Release 🎉

First stable release of Don't Die - a gamified to-do list where you earn points by completing tasks or your little guy drowns in lava!

### Features

#### Task Management
- ✅ Create, edit, and delete tasks
- ✅ Hierarchical tasks with unlimited sub-tasks (max 3 levels deep)
- ✅ Drag-and-drop reordering with keyboard support
- ✅ Expandable notepad for each task with automatic URL extraction
- ✅ Archive view for completed tasks

#### Gamification
- ✅ Earn 1 point per completed task
- ✅ Daily goal of 5 points
- ✅ Lava guy with 4 animated states (safe, warning, danger, drowning)
- ✅ Consecutive zero-point days tracking
- ✅ Game over at 10 consecutive zero-point days
- ✅ Recovery system to reset countdown

#### User Experience
- ✅ Local-first storage using IndexedDB (no backend required)
- ✅ Dark mode with auto/light/dark theme cycling
- ✅ Export/import backup system (JSON format)
- ✅ Fully accessible (WCAG AA compliant)
- ✅ Keyboard navigation throughout
- ✅ Error boundaries for graceful error handling

#### Technical
- ✅ React 19 with TypeScript 5.9+
- ✅ Zustand for state management
- ✅ Dexie.js for IndexedDB persistence
- ✅ @dnd-kit for drag-and-drop
- ✅ Motion for animations
- ✅ 164 tests with 80%+ coverage
- ✅ vitest-axe for accessibility testing
- ✅ Production build: 154KB gzipped

### Documentation
- 📖 Comprehensive README
- 📖 Detailed CONTRIBUTING guide
- 📖 MIT License
- 📖 GitHub issue templates
- 📖 CI/CD pipeline with GitHub Actions

---

## Release Notes

This is the first public release of Don't Die. The app is fully functional and production-ready with comprehensive test coverage and accessibility compliance.

### Known Limitations
- No cloud sync (local-first by design)
- No mobile app (web app works on mobile browsers)
- No collaborative features (single-user by design)

### Feedback & Contributions
We welcome feedback and contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

[1.0.0]: https://github.com/emibock/dont-die/releases/tag/v1.0.0
