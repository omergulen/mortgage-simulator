import { useMortgageStore } from '@/lib/stores/mortgage-store'
import { MortgageCalculator, type ComparisonResult } from '@/lib/mortgage-calculator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { convertToCSV, downloadCSV } from '@/lib/utils/csv-export'

interface DetailedViewProps {
  comparisons: ComparisonResult[]
}

export function DetailedView({ comparisons }: DetailedViewProps) {
  const {
    selectedScenarioId,
    setSelectedScenarioId,
    horizonYears,
    harvestingStrategy,
    propertyValue,
    etfReturn,
  } = useMortgageStore()

  const selectedComparison = comparisons.find((c) => c.id === selectedScenarioId)

  const getHarvestingStrategyName = (strategy: string) => {
    const names: Record<string, string> = {
      none: '(No Harvesting)',
      full: '(Full Buy/Sell)',
      partial: '(Partial Harvest)',
      optimal: '(Optimal Harvest)',
    }
    return names[strategy] || ''
  }

  if (!selectedComparison) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="font-semibold">Select Scenario:</label>
          <Select
            value={selectedScenarioId || ''}
            onValueChange={(value) => setSelectedScenarioId(value || null)}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="-- Select a scenario --" />
            </SelectTrigger>
            <SelectContent>
              {comparisons.map((comparison) => (
                <SelectItem key={comparison.id} value={comparison.id}>
                  {comparison.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  const scenario = selectedComparison
  const amortization = MortgageCalculator.calculateAmortization(scenario, horizonYears)
  const etfResult = MortgageCalculator.calculateETF(
    scenario.initialETF,
    scenario.monthlyETF,
    etfReturn,
    horizonYears,
    harvestingStrategy
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 sticky top-0 bg-card z-10 py-2">
        <label className="font-semibold">Select Scenario:</label>
        <Select
          value={selectedScenarioId || ''}
          onValueChange={(value) => setSelectedScenarioId(value || null)}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {comparisons.map((comparison) => (
              <SelectItem key={comparison.id} value={comparison.id}>
                {comparison.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* No actions needed - scenarios are generated from mortgage offers and options */}
      </div>

      {/* Loan Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricItem
              label="Loan Amount"
              value={MortgageCalculator.formatCurrency(scenario.loanAmount)}
            />
            <MetricItem
              label="Sollzins (Nominal Interest Rate)"
              value={MortgageCalculator.formatPercent(scenario.interestRate)}
            />
            <MetricItem
              label="Effektivzins (Effective Interest Rate)"
              value={MortgageCalculator.formatPercent(scenario.effectiveInterestRate)}
            />
            <MetricItem
              label="Monthly Payment"
              value={MortgageCalculator.formatCurrency(scenario.monthlyPayment)}
            />
            <MetricItem
              label="Extra Yearly Payment"
              value={MortgageCalculator.formatCurrency(scenario.extraYearly || 0)}
            />
            <MetricItem
              label="Years to Payoff"
              value={`${scenario.payoffYears.toFixed(1)} years`}
            />
            <MetricItem
              label="Total Extra Payments"
              value={MortgageCalculator.formatCurrency(amortization.totalExtra)}
            />

            {horizonYears >= 10 && (
              <>
                <MetricItem
                  label="Remaining at 10 years"
                  value={MortgageCalculator.formatCurrency(scenario.balance10y ?? 0)}
                />
                <MetricItem
                  label="Total Paid (10y)"
                  value={MortgageCalculator.formatCurrency(scenario.totalPaid10y ?? 0)}
                />
                <MetricItem
                  label="Total Interest (10y)"
                  value={MortgageCalculator.formatCurrency(scenario.totalInterest10y ?? 0)}
                  negative
                />
              </>
            )}

            {horizonYears >= 20 && (
              <>
                <MetricItem
                  label="Remaining at 20 years"
                  value={MortgageCalculator.formatCurrency(scenario.balance20y ?? 0)}
                />
                <MetricItem
                  label="Total Paid (20y)"
                  value={MortgageCalculator.formatCurrency(scenario.totalPaid20y ?? 0)}
                />
                <MetricItem
                  label="Total Interest (20y)"
                  value={MortgageCalculator.formatCurrency(scenario.totalInterest20y ?? 0)}
                  negative
                />
              </>
            )}

            {horizonYears >= 30 && (
              <>
                <MetricItem
                  label="Remaining at 30 years"
                  value={MortgageCalculator.formatCurrency(scenario.balance30y ?? 0)}
                />
                <MetricItem
                  label="Total Paid (30y)"
                  value={MortgageCalculator.formatCurrency(scenario.totalPaid30y ?? 0)}
                />
                <MetricItem
                  label="Total Interest (30y)"
                  value={MortgageCalculator.formatCurrency(scenario.totalInterest30y ?? 0)}
                  negative
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Equity & Property */}
      <Card>
        <CardHeader>
          <CardTitle>Equity & Property</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricItem
              label="Property Value"
              value={MortgageCalculator.formatCurrency(propertyValue)}
            />

            {horizonYears >= 10 && (
              <>
                <MetricItem
                  label="Equity at 10 years"
                  value={MortgageCalculator.formatCurrency(scenario.equity10y ?? 0)}
                  positive
                />
                <MetricItem
                  label="Loan-to-Value (10y)"
                  value={
                    propertyValue > 0
                      ? MortgageCalculator.formatPercent(
                          ((scenario.balance10y ?? 0) / propertyValue) * 100
                        )
                      : 'N/A'
                  }
                />
              </>
            )}

            {horizonYears >= 20 && (
              <>
                <MetricItem
                  label="Equity at 20 years"
                  value={MortgageCalculator.formatCurrency(scenario.equity20y ?? 0)}
                  positive
                />
                <MetricItem
                  label="Loan-to-Value (20y)"
                  value={
                    propertyValue > 0
                      ? MortgageCalculator.formatPercent(
                          ((scenario.balance20y ?? 0) / propertyValue) * 100
                        )
                      : 'N/A'
                  }
                />
              </>
            )}

            {horizonYears >= 30 && (
              <>
                <MetricItem
                  label="Equity at 30 years"
                  value={MortgageCalculator.formatCurrency(scenario.equity30y ?? 0)}
                  positive
                />
                <MetricItem
                  label="Loan-to-Value (30y)"
                  value={
                    propertyValue > 0
                      ? MortgageCalculator.formatPercent(
                          ((scenario.balance30y ?? 0) / propertyValue) * 100
                        )
                      : 'N/A'
                  }
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ETF Investment */}
      <Card>
        <CardHeader>
          <CardTitle>ETF Investment {getHarvestingStrategyName(harvestingStrategy)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricItem
              label="Initial Investment"
              value={MortgageCalculator.formatCurrency(scenario.initialETF || 0)}
            />
            <MetricItem
              label="Monthly Contribution"
              value={MortgageCalculator.formatCurrency(scenario.monthlyETF || 0)}
            />
            <MetricItem
              label="Expected Return"
              value={MortgageCalculator.formatPercent(etfReturn || 7.0)}
            />
            <MetricItem
              label={`Future Value (${horizonYears}y)`}
              value={MortgageCalculator.formatCurrency(etfResult.futureValue)}
            />
            <MetricItem
              label="Total Gains"
              value={MortgageCalculator.formatCurrency(etfResult.gains)}
              positive
            />
            <MetricItem
              label="Tax Paid During Years"
              value={MortgageCalculator.formatCurrency(etfResult.tax || 0)}
              negative
            />
            <MetricItem
              label="Tax to Pay at End"
              value={MortgageCalculator.formatCurrency(etfResult.finalTax || 0)}
              negative
              bold
            />
            <MetricItem
              label="Total Harvested (Tax-Free)"
              value={MortgageCalculator.formatCurrency(etfResult.totalHarvested || 0)}
              positive
            />
            <MetricItem
              label="After-Tax Value"
              value={MortgageCalculator.formatCurrency(etfResult.afterTaxValue)}
              positive
              bold
            />
          </div>
        </CardContent>
      </Card>

      {/* Amortization Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="sticky top-0 bg-card z-10">Amortization Schedule</CardTitle>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              const headers = ['Year', 'Month', 'Balance', 'Interest', 'Principal', 'Extra', 'Total Payment']
              const csvData = amortization.schedule.map((entry) => ({
                'Year': entry.year,
                'Month': entry.month,
                'Balance': entry.balance,
                'Interest': entry.interestPayment,
                'Principal': entry.principalPayment,
                'Extra': entry.extraPayment,
                'Total Payment': entry.totalPayment,
              }))
              const csvContent = convertToCSV(csvData, headers)
              const timestamp = new Date().toISOString().split('T')[0]
              const scenarioName = scenario.name.replace(/[^a-zA-Z0-9]/g, '-')
              downloadCSV(csvContent, `amortization-${scenarioName}-${timestamp}.csv`)
            }}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[600px]">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-card z-10">
                <tr>
                  <th className="px-4 py-2 text-left border-b">Year</th>
                  <th className="px-4 py-2 text-left border-b">Month</th>
                  <th className="px-4 py-2 text-right border-b">Balance</th>
                  <th className="px-4 py-2 text-right border-b">Interest</th>
                  <th className="px-4 py-2 text-right border-b">Principal</th>
                  <th className="px-4 py-2 text-right border-b">Extra</th>
                  <th className="px-4 py-2 text-right border-b">Total Payment</th>
                </tr>
              </thead>
              <tbody>
                {amortization.schedule.map((entry, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-card' : 'bg-background'}>
                    <td className="px-4 py-2">{entry.year}</td>
                    <td className="px-4 py-2">{entry.month}</td>
                    <td className="px-4 py-2 text-right">
                      {MortgageCalculator.formatCurrency(entry.balance)}
                    </td>
                    <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">
                      {MortgageCalculator.formatCurrency(entry.interestPayment)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {MortgageCalculator.formatCurrency(entry.principalPayment)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {MortgageCalculator.formatCurrency(entry.extraPayment)}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {MortgageCalculator.formatCurrency(entry.totalPayment)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricItem({
  label,
  value,
  positive,
  negative,
  bold,
}: {
  label: string
  value: string
  positive?: boolean
  negative?: boolean
  bold?: boolean
}) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-lg font-semibold ${
          positive
            ? 'text-green-600 dark:text-green-400'
            : negative
              ? 'text-red-600 dark:text-red-400'
              : ''
        } ${bold ? 'font-bold' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}
