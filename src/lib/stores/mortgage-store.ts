import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Scenario, HarvestingStrategy } from '@/lib/mortgage-calculator'

interface MortgageState {
  // Base scenarios (mortgage offers only)
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
  // Selected combination values (for generating combinations)
  selectedInitialETF: number[]
  selectedMonthlyETF: number[]
  selectedExtraYearly: number[]
  selectedScenarios: string[] // Scenario IDs to include in combinations
  visibleComparisons: Record<string, boolean> // Comparison IDs to show in table
  // UI state
  selectedScenarioId: string | null
  sortColumn: string | null
  sortDirection: 'asc' | 'desc' | null
  visibleColumns: Record<string, boolean>
  columnOrder: string[]
  // Actions
  addScenario: (scenario: Scenario) => void
  updateScenario: (id: string, scenario: Partial<Scenario>) => void
  deleteScenario: (id: string) => void
  setHorizonYears: (years: 10 | 20 | 30) => void
  setHarvestingStrategy: (strategy: HarvestingStrategy) => void
  setPropertyValue: (value: number) => void
  setEtfReturn: (value: number) => void
  setInflation: (value: number) => void
  setInitialETFOptions: (options: number[]) => void
  setMonthlyETFOptions: (options: number[]) => void
  setExtraYearlyOptions: (options: number[]) => void
  setSelectedInitialETF: (values: number[]) => void
  setSelectedMonthlyETF: (values: number[]) => void
  setSelectedExtraYearly: (values: number[]) => void
  setSelectedScenarios: (ids: string[]) => void
  setVisibleComparison: (id: string, visible: boolean) => void
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
      propertyValue: 400000,
      etfReturn: 7.0,
      inflation: 2.0,
      initialETFOptions: [0, 10000, 20000, 50000],
      monthlyETFOptions: [0, 100, 200, 500],
      extraYearlyOptions: [0, 2000, 5000, 10000],
      selectedInitialETF: [0],
      selectedMonthlyETF: [0],
      selectedExtraYearly: [0],
      selectedScenarios: [],
      visibleComparisons: {},
      selectedScenarioId: null,
      sortColumn: null,
      sortDirection: null,
      visibleColumns: {},
      columnOrder: [],

      addScenario: (scenario) =>
        set((state) => {
          const newScenarios = [...state.scenarios, scenario]
          // Auto-select new scenario for combinations
          const safeSelectedScenarios = Array.isArray(state.selectedScenarios) ? state.selectedScenarios : []
          const newSelectedScenarios = [...safeSelectedScenarios, scenario.id]
          return {
            scenarios: newScenarios,
            selectedScenarios: newSelectedScenarios,
          }
        }),

      updateScenario: (id, updates) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),

      deleteScenario: (id) =>
        set((state) => {
          const safeSelectedScenarios = Array.isArray(state.selectedScenarios) ? state.selectedScenarios : []
          return {
            scenarios: state.scenarios.filter((s) => s.id !== id),
            selectedScenarios: safeSelectedScenarios.filter((sid) => sid !== id),
            selectedScenarioId: state.selectedScenarioId === id ? null : state.selectedScenarioId,
          }
        }),

      setHorizonYears: (years) => set({ horizonYears: years }),
      setHarvestingStrategy: (strategy) => set({ harvestingStrategy: strategy }),
      setPropertyValue: (value) => set({ propertyValue: value }),
      setEtfReturn: (value) => set({ etfReturn: value }),
      setInflation: (value) => set({ inflation: value }),
      setInitialETFOptions: (options) => set({ initialETFOptions: options }),
      setMonthlyETFOptions: (options) => set({ monthlyETFOptions: options }),
      setExtraYearlyOptions: (options) => set({ extraYearlyOptions: options }),
      setSelectedInitialETF: (values) => set({ selectedInitialETF: values }),
      setSelectedMonthlyETF: (values) => set({ selectedMonthlyETF: values }),
      setSelectedExtraYearly: (values) => set({ selectedExtraYearly: values }),
      setSelectedScenarios: (ids) => set({ selectedScenarios: ids }),
      setVisibleComparison: (id, visible) =>
        set((state) => ({
          visibleComparisons: { ...state.visibleComparisons, [id]: visible },
        })),
      setSelectedScenarioId: (id) => set({ selectedScenarioId: id }),
      setSort: (column, direction) => set({ sortColumn: column, sortDirection: direction }),
      setColumnVisibility: (column, visible) =>
        set((state) => ({
          visibleColumns: { ...state.visibleColumns, [column]: visible },
        })),
      setColumnOrder: (order) => set({ columnOrder: order }),
      resetColumnVisibility: () => set({ visibleColumns: {}, columnOrder: [] }),
      clearAll: () =>
        set({
          scenarios: [],
          selectedScenarios: [],
          visibleComparisons: {},
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
      // Migration function to ensure data structure is correct
      migrate: (persistedState: any, version: number) => {
        // Ensure selectedScenarios is always an array
        if (persistedState?.state?.selectedScenarios && !Array.isArray(persistedState.state.selectedScenarios)) {
          persistedState.state.selectedScenarios = []
        }
        // Ensure other array fields are arrays
        if (persistedState?.state?.scenarios && !Array.isArray(persistedState.state.scenarios)) {
          persistedState.state.scenarios = []
        }
        if (persistedState?.state?.selectedInitialETF && !Array.isArray(persistedState.state.selectedInitialETF)) {
          persistedState.state.selectedInitialETF = [0]
        }
        if (persistedState?.state?.selectedMonthlyETF && !Array.isArray(persistedState.state.selectedMonthlyETF)) {
          persistedState.state.selectedMonthlyETF = [0]
        }
        if (persistedState?.state?.selectedExtraYearly && !Array.isArray(persistedState.state.selectedExtraYearly)) {
          persistedState.state.selectedExtraYearly = [0]
        }
        if (persistedState?.state?.initialETFOptions && !Array.isArray(persistedState.state.initialETFOptions)) {
          persistedState.state.initialETFOptions = [0, 10000, 20000, 50000]
        }
        if (persistedState?.state?.monthlyETFOptions && !Array.isArray(persistedState.state.monthlyETFOptions)) {
          persistedState.state.monthlyETFOptions = [0, 100, 200, 500]
        }
        if (persistedState?.state?.extraYearlyOptions && !Array.isArray(persistedState.state.extraYearlyOptions)) {
          persistedState.state.extraYearlyOptions = [0, 2000, 5000, 10000]
        }
        return persistedState
      },
      version: 1,
    }
  )
)
