import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useTheme } from '@/lib/hooks/use-theme'

export function AppLayout({ children }: { children: React.ReactNode }) {
  useTheme() // Apply theme

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            {/* Logo/Title */}
            <div className="flex items-center flex-shrink-0 z-10">
              <h1 className="text-xl font-bold">🏠 Mortgage Simulator</h1>
            </div>

            {/* Right side - Theme toggle */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-3 flex-shrink-0 z-10">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}

