import { createFileRoute } from '@tanstack/react-router'
import { MortgageSimulator } from '@/components/mortgage-simulator'

export const Route = createFileRoute('/')({
  component: MortgageSimulator,
})
