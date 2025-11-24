import { useState, useEffect } from 'react'
import { useMortgageStore } from '@/lib/stores/mortgage-store'
import { parseNumber } from '@/lib/utils/parse-number'
import type { Scenario } from '@/lib/mortgage-calculator'
import {
  Dialog,
  DialogContent,
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
  editingMortgageId?: string | null
  onClose?: () => void
}

export function ScenarioFormModal({
  editingMortgageId = null,
  onClose,
}: ScenarioFormModalProps = {}) {
  const { addScenario, updateScenario, scenarios } = useMortgageStore()
  const [open, setOpen] = useState(false)
  const editingMortgage = editingMortgageId
    ? scenarios.find((s) => s.id === editingMortgageId)
    : null

  const [formData, setFormData] = useState<Partial<Scenario>>({
    name: '',
    loanAmount: 0,
    interestRate: 0,
    effectiveInterestRate: 0,
    monthlyPayment: 0,
    extraYearlyLimit: undefined,
  })

  // Store raw string values for inputs to allow . and , while typing
  const [rawValues, setRawValues] = useState({
    loanAmount: '',
    interestRate: '',
    effectiveInterestRate: '',
    monthlyPayment: '',
    extraYearlyLimit: '',
  })

  const resetForm = () => {
    setFormData({
      name: '',
      loanAmount: 0,
      interestRate: 0,
      effectiveInterestRate: 0,
      monthlyPayment: 0,
      extraYearlyLimit: undefined,
    })
    setRawValues({
      loanAmount: '',
      interestRate: '',
      effectiveInterestRate: '',
      monthlyPayment: '',
      extraYearlyLimit: '',
    })
  }

  // Load mortgage data when editing
  useEffect(() => {
    if (editingMortgageId && editingMortgage) {
      setFormData(editingMortgage)
      setRawValues({
        loanAmount: editingMortgage.loanAmount.toString(),
        interestRate: editingMortgage.interestRate.toString(),
        effectiveInterestRate: editingMortgage.effectiveInterestRate.toString(),
        monthlyPayment: editingMortgage.monthlyPayment.toString(),
        extraYearlyLimit: editingMortgage.extraYearlyLimit?.toString() || '',
      })
      setOpen(true)
    } else if (!editingMortgageId && !open) {
      resetForm()
    }
  }, [editingMortgageId, editingMortgage, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingMortgage) {
      // Update existing mortgage offer
      updateScenario(editingMortgage.id, {
        name: formData.name || 'Unnamed Mortgage Offer',
        loanAmount: formData.loanAmount || 0,
        interestRate: formData.interestRate || 0,
        effectiveInterestRate: formData.effectiveInterestRate || 0,
        monthlyPayment: formData.monthlyPayment || 0,
        extraYearlyLimit: formData.extraYearlyLimit,
      })
    } else {
      // Add new mortgage offer
      const mortgage: Scenario = {
        id: crypto.randomUUID(),
        name: formData.name || 'Unnamed Mortgage Offer',
        loanAmount: formData.loanAmount || 0,
        interestRate: formData.interestRate || 0,
        effectiveInterestRate: formData.effectiveInterestRate || 0,
        monthlyPayment: formData.monthlyPayment || 0,
        extraYearlyLimit: formData.extraYearlyLimit,
      }
      addScenario(mortgage)
    }

    setOpen(false)
    resetForm()
    onClose?.()
  }

  const handleInputChange = (field: keyof Scenario, value: string) => {
    // Store raw string value to allow . and , while typing
    setRawValues((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Parse and store numeric value for validation
    const parsed = parseNumber(value)
    if (!isNaN(parsed)) {
      setFormData((prev) => ({
        ...prev,
        [field]: parsed,
      }))
    }
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
          onClose?.() // This will clear editingMortgageId in parent
        }
      }}
    >
      {!editingMortgageId && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4" />
            Add Mortgage Offer
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingMortgage ? 'Edit Mortgage Offer' : 'Add Mortgage Offer'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mortgage-name">Mortgage Offer Name</Label>
              <Input
                id="mortgage-name"
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
                value={rawValues.loanAmount}
                onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                placeholder="306000 or 306.000,50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interest-rate">Sollzins / Nominal Interest Rate (% p.a.)</Label>
              <Input
                id="interest-rate"
                type="text"
                value={rawValues.interestRate}
                onChange={(e) => handleInputChange('interestRate', e.target.value)}
                placeholder="3.51 or 3,51"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="effective-interest-rate">
                Effektivzins / Effective Interest Rate (% p.a.)
              </Label>
              <Input
                id="effective-interest-rate"
                type="text"
                value={rawValues.effectiveInterestRate}
                onChange={(e) => handleInputChange('effectiveInterestRate', e.target.value)}
                placeholder="e.g., 3.65 or 3,65"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly-payment">Monthly Payment (€)</Label>
              <Input
                id="monthly-payment"
                type="text"
                value={rawValues.monthlyPayment}
                onChange={(e) => handleInputChange('monthlyPayment', e.target.value)}
                placeholder="1500 or 1.500,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="extra-yearly-limit">Extra Yearly Payment Limit (€)</Label>
              <Input
                id="extra-yearly-limit"
                type="text"
                value={rawValues.extraYearlyLimit}
                onChange={(e) => handleInputChange('extraYearlyLimit', e.target.value)}
                placeholder="Optional - e.g., 5000"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">
              {editingMortgage ? 'Update Mortgage Offer' : 'Add Mortgage Offer'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
