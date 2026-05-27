import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { DarkModeToggle } from './DarkModeToggle.tsx'

describe('DarkModeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('renders toggle button', () => {
    render(<DarkModeToggle />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('starts in auto mode by default', () => {
    render(<DarkModeToggle />)
    const button = screen.getByRole('button')
    expect(button).toHaveAccessibleName(/Switch to light mode/i)
    expect(button.textContent).toBe('🌓')
  })

  it('loads saved theme from localStorage', () => {
    localStorage.setItem('theme', 'dark')
    render(<DarkModeToggle />)

    const button = screen.getByRole('button')
    expect(button.textContent).toBe('🌙')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('cycles from auto to light', async () => {
    const user = userEvent.setup()
    render(<DarkModeToggle />)

    const button = screen.getByRole('button')
    expect(button.textContent).toBe('🌓')

    await user.click(button)

    expect(button.textContent).toBe('☀️')
    expect(button).toHaveAccessibleName(/Switch to dark mode/i)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('cycles from light to dark', async () => {
    localStorage.setItem('theme', 'light')
    const user = userEvent.setup()
    render(<DarkModeToggle />)

    const button = screen.getByRole('button')
    expect(button.textContent).toBe('☀️')

    await user.click(button)

    expect(button.textContent).toBe('🌙')
    expect(button).toHaveAccessibleName(/Switch to auto mode/i)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('cycles from dark to auto', async () => {
    localStorage.setItem('theme', 'dark')
    const user = userEvent.setup()
    render(<DarkModeToggle />)

    const button = screen.getByRole('button')
    expect(button.textContent).toBe('🌙')

    await user.click(button)

    expect(button.textContent).toBe('🌓')
    expect(button).toHaveAccessibleName(/Switch to light mode/i)
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    expect(localStorage.getItem('theme')).toBeNull()
  })

  it('applies data-theme attribute to document root', async () => {
    const user = userEvent.setup()
    render(<DarkModeToggle />)

    const button = screen.getByRole('button')

    // Start: auto (no attribute)
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)

    // Click to light
    await user.click(button)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    // Click to dark
    await user.click(button)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    // Click to auto
    await user.click(button)
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('persists theme to localStorage', async () => {
    const user = userEvent.setup()
    render(<DarkModeToggle />)

    const button = screen.getByRole('button')

    // Click to light
    await user.click(button)
    expect(localStorage.getItem('theme')).toBe('light')

    // Click to dark
    await user.click(button)
    expect(localStorage.getItem('theme')).toBe('dark')

    // Click to auto
    await user.click(button)
    expect(localStorage.getItem('theme')).toBeNull()
  })

  it('has accessible label and title', () => {
    render(<DarkModeToggle />)
    const button = screen.getByRole('button')

    expect(button).toHaveAttribute('aria-label')
    expect(button).toHaveAttribute('title')
  })

  it('updates label when theme changes', async () => {
    const user = userEvent.setup()
    render(<DarkModeToggle />)

    const button = screen.getByRole('button')

    expect(button).toHaveAccessibleName(/Switch to light mode/i)

    await user.click(button)
    expect(button).toHaveAccessibleName(/Switch to dark mode/i)

    await user.click(button)
    expect(button).toHaveAccessibleName(/Switch to auto mode/i)

    await user.click(button)
    expect(button).toHaveAccessibleName(/Switch to light mode/i)
  })

  it('meets accessibility standards in auto mode', async () => {
    const { container } = render(<DarkModeToggle />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('meets accessibility standards in light mode', async () => {
    localStorage.setItem('theme', 'light')
    const { container } = render(<DarkModeToggle />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('meets accessibility standards in dark mode', async () => {
    localStorage.setItem('theme', 'dark')
    const { container } = render(<DarkModeToggle />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
