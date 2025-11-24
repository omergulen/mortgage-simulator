import { useEffect, useState, useMemo, useRef } from 'react'
import { useMortgageStore } from '@/lib/stores/mortgage-store'
import { MortgageCalculator } from '@/lib/mortgage-calculator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScenarioFormModal } from './scenario-form-modal'
import { ComparisonTable } from './comparison-table'
import { DetailedView } from './detailed-view'
import { Charts } from './charts'
import { GlobalConfig } from './global-config'
import { AppLayout } from './layout/app-layout'
import { downloadAllData, importAllData, type ExportData } from '@/lib/utils/migrate-scenarios'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export function MortgageSimulator() {
  const {
    scenarios,
    horizonYears,
    harvestingStrategy,
    propertyValue,
    etfReturn,
    inflation,
    initialETFOptions,
    monthlyETFOptions,
    extraYearlyOptions,
    selectedInitialETF,
    selectedMonthlyETF,
    selectedExtraYearly,
    selectedScenarios,
    visibleComparisons,
    setSelectedScenarios,
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
    setVisibleComparison,
    addScenario,
    clearAll,
  } = useMortgageStore()
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const previousScenarioIdsRef = useRef<Set<string>>(new Set())

  // Initialize selectedScenarios when NEW scenarios are added (not when selectedScenarios changes)
  useEffect(() => {
    const currentScenarioIds = new Set(scenarios.map((s) => s.id))
    const previousScenarioIds = previousScenarioIdsRef.current

    // Find newly added scenarios (in current but not in previous)
    const newScenarioIds = Array.from(currentScenarioIds).filter((id) => !previousScenarioIds.has(id))

    if (newScenarioIds.length > 0) {
      // Only add scenarios that aren't already selected (use functional update to avoid dependency)
      setSelectedScenarios((currentSelected) => {
        // Ensure currentSelected is an array
        const safeCurrentSelected = Array.isArray(currentSelected) ? currentSelected : []
        const missingSelected = newScenarioIds.filter((id) => !safeCurrentSelected.includes(id))
        if (missingSelected.length > 0) {
          return [...safeCurrentSelected, ...missingSelected]
        }
        return safeCurrentSelected
      })
    }

    // Update the ref for next comparison
    previousScenarioIdsRef.current = currentScenarioIds
  }, [scenarios, setSelectedScenarios])

  const handleExport = () => {
    const exportData: ExportData = {
      version: '1.0',
      scenarios,
      horizonYears,
      harvestingStrategy,
      propertyValue,
      etfReturn,
      inflation,
      initialETFOptions,
      monthlyETFOptions,
      extraYearlyOptions,
      selectedInitialETF,
      selectedMonthlyETF,
      selectedExtraYearly,
      selectedScenarios,
      visibleComparisons,
    }
    downloadAllData(exportData)
  }

  const handleImport = () => {
    try {
      setImportError(null)
      const imported = importAllData(importText)
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
      setShowImportDialog(false)
      setImportText('')
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const handleImportReplace = () => {
    try {
      setImportError(null)
      const imported = importAllData(importText)
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
      setShowImportDialog(false)
      setImportText('')
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // Generate combinations from base scenarios and selected values
  const combinations = useMemo(() => {
    // Ensure selectedScenarios is an array (defensive check)
    const safeSelectedScenarios = Array.isArray(selectedScenarios) ? selectedScenarios : []
    if (scenarios.length === 0 || safeSelectedScenarios.length === 0) return []
    if (
      selectedInitialETF.length === 0 ||
      selectedMonthlyETF.length === 0 ||
      selectedExtraYearly.length === 0
    ) {
      return []
    }
    // Filter scenarios to only include selected ones
    const filteredScenarios = scenarios.filter((s) => safeSelectedScenarios.includes(s.id))
    return MortgageCalculator.generateCombinations(
      filteredScenarios,
      selectedInitialETF,
      selectedMonthlyETF,
      selectedExtraYearly
    )
  }, [scenarios, selectedScenarios, selectedInitialETF, selectedMonthlyETF, selectedExtraYearly])

  // Ensure selectedScenarios is always an array (fix if corrupted)
  useEffect(() => {
    if (!Array.isArray(selectedScenarios)) {
      setSelectedScenarios([])
    }
  }, [selectedScenarios, setSelectedScenarios])

  const comparisons =
    combinations.length > 0
      ? MortgageCalculator.compareScenarios(
          combinations,
          propertyValue,
          etfReturn,
          horizonYears,
          harvestingStrategy
        )
      : []

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="mb-6">
          <p className="text-muted-foreground mb-4">
            Compare mortgage offers with detailed amortization and ETF optimization
          </p>

          {/* Add Mortgage Offer Button at the top */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 justify-center items-center">
                <ScenarioFormModal />
                <Button variant="outline" onClick={handleExport} disabled={scenarios.length === 0}>
                  📥 Export Scenarios
                </Button>
                <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                  📤 Import Scenarios
                </Button>
              </div>
            </CardContent>
          </Card>

          <GlobalConfig />
        </div>

        <div className="space-y-6">
          {/* Comparison Table */}
          {scenarios.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Scenario Comparison</CardTitle>
                  <ComparisonTable comparisons={comparisons} showButtonsOnly />
                </div>
              </CardHeader>
              <CardContent>
                <ComparisonTable comparisons={comparisons} />
              </CardContent>
            </Card>
          )}

          {/* Detailed View */}
          {scenarios.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="sticky top-0 bg-card z-10">
                  Detailed Scenario Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DetailedView comparisons={comparisons} />
              </CardContent>
            </Card>
          )}

          {/* Charts */}
          {scenarios.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Visualizations</CardTitle>
              </CardHeader>
              <CardContent>
                <Charts comparisons={comparisons} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Scenarios</DialogTitle>
              <DialogDescription>
                Paste your exported scenarios JSON below. You can either add them to existing
                scenarios or replace all scenarios.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="import-text">Scenarios JSON</Label>
                <textarea
                  id="import-text"
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs"
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value)
                    setImportError(null)
                  }}
                  placeholder="Paste your scenarios JSON here..."
                />
                {importError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{importError}</p>
                )}
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handleImportReplace} disabled={!importText.trim()}>
                Replace All
              </Button>
              <Button onClick={handleImport} disabled={!importText.trim()}>
                Add to Existing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
