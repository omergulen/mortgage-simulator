import { useMemo, useState } from 'react'
import { useMortgageStore } from '@/lib/stores/mortgage-store'
import { MortgageCalculator } from '@/lib/mortgage-calculator'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, ArrowUp, ArrowDown, Settings2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

interface ComparisonTableProps {
  comparisons: any[]
  onEdit?: (id: string) => void
}

export function ComparisonTable({ comparisons, onEdit }: ComparisonTableProps) {
  const {
    horizonYears,
    sortColumn,
    sortDirection,
    setSort,
    duplicateScenario,
    deleteScenario,
    visibleColumns,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
  } = useMortgageStore()
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSort(column, 'desc')
      } else if (sortDirection === 'desc') {
        setSort(null, null)
      } else {
        setSort(column, 'asc')
      }
    } else {
      setSort(column, 'asc')
    }
  }

  const sortedComparisons = useMemo(() => {
    if (!sortColumn || !sortDirection) return comparisons

    return [...comparisons].sort((a, b) => {
      const aVal = a[sortColumn] ?? 0
      const bVal = b[sortColumn] ?? 0

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      }
    })
  }, [comparisons, sortColumn, sortDirection])

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 inline" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 inline" />
    )
  }

  const allColumns = useMemo(() => {
    const cols: Array<{ key: string; label: string; sortable?: boolean; alwaysVisible?: boolean }> = [
      { key: 'name', label: 'Scenario', sortable: true, alwaysVisible: true },
      // Basic scenario properties
      { key: 'loanAmount', label: 'Loan Amount', sortable: true },
      { key: 'interestRate', label: 'Interest Rate', sortable: true },
      { key: 'monthlyPayment', label: 'Monthly Payment', sortable: true },
      { key: 'extraYearly', label: 'Extra Yearly Payment', sortable: true },
      { key: 'propertyValue', label: 'Property Value', sortable: true },
      { key: 'initialETF', label: 'Initial ETF', sortable: true },
      { key: 'monthlyETF', label: 'Monthly ETF', sortable: true },
      { key: 'etfReturn', label: 'ETF Return %', sortable: true },
      { key: 'inflation', label: 'Inflation %', sortable: true },
      { key: 'payoffYears', label: 'Payoff Years', sortable: true },
    ]

    // Time-based metrics
    if (horizonYears >= 10) {
      cols.push(
        { key: 'balance10y', label: 'Remaining at 10y', sortable: true },
        { key: 'totalPaid10y', label: 'Total Paid (10y)', sortable: true },
        { key: 'totalInterest10y', label: 'Total Interest (10y)', sortable: true },
        { key: 'equity10y', label: 'Equity (10y)', sortable: true },
        { key: 'etfValue10y', label: 'ETF Value (10y)', sortable: true },
        { key: 'netWorth10y', label: 'Net Worth (10y)', sortable: true }
      )
    }
    if (horizonYears >= 20) {
      cols.push(
        { key: 'balance20y', label: 'Remaining at 20y', sortable: true },
        { key: 'totalPaid20y', label: 'Total Paid (20y)', sortable: true },
        { key: 'totalInterest20y', label: 'Total Interest (20y)', sortable: true },
        { key: 'equity20y', label: 'Equity (20y)', sortable: true },
        { key: 'etfValue20y', label: 'ETF Value (20y)', sortable: true },
        { key: 'netWorth20y', label: 'Net Worth (20y)', sortable: true }
      )
    }
    if (horizonYears >= 30) {
      cols.push(
        { key: 'balance30y', label: 'Remaining at 30y', sortable: true },
        { key: 'totalPaid30y', label: 'Total Paid (30y)', sortable: true },
        { key: 'totalInterest30y', label: 'Total Interest (30y)', sortable: true },
        { key: 'equity30y', label: 'Equity (30y)', sortable: true },
        { key: 'etfValue30y', label: 'ETF Value (30y)', sortable: true },
        { key: 'netWorth30y', label: 'Net Worth (30y)', sortable: true }
      )
    }

    cols.push(
      { key: 'actions', label: 'Actions', sortable: false, alwaysVisible: true }
    )

    return cols
  }, [horizonYears])
  
  // Apply column order if set, otherwise use default order
  const orderedColumns = useMemo(() => {
    if (columnOrder.length === 0) return allColumns
    
    // Create a map for quick lookup
    const columnMap = new Map(allColumns.map(col => [col.key, col]))
    
    // Build ordered array, preserving order from columnOrder
    const ordered: typeof allColumns = []
    const seen = new Set<string>()
    
    // Add columns in the specified order
    for (const key of columnOrder) {
      const col = columnMap.get(key)
      if (col) {
        ordered.push(col)
        seen.add(key)
      }
    }
    
    // Add any remaining columns that weren't in the order
    for (const col of allColumns) {
      if (!seen.has(col.key)) {
        ordered.push(col)
      }
    }
    
    return ordered
  }, [allColumns, columnOrder])

  // Filter columns based on visibility settings
  const columns = useMemo(() => {
    return orderedColumns.filter((col) => {
      if (col.alwaysVisible) return true
      // If column visibility is not set, default to visible
      return visibleColumns[col.key] !== false
    })
  }, [orderedColumns, visibleColumns])
  
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    
    // Work with all visible columns (orderedColumns filtered by visibility)
    const visibleOrdered = orderedColumns.filter((col) => {
      if (col.alwaysVisible) return true
      return visibleColumns[col.key] !== false
    })
    
    const newOrder = [...visibleOrdered]
    const draggedItem = newOrder[draggedIndex]
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(index, 0, draggedItem)
    
    // Update the full column order, preserving always-visible columns
    const newFullOrder: string[] = []
    
    // Add always-visible columns first in their original positions
    for (const col of orderedColumns) {
      if (col.alwaysVisible) {
        newFullOrder.push(col.key)
      }
    }
    
    // Add reordered visible columns
    for (const col of newOrder) {
      if (!col.alwaysVisible) {
        newFullOrder.push(col.key)
      }
    }
    
    // Add any hidden columns at the end
    for (const col of orderedColumns) {
      if (!col.alwaysVisible && visibleColumns[col.key] === false && !newFullOrder.includes(col.key)) {
        newFullOrder.push(col.key)
      }
    }
    
    setColumnOrder(newFullOrder)
    setDraggedIndex(index)
  }
  
  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-2">
      {/* Column Configuration Button */}
      <div className="flex justify-end">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Configure Columns
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Visible Columns</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    allColumns.forEach((col) => {
                      if (!col.alwaysVisible) {
                        setColumnVisibility(col.key, true)
                      }
                    })
                  }}
                >
                  Show All
                </Button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {orderedColumns.map((col, index) => {
                  const isVisible = col.alwaysVisible || visibleColumns[col.key] !== false
                  // Calculate visible index for drag operations
                  const visibleIndex = orderedColumns
                    .slice(0, index + 1)
                    .filter(c => c.alwaysVisible || visibleColumns[c.key] !== false).length - 1
                  
                  return (
                    <div
                      key={col.key}
                      className={cn(
                        'flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50',
                        draggedIndex === visibleIndex && isVisible && !col.alwaysVisible && 'opacity-50',
                        !isVisible && 'opacity-60'
                      )}
                      draggable={!col.alwaysVisible && isVisible}
                      onDragStart={() => !col.alwaysVisible && isVisible && handleDragStart(visibleIndex)}
                      onDragOver={(e) => !col.alwaysVisible && isVisible && handleDragOver(e, visibleIndex)}
                      onDragEnd={handleDragEnd}
                    >
                      {!col.alwaysVisible && (
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      )}
                      <input
                        type="checkbox"
                        id={`col-${col.key}`}
                        checked={isVisible}
                        disabled={col.alwaysVisible}
                        onChange={(e) => {
                          if (!col.alwaysVisible) {
                            setColumnVisibility(col.key, e.target.checked)
                          }
                        }}
                        className="h-4 w-4 rounded border-input"
                      />
                      <Label
                        htmlFor={`col-${col.key}`}
                        className={cn(
                          'text-sm font-normal cursor-pointer flex-1',
                          col.alwaysVisible && 'text-muted-foreground'
                        )}
                      >
                        {col.label}
                        {col.alwaysVisible && ' (always visible)'}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="overflow-auto max-h-[70vh] relative border rounded-md">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-30">
            <tr>
              {columns.map((col, idx) => {
                const isFirst = idx === 0
                const isLast = col.key === 'actions'
                const isSortable = col.sortable !== false

                return (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-left font-semibold border-b bg-card',
                      isFirst && 'sticky left-0 z-50 shadow-[2px_0_3px_rgba(0,0,0,0.1)]',
                      isLast && 'sticky right-0 z-50 shadow-[-2px_0_3px_rgba(0,0,0,0.1)]',
                      isSortable && 'cursor-pointer hover:bg-muted/50'
                    )}
                    style={{ backgroundColor: 'hsl(var(--card))' }}
                    onClick={() => isSortable && handleSort(col.key)}
                  >
                  <div className="flex items-center">
                    {col.label}
                    {isSortable && getSortIcon(col.key)}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedComparisons.map((comp, index) => (
            <tr
              key={comp.id}
              className={cn(
                'border-b',
                index % 2 === 0 ? 'bg-card' : 'bg-background'
              )}
            >
              {columns.map((col) => {
                const rowBg = index % 2 === 0 ? 'bg-card' : 'bg-background'

                if (col.key === 'name') {
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        'sticky left-0 z-20 px-4 py-3 font-semibold shadow-[2px_0_3px_rgba(0,0,0,0.1)]',
                        rowBg
                      )}
                      style={{ backgroundColor: 'inherit' }}
                    >
                      {comp.name}
                    </td>
                  )
                }

                if (col.key === 'loanAmount') {
                  return (
                    <td key={col.key} className={cn('px-4 py-3', rowBg)}>
                      {MortgageCalculator.formatCurrency(comp.loanAmount)}
                    </td>
                  )
                }

                if (col.key === 'interestRate') {
                  return (
                    <td key={col.key} className={cn('px-4 py-3', rowBg)}>
                      {MortgageCalculator.formatPercent(comp.interestRate)}
                    </td>
                  )
                }

                if (col.key === 'monthlyPayment') {
                  return (
                    <td key={col.key} className={cn('px-4 py-3', rowBg)}>
                      {MortgageCalculator.formatCurrency(comp.monthlyPayment || 0)}
                    </td>
                  )
                }

                if (col.key === 'extraYearly') {
                  return (
                    <td key={col.key} className={cn('px-4 py-3', rowBg)}>
                      {MortgageCalculator.formatCurrency(comp.extraYearly || 0)}
                    </td>
                  )
                }

                if (col.key === 'propertyValue') {
                  return (
                    <td key={col.key} className={cn('px-4 py-3', rowBg)}>
                      {MortgageCalculator.formatCurrency(comp.propertyValue || 0)}
                    </td>
                  )
                }

                if (col.key === 'initialETF') {
                  return (
                    <td key={col.key} className={cn('px-4 py-3', rowBg)}>
                      {MortgageCalculator.formatCurrency(comp.initialETF || 0)}
                    </td>
                  )
                }

                if (col.key === 'monthlyETF') {
                  return (
                    <td key={col.key} className={cn('px-4 py-3', rowBg)}>
                      {MortgageCalculator.formatCurrency(comp.monthlyETF || 0)}
                    </td>
                  )
                }

                if (col.key === 'etfReturn') {
                  return (
                    <td key={col.key} className={cn('px-4 py-3', rowBg)}>
                      {MortgageCalculator.formatPercent(comp.etfReturn || 0)}
                    </td>
                  )
                }

                if (col.key === 'inflation') {
                  return (
                    <td key={col.key} className={cn('px-4 py-3', rowBg)}>
                      {MortgageCalculator.formatPercent(comp.inflation || 0)}
                    </td>
                  )
                }

                if (col.key === 'payoffYears') {
                  return (
                    <td key={col.key} className={cn('px-4 py-3', rowBg)}>
                      {comp.payoffYears.toFixed(1)}
                    </td>
                  )
                }

                if (col.key === 'actions') {
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        'sticky right-0 z-20 px-4 py-3 shadow-[-2px_0_3px_rgba(0,0,0,0.1)]',
                        rowBg
                      )}
                      style={{ backgroundColor: 'inherit' }}
                    >
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit?.(comp.id)}
                          title="Edit"
                        >
                          ✏️
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateScenario(comp.id)}
                          title="Duplicate"
                        >
                          📋
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${comp.name}"?`)) {
                              deleteScenario(comp.id)
                            }
                          }}
                          title="Delete"
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          🗑️
                        </Button>
                      </div>
                    </td>
                  )
                }

                // Dynamic columns based on horizon
                const isNegative = col.key.includes('Interest')
                const isPositive = col.key.includes('equity') || col.key.includes('etfValue') || col.key.includes('netWorth')
                const isBold = col.key.includes('netWorth')

                return (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3',
                      rowBg,
                      isNegative && 'text-red-600 dark:text-red-400',
                      isPositive && 'text-green-600 dark:text-green-400',
                      isBold && 'font-semibold'
                    )}
                  >
                    {col.key.includes('Rate') || col.key.includes('Years')
                      ? comp[col.key]?.toFixed?.(1) || comp[col.key]
                      : MortgageCalculator.formatCurrency(comp[col.key] || 0)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}

