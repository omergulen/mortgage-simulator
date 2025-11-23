import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => {
    // Apply theme immediately (before React renders)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mortgage-simulator-theme')
      const theme = stored || 'system'
      let effectiveTheme: 'light' | 'dark'
      if (theme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      } else {
        effectiveTheme = theme as 'light' | 'dark'
      }
      if (effectiveTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    return <Outlet />
  },
})

