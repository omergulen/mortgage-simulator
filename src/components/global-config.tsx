import { useState, useEffect } from 'react'
import { useMortgageStore } from '@/lib/stores/mortgage-store'
import { type HarvestingStrategy, MortgageCalculator } from '@/lib/mortgage-calculator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { parseNumber } from '@/lib/utils/parse-number'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function GlobalConfig() {
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
    deleteScenario,
  } = useMortgageStore()

  // Store raw string values for inputs to allow . and , while typing
  const [rawGlobalValues, setRawGlobalValues] = useState({
    propertyValue: propertyValue?.toString() || '',
    etfReturn: etfReturn?.toString() || '',
    inflation: inflation?.toString() || '',
  })

  useEffect(() => {
    setRawGlobalValues({
      propertyValue: propertyValue?.toString() || '',
      etfReturn: etfReturn?.toString() || '',
      inflation: inflation?.toString() || '',
    })
  }, [propertyValue, etfReturn, inflation])

  const handleAddOption = (type: 'initialETF' | 'monthlyETF' | 'extraYearly', value: string) => {
    const numValue = parseNumber(value)
    if (isNaN(numValue) || numValue < 0) return

    const currentOptions =
      type === 'initialETF'
        ? initialETFOptions
        : type === 'monthlyETF'
          ? monthlyETFOptions
          : extraYearlyOptions

    if (currentOptions.includes(numValue)) return

    const newOptions = [...currentOptions, numValue].sort((a, b) => a - b)
    if (type === 'initialETF') {
      setInitialETFOptions(newOptions)
    } else if (type === 'monthlyETF') {
      setMonthlyETFOptions(newOptions)
    } else {
      setExtraYearlyOptions(newOptions)
    }
  }

  const handleRemoveOption = (type: 'initialETF' | 'monthlyETF' | 'extraYearly', value: number) => {
    const currentOptions =
      type === 'initialETF'
        ? initialETFOptions
        : type === 'monthlyETF'
          ? monthlyETFOptions
          : extraYearlyOptions

    const newOptions = currentOptions.filter((v) => v !== value)
    if (type === 'initialETF') {
      setInitialETFOptions(newOptions)
      setSelectedInitialETF(selectedInitialETF.filter((v) => v !== value))
    } else if (type === 'monthlyETF') {
      setMonthlyETFOptions(newOptions)
      setSelectedMonthlyETF(selectedMonthlyETF.filter((v) => v !== value))
    } else {
      setExtraYearlyOptions(newOptions)
      setSelectedExtraYearly(selectedExtraYearly.filter((v) => v !== value))
    }
  }

  const toggleSelection = (type: 'initialETF' | 'monthlyETF' | 'extraYearly', value: number) => {
    const currentSelected =
      type === 'initialETF'
        ? selectedInitialETF
        : type === 'monthlyETF'
          ? selectedMonthlyETF
          : selectedExtraYearly

    const isSelected = currentSelected.includes(value)
    const newSelected = isSelected
      ? currentSelected.filter((v) => v !== value)
      : [...currentSelected, value].sort((a, b) => a - b)

    if (type === 'initialETF') {
      setSelectedInitialETF(newSelected)
    } else if (type === 'monthlyETF') {
      setSelectedMonthlyETF(newSelected)
    } else {
      setSelectedExtraYearly(newSelected)
    }
  }

  return (
    <div className="space-y-6">
      {/* Global Values */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Global Values</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="property-value">Property Value (€)</Label>
            <Input
              id="property-value"
              type="text"
              value={rawGlobalValues.propertyValue}
              onChange={(e) => {
                setRawGlobalValues((prev) => ({ ...prev, propertyValue: e.target.value }))
                const parsed = parseNumber(e.target.value)
                if (!isNaN(parsed) && parsed > 0) {
                  setPropertyValue(parsed)
                }
              }}
              onBlur={(e) => {
                const parsed = parseNumber(e.target.value)
                if (!isNaN(parsed) && parsed > 0) {
                  setPropertyValue(parsed)
                  setRawGlobalValues((prev) => ({ ...prev, propertyValue: parsed.toString() }))
                } else {
                  // Reset to previous valid value if invalid
                  setRawGlobalValues((prev) => ({
                    ...prev,
                    propertyValue: propertyValue > 0 ? propertyValue.toString() : '400000',
                  }))
                  if (propertyValue <= 0) {
                    setPropertyValue(400000)
                  }
                }
              }}
              placeholder="400000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="etf-return">ETF Expected Return (% p.a.)</Label>
            <Input
              id="etf-return"
              type="text"
              value={rawGlobalValues.etfReturn}
              onChange={(e) => {
                setRawGlobalValues((prev) => ({ ...prev, etfReturn: e.target.value }))
                const parsed = parseNumber(e.target.value)
                if (!isNaN(parsed)) {
                  setEtfReturn(parsed || 7.0)
                }
              }}
              onBlur={(e) => {
                const parsed = parseNumber(e.target.value)
                if (!isNaN(parsed)) {
                  setEtfReturn(parsed || 7.0)
                  setRawGlobalValues((prev) => ({ ...prev, etfReturn: parsed.toString() }))
                }
              }}
              placeholder="7.0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inflation">Inflation Rate (% p.a.)</Label>
            <Input
              id="inflation"
              type="text"
              value={rawGlobalValues.inflation}
              onChange={(e) => {
                setRawGlobalValues((prev) => ({ ...prev, inflation: e.target.value }))
                const parsed = parseNumber(e.target.value)
                if (!isNaN(parsed)) {
                  setInflation(parsed || 2.0)
                }
              }}
              onBlur={(e) => {
                const parsed = parseNumber(e.target.value)
                if (!isNaN(parsed)) {
                  setInflation(parsed || 2.0)
                  setRawGlobalValues((prev) => ({ ...prev, inflation: parsed.toString() }))
                }
              }}
              placeholder="2.0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time-horizon">Time Horizon</Label>
            <Select
              value={horizonYears.toString()}
              onValueChange={(value) => setHorizonYears(parseInt(value) as 10 | 20 | 30)}
            >
              <SelectTrigger id="time-horizon">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 years</SelectItem>
                <SelectItem value="20">20 years</SelectItem>
                <SelectItem value="30">30 years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="harvesting-strategy">Tax-Gain Harvesting Strategy</Label>
            <Select
              value={harvestingStrategy}
              onValueChange={(value) => setHarvestingStrategy(value as HarvestingStrategy)}
            >
              <SelectTrigger id="harvesting-strategy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Harvesting (Tax at End)</SelectItem>
                <SelectItem value="full">Full Buy/Sell Every Year</SelectItem>
                <SelectItem value="partial">Partial Harvest (Tax-Free Limit Only)</SelectItem>
                <SelectItem value="optimal">Optimal Harvest (Best Strategy)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Mortgage Offers Selection */}
      {scenarios.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Mortgage Offers</h3>
          <p className="text-sm text-muted-foreground">
            Select which mortgage offers to include in combinations.
          </p>
          <div className="flex flex-wrap gap-3">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="flex items-center gap-2">
                <Checkbox
                  id={`scenario-${scenario.id}`}
                  checked={selectedScenarios.includes(scenario.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedScenarios([...selectedScenarios, scenario.id])
                    } else {
                      setSelectedScenarios(selectedScenarios.filter((id) => id !== scenario.id))
                    }
                  }}
                />
                <Label htmlFor={`scenario-${scenario.id}`} className="cursor-pointer font-normal">
                  {scenario.name}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 dark:text-red-400"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${scenario.name}"?`)) {
                      deleteScenario(scenario.id)
                    }
                  }}
                  title="Delete Mortgage Offer"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Combination Options */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Combination Options</h3>

        {/* Initial ETF Options */}
        <div className="space-y-2">
          <Label>Initial ETF Investment (€)</Label>
          <div className="flex flex-wrap gap-3 items-center">
            {initialETFOptions.map((value) => (
              <div key={value} className="flex items-center gap-2">
                <Checkbox
                  id={`initial-etf-${value}`}
                  checked={selectedInitialETF.includes(value)}
                  onCheckedChange={() => toggleSelection('initialETF', value)}
                />
                <Label htmlFor={`initial-etf-${value}`} className="cursor-pointer font-normal">
                  {MortgageCalculator.formatCurrency(value)}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleRemoveOption('initialETF', value)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Input
              type="text"
              placeholder="Add value"
              className="w-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddOption('initialETF', e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>
        </div>

        {/* Monthly ETF Options */}
        <div className="space-y-2">
          <Label>Monthly ETF Contribution (€)</Label>
          <div className="flex flex-wrap gap-3 items-center">
            {monthlyETFOptions.map((value) => (
              <div key={value} className="flex items-center gap-2">
                <Checkbox
                  id={`monthly-etf-${value}`}
                  checked={selectedMonthlyETF.includes(value)}
                  onCheckedChange={() => toggleSelection('monthlyETF', value)}
                />
                <Label htmlFor={`monthly-etf-${value}`} className="cursor-pointer font-normal">
                  {MortgageCalculator.formatCurrency(value)}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleRemoveOption('monthlyETF', value)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Input
              type="text"
              placeholder="Add value"
              className="w-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddOption('monthlyETF', e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>
        </div>

        {/* Extra Yearly Payment Options */}
        <div className="space-y-2">
          <Label>Extra Yearly Payment (€)</Label>
          <div className="flex flex-wrap gap-3 items-center">
            {extraYearlyOptions.map((value) => (
              <div key={value} className="flex items-center gap-2">
                <Checkbox
                  id={`extra-yearly-${value}`}
                  checked={selectedExtraYearly.includes(value)}
                  onCheckedChange={() => toggleSelection('extraYearly', value)}
                />
                <Label htmlFor={`extra-yearly-${value}`} className="cursor-pointer font-normal">
                  {MortgageCalculator.formatCurrency(value)}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleRemoveOption('extraYearly', value)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Input
              type="text"
              placeholder="Add value"
              className="w-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddOption('extraYearly', e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
