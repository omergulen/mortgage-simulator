// German Tax Constants
const TAX_CONSTANTS = {
  TEILFREISTELLUNG: 0.3, // 30% tax-free for equity ETFs
  TAXABLE_PORTION: 0.7, // 70% taxable
  TAX_RATE: 0.26375, // 26.375% (25% + Soli)
  SPARER_PAUSCHBETRAG: 1000, // 1,000€ yearly tax-free allowance
}

// Base scenario - only mortgage information
export interface Scenario {
  id: string
  name: string
  loanAmount: number
  interestRate: number
  monthlyPayment: number
  extraYearlyLimit?: number // Optional limit on extra yearly payments (some mortgages don't allow or have limits)
}

// Scenario combination - combines base scenario with ETF/payment values
export interface ScenarioCombination {
  id: string
  baseScenarioId: string
  name: string
  loanAmount: number
  interestRate: number
  monthlyPayment: number
  extraYearly: number
  initialETF: number
  monthlyETF: number
}

export interface AmortizationEntry {
  month: number
  year: number
  balance: number
  interestPayment: number
  principalPayment: number
  extraPayment: number
  totalPayment: number
}

export interface AmortizationResult {
  schedule: AmortizationEntry[]
  totalInterest: number
  totalPrincipal: number
  totalExtra: number
  finalBalance: number
  payoffMonths: number
}

export interface ETFResult {
  futureValue: number
  gains: number
  tax: number
  afterTaxValue: number
  afterTaxNominal: number
  afterTaxReal: number
  totalHarvested?: number
  finalTax?: number
  strategy: 'none' | 'full' | 'partial' | 'optimal'
}

export type HarvestingStrategy = 'none' | 'full' | 'partial' | 'optimal'

export interface ComparisonResult extends ScenarioCombination {
  payoffYears: number
  etfDetails: ETFResult
  balance10y?: number
  totalPaid10y?: number
  totalInterest10y?: number
  equity10y?: number
  etfValue10y?: number
  netWorth10y?: number
  balance20y?: number
  totalPaid20y?: number
  totalInterest20y?: number
  equity20y?: number
  etfValue20y?: number
  netWorth20y?: number
  balance30y?: number
  totalPaid30y?: number
  totalInterest30y?: number
  equity30y?: number
  etfValue30y?: number
  netWorth30y?: number
  etfValue: number
  netWorth: number
  [key: string]: string | number | undefined | ETFResult
}

export class MortgageCalculator {
  /**
   * Calculate monthly interest rate from annual rate
   */
  static monthlyRate(annualRate: number): number {
    return annualRate / 100 / 12
  }

  /**
   * Calculate amortization schedule for a mortgage
   */
  static calculateAmortization(
    scenario: Scenario & { extraYearly?: number },
    years = 30
  ): AmortizationResult {
    const { loanAmount, interestRate, monthlyPayment, extraYearly = 0 } = scenario

    const monthlyRate = this.monthlyRate(interestRate)
    const totalMonths = years * 12
    const schedule: AmortizationEntry[] = []
    let balance = loanAmount
    let totalInterest = 0
    let totalPrincipal = 0
    let totalExtra = 0

    for (let month = 1; month <= totalMonths && balance > 0.01; month++) {
      const interestPayment = balance * monthlyRate
      let principalPayment = monthlyPayment - interestPayment

      // Apply extra yearly payment in December
      let extraPayment = 0
      if (month % 12 === 0 && extraYearly > 0) {
        extraPayment = Math.min(extraYearly, balance)
        totalExtra += extraPayment
      }

      // Ensure we don't overpay
      if (principalPayment + extraPayment > balance) {
        principalPayment = balance - extraPayment
      }

      balance = Math.max(0, balance - principalPayment - extraPayment)
      totalInterest += interestPayment
      totalPrincipal += principalPayment + extraPayment

      schedule.push({
        month,
        year: Math.ceil(month / 12),
        balance: Math.max(0, balance),
        interestPayment,
        principalPayment,
        extraPayment,
        totalPayment: monthlyPayment + extraPayment,
      })

      // If balance is paid off, stop
      if (balance < 0.01) break
    }

    return {
      schedule,
      totalInterest,
      totalPrincipal,
      totalExtra,
      finalBalance: schedule[schedule.length - 1]?.balance || 0,
      payoffMonths: schedule.length,
    }
  }

  /**
   * Get remaining balance at specific year
   */
  static getBalanceAtYear(
    scenario: Scenario & { extraYearly?: number },
    targetYear: number
  ): number {
    const amortization = this.calculateAmortization(scenario, targetYear + 5)
    const targetMonth = targetYear * 12
    const entry =
      amortization.schedule.find((e) => e.month === targetMonth) ||
      amortization.schedule[amortization.schedule.length - 1]
    return entry ? entry.balance : 0
  }

  /**
   * Calculate years to full payoff
   */
  static getPayoffYears(scenario: Scenario & { extraYearly?: number }): number {
    const amortization = this.calculateAmortization(scenario, 50)
    return amortization.payoffMonths / 12
  }

  /**
   * Calculate total paid over a period
   */
  static getTotalPaid(scenario: Scenario, years: number): number {
    const amortization = this.calculateAmortization(scenario, years)
    return amortization.totalPrincipal + amortization.totalInterest
  }

  /**
   * Calculate ETF future value with German tax optimization
   */
  static calculateETF(
    initialETF: number,
    monthlyETF: number,
    etfReturn: number,
    years: number,
    strategy: HarvestingStrategy = 'optimal'
  ): ETFResult {
    const monthlyReturn = etfReturn / 100 / 12

    switch (strategy) {
      case 'full':
        return this.calculateETFFullHarvest(initialETF, monthlyETF, monthlyReturn, years)
      case 'partial':
        return this.calculateETFPartialHarvest(initialETF, monthlyETF, monthlyReturn, years)
      case 'optimal':
        return this.calculateETFOptimalHarvest(initialETF, monthlyETF, monthlyReturn, years)
      case 'none':
      default:
        return this.calculateETFSimple(initialETF, monthlyETF, monthlyReturn, years)
    }
  }

  /**
   * Simple ETF calculation (one-time tax at end)
   */
  static calculateETFSimple(
    initial: number,
    monthly: number,
    monthlyReturn: number,
    years: number
  ): ETFResult {
    let value = initial
    const totalMonths = years * 12

    for (let month = 1; month <= totalMonths; month++) {
      value = value * (1 + monthlyReturn) + monthly
    }

    const gains = value - initial - monthly * totalMonths
    const taxableGains = gains * TAX_CONSTANTS.TAXABLE_PORTION
    const finalTax =
      Math.max(0, taxableGains - TAX_CONSTANTS.SPARER_PAUSCHBETRAG) * TAX_CONSTANTS.TAX_RATE
    const afterTaxValue = value - finalTax

    return {
      futureValue: value,
      gains,
      tax: 0,
      afterTaxValue,
      afterTaxNominal: afterTaxValue,
      afterTaxReal: afterTaxValue / Math.pow(1 + monthlyReturn * 12, years),
      finalTax,
      strategy: 'none',
    }
  }

  /**
   * Strategy 1: Full buy/sell every year (sell everything, rebuy)
   */
  static calculateETFFullHarvest(
    initial: number,
    monthly: number,
    monthlyReturn: number,
    years: number
  ): ETFResult {
    let value = initial
    let costBasis = initial
    const totalMonths = years * 12
    let totalTaxPaid = 0
    let totalHarvested = 0

    for (let year = 1; year <= years; year++) {
      // Grow value throughout the year
      for (let month = 1; month <= 12; month++) {
        value = value * (1 + monthlyReturn)
        if (monthly > 0) {
          value += monthly
          costBasis += monthly
        }
      }

      // At year end: sell everything, realize all gains, rebuy
      const gains = value - costBasis
      if (gains > 0) {
        const taxableGains = gains * TAX_CONSTANTS.TAXABLE_PORTION
        const tax =
          Math.max(0, taxableGains - TAX_CONSTANTS.SPARER_PAUSCHBETRAG) * TAX_CONSTANTS.TAX_RATE
        totalTaxPaid += tax
        totalHarvested += gains

        // Reset: value stays the same (we rebuy), but cost basis resets to current value
        costBasis = value
      }
    }

    const finalGains = value - initial - monthly * totalMonths
    const afterTaxValue = value - totalTaxPaid

    return {
      futureValue: value,
      gains: finalGains,
      tax: totalTaxPaid,
      afterTaxValue,
      afterTaxNominal: afterTaxValue,
      afterTaxReal: afterTaxValue / Math.pow(1 + monthlyReturn * 12, years),
      totalHarvested,
      finalTax: 0,
      strategy: 'full',
    }
  }

  /**
   * Strategy 2: Partial harvest - sell only up to tax-free limit, keep rest, show final tax
   */
  static calculateETFPartialHarvest(
    initial: number,
    monthly: number,
    monthlyReturn: number,
    years: number
  ): ETFResult {
    let value = initial
    let costBasis = initial
    const totalMonths = years * 12
    let totalHarvested = 0
    const maxHarvestablePerYear = TAX_CONSTANTS.SPARER_PAUSCHBETRAG / TAX_CONSTANTS.TAXABLE_PORTION

    for (let year = 1; year <= years; year++) {
      // Grow value throughout the year
      for (let month = 1; month <= 12; month++) {
        value = value * (1 + monthlyReturn)
        if (monthly > 0) {
          value += monthly
          costBasis += monthly
        }
      }

      // At year end: harvest only up to tax-free limit
      const unrealizedGains = value - costBasis
      if (unrealizedGains > 0) {
        const harvestAmount = Math.min(unrealizedGains, maxHarvestablePerYear)
        if (harvestAmount > 0) {
          totalHarvested += harvestAmount
          const harvestRatio = harvestAmount / unrealizedGains
          // Adjust cost basis proportionally: when we harvest gains, we realize a portion
          // The remaining cost basis should be reduced proportionally
          costBasis = costBasis * (1 - harvestRatio)
        }
      }
    }

    const finalGains = value - initial - monthly * totalMonths
    const remainingUnrealized = finalGains - totalHarvested
    const finalTaxable = remainingUnrealized * TAX_CONSTANTS.TAXABLE_PORTION
    const finalTax =
      Math.max(0, finalTaxable - TAX_CONSTANTS.SPARER_PAUSCHBETRAG) * TAX_CONSTANTS.TAX_RATE

    const afterTaxValue = value - finalTax

    return {
      futureValue: value,
      gains: finalGains,
      tax: 0,
      afterTaxValue,
      afterTaxNominal: afterTaxValue,
      afterTaxReal: afterTaxValue / Math.pow(1 + monthlyReturn * 12, years),
      totalHarvested,
      finalTax,
      strategy: 'partial',
    }
  }

  /**
   * Strategy 3: Optimal harvest - sell optimal amount each year, keep rest, show final tax
   */
  static calculateETFOptimalHarvest(
    initial: number,
    monthly: number,
    monthlyReturn: number,
    years: number
  ): ETFResult {
    let value = initial
    const totalMonths = years * 12
    const monthlyContributions: Array<{ month: number; amount: number; costBasis: number }> = []

    // Track monthly contributions for FIFO
    for (let month = 1; month <= totalMonths; month++) {
      value = value * (1 + monthlyReturn)

      if (monthly > 0) {
        value += monthly
        monthlyContributions.push({
          month,
          amount: monthly,
          costBasis: monthly,
        })
      }
    }

    // Simulate yearly harvesting
    let totalHarvested = 0
    const contributions = [...monthlyContributions]

    for (let year = 1; year <= years; year++) {
      const yearEndMonth = year * 12

      // Calculate value at year end
      let yearValue = initial
      for (let m = 1; m <= yearEndMonth; m++) {
        yearValue = yearValue * (1 + monthlyReturn)
        const contrib = monthlyContributions.find((c) => c.month === m)
        if (contrib) yearValue += contrib.amount
      }

      // Calculate unrealized gains
      let totalCostBasis = initial
      for (const contrib of contributions.filter((c) => c.month <= yearEndMonth)) {
        totalCostBasis += contrib.amount
      }

      const unrealizedGains = yearValue - totalCostBasis

      // Harvest up to tax-free limit
      const maxHarvestable = TAX_CONSTANTS.SPARER_PAUSCHBETRAG / TAX_CONSTANTS.TAXABLE_PORTION
      const harvestAmount = Math.min(unrealizedGains, maxHarvestable)

      if (harvestAmount > 0) {
        totalHarvested += harvestAmount
      }
    }

    // Final value calculation
    let finalValue = initial
    for (let m = 1; m <= totalMonths; m++) {
      finalValue = finalValue * (1 + monthlyReturn)
      const contrib = monthlyContributions.find((c) => c.month === m)
      if (contrib) finalValue += contrib.amount
    }

    // Final tax calculation
    const finalGains = finalValue - initial - monthly * totalMonths
    const remainingUnrealized = finalGains - totalHarvested
    const finalTaxable = remainingUnrealized * TAX_CONSTANTS.TAXABLE_PORTION
    const finalTax =
      Math.max(0, finalTaxable - TAX_CONSTANTS.SPARER_PAUSCHBETRAG) * TAX_CONSTANTS.TAX_RATE

    const afterTaxValue = finalValue - finalTax

    return {
      futureValue: finalValue,
      gains: finalGains,
      tax: 0,
      afterTaxValue,
      afterTaxNominal: afterTaxValue,
      afterTaxReal: afterTaxValue / Math.pow(1 + monthlyReturn * 12, years),
      totalHarvested,
      finalTax,
      strategy: 'optimal',
    }
  }

  /**
   * Generate scenario combinations from base scenarios and selected values
   */
  static generateCombinations(
    scenarios: Scenario[],
    selectedInitialETF: number[],
    selectedMonthlyETF: number[],
    selectedExtraYearly: number[]
  ): ScenarioCombination[] {
    const combinations: ScenarioCombination[] = []

    for (const scenario of scenarios) {
      for (const initialETF of selectedInitialETF) {
        for (const monthlyETF of selectedMonthlyETF) {
          for (const extraYearly of selectedExtraYearly) {
            // Check if extra yearly payment is within limit (if set)
            if (
              scenario.extraYearlyLimit !== undefined &&
              extraYearly > scenario.extraYearlyLimit
            ) {
              continue
            }

            const nameParts = [scenario.name]
            if (initialETF > 0) nameParts.push(`ETF: ${this.formatCurrency(initialETF)}`)
            if (monthlyETF > 0) nameParts.push(`Monthly: ${this.formatCurrency(monthlyETF)}`)
            if (extraYearly > 0) nameParts.push(`Extra: ${this.formatCurrency(extraYearly)}`)

            combinations.push({
              id: `${scenario.id}-${initialETF}-${monthlyETF}-${extraYearly}`,
              baseScenarioId: scenario.id,
              name: nameParts.join(' | '),
              loanAmount: scenario.loanAmount,
              interestRate: scenario.interestRate,
              monthlyPayment: scenario.monthlyPayment,
              extraYearly,
              initialETF,
              monthlyETF,
            })
          }
        }
      }
    }

    return combinations
  }

  /**
   * Calculate comprehensive scenario comparison
   */
  static compareScenarios(
    combinations: ScenarioCombination[],
    propertyValue: number,
    etfReturn: number,
    horizonYears = 20,
    harvestingStrategy: HarvestingStrategy = 'optimal'
  ): ComparisonResult[] {
    return combinations.map((combination) => {
      // Create a temporary scenario-like object for calculations
      const calcScenario: Scenario & { extraYearly: number } = {
        id: combination.id,
        name: combination.name,
        loanAmount: combination.loanAmount,
        interestRate: combination.interestRate,
        monthlyPayment: combination.monthlyPayment,
        extraYearly: combination.extraYearly,
      }

      const result: Partial<ComparisonResult> = {
        ...combination,
        payoffYears: this.getPayoffYears(calcScenario),
        etfDetails: this.calculateETF(
          combination.initialETF,
          combination.monthlyETF,
          etfReturn,
          horizonYears,
          harvestingStrategy
        ),
      }

      // Calculate metrics for all relevant years based on horizon
      if (horizonYears >= 10) {
        result.balance10y = this.getBalanceAtYear(calcScenario, 10)
        const amortization10y = this.calculateAmortization(calcScenario, 10)
        result.totalPaid10y = amortization10y.totalInterest + amortization10y.totalPrincipal
        result.totalInterest10y = amortization10y.totalInterest
        result.equity10y = propertyValue - result.balance10y!
        const etf10y = this.calculateETF(
          combination.initialETF,
          combination.monthlyETF,
          etfReturn,
          10,
          harvestingStrategy
        )
        result.etfValue10y = etf10y.afterTaxValue
        result.netWorth10y = result.equity10y + result.etfValue10y
      }

      if (horizonYears >= 20) {
        result.balance20y = this.getBalanceAtYear(calcScenario, 20)
        const amortization20y = this.calculateAmortization(calcScenario, 20)
        result.totalPaid20y = amortization20y.totalInterest + amortization20y.totalPrincipal
        result.totalInterest20y = amortization20y.totalInterest
        result.equity20y = propertyValue - result.balance20y!
        const etf20y = this.calculateETF(
          combination.initialETF,
          combination.monthlyETF,
          etfReturn,
          20,
          harvestingStrategy
        )
        result.etfValue20y = etf20y.afterTaxValue
        result.netWorth20y = result.equity20y + result.etfValue20y
      }

      if (horizonYears >= 30) {
        result.balance30y = this.getBalanceAtYear(calcScenario, 30)
        const amortization30y = this.calculateAmortization(calcScenario, 30)
        result.totalPaid30y = amortization30y.totalInterest + amortization30y.totalPrincipal
        result.totalInterest30y = amortization30y.totalInterest
        result.equity30y = propertyValue - result.balance30y!
        const etf30y = this.calculateETF(
          combination.initialETF,
          combination.monthlyETF,
          etfReturn,
          30,
          harvestingStrategy
        )
        result.etfValue30y = etf30y.afterTaxValue
        result.netWorth30y = result.equity30y + result.etfValue30y
      }

      // Set final values based on horizon
      const finalYear = horizonYears
      result.etfValue = result.etfDetails!.afterTaxValue
      const netWorthKey = `netWorth${finalYear}y` as keyof ComparisonResult
      result.netWorth =
        (result[netWorthKey] as number) || result.netWorth20y || result.netWorth10y || 0

      return result as ComparisonResult
    })
  }

  /**
   * Format currency
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  /**
   * Format percentage
   */
  static formatPercent(value: number, decimals = 2): string {
    return `${value.toFixed(decimals)}%`
  }
}
