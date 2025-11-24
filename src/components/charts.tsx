import { useMemo } from 'react'
import { useMortgageStore } from '@/lib/stores/mortgage-store'
import { MortgageCalculator, type ComparisonResult } from '@/lib/mortgage-calculator'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ChartsProps {
  comparisons: ComparisonResult[]
}

interface ChartDataEntry {
  year: number
  [key: string]: number | string
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

export function Charts({ comparisons }: ChartsProps) {
  const { horizonYears, harvestingStrategy, propertyValue, etfReturn, visibleComparisons } =
    useMortgageStore()

  // Filter comparisons to only include visible ones (same logic as comparison table)
  const visibleComparisonsList = useMemo(() => {
    return comparisons.filter((comp) => visibleComparisons[comp.id] !== false)
  }, [comparisons, visibleComparisons])

  const balanceData = useMemo(() => {
    const data: ChartDataEntry[] = []

    for (let year = 0; year <= horizonYears; year++) {
      const entry: ChartDataEntry = { year }
      visibleComparisonsList.forEach((comp) => {
        if (year === 0) {
          // At year 0, balance is the initial loan amount
          entry[comp.name] = comp.loanAmount
        } else {
          const amortization = MortgageCalculator.calculateAmortization(comp, horizonYears)
          const month = year * 12
          const scheduleEntry =
            amortization.schedule.find((e) => e.month === month) ||
            amortization.schedule[amortization.schedule.length - 1]
          entry[comp.name] = scheduleEntry ? scheduleEntry.balance : 0
        }
      })
      data.push(entry)
    }

    return data
  }, [visibleComparisonsList, horizonYears])

  const netWorthData = useMemo(() => {
    const data: ChartDataEntry[] = []

    for (let year = 0; year <= horizonYears; year++) {
      const entry: ChartDataEntry = { year }
      visibleComparisonsList.forEach((comp) => {
        let balance: number
        if (year === 0) {
          // At year 0, balance is the initial loan amount
          balance = comp.loanAmount
        } else {
          const amortization = MortgageCalculator.calculateAmortization(comp, horizonYears)
          const month = year * 12
          const scheduleEntry =
            amortization.schedule.find((e) => e.month === month) ||
            amortization.schedule[amortization.schedule.length - 1]
          balance = scheduleEntry ? scheduleEntry.balance : 0
        }
        const equity = propertyValue - balance

        const etfResult = MortgageCalculator.calculateETF(
          comp.initialETF,
          comp.monthlyETF,
          etfReturn,
          year,
          harvestingStrategy
        )
        const netWorth = equity + etfResult.afterTaxValue

        entry[comp.name] = netWorth
      })
      data.push(entry)
    }

    return data
  }, [visibleComparisonsList, horizonYears, harvestingStrategy, propertyValue, etfReturn])

  const formatCurrency = (value: number) => {
    return MortgageCalculator.formatCurrency(value)
  }

  // Generate colors that work well with the theme
  const getLineColor = (index: number) => {
    const colors = [
      'hsl(37, 91%, 55%)', // Orange (primary)
      'hsl(200, 70%, 50%)', // Blue
      'hsl(280, 70%, 50%)', // Purple
      'hsl(150, 70%, 50%)', // Teal
      'hsl(20, 70%, 50%)', // Red-orange
      'hsl(260, 70%, 50%)', // Indigo
      'hsl(100, 70%, 50%)', // Green
      'hsl(320, 70%, 50%)', // Pink
    ]
    return colors[index % colors.length]
  }

  // Custom tooltip component with proper styling
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = (props: any) => {
    if (!props.active || !props.payload || !props.payload.length) return null

    return (
      <div className="rounded-lg border bg-popover p-3 shadow-lg z-50">
        <p className="font-semibold mb-2 text-popover-foreground">{`Year ${props.label}`}</p>
        {props.payload.map((entry: TooltipPayload, idx: number) => (
          <p key={idx} className="text-sm text-popover-foreground" style={{ color: entry.color }}>
            {`${entry.name}: ${formatCurrency(entry.value)}`}
          </p>
        ))}
      </div>
    )
  }

  // Custom legend component with scrollable container
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomLegend = (props: any) => {
    const payload = props.payload as Array<{ value: string; color: string }> | undefined
    if (!payload || payload.length === 0) return null

    return (
      <div className="mt-4 mb-2">
        <div className="overflow-x-auto overflow-y-hidden max-h-24 pb-2">
          <div className="flex gap-3 min-w-max px-2">
            {payload.map((entry, index: number) => (
              <div key={index} className="flex items-center gap-1.5 text-xs flex-shrink-0">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span
                  className="text-foreground whitespace-nowrap max-w-[150px] truncate"
                  title={entry.value}
                >
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        {payload.length > 8 && (
          <p className="text-xs text-muted-foreground text-center mt-1">
            Scroll horizontally to see all scenarios • Use filter to show/hide specific scenarios
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Loan Balance Over Time</h3>
        <div className="relative pb-8">
          <ResponsiveContainer width="100%" height={800}>
            <LineChart data={balanceData} margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="year"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--foreground))' }}
                label={{
                  value: 'Years',
                  position: 'insideBottom',
                  offset: -5,
                  fill: 'hsl(var(--foreground))',
                }}
              />
              <YAxis
                tickFormatter={formatCurrency}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--foreground))' }}
                label={{
                  value: 'Balance (€)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: 'hsl(var(--foreground))',
                }}
              />
              <Tooltip
                content={<CustomTooltip />}
                wrapperStyle={{ zIndex: 1000 }}
                position={{ x: undefined, y: undefined }}
              />
              <Legend content={renderCustomLegend} wrapperStyle={{ paddingTop: '20px' }} />
              {visibleComparisonsList.map((comp, idx) => (
                <Line
                  key={comp.id}
                  type="monotone"
                  dataKey={comp.name}
                  stroke={getLineColor(idx)}
                  strokeWidth={2}
                  dot={{ r: 4, fill: getLineColor(idx) }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Net Worth Over Time</h3>
        <div className="relative pb-8">
          <ResponsiveContainer width="100%" height={800}>
            <LineChart data={netWorthData} margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="year"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--foreground))' }}
                label={{
                  value: 'Years',
                  position: 'insideBottom',
                  offset: -5,
                  fill: 'hsl(var(--foreground))',
                }}
              />
              <YAxis
                tickFormatter={formatCurrency}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--foreground))' }}
                label={{
                  value: 'Net Worth (€)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: 'hsl(var(--foreground))',
                }}
              />
              <Tooltip
                content={<CustomTooltip />}
                wrapperStyle={{ zIndex: 1000 }}
                position={{ x: undefined, y: undefined }}
              />
              <Legend content={renderCustomLegend} wrapperStyle={{ paddingTop: '20px' }} />
              {visibleComparisonsList.map((comp, idx) => (
                <Line
                  key={comp.id}
                  type="monotone"
                  dataKey={comp.name}
                  stroke={getLineColor(idx)}
                  strokeWidth={2}
                  dot={{ r: 4, fill: getLineColor(idx) }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
