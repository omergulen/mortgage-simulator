import { useMortgageStore } from '@/lib/stores/mortgage-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const strategyDescriptions = {
  none: 'No harvesting - all gains taxed at the end',
  full: 'Sell and rebuy everything every year - realize all gains annually',
  partial: 'Harvest only up to the tax-free limit (€1,000) each year',
  optimal: 'Harvest optimal amount each year, keeping the rest to accumulate',
}

export function GlobalConfig() {
  const { horizonYears, harvestingStrategy, setHorizonYears, setHarvestingStrategy } =
    useMortgageStore()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="font-semibold">Time Horizon:</label>
          <Select
            value={horizonYears.toString()}
            onValueChange={(value) => setHorizonYears(parseInt(value) as 10 | 20 | 30)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 years</SelectItem>
              <SelectItem value="20">20 years</SelectItem>
              <SelectItem value="30">30 years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="font-semibold">Tax-Gain Harvesting Strategy:</label>
          <Select
            value={harvestingStrategy}
            onValueChange={(value) => setHarvestingStrategy(value as any)}
          >
            <SelectTrigger className="w-[300px]">
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

      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
        <strong>Strategy Info:</strong> {strategyDescriptions[harvestingStrategy]}
      </div>
    </div>
  )
}

