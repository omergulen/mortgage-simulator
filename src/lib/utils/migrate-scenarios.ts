import type { Scenario, HarvestingStrategy } from '@/lib/mortgage-calculator'

const OLD_STORAGE_KEY = 'mortgageScenarios'

export interface ExportData {
  version: string
  scenarios: Scenario[]
  // Global configuration
  horizonYears: 10 | 20 | 30
  harvestingStrategy: HarvestingStrategy
  propertyValue: number
  etfReturn: number
  inflation: number
  // Combination options
  initialETFOptions: number[]
  monthlyETFOptions: number[]
  extraYearlyOptions: number[]
  // Selected combination values
  selectedInitialETF: number[]
  selectedMonthlyETF: number[]
  selectedExtraYearly: number[]
  selectedScenarios: string[]
  visibleComparisons?: Record<string, boolean>
}

/**
 * Migrate scenarios from old localStorage format to new format
 */
export function migrateOldScenarios(): Scenario[] {
  if (typeof window === 'undefined') return []

  try {
    const oldData = localStorage.getItem(OLD_STORAGE_KEY)
    if (!oldData) return []

    const oldScenarios = JSON.parse(oldData)
    if (!Array.isArray(oldScenarios)) return []

    // Convert old format to new format (only mortgage-specific fields)
    const migratedScenarios: Scenario[] = oldScenarios.map((old: Record<string, unknown>) => ({
      id: (old.id as string) || crypto.randomUUID(),
      name: (old.name as string) || 'Unnamed Scenario',
      loanAmount: Number(old.loanAmount) || 0,
      interestRate: Number(old.interestRate) || 0,
      monthlyPayment: Number(old.monthlyPayment) || 0,
      extraYearlyLimit:
        old.extraYearlyLimit !== undefined ? Number(old.extraYearlyLimit) : undefined,
    }))

    return migratedScenarios
  } catch (error) {
    console.error('Error migrating old scenarios:', error)
    return []
  }
}

/**
 * Check if old scenarios exist and haven't been migrated yet
 */
export function hasOldScenarios(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const oldData = localStorage.getItem(OLD_STORAGE_KEY)
    if (!oldData) return false

    const oldScenarios = JSON.parse(oldData)
    return Array.isArray(oldScenarios) && oldScenarios.length > 0
  } catch {
    return false
  }
}

/**
 * Export all application data to JSON
 */
export function exportAllData(data: ExportData): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Import all application data from JSON
 * Supports both new format (with version) and old format (just scenarios array)
 */
export function importAllData(json: string): ExportData {
  try {
    const data = JSON.parse(json)

    // Check if it's the old format (just an array of scenarios)
    if (Array.isArray(data)) {
      // Old format - convert scenarios and use defaults for everything else
      const scenarios: Scenario[] = data.map((item: Record<string, unknown>, index: number) => ({
        id: (item.id as string) || crypto.randomUUID(),
        name: (item.name as string) || `Imported Scenario ${index + 1}`,
        loanAmount: Number(item.loanAmount) || 0,
        interestRate: Number(item.interestRate) || 0,
        monthlyPayment: Number(item.monthlyPayment) || 0,
        extraYearlyLimit:
          item.extraYearlyLimit !== undefined ? Number(item.extraYearlyLimit) : undefined,
      }))

      return {
        version: '1.0',
        scenarios,
        horizonYears: 20,
        harvestingStrategy: 'optimal',
        propertyValue: 400000,
        etfReturn: 7.0,
        inflation: 2.0,
        initialETFOptions: [0, 10000, 20000, 50000],
        monthlyETFOptions: [0, 100, 200, 500],
        extraYearlyOptions: [0, 2000, 5000, 10000],
        selectedInitialETF: [0],
        selectedMonthlyETF: [0],
        selectedExtraYearly: [0],
        selectedScenarios: scenarios.map((s) => s.id),
        visibleComparisons: {},
      }
    }

    // New format - validate and return
    if (!data.scenarios || !Array.isArray(data.scenarios)) {
      throw new Error('Invalid format: expected scenarios array')
    }

    const scenarios: Scenario[] = data.scenarios.map(
      (item: Record<string, unknown>, index: number) => ({
        id: (item.id as string) || crypto.randomUUID(),
        name: (item.name as string) || `Imported Scenario ${index + 1}`,
        loanAmount: Number(item.loanAmount) || 0,
        interestRate: Number(item.interestRate) || 0,
        monthlyPayment: Number(item.monthlyPayment) || 0,
        extraYearlyLimit:
          item.extraYearlyLimit !== undefined ? Number(item.extraYearlyLimit) : undefined,
      })
    )

    return {
      version: data.version || '1.0',
      scenarios,
      horizonYears: (data.horizonYears as 10 | 20 | 30) || 20,
      harvestingStrategy: (data.harvestingStrategy as HarvestingStrategy) || 'optimal',
      propertyValue: Number(data.propertyValue) || 400000,
      etfReturn: Number(data.etfReturn) || 7.0,
      inflation: Number(data.inflation) || 2.0,
      initialETFOptions: Array.isArray(data.initialETFOptions)
        ? data.initialETFOptions.map(Number)
        : [0, 10000, 20000, 50000],
      monthlyETFOptions: Array.isArray(data.monthlyETFOptions)
        ? data.monthlyETFOptions.map(Number)
        : [0, 100, 200, 500],
      extraYearlyOptions: Array.isArray(data.extraYearlyOptions)
        ? data.extraYearlyOptions.map(Number)
        : [0, 2000, 5000, 10000],
      selectedInitialETF: Array.isArray(data.selectedInitialETF)
        ? data.selectedInitialETF.map(Number)
        : [0],
      selectedMonthlyETF: Array.isArray(data.selectedMonthlyETF)
        ? data.selectedMonthlyETF.map(Number)
        : [0],
      selectedExtraYearly: Array.isArray(data.selectedExtraYearly)
        ? data.selectedExtraYearly.map(Number)
        : [0],
      selectedScenarios: Array.isArray(data.selectedScenarios)
        ? data.selectedScenarios
        : scenarios.map((s) => s.id),
      visibleComparisons: data.visibleComparisons || {},
    }
  } catch (error) {
    throw new Error(
      `Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Download all application data as JSON file
 */
export function downloadAllData(data: ExportData, filename = 'mortgage-simulator-data.json') {
  const json = exportAllData(data)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Legacy functions for backward compatibility
/**
 * @deprecated Use exportAllData instead
 */
export function exportScenarios(scenarios: Scenario[]): string {
  return JSON.stringify(scenarios, null, 2)
}

/**
 * @deprecated Use importAllData instead
 */
export function importScenarios(json: string): Scenario[] {
  const data = importAllData(json)
  return data.scenarios
}

/**
 * @deprecated Use downloadAllData instead
 */
export function downloadScenarios(scenarios: Scenario[], filename = 'mortgage-scenarios.json') {
  const data: ExportData = {
    version: '1.0',
    scenarios,
    horizonYears: 20,
    harvestingStrategy: 'optimal',
    propertyValue: 400000,
    etfReturn: 7.0,
    inflation: 2.0,
    initialETFOptions: [0, 10000, 20000, 50000],
    monthlyETFOptions: [0, 100, 200, 500],
    extraYearlyOptions: [0, 2000, 5000, 10000],
    selectedInitialETF: [0],
    selectedMonthlyETF: [0],
    selectedExtraYearly: [0],
    selectedScenarios: scenarios.map((s) => s.id),
    visibleComparisons: {},
  }
  downloadAllData(data, filename)
}
