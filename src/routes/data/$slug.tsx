import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { MortgageSimulator } from '@/components/mortgage-simulator'
import { useMortgageStore } from '@/lib/stores/mortgage-store'
import { importAllData } from '@/lib/utils/migrate-scenarios'

export const Route = createFileRoute('/data/$slug')({
  component: SlugRoute,
})

function SlugRoute() {
  const { slug } = Route.useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const {
    clearAll,
    addScenario,
    setHorizonYears,
    setHarvestingStrategy,
    setPropertyValue,
    setEtfReturn,
    setInflation,
    setInitialETFOptions,
    setMonthlyETFOptions,
    setExtraYearlyOptions,
    setSelectedInitialETF,
    setSelectedMonthlyETF,
    setSelectedExtraYearly,
    setSelectedScenarios,
    setVisibleComparison,
  } = useMortgageStore()

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Sanitize slug to prevent path traversal
        const sanitizedSlug = slug.replace(/[^a-zA-Z0-9_-]/g, '')
        if (!sanitizedSlug) {
          throw new Error('Invalid slug')
        }

        // Fetch the JSON file matching the slug from the data directory
        const response = await fetch(`/data/${sanitizedSlug}.json`)
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Data file "${sanitizedSlug}.json" not found`)
          }
          throw new Error(`Failed to load data: ${response.statusText}`)
        }

        const jsonText = await response.text()
        const imported = importAllData(jsonText)

        // Clear everything first
        clearAll()

        // Add scenarios
        imported.scenarios.forEach((scenario) => addScenario(scenario))

        // Restore all configuration
        setHorizonYears(imported.horizonYears)
        setHarvestingStrategy(imported.harvestingStrategy)
        setPropertyValue(imported.propertyValue)
        setEtfReturn(imported.etfReturn)
        setInflation(imported.inflation)
        setInitialETFOptions(imported.initialETFOptions)
        setMonthlyETFOptions(imported.monthlyETFOptions)
        setExtraYearlyOptions(imported.extraYearlyOptions)
        setSelectedInitialETF(imported.selectedInitialETF)
        setSelectedMonthlyETF(imported.selectedMonthlyETF)
        setSelectedExtraYearly(imported.selectedExtraYearly)
        setSelectedScenarios(imported.selectedScenarios)

        // Restore visible comparisons if present
        if (imported.visibleComparisons) {
          Object.entries(imported.visibleComparisons).forEach(([id, visible]) => {
            setVisibleComparison(id, visible)
          })
        }

        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setIsLoading(false)
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading data for "{slug}"...</div>
          <div className="text-sm text-muted-foreground">Please wait</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-lg font-semibold mb-2 text-destructive">Error loading data</div>
          <div className="text-sm text-muted-foreground mb-4">{error}</div>
          <div className="space-y-2">
            <a href="/" className="text-primary hover:underline block">
              Go to home page
            </a>
            <div className="text-xs text-muted-foreground">
              Make sure the file <code className="bg-muted px-1 rounded">data/{slug}.json</code>{' '}
              exists in the <code className="bg-muted px-1 rounded">public</code> directory
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <MortgageSimulator />
}
