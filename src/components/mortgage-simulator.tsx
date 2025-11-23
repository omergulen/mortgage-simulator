import { useEffect, useState } from 'react'
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
import {
  migrateOldScenarios,
  hasOldScenarios,
  downloadScenarios,
  importScenarios,
} from '@/lib/utils/migrate-scenarios'
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
  const { scenarios, horizonYears, harvestingStrategy, addScenario, clearAll } = useMortgageStore()
  const [editingScenario, setEditingScenario] = useState<{ id: string } | null>(null)
  const [showMigrationDialog, setShowMigrationDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)

  // Check for old scenarios on mount (one-time initialization)
  useEffect(() => {
    if (hasOldScenarios() && scenarios.length === 0) {
      setShowMigrationDialog(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMigrate = () => {
    const oldScenarios = migrateOldScenarios()
    oldScenarios.forEach((scenario) => addScenario(scenario))
    setShowMigrationDialog(false)
  }

  const handleExport = () => {
    downloadScenarios(scenarios)
  }

  const handleImport = () => {
    try {
      setImportError(null)
      const imported = importScenarios(importText)
      imported.forEach((scenario) => addScenario(scenario))
      setShowImportDialog(false)
      setImportText('')
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const handleImportReplace = () => {
    try {
      setImportError(null)
      const imported = importScenarios(importText)
      clearAll()
      imported.forEach((scenario) => addScenario(scenario))
      setShowImportDialog(false)
      setImportText('')
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const comparisons = scenarios.length > 0
    ? MortgageCalculator.compareScenarios(scenarios, horizonYears, harvestingStrategy)
    : []

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="mb-6">
          <p className="text-muted-foreground mb-4">
            Compare mortgage offers with detailed amortization and ETF optimization
          </p>
          <GlobalConfig />
        </div>

        <div className="space-y-6">
          {/* Add Scenario Button and Import/Export */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 justify-center items-center">
                <ScenarioFormModal
                  editingScenario={editingScenario}
                  onClose={() => setEditingScenario(null)}
                />
                <Button variant="outline" onClick={handleExport} disabled={scenarios.length === 0}>
                  📥 Export Scenarios
                </Button>
                <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                  📤 Import Scenarios
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          {scenarios.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="sticky top-0 bg-card z-10">Scenario Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ComparisonTable
                  comparisons={comparisons}
                  onEdit={(id) => setEditingScenario({ id })}
                />
              </CardContent>
            </Card>
          )}

          {/* Detailed View */}
          {scenarios.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="sticky top-0 bg-card z-10">Detailed Scenario Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <DetailedView
                  comparisons={comparisons}
                  onEdit={(id) => setEditingScenario({ id })}
                />
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

        {/* Migration Dialog */}
        <Dialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Migrate Old Scenarios?</DialogTitle>
              <DialogDescription>
                We found scenarios from the previous version. Would you like to import them?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMigrationDialog(false)}>
                Skip
              </Button>
              <Button onClick={handleMigrate}>Import</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Scenarios</DialogTitle>
              <DialogDescription>
                Paste your exported scenarios JSON below. You can either add them to existing scenarios or replace all scenarios.
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
              <Button
                variant="outline"
                onClick={handleImportReplace}
                disabled={!importText.trim()}
              >
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

