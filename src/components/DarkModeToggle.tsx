import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'auto'

export function DarkModeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null
    return savedTheme || 'auto'
  })

  useEffect(() => {
    const root = document.documentElement

    if (theme === 'auto') {
      root.removeAttribute('data-theme')
      localStorage.removeItem('theme')
    } else {
      root.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
    }
  }, [theme])

  const cycleTheme = () => {
    setTheme(current => {
      if (current === 'auto') return 'light'
      if (current === 'light') return 'dark'
      return 'auto'
    })
  }

  const getIcon = () => {
    if (theme === 'light') return '☀️'
    if (theme === 'dark') return '🌙'
    return '🌓'
  }

  const getLabel = () => {
    if (theme === 'light') return 'Switch to dark mode'
    if (theme === 'dark') return 'Switch to auto mode'
    return 'Switch to light mode'
  }

  return (
    <button
      className="dark-mode-toggle"
      onClick={cycleTheme}
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  )
}
