import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Scenario, HarvestingStrategy } from '@/lib/mortgage-calculator'

interface MortgageState {
  scenarios: Scenario[]
  horizonYears: 10 | 20 | 30
  harvestingStrategy: HarvestingStrategy
  selectedScenarioId: string | null
  sortColumn: string | null
  sortDirection: 'asc' | 'desc' | null
  visibleColumns: Record<string, boolean>
  columnOrder: string[]
  addScenario: (scenario: Scenario) => void
  updateScenario: (id: string, scenario: Partial<Scenario>) => void
  deleteScenario: (id: string) => void
  duplicateScenario: (id: string) => void
  setHorizonYears: (years: 10 | 20 | 30) => void
  setHarvestingStrategy: (strategy: HarvestingStrategy) => void
  setSelectedScenarioId: (id: string | null) => void
  setSort: (column: string | null, direction: 'asc' | 'desc' | null) => void
  setColumnVisibility: (column: string, visible: boolean) => void
  setColumnOrder: (order: string[]) => void
  resetColumnVisibility: () => void
  clearAll: () => void
}

export const useMortgageStore = create<MortgageState>()(
  persist(
    (set) => ({
      scenarios: [],
      horizonYears: 20,
      harvestingStrategy: 'optimal',
      selectedScenarioId: null,
      sortColumn: null,
      sortDirection: null,
      visibleColumns: {},
      columnOrder: [],
      
      addScenario: (scenario) =>
        set((state) => ({
          scenarios: [...state.scenarios, scenario],
        })),
      
      updateScenario: (id, updates) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      
      deleteScenario: (id) =>
        set((state) => ({
          scenarios: state.scenarios.filter((s) => s.id !== id),
          selectedScenarioId:
            state.selectedScenarioId === id ? null : state.selectedScenarioId,
        })),
      
      duplicateScenario: (id) =>
        set((state) => {
          const scenario = state.scenarios.find((s) => s.id === id)
          if (!scenario) return state
          
          const duplicated: Scenario = {
            ...scenario,
            id: crypto.randomUUID(),
            name: `${scenario.name} (Copy)`,
          }
          
          return {
            scenarios: [...state.scenarios, duplicated],
          }
        }),
      
      setHorizonYears: (years) => set({ horizonYears: years }),
      setHarvestingStrategy: (strategy) => set({ harvestingStrategy: strategy }),
      setSelectedScenarioId: (id) => set({ selectedScenarioId: id }),
      setSort: (column, direction) =>
        set({ sortColumn: column, sortDirection: direction }),
      setColumnVisibility: (column, visible) =>
        set((state) => ({
          visibleColumns: { ...state.visibleColumns, [column]: visible },
        })),
      setColumnOrder: (order) =>
        set({ columnOrder: order }),
      resetColumnVisibility: () =>
        set({ visibleColumns: {}, columnOrder: [] }),
      clearAll: () =>
        set({
          scenarios: [],
          selectedScenarioId: null,
          sortColumn: null,
          sortDirection: null,
          visibleColumns: {},
          columnOrder: [],
        }),
    }),
    {
      name: 'mortgage-simulator-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

