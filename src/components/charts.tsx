import { useMemo } from 'react'
import { useMortgageStore } from '@/lib/stores/mortgage-store'
import { MortgageCalculator } from '@/lib/mortgage-calculator'
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
  comparisons: any[]
}

export function Charts({ comparisons }: ChartsProps) {
  const { horizonYears, harvestingStrategy } = useMortgageStore()

  const balanceData = useMemo(() => {
    const data: Array<{ year: number; [key: string]: number | string }> = []

    for (let year = 0; year <= horizonYears; year++) {
      const entry: any = { year }
      comparisons.forEach((comp) => {
        const amortization = MortgageCalculator.calculateAmortization(comp, horizonYears)
        const month = year * 12
        const scheduleEntry = amortization.schedule.find((e) => e.month === month) ||
          amortization.schedule[amortization.schedule.length - 1]
        entry[comp.name] = scheduleEntry ? scheduleEntry.balance : 0
      })
      data.push(entry)
    }

    return data
  }, [comparisons, horizonYears])

  const netWorthData = useMemo(() => {
    const data: Array<{ year: number; [key: string]: number | string }> = []

    for (let year = 0; year <= horizonYears; year++) {
      const entry: any = { year }
      comparisons.forEach((comp) => {
        const amortization = MortgageCalculator.calculateAmortization(comp, horizonYears)
        const month = year * 12
        const scheduleEntry = amortization.schedule.find((e) => e.month === month) ||
          amortization.schedule[amortization.schedule.length - 1]
        const balance = scheduleEntry ? scheduleEntry.balance : 0
        const equity = comp.propertyValue - balance

        const etfResult = MortgageCalculator.calculateETF(comp, year, harvestingStrategy)
        const netWorth = equity + etfResult.afterTaxValue

        entry[comp.name] = netWorth
      })
      data.push(entry)
    }

    return data
  }, [comparisons, horizonYears, harvestingStrategy])

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
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    return (
      <div className="rounded-lg border bg-popover p-3 shadow-lg z-50">
        <p className="font-semibold mb-2 text-popover-foreground">{`Year ${label}`}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} className="text-sm text-popover-foreground" style={{ color: entry.color }}>
            {`${entry.name}: ${formatCurrency(entry.value as number)}`}
          </p>
        ))}
      </div>
    )
  }

  // Custom legend component
  const renderCustomLegend = (props: any) => {
    const { payload } = props
    if (!payload || payload.length === 0) return null
    return (
      <div className="flex flex-wrap gap-4 justify-center mt-6 mb-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-foreground whitespace-nowrap">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Loan Balance Over Time</h3>
        <div className="relative pb-8">
          <ResponsiveContainer width="100%" height={800}>
            <LineChart
              data={balanceData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
              <XAxis
                dataKey="year"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--foreground))' }}
                label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: 'hsl(var(--foreground))' }}
              />
              <YAxis
                tickFormatter={formatCurrency}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--foreground))' }}
                label={{ value: 'Balance (€)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--foreground))' }}
              />
              <Tooltip
                content={<CustomTooltip />}
                wrapperStyle={{ zIndex: 1000 }}
                position={{ x: undefined, y: undefined }}
              />
              <Legend content={renderCustomLegend} wrapperStyle={{ paddingTop: '20px' }} />
              {comparisons.map((comp, idx) => (
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
            <LineChart
              data={netWorthData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
              <XAxis
                dataKey="year"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--foreground))' }}
                label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: 'hsl(var(--foreground))' }}
              />
              <YAxis
                tickFormatter={formatCurrency}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--foreground))' }}
                label={{ value: 'Net Worth (€)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--foreground))' }}
              />
              <Tooltip
                content={<CustomTooltip />}
                wrapperStyle={{ zIndex: 1000 }}
                position={{ x: undefined, y: undefined }}
              />
              <Legend content={renderCustomLegend} wrapperStyle={{ paddingTop: '20px' }} />
              {comparisons.map((comp, idx) => (
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

