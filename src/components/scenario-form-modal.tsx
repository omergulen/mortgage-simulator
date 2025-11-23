import { useState, useEffect } from 'react'
import { useMortgageStore } from '@/lib/stores/mortgage-store'
import { parseNumber } from '@/lib/utils/parse-number'
import type { Scenario } from '@/lib/mortgage-calculator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'

interface ScenarioFormModalProps {
  editingScenario?: { id: string } | null
  onClose?: () => void
}

export function ScenarioFormModal({
  editingScenario = null,
  onClose,
}: ScenarioFormModalProps = {}) {
  const { addScenario, updateScenario, scenarios } = useMortgageStore()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(editingScenario?.id || null)
  const scenarioToEdit = editingScenario ? scenarios.find((s) => s.id === editingScenario.id) : null

  const [formData, setFormData] = useState<Partial<Scenario>>(
    scenarioToEdit || {
      name: '',
      loanAmount: 0,
      interestRate: 0,
      monthlyPayment: 0,
      extraYearly: 0,
      propertyValue: 0,
      initialETF: 0,
      monthlyETF: 0,
      etfReturn: 7.0,
      inflation: 2.0,
    }
  )

  useEffect(() => {
    if (editingScenario) {
      const scenario = scenarios.find((s) => s.id === editingScenario.id)
      if (scenario) {
        setFormData(scenario)
        setEditingId(scenario.id)
        setOpen(true)
      }
    }
  }, [editingScenario, scenarios])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const scenario: Scenario = {
      id: editingId || crypto.randomUUID(),
      name: formData.name || 'Unnamed Scenario',
      loanAmount: formData.loanAmount || 0,
      interestRate: formData.interestRate || 0,
      monthlyPayment: formData.monthlyPayment || 0,
      extraYearly: formData.extraYearly || 0,
      propertyValue: formData.propertyValue || 0,
      initialETF: formData.initialETF || 0,
      monthlyETF: formData.monthlyETF || 0,
      etfReturn: formData.etfReturn || 7.0,
      inflation: formData.inflation || 2.0,
    }

    if (editingId) {
      updateScenario(editingId, scenario)
    } else {
      addScenario(scenario)
    }

    setOpen(false)
    resetForm()
    onClose?.()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      loanAmount: 0,
      interestRate: 0,
      monthlyPayment: 0,
      extraYearly: 0,
      propertyValue: 0,
      initialETF: 0,
      monthlyETF: 0,
      etfReturn: 7.0,
      inflation: 2.0,
    })
    setEditingId(null)
  }

  const handleInputChange = (field: keyof Scenario, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: parseNumber(value),
    }))
  }

  const handleTextChange = (field: keyof Scenario, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          resetForm()
          onClose?.()
        }
      }}
    >
      {!editingScenario && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4" />
            Add New Scenario
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingId ? 'Edit Mortgage Scenario' : 'Add Mortgage Scenario'}
          </DialogTitle>
          <DialogDescription>
            Enter the details of your mortgage scenario to compare with others.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scenario-name">Scenario Name</Label>
              <Input
                id="scenario-name"
                value={formData.name || ''}
                onChange={(e) => handleTextChange('name', e.target.value)}
                placeholder="e.g., 306k MBS Interhyp"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan-amount">Loan Amount (€)</Label>
              <Input
                id="loan-amount"
                type="text"
                value={formData.loanAmount || ''}
                onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                placeholder="306000 or 306.000,50"
                required
              />
              <p className="text-xs text-muted-foreground">
                Accepts: 306000, 306.000,50, 306,000.50, 306 000,50
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interest-rate">Interest Rate (% p.a.)</Label>
              <Input
                id="interest-rate"
                type="text"
                value={formData.interestRate || ''}
                onChange={(e) => handleInputChange('interestRate', e.target.value)}
                placeholder="3.51 or 3,51"
                required
              />
              <p className="text-xs text-muted-foreground">Accepts: 3.51 or 3,51</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly-payment">Monthly Payment (€)</Label>
              <Input
                id="monthly-payment"
                type="text"
                value={formData.monthlyPayment || ''}
                onChange={(e) => handleInputChange('monthlyPayment', e.target.value)}
                placeholder="1500 or 1.500,00"
                required
              />
              <p className="text-xs text-muted-foreground">
                Accepts: 1500, 1.500,50, 1,500.50, 1 500,50
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="extra-yearly">Extra Yearly Payment (€)</Label>
              <Input
                id="extra-yearly"
                type="text"
                value={formData.extraYearly || ''}
                onChange={(e) => handleInputChange('extraYearly', e.target.value)}
                placeholder="2000 or 2.000,00"
              />
              <p className="text-xs text-muted-foreground">
                Accepts: 2000, 2.000,50, 2,000.50, 2 000,50
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property-value">Property Value (€)</Label>
              <Input
                id="property-value"
                type="text"
                value={formData.propertyValue || ''}
                onChange={(e) => handleInputChange('propertyValue', e.target.value)}
                placeholder="400000 or 400.000,00"
                required
              />
              <p className="text-xs text-muted-foreground">
                Accepts: 400000, 400.000,50, 400,000.50, 400 000,50
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial-etf">Initial ETF Investment (€)</Label>
              <Input
                id="initial-etf"
                type="text"
                value={formData.initialETF || ''}
                onChange={(e) => handleInputChange('initialETF', e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Accepts: 0, 1000, 1.000,50, 1,000.50</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly-etf">Monthly ETF Contribution (€)</Label>
              <Input
                id="monthly-etf"
                type="text"
                value={formData.monthlyETF || ''}
                onChange={(e) => handleInputChange('monthlyETF', e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Accepts: 0, 500, 500,50, 500.50</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="etf-return">ETF Expected Return (% p.a.)</Label>
              <Input
                id="etf-return"
                type="text"
                value={formData.etfReturn || ''}
                onChange={(e) => handleInputChange('etfReturn', e.target.value)}
                placeholder="7.0 or 7,0"
              />
              <p className="text-xs text-muted-foreground">Accepts: 7.0 or 7,0</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inflation">Inflation Rate (% p.a.)</Label>
              <Input
                id="inflation"
                type="text"
                value={formData.inflation || ''}
                onChange={(e) => handleInputChange('inflation', e.target.value)}
                placeholder="2.0 or 2,0"
              />
              <p className="text-xs text-muted-foreground">Accepts: 2.0 or 2,0</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">{editingId ? 'Update Scenario' : 'Add Scenario'}</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
