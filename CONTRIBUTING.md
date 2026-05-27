# Contributing to Don't Die

Thank you for your interest in contributing to Don't Die! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This project follows a simple principle: **Be respectful and constructive**. We're all here to build something useful and have fun doing it.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/dont-die.git
   cd dont-die
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/emibock/dont-die.git
   ```

## Development Setup

### Prerequisites

- **Node.js 22+** (use `nvm use` if you have nvm)
- npm (comes with Node.js)
- A modern browser (Chrome, Firefox, Safari, or Edge)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# In another terminal, run tests in watch mode
npm run test:watch
```

The app will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode (recommended during development)
- `npm run test:coverage` - Generate test coverage report

## Code Style

### TypeScript

- **Strict mode**: All code must pass TypeScript strict mode checks (zero errors)
- **No `any`**: Avoid using `any` type - use `unknown` if type is truly unknown, then narrow with type guards
- **Named exports**: Use named exports instead of default exports (easier to refactor, better IDE support)
- **Type imports**: Use `import type` for type-only imports when possible

### React

- **Functional components**: Use function components with hooks (no class components except ErrorBoundary)
- **Component naming**: PascalCase for component files and exports (e.g., `TaskList.tsx`, `export function TaskList()`)
- **Hook naming**: camelCase starting with `use` (e.g., `useTaskStore`, `useLavaLogic`)
- **Props destructuring**: Destructure props in function signature

### Code Organization

- **One component per file**: Each component should have its own file
- **Co-locate tests**: Test files should live next to the component they test (e.g., `TaskList.tsx` and `TaskList.test.tsx`)
- **Imports order**:
  1. React imports
  2. Third-party library imports
  3. Internal imports (components, stores, utils, types)
  4. CSS imports

Example:
```typescript
import { useState } from 'react'
import { motion } from 'motion/react'
import { useTaskStore } from '../stores/useTaskStore.ts'
import type { Task } from '../types/task.ts'
```

### Styling

- **Plain CSS**: Use vanilla CSS with CSS variables (no CSS-in-JS, no CSS frameworks)
- **CSS Variables**: Use existing variables from `:root` for colors, spacing, etc.
- **Semantic HTML**: Use semantic elements (`<nav>`, `<main>`, `<article>`, etc.)
- **BEM-like naming**: Use descriptive class names (e.g., `.task-item`, `.gamification-bar`)

### Comments

- **Default to no comments**: Code should be self-explanatory through clear naming
- **Only add comments when**:
  - Explaining WHY (not WHAT): Hidden constraints, subtle invariants, workarounds
  - Non-obvious behavior that would surprise a future reader
- **Keep comments short**: One line max in most cases

## Testing Requirements

### Coverage

- **Minimum 80% coverage** across statements, branches, functions, and lines
- All new components must have comprehensive tests
- All new utilities must have unit tests

### Test Types

1. **Component tests**: User interactions, rendering, edge cases
2. **Unit tests**: Pure functions, utilities, helpers
3. **Accessibility tests**: All components must pass vitest-axe checks

### Writing Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { MyComponent } from './MyComponent.tsx'

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup code
  })

  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected text')).toBeInTheDocument()
  })

  it('meets accessibility standards', async () => {
    const { container } = render(<MyComponent />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### Test Guidelines

- **Descriptive test names**: Use clear, specific descriptions (e.g., "disables submit button when input is empty")
- **Test behavior, not implementation**: Focus on what users see and do
- **One assertion per concept**: Multiple `expect` calls are fine if testing the same concept
- **Use testing-library queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`

## Pull Request Process

### Before Submitting

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes** with clear, focused commits

3. **Ensure all tests pass**:
   ```bash
   npm test
   ```

4. **Ensure TypeScript compiles** with zero errors:
   ```bash
   npm run build
   ```

5. **Update documentation** if needed (README, comments, etc.)

### Submitting

1. **Push to your fork**:
   ```bash
   git push origin feature/my-feature
   ```

2. **Open a Pull Request** on GitHub with:
   - **Clear title**: Describe what the PR does
   - **Description**: Explain why the change is needed and what it does
   - **Testing notes**: Describe how you tested the changes
   - **Screenshots/GIFs**: For UI changes, include visuals

3. **Link related issues**: Use "Fixes #123" or "Closes #456" in the description

### PR Review

- Maintainers will review your PR and may request changes
- Address feedback by pushing new commits to your branch
- Once approved, a maintainer will merge your PR

## Commit Message Guidelines

We use **Conventional Commits** format:

```
<type>: <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring (no functional changes)
- `style`: Code style changes (formatting, whitespace)
- `perf`: Performance improvements
- `chore`: Build process, dependency updates

### Examples

```
feat: add drag-and-drop reordering for tasks

Implemented using @dnd-kit with keyboard support.
Users can now reorder tasks by dragging or using
Space + Arrow keys.

Closes #42
```

```
fix: prevent circular hierarchy in task nesting

Added isDescendant check to prevent moving a task
under itself or its descendants.
```

```
test: add accessibility tests for GamificationBar

All tests passing with vitest-axe.
```

### Commit Best Practices

- **One logical change per commit**: Each commit should be atomic and self-contained
- **Leave codebase in working state**: Every commit should compile and pass tests
- **Descriptive messages**: First line under 72 chars, body wraps at 80 chars
- **Use imperative mood**: "add feature" not "added feature" or "adds feature"

## Questions?

- **Open an issue** for bugs, feature requests, or questions
- **Check existing issues** before opening a new one
- **Be patient**: This is a volunteer project, responses may take time

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Don't Die! 🔥
