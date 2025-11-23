import { useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'mortgage-simulator-theme'

/**
 * Get the effective theme (resolves 'system' to 'light' or 'dark')
 */
function getEffectiveTheme(theme: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

/**
 * Apply theme to document
 */
function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

/**
 * Get theme from localStorage
 */
function getStoredTheme(): 'light' | 'dark' | 'system' | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  return null
}

/**
 * Store theme in localStorage
 */
function storeTheme(theme: 'light' | 'dark' | 'system') {
  if (typeof window === 'undefined') return
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

/**
 * Hook to manage theme
 */
export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    return getStoredTheme() || 'system'
  })

  // Apply theme immediately on mount
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme(theme)
    applyTheme(effectiveTheme)

    // If theme is 'system', listen for system preference changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        applyTheme(e.matches ? 'dark' : 'light')
      }

      // Listen for changes
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange)
        return () => mediaQuery.removeListener(handleChange)
      }
    }
  }, [theme])

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    // Apply theme immediately
    const effectiveTheme = getEffectiveTheme(newTheme)
    applyTheme(effectiveTheme)

    // Update state and storage
    storeTheme(newTheme)
    setThemeState(newTheme)
  }

  return {
    theme,
    setTheme,
    effectiveTheme: getEffectiveTheme(theme),
  }
}
