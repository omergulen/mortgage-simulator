import type { Scenario } from '@/lib/mortgage-calculator'

const OLD_STORAGE_KEY = 'mortgageScenarios'

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

    // Convert old format to new format
    const migratedScenarios: Scenario[] = oldScenarios.map((old: Record<string, unknown>) => ({
      id: (old.id as string) || crypto.randomUUID(),
      name: (old.name as string) || 'Unnamed Scenario',
      loanAmount: Number(old.loanAmount) || 0,
      interestRate: Number(old.interestRate) || 0,
      monthlyPayment: Number(old.monthlyPayment) || 0,
      extraYearly: Number(old.extraYearly) || 0,
      propertyValue: Number(old.propertyValue) || 0,
      initialETF: Number(old.initialETF) || 0,
      monthlyETF: Number(old.monthlyETF) || 0,
      etfReturn: Number(old.etfReturn) || 7.0,
      inflation: Number(old.inflation) || 2.0,
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
 * Export scenarios to JSON
 */
export function exportScenarios(scenarios: Scenario[]): string {
  return JSON.stringify(scenarios, null, 2)
}

/**
 * Import scenarios from JSON
 */
export function importScenarios(json: string): Scenario[] {
  try {
    const data = JSON.parse(json)
    if (!Array.isArray(data)) {
      throw new Error('Invalid format: expected an array of scenarios')
    }

    // Validate and convert to Scenario format
    return data.map((item: Record<string, unknown>, index: number) => ({
      id: (item.id as string) || crypto.randomUUID(),
      name: (item.name as string) || `Imported Scenario ${index + 1}`,
      loanAmount: Number(item.loanAmount) || 0,
      interestRate: Number(item.interestRate) || 0,
      monthlyPayment: Number(item.monthlyPayment) || 0,
      extraYearly: Number(item.extraYearly) || 0,
      propertyValue: Number(item.propertyValue) || 0,
      initialETF: Number(item.initialETF) || 0,
      monthlyETF: Number(item.monthlyETF) || 0,
      etfReturn: Number(item.etfReturn) || 7.0,
      inflation: Number(item.inflation) || 2.0,
    }))
  } catch (error) {
    throw new Error(
      `Failed to import scenarios: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Download scenarios as JSON file
 */
export function downloadScenarios(scenarios: Scenario[], filename = 'mortgage-scenarios.json') {
  const json = exportScenarios(scenarios)
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
